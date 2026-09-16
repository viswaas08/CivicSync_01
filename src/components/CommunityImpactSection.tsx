import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts';
import { useCivic } from '../context/CivicContext';
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  Award, 
  TrendingUp, 
  Calendar,
  Sparkles,
  BarChart3,
  Layers,
  HeartHandshake
} from 'lucide-react';

interface MonthlyImpactData {
  month: string;
  resolvedComplaints: number;
  volunteerHours: number;
  volunteersMobilized: number;
}

const BASELINE_MONTHLY_DATA: MonthlyImpactData[] = [
  { month: 'Apr 2024', resolvedComplaints: 28, volunteerHours: 120, volunteersMobilized: 45 },
  { month: 'May 2024', resolvedComplaints: 34, volunteerHours: 180, volunteersMobilized: 68 },
  { month: 'Jun 2024', resolvedComplaints: 42, volunteerHours: 210, volunteersMobilized: 85 },
  { month: 'Jul 2024', resolvedComplaints: 39, volunteerHours: 260, volunteersMobilized: 95 },
  { month: 'Aug 2024', resolvedComplaints: 51, volunteerHours: 320, volunteersMobilized: 118 },
  { month: 'Sep 2024', resolvedComplaints: 58, volunteerHours: 390, volunteersMobilized: 142 },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Roads & Transport': '#10b981',
  'Solid Waste Management': '#059669',
  'Water Supply & Sewage': '#0284c7',
  'Street Lighting': '#f59e0b',
  'Public Health & Sanitation': '#8b5cf6',
  'Stormwater Drainage': '#06b6d4',
  'Parks & Green Spaces': '#16a34a',
  'Other': '#64748b'
};

