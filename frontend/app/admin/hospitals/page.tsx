'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetchJSON } from '@/lib/api-client';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2 } from 'lucide-react';

interface Hospital {
  _id: string;
  name: string;
  address: string;
  capacity: number;
  availableBeds: number;
  status: string;
}

export default function AdminHospitalsPage() {
  const { token } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchHospitals = async () => {
      try {
        const response = await apiFetchJSON('/hospitals', { token });
        setHospitals(response.data || []);
      } catch (error) {
        console.error('Failed to load hospitals', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [token]);

  return (
    <DashboardLayout title="Hospital Management" description="Manage hospital availability and capacity">
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-300">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-white">Registered Hospitals</h2>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Beds Available</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitals.map((hospital) => (
                <TableRow key={hospital._id}>
                  <TableCell className="font-medium text-slate-200">{hospital.name}</TableCell>
                  <TableCell className="text-slate-400">{hospital.address}</TableCell>
                  <TableCell className="text-slate-200">{hospital.availableBeds} / {hospital.capacity}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize border-slate-600 ${hospital.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-slate-400'}`}>
                      {hospital.status}
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
