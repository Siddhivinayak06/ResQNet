import { Report, Hospital } from '@/lib/auth-types';
import { AlertTriangle, Bed, Activity, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HospitalDashboardProps {
  reports: Report[];
  hospitals: Hospital[];
  loading: boolean;
}

export default function HospitalDashboard({ reports, hospitals, loading }: HospitalDashboardProps) {
  const incomingPatients = reports.filter(r => r.status === 'in-progress' && r.assignedToHospital).length;
  const totalCapacity = hospitals.reduce((sum, h) => sum + h.emergencyCapacity, 0);
  const currentPatients = hospitals.reduce((sum, h) => sum + h.currentPatients, 0);
  const availableBeds = totalCapacity - currentPatients;

  return (
    <div className="space-y-8">
      {/* Hospital Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-red-500 text-sm font-semibold">Incoming</span>
          </div>
          <div className="text-3xl font-bold text-white">{incomingPatients}</div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bed className="w-4 h-4 text-blue-500" />
            <span className="text-blue-500 text-sm font-semibold">Available Beds</span>
          </div>
          <div className="text-3xl font-bold text-white">{availableBeds}</div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 text-sm font-semibold">Current Patients</span>
          </div>
          <div className="text-3xl font-bold text-white">{currentPatients}</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-semibold">Capacity</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalCapacity}</div>
        </div>
      </div>

      {/* Incoming Patients */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Incoming Patients</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full mx-auto"></div>
          </div>
        ) : incomingPatients === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <Bed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No incoming patients</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports
              .filter(r => r.status === 'in-progress' && r.assignedToHospital)
              .map(report => (
                <div key={report.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          report.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          report.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {report.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white font-semibold mb-2">{report.description}</p>
                      <p className="text-slate-400 text-sm">
                        ETA: {new Date(report.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Prepare
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Hospital Network */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Hospital Network</h2>
        <div className="space-y-3">
          {hospitals.map(hospital => {
            const occupancy = ((hospital.currentPatients / hospital.emergencyCapacity) * 100).toFixed(0);
            return (
              <div key={hospital.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{hospital.name}</h3>
                    <p className="text-slate-400 text-sm">{hospital.address}</p>
                  </div>
                  <span className="text-slate-400 text-xs">{hospital.phone}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">Bed Occupancy</span>
                      <span className="text-sm font-semibold text-white">{occupancy}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all"
                        style={{ width: `${occupancy}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{hospital.currentPatients}</p>
                    <p className="text-slate-400 text-xs">of {hospital.emergencyCapacity}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
