import { Report } from '@/lib/auth-types';
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CitizenDashboardProps {
  reports: Report[];
  loading: boolean;
}

import { useState } from 'react';

export default function CitizenDashboard({ reports, loading }: CitizenDashboardProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const openReports = reports.filter(r => r.status === 'open' || r.status === 'pending').length;
  const inProgress = reports.filter(r => r.status === 'in-progress' || r.status === 'assigned' || r.status === 'active').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = reports.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <span className="text-blue-500 text-sm font-semibold">Open</span>
          </div>
          <div className="text-3xl font-bold text-white">{openReports}</div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 text-sm font-semibold">In Progress</span>
          </div>
          <div className="text-3xl font-bold text-white">{inProgress}</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-semibold">Resolved</span>
          </div>
          <div className="text-3xl font-bold text-white">{resolved}</div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <div className="text-slate-400 text-sm font-semibold mb-2">Total Reports</div>
          <div className="text-3xl font-bold text-white">{reports.length}</div>
        </div>
      </div>

      {/* Action Button */}
      <div>
        <Link href="/report">
          <Button className="bg-red-600 hover:bg-red-700 gap-2">
            <AlertTriangle className="w-4 h-4" />
            Report New Emergency
          </Button>
        </Link>
      </div>

      {/* Reports List */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Your Emergency Reports</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full mx-auto"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No emergency reports yet</p>
            <p className="text-slate-500 text-sm mt-2">Submit your first emergency report to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedReports.map(report => (
              <div key={report._id || report.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-700/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        ['open', 'pending'].includes(report.status) ? 'bg-blue-500/20 text-blue-400' :
                        ['in-progress', 'assigned', 'active'].includes(report.status) ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {report.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        report.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        report.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {report.severity ? report.severity.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-white font-semibold mb-2">{report.description}</p>
                    <div className="text-slate-400 text-sm">
                      {new Date(report.timestamp || report.reportedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="border-slate-600 text-slate-300"
                >
                  Previous
                </Button>
                <span className="text-slate-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="border-slate-600 text-slate-300"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
