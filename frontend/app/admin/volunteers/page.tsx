'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetchJSON } from '@/lib/api-client';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus } from 'lucide-react';

interface Volunteer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  skills: string[];
  status: string;
  isVerified: boolean;
}

export default function AdminVolunteersPage() {
  const { token } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchVolunteers = async () => {
      try {
        // Assume backend returns volunteers with populated user data
        const response = await apiFetchJSON('/volunteers', { token });
        setVolunteers(response.data || []);
      } catch (error) {
        console.error('Failed to load volunteers', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, [token]);

  return (
    <DashboardLayout title="Volunteer Management" description="Manage volunteer verification and status">
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-300">
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-white">Registered Volunteers</h2>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map((vol) => (
                <TableRow key={vol._id}>
                  <TableCell className="font-medium text-slate-200">
                    {vol.userId?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {vol.skills?.join(', ') || 'None'}
                  </TableCell>
                  <TableCell>
                    {vol.isVerified ? (
                      <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/50">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-400 bg-yellow-500/10 border-yellow-500/50">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-slate-300 border-slate-600">
                      {vol.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
}
