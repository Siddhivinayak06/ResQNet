import Incident from '../models/Incident.js';
import { getIO } from '../socket/index.js';

/**
 * @desc    Create a new emergency incident
 * @route   POST /api/incidents
 */
export const createIncident = async (req, res, next) => {
  try {
    const { incidentType, description, latitude, longitude, imageUrl, reporterId } = req.body;

    const incident = await Incident.create({
      incidentType,
      description,
      latitude,
      longitude,
      imageUrl: imageUrl || null,
      reporterId: reporterId || null,
    });

    // Broadcast new incident to all connected clients
    try {
      const io = getIO();
      io.emit('newIncident', {
        incidentId: incident._id,
        incidentType: incident.incidentType,
        description: incident.description,
        latitude: incident.latitude,
        longitude: incident.longitude,
        timestamp: incident.reportedAt,
      });
    } catch (socketErr) {
      console.error('Socket.io emit error (newIncident):', socketErr.message);
    }

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
 * @desc    Get all incidents
 * @route   GET /api/incidents
 */
export const getAllIncidents = async (req, res, next) => {
  try {
    // Support optional query filters
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.incidentType) {
      filter.incidentType = req.query.incidentType;
    }

    const sortField = req.query.sort || '-reportedAt';

    const incidents = await Incident.find(filter).sort(sortField);

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
 * @desc    Get a single incident by ID
 * @route   GET /api/incidents/:id
 */
export const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update incident status
 * @route   PATCH /api/incidents/:id
 */
export const updateIncidentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status field is required',
      });
    }

    const validStatuses = ['pending', 'active', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }

    // Broadcast status update to all clients + incident-specific room
    try {
      const io = getIO();
      const updatePayload = {
        incidentId: incident._id,
        incidentType: incident.incidentType,
        description: incident.description,
        latitude: incident.latitude,
        longitude: incident.longitude,
        status: incident.status,
        timestamp: incident.updatedAt,
      };
      io.emit('incidentUpdated', updatePayload);
      io.to(`incident:${incident._id}`).emit('incidentUpdated', updatePayload);
    } catch (socketErr) {
      console.error('Socket.io emit error (incidentUpdated):', socketErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Incident status updated successfully',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an incident
 * @route   DELETE /api/incidents/:id
 */
export const deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Incident deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
