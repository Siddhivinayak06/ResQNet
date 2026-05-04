import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ResponderProfile } from '../models/ResponderProfile.js';
import { HospitalProfile } from '../models/HospitalProfile.js';
import { EmergencyReport } from '../models/EmergencyReport.js';
import { detectSeverity } from '../utils/severity.js';

const DEMO_PASSWORD = 'password123';

export async function seedDemoData() {
  const existingUserCount = await User.countDocuments();

  if (existingUserCount > 0) {
    return;
  }

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const createdUsers = await User.insertMany([
    {
      name: 'John Doe',
      email: 'citizen@example.com',
      password: hashedPassword,
      role: 'citizen',
      phone: '555-0001',
      isActive: true,
    },
    {
      name: 'Alex Emergency',
      email: 'responder@example.com',
      password: hashedPassword,
      role: 'responder',
      phone: '555-0002',
      location: 'Downtown Station',
      isActive: true,
    },
    {
      name: 'City Medical Center',
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'hospital',
      phone: '555-0003',
      isActive: true,
    },
    {
      name: 'System Administrator',
      email: 'admin@ers.com',
      password: hashedPassword,
      role: 'admin',
      phone: '555-0004',
      isActive: true,
    },
  ]);

  const usersByRole = Object.fromEntries(createdUsers.map((user) => [user.role, user]));

  await ResponderProfile.insertMany([
    {
      userId: usersByRole.responder._id,
      location: 'Downtown Station',
      latitude: 40.7128,
      longitude: -74.006,
      status: 'available',
    },
  ]);

  const hospitalProfile = await HospitalProfile.create({
    userId: usersByRole.hospital._id,
    name: 'City Medical Center',
    address: '123 Hospital Ave, City',
    phone: '555-0003',
    latitude: 40.7505,
    longitude: -73.9972,
    emergencyCapacity: 50,
    currentPatients: 25,
    specializations: ['Trauma', 'Cardiology', 'Neurology'],
  });

  usersByRole.hospital.hospitalId = hospitalProfile._id.toString();
  await usersByRole.hospital.save();

  const sampleDescription = 'Car accident with injured passengers near downtown bridge';
  await EmergencyReport.create({
    description: sampleDescription,
    location: {
      type: 'Point',
      coordinates: [-74.0022, 40.7139],
    },
    severity: detectSeverity(sampleDescription),
    status: 'open',
    reportedBy: usersByRole.citizen._id,
  });

  console.log('[backend] Seeded demo users and baseline emergency data');
}
