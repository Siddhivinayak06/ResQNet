'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetchJSON } from '@/lib/api-client';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const response = await apiFetchJSON('/users', { token });
        setUsers(response.data || []);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  return (
    <DashboardLayout title="User Management" description="Manage all registered users on the platform">
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-white">Registered Users</h2>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium text-slate-200">{user.name}</TableCell>
                  <TableCell className="text-slate-400">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-slate-300 border-slate-600">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
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
