// ─────────────────────────────────────────────────────────────
// ResQNet — Incident Controller
// Full CRUD + assignment, timeline, nearby queries, stats,
// and AI enrichment trigger.
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { Incident } from '../models/index.js';
import { createGeoPoint } from '../utils/geo.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { getIO } from '../socket/server.js';
import type { AuthenticatedRequest, PaginationQuery } from '../types/index.js';

/**
 * @desc    Create a new emergency incident
 * @route   POST /api/v1/incidents
 */
export const createIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { incidentType, description, latitude, longitude, address, severity, imageUrl, tags } = req.body;
    const user = (req as AuthenticatedRequest).user;

    const incident = await Incident.create({
      incidentType,
      description,
      location: createGeoPoint(latitude, longitude),
      address: address || null,
      severity: severity || 'medium',
      imageUrl: imageUrl || null,
      tags: tags || [],
      reporterId: user?.id || null,
    });

    // Invalidate incidents cache
    await cacheInvalidatePattern('incidents:*').catch(() => {});

    // TODO: Phase 2 — Trigger AI enrichment pipeline via BullMQ
    // await aiEnrichmentQueue.add('enrich', { incidentId: incident._id });

    // Broadcast via Socket.io
    getIO().emit('newIncident', incident.toJSON());

    logger.info(`New incident created: ${incident._id} (${incidentType})`);

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all incidents (paginated, filtered)
 * @route   GET /api/v1/incidents
 */
export const getIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search,
    } = req.query as unknown as PaginationQuery;

    const filter: Record<string, unknown> = {};

    // Apply filters from query params
    if (req.query.status) filter.status = req.query.status;
    if (req.query.incidentType) filter.incidentType = req.query.incidentType;
    if (req.query.severity) filter.severity = req.query.severity;
    if (search) {
      filter.$text = { $search: search };
    }

    // Check cache
    const cacheKey = `incidents:list:${JSON.stringify({ filter, page, limit, sort })}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, ...(cached as object) });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit))
        .populate('reporterId', 'name email')
        .populate('assignedResponders', 'name email role'),
      Incident.countDocuments(filter),
    ]);

    const result = {
      data: incidents,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };

    // Cache for 30 seconds
    await cacheSet(cacheKey, result, 30).catch(() => {});

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single incident by ID
 * @route   GET /api/v1/incidents/:id
 */
export const getIncidentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reporterId', 'name email phoneNumber')
      .populate('assignedResponders', 'name email role phoneNumber')
      .populate('assignedVehicles');

    if (!incident) {
      throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
    }

    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update incident status
 * @route   PATCH /api/v1/incidents/:id/status
 */
export const updateIncidentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const user = (req as AuthenticatedRequest).user;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
    }

    const previousStatus = incident.status;
    incident.status = status;

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: 'status_changed',
      performedBy: user?.id ? new (await import('mongoose')).Types.ObjectId(user.id) : null,
      details: `Status changed from ${previousStatus} to ${status}`,
    });

    // Set resolvedAt if transitioning to resolved/closed
    if (['resolved', 'closed'].includes(status) && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
    }

    await incident.save();
    await cacheInvalidatePattern('incidents:*').catch(() => {});

    // Broadcast update via Socket.io
    getIO().emit('incidentUpdated', incident.toJSON());

    res.status(200).json({
      success: true,
      message: 'Incident status updated',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign responders to an incident
 * @route   POST /api/v1/incidents/:id/assign
 */
export const assignIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { responderIds, vehicleIds } = req.body;
    const user = (req as AuthenticatedRequest).user;
    const { Types } = await import('mongoose');

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
    }

    // Add responders
    if (responderIds?.length) {
      const newIds = responderIds.map((id: string) => new Types.ObjectId(id));
      incident.assignedResponders.push(...newIds);
    }

    // Add vehicles
    if (vehicleIds?.length) {
      const newIds = vehicleIds.map((id: string) => new Types.ObjectId(id));
      incident.assignedVehicles.push(...newIds);
    }

    // Update status to assigned if still pending/verified
    if (['pending', 'verified'].includes(incident.status)) {
      incident.status = 'assigned';
    }

    incident.timeline.push({
      timestamp: new Date(),
      action: 'responders_assigned',
      performedBy: user?.id ? new Types.ObjectId(user.id) : null,
      details: `${responderIds?.length || 0} responder(s) and ${vehicleIds?.length || 0} vehicle(s) assigned`,
    });

    await incident.save();
    await cacheInvalidatePattern('incidents:*').catch(() => {});

    // Broadcast assignment via Socket.io
    getIO().emit('incidentUpdated', incident.toJSON());

    res.status(200).json({
      success: true,
      message: 'Responders assigned successfully',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby incidents
 * @route   GET /api/v1/incidents/nearby
 */
export const getNearbyIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, radius = 5 } = req.query as unknown as {
      latitude: number;
      longitude: number;
      radius: number;
    };

    const incidents = await Incident.find({
      location: {
        $near: {
          $geometry: createGeoPoint(Number(latitude), Number(longitude)),
          $maxDistance: Number(radius) * 1000, // Convert km to meters
        },
      },
      status: { $nin: ['resolved', 'closed', 'false_alarm'] },
    }).limit(50);

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get incident statistics
 * @route   GET /api/v1/incidents/stats
 */
export const getIncidentStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'incidents:stats';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: cached });
      return;
    }

    const [statusCounts, typeCounts, severityCounts, totalToday] = await Promise.all([
      Incident.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Incident.aggregate([
        { $group: { _id: '$incidentType', count: { $sum: 1 } } },
      ]),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Incident.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    // Calculate average response time for resolved incidents
    const avgResponseTime = await Incident.aggregate([
      { $match: { resolvedAt: { $ne: null } } },
      {
        $project: {
          responseTime: { $subtract: ['$resolvedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseMs: { $avg: '$responseTime' },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      byStatus: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byType: typeCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      bySeverity: severityCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      totalToday,
      averageResponseTimeMinutes: avgResponseTime[0]
        ? Math.round(avgResponseTime[0].avgResponseMs / 60000 * 10) / 10
        : 0,
      totalResolved: avgResponseTime[0]?.count || 0,
    };

    await cacheSet(cacheKey, stats, 60).catch(() => {});

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an incident
 * @route   DELETE /api/v1/incidents/:id
 */
export const deleteIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) {
      throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
    }

    await cacheInvalidatePattern('incidents:*').catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Incident deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
