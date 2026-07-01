import { Report, Responder } from '@/lib/auth-types';
import { AlertTriangle, Map, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponderDashboardProps {
  reports: Report[];
  responders: Responder[];
  loading: boolean;
  onAcceptReport?: (reportId: string) => void;
}

export default function ResponderDashboard({
  reports,
  responders,
  loading,
  onAcceptReport,
}: ResponderDashboardProps) {
  const activeEmergencies = reports.filter(r => r.status !== 'resolved').length;
  const assignedToMe = reports.filter(r => r.assignedTo === responders[0]?.id).length;
  const availableResponders = responders.filter(r => r.status === 'available').length;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-red-500 text-sm font-semibold">Active</span>
          </div>
          <div className="text-3xl font-bold text-white">{activeEmergencies}</div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 text-sm font-semibold">Assigned</span>
          </div>
          <div className="text-3xl font-bold text-white">{assignedToMe}</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-semibold">Available</span>
          </div>
          <div className="text-3xl font-bold text-white">{availableResponders}</div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Map className="w-4 h-4 text-blue-500" />
            <span className="text-blue-500 text-sm font-semibold">Total Responders</span>
          </div>
          <div className="text-3xl font-bold text-white">{responders.length}</div>
        </div>
      </div>

      {/* Active Emergencies */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Active Emergencies</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full mx-auto"></div>
          </div>
        ) : activeEmergencies === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No active emergencies</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports
              .filter(r => r.status !== 'resolved')
              .map(report => (
                <div
                  key={report.id}
                  className={`bg-slate-800/50 border rounded-lg p-4 hover:bg-slate-700/50 transition ${
                    report.severity === 'high'
                      ? 'border-red-500/50'
                      : report.severity === 'medium'
                        ? 'border-yellow-500/50'
                        : 'border-blue-500/50'
                  }`}
                >
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
                        <span className="text-slate-400 text-xs">
                          {new Date(report.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white font-semibold mb-2">{report.description}</p>
                      {report.assignedTo && (
                        <p className="text-slate-400 text-sm">
                          Assigned to: <span className="text-slate-300">{report.assignedTo}</span>
                        </p>
                      )}
                    </div>
                    {!report.assignedTo && (
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => onAcceptReport?.(report.id)}
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Responders List */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Responder Team</h2>
        <div className="space-y-2">
          {responders.map(responder => (
            <div key={responder.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{responder.name}</p>
                <p className="text-slate-400 text-sm">{responder.location}</p>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-semibold ${
                responder.status === 'available' ? 'bg-green-500/20 text-green-400' :
                responder.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {responder.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