export const CommunityImpactSection: React.FC = () => {
  const { complaints, communityOpportunities, t } = useCivic();
  const [activeMetricView, setActiveMetricView] = useState<'both' | 'complaints' | 'volunteer_hours'>('both');
  const [timeRange, setTimeRange] = useState<'6m' | '3m' | 'all'>('6m');

  // Compute live resolved complaints count
  const liveResolvedCount = useMemo(() => {
    return complaints.filter(c => 
      c.status === 'RESOLVED' || 
      c.status === 'VERIFIED_ACCEPTED' || 
      c.status === 'CLOSED'
    ).length;
  }, [complaints]);

  // Compute live volunteer hours contributed from completed/active community opportunities
  const liveVolunteerStats = useMemo(() => {
    let hours = 0;
    let volunteers = 0;
    
    communityOpportunities.forEach(opp => {
      const volCount = opp.requiredVolunteers || 15;
      const estHrs = 4; // average 4 hours per drive
      volunteers += volCount;
      if (opp.status === 'VERIFIED_COMPLETE') {
        hours += volCount * estHrs;
      } else if (opp.status === 'IN_PROGRESS' || opp.status === 'ACCEPTED') {
        hours += Math.round(volCount * estHrs * 0.5);
      }
    });

    return { hours, volunteers };
  }, [communityOpportunities]);

  // Aggregate category breakdown of resolved issues
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      const cat = c.category || 'Roads & Transport';
      counts[cat] = (counts[cat] || 0) + (c.status === 'RESOLVED' || c.status === 'VERIFIED_ACCEPTED' ? 1 : 0);
    });

    // Provide default representative values if live dataset is freshly reset
    const defaultData = [
      { name: 'Roads & Transport', resolved: counts['Roads & Transport'] || 24, hours: 140 },
      { name: 'Solid Waste Management', resolved: counts['Solid Waste Management'] || 18, hours: 210 },
      { name: 'Water Supply & Sewage', resolved: counts['Water Supply & Sewage'] || 15, hours: 95 },
      { name: 'Street Lighting', resolved: counts['Street Lighting'] || 12, hours: 45 },
      { name: 'Public Health & Sanitation', resolved: counts['Public Health & Sanitation'] || 9, hours: 160 },
      { name: 'Stormwater Drainage', resolved: counts['Stormwater Drainage'] || 8, hours: 70 },
    ];

    return defaultData;
  }, [complaints]);

  // Dynamic monthly chart data combining baseline trend + active database records
  const chartData = useMemo(() => {
    return BASELINE_MONTHLY_DATA.map((item, idx) => {
      if (idx === BASELINE_MONTHLY_DATA.length - 1) {
        return {
          ...item,
          resolvedComplaints: item.resolvedComplaints + liveResolvedCount,
          volunteerHours: item.volunteerHours + liveVolunteerStats.hours,
          volunteersMobilized: item.volunteersMobilized + liveVolunteerStats.volunteers
        };
      }
      return item;
    });
  }, [liveResolvedCount, liveVolunteerStats]);

  // Total sums
  const totalResolvedGrievances = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.resolvedComplaints, 0);
  }, [chartData]);

  const totalVolunteerHours = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.volunteerHours, 0);
  }, [chartData]);

  const totalVolunteersMobilized = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.volunteersMobilized, 0);
  }, [chartData]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900">
                Community Impact & Civic Participation
              </h2>
              <p className="text-xs text-neutral-500">
                Tracking citizen-driven grievance resolutions, volunteer workforce, and verified community hours.
              </p>
            </div>
          </div>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveMetricView('both')}
            className={`px-3 py-1.5 rounded-lg transition ${activeMetricView === 'both' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            Combined Metrics
          </button>
          <button
            onClick={() => setActiveMetricView('complaints')}
            className={`px-3 py-1.5 rounded-lg transition ${activeMetricView === 'complaints' ? 'bg-white text-emerald-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            Resolved Issues
          </button>
          <button
            onClick={() => setActiveMetricView('volunteer_hours')}
            className={`px-3 py-1.5 rounded-lg transition ${activeMetricView === 'volunteer_hours' ? 'bg-white text-blue-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            Volunteer Hours
          </button>
        </div>
      </div>

      {/* Primary Impact Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Resolved Grievances */}
        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Total Resolved Grievances</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900">
              {totalResolvedGrievances.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              +18% this quarter
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Verified by citizen sign-offs with before & after photographic evidence.
          </p>
        </div>

        {/* Card 2: Volunteer Hours Contributed */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Volunteer Hours Contributed</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-900">
              {totalVolunteerHours.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
              Hours Logged
            </span>
          </div>
          <p className="text-[11px] text-blue-700/80 mt-1">
            Dedicated across lake cleanups, waste drives, and tree plantations.
          </p>
        </div>

        {/* Card 3: Volunteers Mobilized */}
        <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">Volunteers Mobilized</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-900">
              {totalVolunteersMobilized.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
              Active Citizens
            </span>
          </div>
          <p className="text-[11px] text-purple-700/80 mt-1">
            Civic action groups and student collectives coordinated with ward officers.
          </p>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              {activeMetricView === 'both' && 'Resolved Grievances vs. Volunteer Hours (6-Month Trend)'}
              {activeMetricView === 'complaints' && 'Municipal Grievances Resolved by Citizen Verification'}
              {activeMetricView === 'volunteer_hours' && 'Community Volunteer Hours Contributed Monthly'}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {(activeMetricView === 'both' || activeMetricView === 'complaints') && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-3 h-3 rounded-sm bg-emerald-600"></span>
                Resolved Complaints
              </span>
            )}
            {(activeMetricView === 'both' || activeMetricView === 'volunteer_hours') && (
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
                Volunteer Hours
              </span>
            )}
          </div>
        </div>

        {/* Recharts Area/Bar Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetricView === 'both' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="resolvedComplaints" 
                  name="Resolved Complaints" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#gradComplaints)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="volunteerHours" 
                  name="Volunteer Hours (hrs)" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#gradHours)" 
                />
              </AreaChart>
            ) : activeMetricView === 'complaints' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Bar 
                  dataKey="resolvedComplaints" 
                  name="Resolved Grievances" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Bar 
                  dataKey="volunteerHours" 
                  name="Volunteer Hours Contributed" 
                  fill="#2563eb" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="pt-4 border-t border-neutral-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-neutral-500" />
          <span>Sector Breakdown: Resolved Grievances & Volunteer Hours by Domain</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryBreakdown.map((cat) => (
            <div key={cat.name} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                <span className="truncate">{cat.name}</span>
                <span className="text-emerald-700 font-bold ml-2 shrink-0">{cat.resolved} Fixed</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                <span>Volunteer Hours:</span>
                <span className="font-semibold text-blue-700">{cat.hours} hrs</span>
              </div>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${Math.min(100, (cat.resolved / 30) * 100)}%` }}
                />
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${Math.min(100, (cat.hours / 250) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
