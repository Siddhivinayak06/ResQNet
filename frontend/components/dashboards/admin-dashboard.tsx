"use client";

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Report, Responder, Hospital, AdminStats } from '@/lib/auth-types';
import { useAuth } from '@/lib/auth-context';
import { getApiBaseUrl } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  Filter,
  Flame,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Siren,
  TriangleAlert,
  Users,
} from 'lucide-react';

interface AdminDashboardProps {
  reports: Report[];
  responders: Responder[];
  hospitals: Hospital[];
  loading: boolean;
}

type EnrichedReport = Report & { category: string };

export default function AdminDashboard({
  reports,
  responders,
  hospitals,
  loading,
}: AdminDashboardProps) {
  const { token } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const categoryConfig = useMemo(
    () => [
      {
        id: 'fire',
        label: 'Fire',
        color: '#ef4444',
        icon: Flame,
        keywords: ['fire', 'smoke', 'burn', 'explosion', 'gas leak'],
      },
      {
        id: 'accident',
        label: 'Accident',
        color: '#f97316',
        icon: TriangleAlert,
        keywords: ['accident', 'collision', 'crash', 'vehicle', 'car', 'truck', 'bike', 'road'],
      },
      {
        id: 'medical',
        label: 'Medical',
        color: '#3b82f6',
        icon: HeartPulse,
        keywords: ['medical', 'injury', 'bleeding', 'unconscious', 'heart', 'stroke', 'overdose', 'allergic'],
      },
      {
        id: 'disaster',
        label: 'Disaster',
        color: '#8b5cf6',
        icon: AlertTriangle,
        keywords: ['disaster', 'earthquake', 'flood', 'hurricane', 'storm', 'tornado', 'landslide'],
      },
      {
        id: 'other',
        label: 'Other',
        color: '#64748b',
        icon: Activity,
        keywords: [],
      },
    ],
    [],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/incidents/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        // Adapt the backend response structure to the frontend expectations if needed,
        // or just set the raw data.
        setAdminStats({
          averageResponseTime: response.data.data.averageResponseTimeMinutes || 0,
          successRate: response.data.data.totalResolved > 0 ? (response.data.data.totalResolved / response.data.data.totalToday) * 100 : 0,
        } as AdminStats);
        setStatsError(null);
      } catch (error) {
        console.error('Failed to load admin stats:', error);
        setStatsError('Admin stats unavailable');
      }
    };

    fetchStats();
  }, [token]);

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  const startDate = dateStart ? new Date(`${dateStart}T00:00:00`) : null;
  const endDate = dateEnd ? new Date(`${dateEnd}T23:59:59`) : null;

  const getIncidentCategory = (report: Report) => {
    const description = report.description?.toLowerCase() ?? '';
    const match = categoryConfig.find((category) =>
      category.keywords.some((keyword) => description.includes(keyword)),
    );
    return match?.id ?? 'other';
  };

  const enrichedReports: EnrichedReport[] = useMemo(
    () =>
      reports.map((report) => ({
        ...report,
        category: getIncidentCategory(report),
      })),
    [reports],
  );

  const filteredReports = useMemo(() => {
    return enrichedReports.filter((report) => {
      if (typeFilter !== 'all' && report.category !== typeFilter) {
        return false;
      }

      if (statusFilter !== 'all' && report.status !== statusFilter) {
        return false;
      }

      const reportDate = new Date(report.timestamp);
      if (startDate && reportDate < startDate) {
        return false;
      }

      if (endDate && reportDate > endDate) {
        return false;
      }

      return true;
    });
  }, [enrichedReports, endDate, startDate, statusFilter, typeFilter]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const totalToday = filteredReports.filter((report) =>
    new Date(report.timestamp) >= startOfToday,
  ).length;
  const activeIncidents = filteredReports.filter((report) => report.status !== 'resolved').length;
  const resolvedIncidents = filteredReports.filter((report) => report.status === 'resolved').length;
  const incidentsThisWeek = filteredReports.filter((report) =>
    new Date(report.timestamp) >= startOfWeek,
  ).length;

  const categoryData = categoryConfig.map((category) => ({
    name: category.label,
    value: filteredReports.filter((report) => report.category === category.id).length,
    color: category.color,
  }));

  const trendStart = startDate ?? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const trendEnd = endDate ?? now;
  const trendCursor = new Date(trendStart);
  const trendDays: string[] = [];
  while (trendCursor <= trendEnd) {
    trendDays.push(formatDateKey(trendCursor));
    trendCursor.setDate(trendCursor.getDate() + 1);
  }

  const trendCounts = filteredReports.reduce<Record<string, number>>((acc, report) => {
    const key = formatDateKey(new Date(report.timestamp));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const trendData = trendDays.map((day) => {
    const [year, month, date] = day.split('-').map(Number);
    const labelDate = new Date(year, month - 1, date);
    return {
      date: formatDateLabel(labelDate),
      incidents: trendCounts[day] || 0,
    };
  });

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'open', label: 'Open' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const statusDistribution = statusOptions
    .filter((option) => option.value !== 'all')
    .map((option) => ({
      name: option.label,
      value: filteredReports.filter((report) => report.status === option.value).length,
      color:
        option.value === 'resolved'
          ? '#22c55e'
          : option.value === 'in-progress'
            ? '#f59e0b'
            : option.value === 'assigned'
              ? '#38bdf8'
              : '#f97316',
    }));

  const recentReports = useMemo(
    () =>
      [...filteredReports]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8),
    [filteredReports],
  );

  const formatLocation = (report: Report) => {
    if (typeof report.latitude !== 'number' || typeof report.longitude !== 'number') {
      return 'Unknown';
    }
    return `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`;
  };

  const averageResponseTimeLabel = adminStats
    ? `${adminStats.averageResponseTime.toFixed(1)} min`
    : '--';
  const successRateLabel = adminStats ? `${adminStats.successRate.toFixed(1)}%` : '--';
  const activeResponders = responders.filter((responder) => responder.status === 'available').length;

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-6">
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125 duration-700" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-lg shadow-primary/20">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Admin</p>
              <h2 className="text-xl font-bold text-foreground">Analytics Hub</h2>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm font-medium text-muted-foreground relative z-10">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-300" />
              Overview
            </div>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-rose-300" />
              Incident analysis
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-300" />
              Responders
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-300" />
              Hospitals
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Filter className="h-4 w-4 text-rose-300" />
            Filters
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.15em] text-slate-400">Date range</label>
              <div className="grid gap-2">
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(event) => setDateStart(event.target.value)}
                  className="bg-slate-950 border-slate-700 text-white"
                />
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(event) => setDateEnd(event.target.value)}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.15em] text-slate-400">Incident type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {categoryConfig.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.15em] text-slate-400">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-200 hover:bg-slate-800"
              onClick={() => {
                setDateStart('');
                setDateEnd('');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
            >
              Reset filters
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarDays className="h-4 w-4 text-rose-300" />
            System KPIs
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Avg response time</span>
              <span className="text-white font-semibold">{averageResponseTimeLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Success rate</span>
              <span className="text-white font-semibold">{successRateLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active responders</span>
              <span className="text-white font-semibold">{activeResponders}</span>
            </div>
            {statsError && <p className="text-xs text-rose-300">{statsError}</p>}
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300">
                <Siren className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</p>
                <p className="text-2xl font-semibold text-white">{totalToday}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active</p>
                <p className="text-2xl font-semibold text-white">{activeIncidents}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resolved</p>
                <p className="text-2xl font-semibold text-white">{resolvedIncidents}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">This week</p>
                <p className="text-2xl font-semibold text-white">{incidentsThisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Incidents by category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Daily incident trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="incidents"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-foreground mb-4">Recent incidents</h3>
            {loading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground font-medium">
                Loading incidents...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => {
                    const category = categoryConfig.find((item) => item.id === report.category);
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {category?.icon ? (
                              <category.icon className="h-4 w-4" style={{ color: category?.color }} />
                            ) : null}
                            <span className="text-slate-200">{category?.label ?? 'Other'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{formatLocation(report)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-slate-600 text-slate-200 ${
                              report.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : report.status === 'in-progress'
                                  ? 'bg-amber-500/10 text-amber-300'
                                  : report.status === 'assigned'
                                    ? 'bg-sky-500/10 text-sky-300'
                                    : 'bg-rose-500/10 text-rose-300'
                            }`}
                          >
                            {report.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(report.timestamp).toLocaleString('en-US')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Incident distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              {statusDistribution.map((entry) => (
                <span key={entry.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
