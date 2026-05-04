'use client';

interface Report {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
}

interface MapProps {
  reports: Report[];
}

export default function MapComponent({ reports }: MapProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-600';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'from-red-600/20 to-red-600/10';
      case 'medium':
        return 'from-yellow-500/20 to-yellow-500/10';
      default:
        return 'from-blue-500/20 to-blue-500/10';
    }
  };

  // Normalize coordinates to a 0-100 grid for visualization
  const normalizeCoords = (lat: number, lng: number) => {
    // Simple normalization for demo purposes
    const x = ((lng + 180) / 360) * 100;
    const y = ((lat + 90) / 180) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Map Container */}
      <div className="relative w-full h-96 bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Reports markers */}
        {reports.length > 0 ? (
          reports.map((report) => {
            const { x, y } = normalizeCoords(report.latitude, report.longitude);
            const color = getSeverityColor(report.severity);
            const bgGradient = getSeverityBgColor(report.severity);

            return (
              <div
                key={report.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
              >
                {/* Pulse ring */}
                <div className={`absolute inset-0 rounded-full animate-pulse ${color} opacity-50`} style={{ width: '24px', height: '24px', marginLeft: '-12px', marginTop: '-12px' }}></div>

                {/* Main marker */}
                <div className={`relative w-6 h-6 rounded-full ${color} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-transform group-hover:scale-125`}>
                  !
                </div>

                {/* Tooltip on hover */}
                <div className="absolute z-10 hidden group-hover:block bg-slate-900 border border-slate-700 rounded-lg p-3 w-48 -top-56 -left-24 shadow-xl">
                  <div className={`h-1 rounded-full mb-2 ${color}`}></div>
                  <h3 className="text-white font-semibold text-sm line-clamp-2">{report.description}</h3>
                  <div className="text-slate-400 text-xs mt-2 space-y-1">
                    <p>
                      <span className="text-slate-300">Severity:</span> <span className="capitalize">{report.severity}</span>
                    </p>
                    <p>
                      <span className="text-slate-300">Location:</span> {report.latitude.toFixed(2)}, {report.longitude.toFixed(2)}
                    </p>
                    <p>
                      <span className="text-slate-300">Time:</span> {new Date(report.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-sm">No emergency reports yet</p>
              <p className="text-slate-500 text-xs mt-2">Reports will appear here as they are submitted</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 z-5">
          <p className="text-slate-300 text-xs font-semibold mb-2">Severity</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-slate-400 text-xs">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-400 text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-400 text-xs">Low</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 z-5">
          <p className="text-slate-300 text-xs font-semibold mb-2">Statistics</p>
          <div className="space-y-1.5 text-xs text-slate-400">
            <p>Total: <span className="text-slate-200 font-semibold">{reports.length}</span></p>
            <p>High: <span className="text-red-400 font-semibold">{reports.filter(r => r.severity === 'high').length}</span></p>
            <p>Medium: <span className="text-yellow-400 font-semibold">{reports.filter(r => r.severity === 'medium').length}</span></p>
            <p>Low: <span className="text-blue-400 font-semibold">{reports.filter(r => r.severity === 'low').length}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
