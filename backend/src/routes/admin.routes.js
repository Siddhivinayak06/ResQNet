import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { EmergencyReport } from '../models/EmergencyReport.js';
import { ResponderProfile } from '../models/ResponderProfile.js';
import { HospitalProfile } from '../models/HospitalProfile.js';

const router = express.Router();

router.get('/stats', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const [
      totalEmergencies,
      activeEmergencies,
      resolvedEmergencies,
      totalResponders,
      activeResponders,
      totalHospitals,
      resolvedReports,
    ] = await Promise.all([
      EmergencyReport.countDocuments(),
      EmergencyReport.countDocuments({ status: { $ne: 'resolved' } }),
      EmergencyReport.countDocuments({ status: 'resolved' }),
      ResponderProfile.countDocuments(),
      ResponderProfile.countDocuments({ status: 'available' }),
      HospitalProfile.countDocuments(),
      EmergencyReport.find({ status: 'resolved', resolvedAt: { $ne: null } })
        .select('createdAt resolvedAt')
        .lean(),
    ]);

    const averageResponseTime = resolvedReports.length
      ? resolvedReports.reduce((total, report) => {
          const createdAt = new Date(report.createdAt).getTime();
          const resolvedAt = new Date(report.resolvedAt).getTime();
          return total + Math.max(0, resolvedAt - createdAt);
        }, 0) / resolvedReports.length / 60000
      : 0;

    const successRate = totalEmergencies
      ? Number(((resolvedEmergencies / totalEmergencies) * 100).toFixed(2))
      : 0;

    return res.json({
      totalEmergencies,
      activeEmergencies,
      resolvedEmergencies,
      totalResponders,
      activeResponders,
      totalHospitals,
      averageResponseTime,
      successRate,
    });
  } catch (error) {
    console.error('Admin stats route error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router;
