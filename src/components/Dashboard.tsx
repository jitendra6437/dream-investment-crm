import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  Users,
  Layers,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Award,
  DollarSign,
  Briefcase,
  Layers3,
  ThumbsDown,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import { Lead, Task, Project, SiteVisit, Deal, CRMUser } from '../types';
import { CrmDb } from '../firebase';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [timePreset, setTimePreset] = useState<'today' | 'yesterday' | '7days' | '30days' | 'thismonth' | 'custom'>('thismonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filteredSiteVisits, setFilteredSiteVisits] = useState<SiteVisit[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const l = await CrmDb.getLeads();
      const t = await CrmDb.getTasks();
      const s = await CrmDb.getSiteVisits();
      const d = await CrmDb.getDeals();
      const u = await CrmDb.getUsers();
      const p = await CrmDb.getProjects();

      setLeads(l);
      setTasks(t);
      setSiteVisits(s);
      setDeals(d);
      setUsers(u);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Run Filtering
  useEffect(() => {
    let tempLeads = [...leads];
    let tempTasks = [...tasks];
    let tempVisits = [...siteVisits];
    let tempDeals = [...deals];

    // 1. Time Presets
    const now = new Date();
    let startLimit: Date | null = null;
    let endLimit: Date | null = null;

    if (timePreset === 'today') {
      startLimit = new Date();
      startLimit.setHours(0, 0, 0, 0);
      endLimit = new Date();
      endLimit.setHours(23, 59, 59, 999);
    } else if (timePreset === 'yesterday') {
      startLimit = new Date();
      startLimit.setDate(now.getDate() - 1);
      startLimit.setHours(0, 0, 0, 0);
      endLimit = new Date();
      endLimit.setDate(now.getDate() - 1);
      endLimit.setHours(23, 59, 59, 999);
    } else if (timePreset === '7days') {
      startLimit = new Date();
      startLimit.setDate(now.getDate() - 7);
      startLimit.setHours(0, 0, 0, 0);
    } else if (timePreset === '30days') {
      startLimit = new Date();
      startLimit.setDate(now.getDate() - 30);
      startLimit.setHours(0, 0, 0, 0);
    } else if (timePreset === 'thismonth') {
      startLimit = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timePreset === 'custom') {
      if (customStart) startLimit = new Date(customStart);
      if (customEnd) {
        endLimit = new Date(customEnd);
        endLimit.setHours(23, 59, 59, 999);
      }
    }

    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (startLimit && d < startLimit) return false;
      if (endLimit && d > endLimit) return false;
      return true;
    };

    tempLeads = tempLeads.filter(l => filterByDate(l.createdAt));
    tempTasks = tempTasks.filter(t => filterByDate(t.createdAt));
    tempVisits = tempVisits.filter(v => filterByDate(v.createdAt));
    tempDeals = tempDeals.filter(d => filterByDate(d.createdAt));

    // 2. Filter by Team Member
    if (selectedUser !== 'all') {
      tempLeads = tempLeads.filter(l => l.assignedTo === selectedUser);
      tempTasks = tempTasks.filter(t => t.assignedTo === selectedUser);
      tempVisits = tempVisits.filter(v => v.salesPerson === selectedUser);
      tempDeals = tempDeals.filter(d => d.salesPerson === selectedUser);
    }

    // 3. Filter by Project Interested
    if (selectedProject !== 'all') {
      tempLeads = tempLeads.filter(l => l.projectInterested === selectedProject);
      tempVisits = tempVisits.filter(v => v.projectName === selectedProject);
      tempDeals = tempDeals.filter(d => d.projectName === selectedProject);
    }

    // 4. Filter by Source
    if (selectedSource !== 'all') {
      tempLeads = tempLeads.filter(l => l.source === selectedSource);
    }

    setFilteredLeads(tempLeads);
    setFilteredTasks(tempTasks);
    setFilteredSiteVisits(tempVisits);
    setFilteredDeals(tempDeals);
  }, [timePreset, customStart, customEnd, selectedUser, selectedProject, selectedSource, leads, tasks, siteVisits, deals]);

  // Calculations for Key Cards
  const totalLeadsCount = filteredLeads.length;
  const freshLeadsCount = filteredLeads.filter(l => l.status === 'Fresh').length;
  const hotLeadsCount = filteredLeads.filter(l => l.priority === 'Hot').length;
  const lostLeadsCount = filteredLeads.filter(l => l.status === 'Lost' || l.status === 'Not Interested').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = filteredTasks.filter(t => t.dueDate === todayStr);
  const overdueTasksCount = filteredTasks.filter(t => t.status === 'Overdue').length;

  const visitsScheduled = filteredSiteVisits.filter(v => v.status === 'Scheduled').length;
  const visitsCompleted = filteredSiteVisits.filter(v => v.status === 'Done').length;

  const dealsClosed = filteredDeals.filter(d => d.stage === 'Closed').length;
  const totalRevenue = filteredDeals.reduce((sum, d) => sum + d.expectedCommission, 0);
  const revenueReceived = filteredDeals.reduce((sum, d) => sum + d.receivedCommission, 0);
  const revenuePending = filteredDeals.reduce((sum, d) => sum + d.pendingCommission, 0);

  // Chart Data Generation
  // 1. Lead Statuses
  const statusCounts = filteredLeads.reduce((acc: { [key: string]: number }, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});
  const statusChartData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  // 2. Lead Sources
  const sourceCounts = filteredLeads.reduce((acc: { [key: string]: number }, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});
  const sourceChartData = Object.keys(sourceCounts).map(source => ({
    name: source,
    value: sourceCounts[source]
  }));

  // 3. Deal Funnel
  const funnelChartData = [
    { value: totalLeadsCount, name: 'Total Leads', fill: '#3b82f6' },
    { value: filteredLeads.filter(l => l.status !== 'Fresh').length, name: 'Contacted Leads', fill: '#14b8a6' },
    { value: filteredSiteVisits.length, name: 'Site Visits', fill: '#f59e0b' },
    { value: filteredDeals.length, name: 'Deals Active', fill: '#8b5cf6' },
    { value: dealsClosed, name: 'Won Deals', fill: '#10b981' }
  ];

  // 4. Daily Trend (for last 7 days from current date)
  const getDailyTrendData = () => {
    const dates: { [key: string]: { leads: number; visits: number; revenue: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isostring = d.toISOString().split('T')[0];
      dates[isostring] = { leads: 0, visits: 0, revenue: 0 };
    }

    filteredLeads.forEach(l => {
      const cDate = l.createdAt.split('T')[0];
      if (dates[cDate] !== undefined) {
        dates[cDate].leads += 1;
      }
    });

    filteredSiteVisits.forEach(v => {
      const cDate = v.createdAt.split('T')[0];
      if (dates[cDate] !== undefined) {
        dates[cDate].visits += 1;
      }
    });

    filteredDeals.forEach(d => {
      const cDate = d.createdAt.split('T')[0];
      if (dates[cDate] !== undefined) {
        dates[cDate].revenue += d.expectedCommission;
      }
    });

    return Object.keys(dates).map(date => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      Leads: dates[date].leads,
      SiteVisits: dates[date].visits,
      Commission: Math.round(dates[date].revenue / 1000) // in Thousands
    }));
  };

  const trendData = getDailyTrendData();

  // 5. Team Performance Tracker (Leaderboard)
  const getTeamPerformance = () => {
    const map: { [userId: string]: { name: string; leads: number; visits: number; deals: number; revenue: number } } = {};

    users.forEach(u => {
      map[u.id] = { name: u.name, leads: 0, visits: 0, deals: 0, revenue: 0 };
    });

    filteredLeads.forEach(l => {
      if (map[l.assignedTo]) {
        map[l.assignedTo].leads += 1;
      }
    });

    filteredSiteVisits.forEach(v => {
      // siteVisits salesPerson is string (name or id)
      const u = users.find(usr => usr.name === v.salesPerson || usr.id === v.salesPerson);
      if (u && map[u.id]) {
        map[u.id].visits += 1;
      }
    });

    filteredDeals.forEach(d => {
      if (map[d.salesPerson]) {
        map[d.salesPerson].deals += 1;
        map[d.salesPerson].revenue += d.expectedCommission;
      }
    });

    return Object.keys(map).map(id => map[id]).sort((a, b) => b.revenue - a.revenue);
  };

  const teamPerformance = getTeamPerformance();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6" id="dashboard-container">
      {/* Filters Strip */}
      <div className="bg-white/95 p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="filter-today"
            onClick={() => setTimePreset('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${timePreset === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Today
          </button>
          <button
            id="filter-yesterday"
            onClick={() => setTimePreset('yesterday')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${timePreset === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Yesterday
          </button>
          <button
            id="filter-7days"
            onClick={() => setTimePreset('7days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${timePreset === '7days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Last 7 Days
          </button>
          <button
            id="filter-30days"
            onClick={() => setTimePreset('30days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${timePreset === '30days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Last 30 Days
          </button>
          <button
            id="filter-thismonth"
            onClick={() => setTimePreset('thismonth')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${timePreset === 'thismonth' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            This Month
          </button>
          <button
            id="filter-custom"
            onClick={() => setTimePreset('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${timePreset === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom date selectors */}
        {timePreset === 'custom' && (
          <div className="flex items-center space-x-2 animate-fade-in" id="custom-date-inputs">
            <input
              type="date"
              id="start-date-picker"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              id="end-date-picker"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Executive dropdown */}
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <select
              id="user-filter-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Agents</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Project dropdown */}
          <div className="flex items-center space-x-1.5">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <select
              id="project-filter-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Lead Source dropdown */}
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <select
              id="source-filter-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Website">Website</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>

          <button
            id="refresh-dashboard"
            onClick={loadDashboardData}
            title="Refresh statistics"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Numerical Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Total Leads */}
        <div id="card-total-leads" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Leads</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-950">{totalLeadsCount}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Fresh Leads */}
        <div id="card-fresh-leads" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Fresh Leads</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-600">{freshLeadsCount}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-lg">
            <Layers3 className="w-6 h-6" />
          </div>
        </div>

        {/* Hot Leads */}
        <div id="card-hot-leads" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Hot Leads</p>
            <h3 className="text-2xl font-bold mt-1 text-red-600">{hotLeadsCount}</h3>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Today Tasks */}
        <div id="card-today-tasks" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Today Follow-ups</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-600">{todayTasks.length}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue */}
        <div id="card-overdue-tasks" className="bg-white p-4 rounded-xl border border-red-200 shadow-xs flex items-center justify-between bg-red-50/10">
          <div>
            <p className="text-red-500 text-xs font-semibold uppercase tracking-wider">Overdue Tasks</p>
            <h3 className="text-2xl font-bold mt-1 text-red-600">{overdueTasksCount}</h3>
          </div>
          <div className="p-2.5 bg-red-50 text-red-500 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Site Visits Scheduled */}
        <div id="card-visits-scheduled" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Site Visits Sched.</p>
            <h3 className="text-2xl font-bold mt-1 text-purple-600">{visitsScheduled}</h3>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Site Visits Completed */}
        <div id="card-visits-completed" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Visits Completed</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600">{visitsCompleted}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Deals Closed */}
        <div id="card-deals-closed" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Deals closed</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900">{dealsClosed}</h3>
          </div>
          <div className="p-2.5 bg-green-50 text-emerald-700 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Total Revenue */}
        <div id="card-revenue" className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between md:col-span-2">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Expected Brokerage</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900">₹{totalRevenue.toLocaleString()}</h3>
            <div className="flex items-center space-x-2 mt-1 text-[11px]">
              <span className="text-emerald-600 font-medium">Recd: ₹{revenueReceived.toLocaleString()}</span>
              <span className="text-gray-400">|</span>
              <span className="text-red-500 font-medium font-mono">Pend: ₹{revenuePending.toLocaleString()}</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Deal Conversion Funnel */}
        <div id="chart-funnel" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col h-[340px]">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-blue-500" />
            Brokerage Conversion Funnel
          </h4>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip formatter={(value) => [`${value} items`, 'Stage Count']} />
                <Funnel
                  dataKey="value"
                  data={funnelChartData}
                  isAnimationActive={false}
                >
                  <LabelList position="right" fill="#475569" stroke="none" dataKey="name" fontSize={11} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activities Trend Chart */}
        <div id="chart-trend" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col h-[340px]">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-blue-500" />
            Daily Operational Trends
          </h4>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Leads" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="SiteVisits" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead status pie chart */}
        <div id="chart-status" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col h-[340px]">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
            <Layers3 className="w-4 h-4 mr-1.5 text-blue-500" />
            Lead Status Distribution
          </h4>
          <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
            {statusChartData.length === 0 ? (
              <p className="text-xs text-gray-400">No status metrics found for selected criteria.</p>
            ) : (
              <div className="w-full h-full flex flex-row items-center justify-center">
                <div className="w-[60%] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-[40%] space-y-1.5 overflow-y-auto max-h-[180px] p-1">
                  {statusChartData.slice(0, 6).map((item, idx) => (
                    <div key={item.name} className="flex items-center text-[10px] space-x-1.5 text-ellipsis">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-gray-600 truncate max-w-[80px]" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Source Horizontal Bars */}
        <div id="chart-sources" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col h-[340px]">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
            <Users className="w-4 h-4 mr-1.5 text-blue-500" />
            Leads by Sourcing Mediums
          </h4>
          <div className="flex-1 w-full min-h-[220px]">
            {sourceChartData.length === 0 ? (
              <p className="text-xs text-gray-400">No source data available matching filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Priority Card */}
        <div id="card-leads-priority-grid" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col h-[340px]">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-blue-500" />
            Priority Class Allocation
          </h4>
          <div className="flex-1 flex flex-col justify-around py-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-1.5 bg-red-50 text-red-600 font-bold text-xs rounded-full">HOT LEADS</span>
                <p className="text-xs text-gray-400 mt-2">Active high budget immediately closeable buyers</p>
              </div>
              <span className="text-2xl font-black text-red-600">{hotLeadsCount}</span>
            </div>
            <div className="border-t border-gray-50 my-2"></div>
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-1.5 bg-amber-50 text-amber-600 font-bold text-xs rounded-full">WARM LEADS</span>
                <p className="text-xs text-gray-400 mt-2">Follow-ups interested but looking for RERA details</p>
              </div>
              <span className="text-2xl font-black text-amber-500">
                {filteredLeads.filter(l => l.priority === 'Warm').length}
              </span>
            </div>
            <div className="border-t border-gray-50 my-2"></div>
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-1.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">COLD LEADS</span>
                <p className="text-xs text-gray-400 mt-2">Low priority future requirements, passive searchers</p>
              </div>
              <span className="text-2xl font-black text-slate-500">
                {filteredLeads.filter(l => l.priority === 'Cold').length}
              </span>
            </div>
          </div>
        </div>

        {/* Top Performing Agents Leaderboard */}
        <div id="card-agent-leaderboard" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col h-[340px]">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <Award className="w-4 h-4 mr-1.5 text-blue-500 animate-pulse" />
            Agent Power Leaderboard
          </h4>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {teamPerformance.map((user, index) => (
              <div key={user.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700 font-black' :
                    index === 1 ? 'bg-slate-100 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-xs text-gray-800 truncate" title={user.name}>{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">Leads: {user.leads} | Visits: {user.visits} | Deals: {user.deals}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 font-mono">₹{user.revenue.toLocaleString()}</p>
                  <p className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">Revenue</p>
                </div>
              </div>
            ))}
            {teamPerformance.length === 0 && (
              <p className="text-xs text-gray-400">No performance data updated.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
