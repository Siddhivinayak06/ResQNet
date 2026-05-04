import express from 'express';
import { EmergencyReport } from '../models/EmergencyReport.js';
import { HospitalProfile } from '../models/HospitalProfile.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { detectSeverity } from '../utils/severity.js';
import { formatReport } from '../utils/reportFormatter.js';
import { emitToRoles, emitToUser } from '../services/socket.js';

const router = express.Router();

const validStatuses = ['open', 'assigned', 'in-progress', 'resolved'];

router.get('/', authenticate, async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'citizen') {
      query.reportedBy = req.user.id;
    }

    if (req.user.role === 'responder') {
      query.$or = [
        { assignedTo: req.user.id },
        { status: { $in: ['open', 'assigned', 'in-progress'] } },
      ];
    }

    if (req.user.role === 'hospital') {
      const hospitalProfile = await HospitalProfile.findOne({ userId: req.user.id });
      if (hospitalProfile) {
        query.$or = [
          { assignedToHospital: hospitalProfile._id },
          { status: { $in: ['open', 'assigned', 'in-progress'] } },
        ];
      }
    }

    const reports = await EmergencyReport.find(query).sort({ createdAt: -1 }).limit(500);

    return res.json(reports.map(formatReport));
  } catch (error) {
    console.error('Get reports route error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.post('/', authenticate, authorizeRoles('citizen', 'admin'), async (req, res) => {
  try {
    const { description, latitude, longitude, photo } = req.body;

    if (!description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Description and coordinates are required' });
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const report = await EmergencyReport.create({
      description,
      location: {
        type: 'Point',
        coordinates: [parsedLongitude, parsedLatitude],
      },
      severity: detectSeverity(description),
      status: 'open',
      photo: photo || null,
      reportedBy: req.user.id,
    });

    const payload = formatReport(report);

    emitToRoles('report:created', payload, ['admin', 'responder', 'hospital']);
    emitToUser(req.user.id, 'report:created', payload);

    return res.status(201).json(payload);
  } catch (error) {
    console.error('Create report route error:', error);
    return res.status(500).json({ error: 'Failed to create report' });
  }
});

router.patch('/:id/assign', authenticate, authorizeRoles('responder', 'admin'), async (req, res) => {
  try {
    const { responderId, hospitalId } = req.body;
    const report = await EmergencyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.status === 'resolved') {
      return res.status(400).json({ error: 'Resolved reports cannot be reassigned' });
    }

    const effectiveResponderId = req.user.role === 'responder' ? req.user.id : responderId;

    if (!effectiveResponderId) {
      return res.status(400).json({ error: 'Responder id is required for assignment' });
    }

    report.assignedTo = effectiveResponderId;
    report.status = 'assigned';

    let effectiveHospitalId = hospitalId;

    if (!effectiveHospitalId) {
      const fallbackHospital = await HospitalProfile.findOne({
        $expr: { $lt: ['$currentPatients', '$emergencyCapacity'] },
      }).sort({ currentPatients: 1, emergencyCapacity: -1 });

      if (fallbackHospital) {
        effectiveHospitalId = fallbackHospital._id;
      }
    }

    if (effectiveHospitalId) {
      report.assignedToHospital = effectiveHospitalId;

      const assignedHospital = await HospitalProfile.findById(effectiveHospitalId);
      if (assignedHospital && assignedHospital.currentPatients < assignedHospital.emergencyCapacity) {
        assignedHospital.currentPatients += 1;
        await assignedHospital.save();
      }
    }

    await report.save();

    const payload = formatReport(report);

    emitToRoles('report:updated', payload, ['admin', 'responder', 'hospital']);
    emitToUser(payload.reportedBy, 'report:updated', payload);

    return res.json(payload);
  } catch (error) {
    console.error('Assign report route error:', error);
    return res.status(500).json({ error: 'Failed to assign report' });
  }
});

router.patch('/:id/status', authenticate, authorizeRoles('responder', 'hospital', 'admin'), async (req, res) => {
  try {
    const { status, assignedToHospital } = req.body;

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const report = await EmergencyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const previousStatus = report.status;

    if (req.user.role === 'responder' && report.assignedTo && report.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update reports assigned to you' });
    }

    if (req.user.role === 'hospital' && report.assignedToHospital) {
      const myHospitalProfile = await HospitalProfile.findOne({ userId: req.user.id });
      if (myHospitalProfile && report.assignedToHospital.toString() !== myHospitalProfile.id) {
        return res.status(403).json({ error: 'You can only update your hospital reports' });
      }
    }

    report.status = status;

    if (req.user.role === 'responder' && !report.assignedTo) {
      report.assignedTo = req.user.id;
    }

    if (assignedToHospital) {
      report.assignedToHospital = assignedToHospital;
    }

    if (status === 'resolved') {
      report.resolvedAt = new Date();

      if (previousStatus !== 'resolved' && report.assignedToHospital) {
        const assignedHospital = await HospitalProfile.findById(report.assignedToHospital);

        if (assignedHospital && assignedHospital.currentPatients > 0) {
          assignedHospital.currentPatients -= 1;
          await assignedHospital.save();
        }
      }
    } else {
      report.resolvedAt = null;
    }

    await report.save();

    const payload = formatReport(report);

    emitToRoles('report:updated', payload, ['admin', 'responder', 'hospital']);
    emitToUser(payload.reportedBy, 'report:updated', payload);

    return res.json(payload);
  } catch (error) {
    console.error('Update report status route error:', error);
    return res.status(500).json({ error: 'Failed to update report status' });
  }
});

export default router;
