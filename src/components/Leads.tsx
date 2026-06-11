import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  UserPlus,
  Send,
  Download,
  Upload,
  Phone,
  MessageSquare,
  MoreVertical,
  Calendar,
  Layers,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  BadgeAlert,
  Archive,
  Info,
  Clock,
  User,
  Filter,
  DollarSign,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Lead, Task, SiteVisit, Deal, Project, CRMUser, LeadStatus, LeadPriority, LeadSource, PropertyType, BHKOption, PurposeOption } from '../types';
import { CrmDb, getActiveUser } from '../firebase';

export default function Leads() {
  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all'); // 'low', 'medium', 'high', 'custom'
  const [bhkFilter, setBhkFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState<'all' | 'hot' | 'fresh' | 'site_visit' | 'converted' | 'lost'>('all');

  // Multi select
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null); // Detail view drawer
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null); // Edit wizard

  // Quick Action Modals
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showSiteVisitModal, setShowSiteVisitModal] = useState(false);
  const [showConvertDealModal, setShowConvertDealModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    setLoading(true);
    try {
      const l = await CrmDb.getLeads();
      const u = await CrmDb.getUsers();
      const p = await CrmDb.getProjects();
      setLeads(l);
      setUsers(u);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever modification happens
  const refreshLeadsList = async () => {
    const l = await CrmDb.getLeads();
    setLeads(l);
  };

  // Saved presets filters
  const getTabFilteredLeads = () => {
    let result = [...leads];
    if (selectedTab === 'hot') {
      result = result.filter(l => l.priority === 'Hot');
    } else if (selectedTab === 'fresh') {
      result = result.filter(l => l.status === 'Fresh');
    } else if (selectedTab === 'site_visit') {
      result = result.filter(l => l.status === 'Site Visit Scheduled' || l.status === 'Site Visit Done');
    } else if (selectedTab === 'converted') {
      result = result.filter(l => l.status === 'Booking Done' || l.status === 'Deal Closed');
    } else if (selectedTab === 'lost') {
      result = result.filter(l => l.status === 'Lost' || l.status === 'Not Interested' || l.status === 'Low Budget');
    }
    return result;
  };

  // Complex multi-level filters
  const getFullyFilteredLeads = () => {
    let base = getTabFilteredLeads();

    // Text search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      base = base.filter(l =>
        l.name.toLowerCase().includes(term) ||
        l.mobile.toLowerCase().includes(term) ||
        (l.email && l.email.toLowerCase().includes(term)) ||
        (l.projectInterested && l.projectInterested.toLowerCase().includes(term)) ||
        l.city.toLowerCase().includes(term) ||
        l.propertyType.toLowerCase().includes(term)
      );
    }

    // Dropdowns
    if (statusFilter !== 'all') {
      base = base.filter(l => l.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      base = base.filter(l => l.priority === priorityFilter);
    }
    if (sourceFilter !== 'all') {
      base = base.filter(l => l.source === sourceFilter);
    }
    if (assignedFilter !== 'all') {
      base = base.filter(l => l.assignedTo === assignedFilter);
    }
    if (bhkFilter !== 'all') {
      base = base.filter(l => l.bhk === bhkFilter);
    }

    // Budget Filters
    if (budgetFilter !== 'all') {
      if (budgetFilter === 'low') {
        base = base.filter(l => l.budgetMax <= 10000000); // under 1 Cr
      } else if (budgetFilter === 'medium') {
        base = base.filter(l => l.budgetMin >= 10000000 && l.budgetMax <= 25000000); // 1 to 2.5 Cr
      } else if (budgetFilter === 'high') {
        base = base.filter(l => l.budgetMin >= 25000000); // 2.5 Cr+
      }
    }

    return base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const processedLeads = getFullyFilteredLeads();

  // Pagination compute
  const totalPages = Math.ceil(processedLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = processedLeads.slice(startIndex, startIndex + itemsPerPage);

  // Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = paginatedLeads.map(l => l.id);
      setSelectedLeadIds(allIds);
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectOne = (leadId: string) => {
    if (selectedLeadIds.includes(leadId)) {
      setSelectedLeadIds(selectedLeadIds.filter(id => id !== leadId));
    } else {
      setSelectedLeadIds([...selectedLeadIds, leadId]);
    }
  };

  // Dynamic status styling
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Fresh':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Assigned':
        return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Interested':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Negotiation':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Booking Done':
      case 'Deal Closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Lost':
      case 'Not Interested':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getPriorityBadge = (p: LeadPriority) => {
    if (p === 'Hot') return 'bg-red-100 text-red-800';
    if (p === 'Warm') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-800';
  };

  // Bulk deletion
  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (window.confirm(`Are you absolutely sure you want to delete ${selectedLeadIds.length} selected leads?`)) {
      setLoading(true);
      for (const id of selectedLeadIds) {
        await CrmDb.deleteLead(id);
      }
      setSelectedLeadIds([]);
      await refreshLeadsList();
      alert('Selected leads deleted successfully.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const dataToExport = selectedLeadIds.length > 0
      ? leads.filter(l => selectedLeadIds.includes(l.id))
      : processedLeads;

    if (dataToExport.length === 0) {
      alert('No leads found to export.');
      return;
    }

    const headers = [
      'Lead ID', 'Name', 'Phone', 'Alternate Phone', 'Email', 'City', 'Locality', 'Requirement',
      'Buy/Rent/Resale', 'Min Budget', 'Max Budget', 'Property Type', 'BHK', 'Purpose', 'Source',
      'Interested Project', 'Status', 'Priority', 'Assigned To', 'Created Date'
    ];

    const csvRows = [headers.join(',')];

    dataToExport.forEach(l => {
      const row = [
        l.id,
        `"${l.name.replace(/"/g, '""')}"`,
        l.mobile,
        l.alternateNumber || '',
        l.email || '',
        l.city,
        l.locality ? `"${l.locality.replace(/"/g, '""')}"` : '',
        l.propertyRequirement ? `"${l.propertyRequirement.replace(/"/g, '""')}"` : '',
        l.buyRentResale,
        l.budgetMin,
        l.budgetMax,
        l.propertyType,
        l.bhk || '',
        l.purpose || '',
        l.source,
        l.projectInterested || '',
        l.status,
        l.priority,
        `"${(l.assignedToName || l.assignedTo || '').replace(/"/g, '""')}"`,
        l.createdAt
      ];
      csvRows.push(row.join(','));
    });

    const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `dream_investment_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Timeline Action Handler
  const [timelineNotes, setTimelineNotes] = useState('');
  const handleAddTimelineNote = async (leadId: string) => {
    if (!timelineNotes.trim()) return;
    await CrmDb.updateLead(leadId, { notes: timelineNotes });
    setTimelineNotes('');
    const refreshed = await CrmDb.getLeads();
    setLeads(refreshed);
    const currentObj = refreshed.find(l => l.id === leadId);
    if (currentObj) setSelectedLead(currentObj);
  };

  // Convert budget to readable Lac/Cr
  const formatBudget = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${Math.round(num / 100000)} Lac`;
    }
    return `₹${num.toLocaleString()}`;
  };

  return (
    <div className="p-4 space-y-4" id="leads-view-outer">
      {/* Search & Action bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              id="leads-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, email, project or locality..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-add-lead"
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
            <button
              id="btn-import-leads"
              onClick={() => setShowImportModal(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-gray-200"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <button
              id="btn-export-leads"
              onClick={handleExportCSV}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-gray-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="pt-2 border-t border-gray-50 flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 text-xs text-gray-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status filter */}
          <select
            id="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 bg-white text-gray-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Statuses: All</option>
            <option value="Fresh">Fresh</option>
            <option value="Assigned">Assigned</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Site Visit Scheduled">Site Visit Scheduled</option>
            <option value="Site Visit Done">Site Visit Done</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Booking Done">Booking Done</option>
            <option value="Deal Closed">Deal Closed</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Priority filter */}
          <select
            id="filter-priority-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-200 bg-white text-gray-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Priority: All</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>

          {/* Source filter */}
          <select
            id="filter-source-select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border border-gray-200 bg-white text-gray-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Source: All</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Website">Website</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Referral">Referral</option>
            <option value="Manual">Manual</option>
          </select>

          {/* Budget bucket filter */}
          <select
            id="filter-budget-select"
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="border border-gray-200 bg-white text-gray-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Budgets: All</option>
            <option value="low">Under 1 Crore</option>
            <option value="medium">1 - 2.5 Crore</option>
            <option value="high">Above 2.5 Crore</option>
          </select>

          {/* Assigned Agent filter */}
          <select
            id="filter-assigned-select"
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="border border-gray-200 bg-white text-gray-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Assignments: All</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Reset Filters */}
          {(statusFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all' || budgetFilter !== 'all' || assignedFilter !== 'all' || searchTerm !== '') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSourceFilter('all');
                setBudgetFilter('all');
                setAssignedFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline decoration-dotted decoration-1"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Tabs list (Saved View filters) */}
      <div className="flex border-b border-gray-200" id="leads-saved-views-tabs">
        <button
          onClick={() => { setSelectedTab('all'); setCurrentPage(1); }}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 shrink-0 ${selectedTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          All Leads ({leads.length})
        </button>
        <button
          onClick={() => { setSelectedTab('hot'); setCurrentPage(1); }}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 shrink-0 ${selectedTab === 'hot' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          🔥 Hot Leads ({leads.filter(l => l.priority === 'Hot').length})
        </button>
        <button
          onClick={() => { setSelectedTab('fresh'); setCurrentPage(1); }}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 shrink-0 ${selectedTab === 'fresh' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          🆕 Fresh ({leads.filter(l => l.status === 'Fresh').length})
        </button>
        <button
          onClick={() => { setSelectedTab('site_visit'); setCurrentPage(1); }}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 shrink-0 ${selectedTab === 'site_visit' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          🚘 Site Visits ({leads.filter(l => l.status === 'Site Visit Scheduled' || l.status === 'Site Visit Done').length})
        </button>
        <button
          onClick={() => { setSelectedTab('converted'); setCurrentPage(1); }}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 shrink-0 ${selectedTab === 'converted' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          💰 Booking/Deals ({leads.filter(l => l.status === 'Booking Done' || l.status === 'Deal Closed').length})
        </button>
        <button
          onClick={() => { setSelectedTab('lost'); setCurrentPage(1); }}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 shrink-0 ${selectedTab === 'lost' ? 'border-slate-600 text-slate-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          ✖ Lost ({leads.filter(l => l.status === 'Lost' || l.status === 'Not Interested' || l.status === 'Low Budget').length})
        </button>
      </div>

      {/* Bulk Actions Bar if selection exists */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between animate-fade-in" id="leads-bulk-actions">
          <div className="flex items-center space-x-2 text-xs text-blue-800 font-bold">
            <BadgeAlert className="w-4 h-4 text-blue-600" />
            <span>{selectedLeadIds.length} leads selected in view</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Change Representative</span>
            </button>
            <button
              onClick={() => setShowBulkStatusModal(true)}
              className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center space-x-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Change Status</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Leads table and detail view side-by-side if lead is selected */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5" id="main-leads-body-grid">
        {/* Table View (Takes full/flexible width) */}
        <div className={`xl:col-span-8 bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="leads-master-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-4">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id))}
                    />
                  </th>
                  <th className="py-3 px-4">Client Detail</th>
                  <th className="py-3 px-4">Buy/Rent/Requirement</th>
                  <th className="py-3 px-4">Budget Range</th>
                  <th className="py-3 px-4">Status & Priority</th>
                  <th className="py-3 px-4">Representation</th>
                  <th className="py-3 px-4">Next Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`hover:bg-slate-50/70 transition-all cursor-pointer ${selectedLead?.id === lead.id ? 'bg-blue-50/50 border-l-2 border-l-blue-600' : ''}`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => handleSelectOne(lead.id)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600">{lead.name}</p>
                        <p className="text-gray-500 font-medium font-mono text-[11px] mt-0.5">{lead.mobile}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Src: {lead.source} | Loc: {lead.city}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-slate-100 mr-1 ${lead.buyRentResale === 'Rent' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                          {lead.buyRentResale}
                        </span>
                        <span className="font-semibold text-gray-700">{lead.bhk || lead.propertyType}</span>
                        <p className="text-gray-400 text-[10px] truncate max-w-[150px] mt-0.5">{lead.propertyRequirement || 'No further notes'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-800 font-mono">
                        {formatBudget(lead.budgetMin)} - {formatBudget(lead.budgetMax)}
                      </div>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <div>
                        <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div>
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${getPriorityBadge(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700 truncate">{lead.assignedToName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-700">
                        {lead.nextFollowUpDate ? (
                          <span className={`flex items-center space-x-1 ${new Date(lead.nextFollowUpDate) < new Date() && lead.status !== 'Booking Done' && lead.status !== 'Deal Closed' ? 'text-red-600 font-bold' : ''}`}>
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{lead.nextFollowUpDate}</span>
                          </span>
                        ) : '---'}
                      </div>
                    </td>
                  </tr>
                ))}

                {processedLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No matching CRM leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-100 flex items-center justify-between" id="leads-pagination-bar">
              <span className="text-xs text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedLeads.length)} of {processedLeads.length} leads
              </span>
              <div className="flex space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-xs rounded hover:bg-gray-100 font-semibold disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-xs rounded hover:bg-gray-100 font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lead Detail View Drawer/Span */}
        <div className="xl:col-span-4 bg-white rounded-xl border border-gray-100 shadow-xs p-4 flex flex-col h-[600px] overflow-hidden" id="leads-right-drawer-container">
          {selectedLead ? (
            <div className="flex flex-col h-full overflow-hidden animate-fade-in text-slate-800">
              {/* Header */}
              <div className="pb-3 border-b border-gray-150 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{selectedLead.name}</h3>
                  <p className="text-xs font-mono text-gray-500 flex items-center mt-0.5 space-x-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{selectedLead.mobile}</span>
                  </p>
                </div>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => {
                      const msg = `Hello ${selectedLead.name}, we are looking forward to showing you properties on Dream Investment!`;
                      window.open(`https://wa.me/${selectedLead.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                    title="Send WhatsApp Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setLeadToEdit(selectedLead); }}
                    className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setSelectedLead(null); }}
                    className="text-xs font-medium text-gray-400 hover:text-gray-700 font-mono px-1"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Quick action buttons panel */}
              <div className="py-3 border-b border-gray-50 flex items-center flex-wrap gap-1.5 shrink-0 justify-around">
                <button
                  onClick={() => setShowFollowupModal(true)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold rounded flex items-center space-x-1 shadow-2xs"
                >
                  <Clock className="w-3 h-3" />
                  <span>Call Follow-up</span>
                </button>
                <button
                  onClick={() => setShowSiteVisitModal(true)}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[10px] font-bold rounded flex items-center space-x-1 shadow-2xs"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Schedule Site Visit</span>
                </button>
                <button
                  disabled={selectedLead.status === 'Booking Done' || selectedLead.status === 'Deal Closed'}
                  onClick={() => setShowConvertDealModal(true)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded flex items-center space-x-1 shadow-2xs disabled:opacity-40"
                >
                  <DollarSign className="w-3 h-3" />
                  <span>Convert Deal</span>
                </button>
              </div>

              {/* Scrollable details and timeline logs */}
              <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-xs">
                {/* Core parameters details */}
                <div className="bg-slate-50/50 p-2.5 rounded-lg space-y-2 border border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Requirement</span>
                      <span className="font-bold text-gray-800">{selectedLead.bhk || selectedLead.propertyType} {selectedLead.buyRentResale}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Budget Range</span>
                      <span className="font-bold text-red-600 font-mono">{formatBudget(selectedLead.budgetMin)} - {formatBudget(selectedLead.budgetMax)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Interst Project</span>
                      <span className="font-bold text-gray-800 truncate block">{selectedLead.projectInterested || 'Global Finder'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Representative</span>
                      <span className="font-bold text-gray-800">{selectedLead.assignedToName || 'Unassigned'}</span>
                    </div>
                  </div>
                  {selectedLead.locality && (
                    <div className="text-[11px] pt-1 border-t border-gray-100">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider block">Areas Demanded</span>
                      <p className="font-bold text-gray-700 flex items-center">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 mr-0.5" />
                        <span>{selectedLead.locality}, {selectedLead.city}</span>
                      </p>
                    </div>
                  )}
                  {selectedLead.notes && (
                    <div className="text-[11px] pt-1.5 border-t border-gray-100">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase block">Latest Remarks</span>
                      <p className="italic text-gray-600 font-medium font-sans mt-0.5">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedLead.tags && selectedLead.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedLead.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-[10px] text-blue-600 rounded font-medium">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Notes Input / Append timeline notes */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Add Timeline remark</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={timelineNotes}
                      id="remark-timeline-input"
                      onChange={(e) => setTimelineNotes(e.target.value)}
                      placeholder="Type call outcome, reply notes..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddTimelineNote(selectedLead.id)}
                      className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-xs font-bold hover:bg-slate-800 shrink-0"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Call Outbox templates click log builders */}
                <div className="pt-2">
                  <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Activities History Tracker</h4>
                  <LeadTimeline leadId={selectedLead.id} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-gray-400 p-6">
              <Info className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-xs font-medium">No Lead Selected</p>
              <p className="text-[10px] text-gray-400 mt-1">Select a row from the leads sheet to view complete transaction logs, details and launch communication templates.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD LEAD MODEL */}
      {showAddModal && (
        <LeadFormWizard
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            setShowAddModal(false);
            await refreshLeadsList();
          }}
          users={users}
          projects={projects}
        />
      )}

      {/* MODAL 2: EDIT LEAD PLANNER */}
      {leadToEdit && (
        <LeadFormWizard
          lead={leadToEdit}
          onClose={() => setLeadToEdit(null)}
          onSuccess={async () => {
            setLeadToEdit(null);
            await refreshLeadsList();
            if (selectedLead && selectedLead.id === leadToEdit.id) {
              const r = await CrmDb.getLeads();
              const updateSel = r.find(l => l.id === leadToEdit.id);
              if (updateSel) setSelectedLead(updateSel);
            }
          }}
          users={users}
          projects={projects}
        />
      )}

      {/* MODAL 3: FOLLOW UP SCHEDULER */}
      {showFollowupModal && selectedLead && (
        <FollowUpSchedulerModal
          lead={selectedLead}
          onClose={() => setShowFollowupModal(false)}
          onSuccess={async () => {
            setShowFollowupModal(false);
            await refreshLeadsList();
          }}
        />
      )}

      {/* MODAL 4: SITE VISIT PLANNER */}
      {showSiteVisitModal && selectedLead && (
        <SiteVisitPlannerModal
          lead={selectedLead}
          projects={projects}
          onClose={() => setShowSiteVisitModal(false)}
          onSuccess={async () => {
            setShowSiteVisitModal(false);
            await refreshLeadsList();
            // sync drawer state
            const r = await CrmDb.getLeads();
            const syn = r.find(l => l.id === selectedLead.id);
            if (syn) setSelectedLead(syn);
          }}
        />
      )}

      {/* MODAL 5: CONVERT TO TRANS CLOSING DEAL */}
      {showConvertDealModal && selectedLead && (
        <ConvertDealModal
          lead={selectedLead}
          projects={projects}
          users={users}
          onClose={() => setShowConvertDealModal(false)}
          onSuccess={async () => {
            setShowConvertDealModal(false);
            await refreshLeadsList();
            // sync drawer state
            const r = await CrmDb.getLeads();
            const syn = r.find(l => l.id === selectedLead.id);
            if (syn) setSelectedLead(syn);
          }}
        />
      )}

      {/* MODAL 6: BULK CHANGE ASSIGN */}
      {showBulkAssignModal && (
        <BulkChangeAssignModal
          selectedLeadIds={selectedLeadIds}
          users={users}
          onClose={() => setShowBulkAssignModal(false)}
          onSuccess={async () => {
            setShowBulkAssignModal(false);
            setSelectedLeadIds([]);
            await refreshLeadsList();
          }}
        />
      )}

      {/* MODAL 7: BULK STATUS ASSIGN */}
      {showBulkStatusModal && (
        <BulkChangeStatusModal
          selectedLeadIds={selectedLeadIds}
          onClose={() => setShowBulkStatusModal(false)}
          onSuccess={async () => {
            setShowBulkStatusModal(false);
            setSelectedLeadIds([]);
            await refreshLeadsList();
          }}
        />
      )}

      {/* MODAL 8: CSV IMPORT ENHANCED MAPPER */}
      {showImportModal && (
        <CSVImporterModal
          users={users}
          projects={projects}
          onClose={() => setShowImportModal(false)}
          onSuccess={async () => {
            setShowImportModal(false);
            await refreshLeadsList();
          }}
        />
      )}
    </div>
  );
}

// ===============================================
// LEAD TIMELINE LOGS LIST SUBCOMPONENT
// ===============================================
function LeadTimeline({ leadId }: { leadId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    CrmDb.getActivities(leadId).then(setLogs);
  }, [leadId]);

  return (
    <div className="space-y-2 border-l border-gray-150 pl-3 pt-1">
      {logs.map((log) => (
        <div key={log.id} className="relative pb-2" id={`timeline-log-${log.id}`}>
          <div className="absolute -left-[16.5px] top-1 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></div>
          <div className="text-[11px]">
            <span className="font-bold text-gray-800">{log.type}</span>
            <span className="text-gray-400 ml-1 font-mono">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <p className="text-gray-500 mt-0.5 leading-relaxed">{log.description}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">By {log.performedByName || 'System'}</p>
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <p className="text-[10px] text-gray-400">No interaction records found.</p>
      )}
    </div>
  );
}

// ===============================================
// LEAD FORM ADD AND EDIT WIZARD MODAL
// ===============================================
interface LeadFormProps {
  lead?: Lead;
  onClose: () => void;
  onSuccess: () => void;
  users: CRMUser[];
  projects: Project[];
}

function LeadFormWizard({ lead, onClose, onSuccess, users, projects }: LeadFormProps) {
  const isEdit = !!lead;
  const [name, setName] = useState(lead?.name || '');
  const [mobile, setMobile] = useState(lead?.mobile || '');
  const [alternateNumber, setAlternateNumber] = useState(lead?.alternateNumber || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [city, setCity] = useState(lead?.city || 'Mumbai');
  const [locality, setLocality] = useState(lead?.locality || '');
  const [requirement, setRequirement] = useState(lead?.propertyRequirement || '');
  const [buyRentResale, setBuyRentResale] = useState<'Buy' | 'Rent' | 'Resale'>(lead?.buyRentResale || 'Buy');
  const [budgetMin, setBudgetMin] = useState(lead?.budgetMin || 1000000);
  const [budgetMax, setBudgetMax] = useState(lead?.budgetMax || 10000000);
  const [propertyType, setPropertyType] = useState<PropertyType>(lead?.propertyType || 'Flat');
  const [bhk, setBhk] = useState<BHKOption>(lead?.bhk || '2BHK');
  const [purpose, setPurpose] = useState<PurposeOption>(lead?.purpose || 'Own Use');
  const [source, setSource] = useState<LeadSource>(lead?.source || 'Meta Ads');
  const [projectInterested, setProjectInterested] = useState(lead?.projectInterested || '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'Fresh');
  const [priority, setPriority] = useState<LeadPriority>(lead?.priority || 'Warm');
  const [assignedTo, setAssignedTo] = useState(lead?.assignedTo || '');
  const [tagsStr, setTagsStr] = useState(lead?.tags?.join(', ') || '');
  const [errorWord, setErrorWord] = useState('');

  const activeExecs = users.filter(u => u.role === 'Sales Executive' || u.role === 'Telecaller' || u.role === 'Super Admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorWord('Client name is required.');
    if (!mobile.trim()) return setErrorWord('Valid phone number is required.');

    // Find executive name
    const executive = users.find(u => u.id === assignedTo);
    const assignedName = executive ? executive.name : '';

    const payload: any = {
      name,
      mobile,
      alternateNumber,
      email,
      city,
      locality,
      propertyRequirement: requirement,
      buyRentResale,
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      propertyType,
      bhk,
      purpose,
      source,
      projectInterested,
      status,
      priority,
      assignedTo,
      assignedToName: assignedName,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      createdBy: lead?.createdBy || getActiveUser().id,
      createdByName: lead?.createdByName || getActiveUser().name,
      createdAt: lead?.createdAt || new Date().toISOString()
    };

    try {
      if (isEdit && lead) {
        await CrmDb.updateLead(lead.id, payload);
      } else {
        await CrmDb.addLead(payload);
      }
      onSuccess();
    } catch (err: any) {
      if (err.message.includes('DUPLICATE_PHONE')) {
        setErrorWord(err.message);
      } else {
        setErrorWord(err.message || 'Saving lead failed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xs" id="lead-form-modal">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-150 mb-4 h-10">
          <h3 className="font-bold text-gray-900 text-base">{isEdit ? 'Modify CRM Lead Profile' : 'Upload Property Lead'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm font-mono p-1">✖</button>
        </div>

        {errorWord && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-lg text-xs font-semibold mb-4" id="lead-form-error">
            {errorWord}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold" id="lead-form-element">
          {/* Section 1: Contact Detail */}
          <div>
            <h4 className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-2">1. Client Core Contact Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Full Client Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-50 focus:bg-white text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Phone Mobile *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-50 focus:bg-white text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Alternate Number</label>
                <input
                  type="tel"
                  value={alternateNumber}
                  onChange={(e) => setAlternateNumber(e.target.value)}
                  placeholder="Landline / Spouse no"
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-50 focus:bg-white text-xs font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@gmail.com"
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-50 focus:bg-white text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Target Sourcing Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-50 text-xs text-gray-700"
                >
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Website">Website</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Referral">Referral</option>
                  <option value="Magicbricks">Magicbricks</option>
                  <option value="Housing">Housing</option>
                  <option value="99acres">99acres</option>
                  <option value="Manual">Manual</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Requirement Info */}
          <div>
            <h4 className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-2">2. Property Requirements Mapping</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Action Type</label>
                <select
                  value={buyRentResale}
                  onChange={(e) => setBuyRentResale(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="Buy">Buy Outright</option>
                  <option value="Rent">Rent Lease</option>
                  <option value="Resale">Resale</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="Flat">Flat Apartment</option>
                  <option value="Villa">Villa / Row House</option>
                  <option value="Plot">Plot Land</option>
                  <option value="Office">Commercial Office</option>
                  <option value="Shop">Retail Shop</option>
                  <option value="Warehouse">Warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Configuration (BHK)</label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value as BHKOption)}
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                  <option value="4BHK">4 BHK</option>
                  <option value="5BHK+">5 BHK+</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Purchase Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as PurposeOption)}
                  className="w-full border border-gray-200 rounded-md p-1.5 focus:outline-none bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="Own Use">Own Use</option>
                  <option value="Investment">Investment Yield</option>
                  <option value="Rental Income">Rental Income</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">City Location</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-500 mb-1">Locality Area Interested</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Wadala East, Thane Meadows"
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Interested Project</label>
                <select
                  value={projectInterested}
                  onChange={(e) => setProjectInterested(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="">-- Generic Search --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-500 mb-1">Min Budget Value (₹)</label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs font-mono font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-500 mb-1">Max Budget Value (₹)</label>
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs font-mono font-medium"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-gray-500 mb-1">Requirement Notes</label>
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Specific instructions on layout, facing, balconies..."
                className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2 text-xs font-medium focus:bg-white focus:outline-none"
                rows={2}
              />
            </div>
          </div>

          {/* Section 3: Status & Representation */}
          <div>
            <h4 className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-2">3. Workflow Allocation</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Sales Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="Fresh">Fresh</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                  <option value="Site Visit Done">Site Visit Done</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Booking Done">Booking Done</option>
                  <option value="Deal Closed">Deal Closed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Lead Priority Group</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LeadPriority)}
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="Hot">🔥 Hot (Immediate)</option>
                  <option value="Warm">⚡ Warm (Nurture)</option>
                  <option value="Cold">❄ Cold (Passive)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-500 mb-1">Assign Representative User</label>
                <select
                  value={assignedTo}
                  required
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs text-gray-700 font-medium"
                >
                  <option value="">-- Choose Agent --</option>
                  {activeExecs.map(ae => (
                    <option key={ae.id} value={ae.id}>{ae.name} ({ae.role})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-gray-500 mb-1">CRM Identifier Tags (comma separated)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="HNI, Wadala, Dadar, ImmediateSale"
                className="w-full border border-gray-200 rounded-md p-1.5 bg-gray-50 text-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              {isEdit ? 'Save Lead Adjustments' : 'Upload CRM Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===============================================
// MODAL: DYNAMIC FOLLOWUP SCHEDULER
// ===============================================
interface FollowUpSchedulerModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

function FollowUpSchedulerModal({ lead, onClose, onSuccess }: FollowUpSchedulerModalProps) {
  const [type, setType] = useState<'Call' | 'WhatsApp' | 'Meeting' | 'Document' | 'Other'>('Call');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('11:00');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [notes, setNotes] = useState('');

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) {
      alert('Please select a due-date');
      return;
    }

    try {
      await CrmDb.addTask({
        leadId: lead.id,
        clientName: lead.name,
        mobile: lead.mobile,
        type,
        dueDate,
        dueTime,
        priority,
        assignedTo: lead.assignedTo,
        assignedToName: lead.assignedToName || 'Unassigned',
        status: 'Pending',
        notes
      });

      // Synchronize lead next follow up date parameter
      await CrmDb.updateLead(lead.id, {
        nextFollowUpDate: dueDate,
        status: 'Follow-up'
      });

      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-md w-full">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Schedule Follow-up Task - {lead.name}</h3>
        <form onSubmit={handleSchedule} className="space-y-3.5 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-500 mb-1">Followup Medium</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700">
                <option value="Call">Phone Call Calling</option>
                <option value="WhatsApp">WhatsApp Chat</option>
                <option value="Meeting">Joint Meeting</option>
                <option value="Document">Paper Documents Collect</option>
                <option value="Other">Other Touchpoint</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Task Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700">
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🔵 Low Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Appointment Date</label>
              <input required type="date" value={dueDate} onChange={(e: any) => setDueDate(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 font-medium text-xs text-gray-700" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Appt Time</label>
              <input required type="time" value={dueTime} onChange={(e: any) => setDueTime(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 font-medium text-xs text-gray-700" />
            </div>
          </div>
          <div>
            <label className="block text-gray-500 mb-1">Follow-up Brief / Objectives</label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Call to discuss tower height constraints, or pitch Prestiges layout plans."
              className="w-full border rounded p-2 bg-gray-50 font-medium text-xs focus:bg-white"
            />
          </div>
          <div className="flex justify-end space-x-1.5 pt-2">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-3.5 py-1.5 bg-blue-600 rounded text-white hover:bg-blue-700">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===============================================
// MODAL: SITE VISIT PLANNER
// ===============================================
interface SiteVisitModalProps {
  lead: Lead;
  projects: Project[];
  onClose: () => void;
  onSuccess: () => void;
}

function SiteVisitPlannerModal({ lead, projects, onClose, onSuccess }: SiteVisitModalProps) {
  const [projectName, setProjectName] = useState(lead.projectInterested || '');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00');
  const [salesPerson, setSalesPerson] = useState(lead.assignedToName || '');
  const [pickupRequired, setPickupRequired] = useState<'Yes' | 'No'>('No');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      alert('Must choose a target project brochure listings.');
      return;
    }
    if (!visitDate) return;

    try {
      await CrmDb.scheduleSiteVisit({
        leadId: lead.id,
        clientName: lead.name,
        mobile: lead.mobile,
        projectName,
        visitDate,
        visitTime,
        salesPerson,
        status: 'Scheduled',
        pickupRequired,
        meetingLocation,
        notes
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-md w-full">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Schedule Project Site Walkthrough</h3>
        <form onSubmit={handleScheduleVisit} className="space-y-3.5 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-gray-500 mb-1 font-bold">Select Real Estate Project Brochure</label>
              <select value={projectName} required onChange={(e) => setProjectName(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700">
                <option value="">-- Choose Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name} - {p.location}, {p.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Preferred Date</label>
              <input required type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700 font-medium" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Expected Time</label>
              <input required type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700 font-medium" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Accompanying Agent</label>
              <input required type="text" value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700 font-medium" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Vechicle Pickup Required?</label>
              <select value={pickupRequired} onChange={(e) => setPickupRequired(e.target.value as any)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700 font-medium">
                <option value="No">No (Client Commutes Myself)</option>
                <option value="Yes">Yes (Arrange Pickup Vehicle)</option>
              </select>
            </div>
          </div>
          {pickupRequired === 'Yes' && (
            <div>
              <label className="block text-gray-500 mb-1">Pickup Meeting Venue Address</label>
              <input type="text" value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="e.g. Dadar West near Metro exit Gate" className="w-full border rounded p-1.5 bg-gray-50 font-medium text-xs" />
            </div>
          )}
          <div>
            <label className="block text-gray-500 mb-1">Walkthrough Coordinators Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Specific tower mock apartment walkthrough requested."
              className="w-full border rounded p-1.5 bg-gray-50 font-medium text-xs"
            />
          </div>
          <div className="flex justify-end space-x-1.5 pt-2">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-3.5 py-1.5 bg-purple-600 rounded text-white hover:bg-purple-700">Schedule Visit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===============================================
// MODAL: CONVERT TO BOOKED TRANSACTION DEAL
// ===============================================
interface ConvertDealModalProps {
  lead: Lead;
  projects: Project[];
  users: CRMUser[];
  onClose: () => void;
  onSuccess: () => void;
}

function ConvertDealModal({ lead, projects, users, onClose, onSuccess }: ConvertDealModalProps) {
  const [projectName, setProjectName] = useState(lead.projectInterested || '');
  const [unitDetails, setUnitDetails] = useState('');
  const [dealValue, setDealValue] = useState(lead.budgetMin || 10000000);
  const [bookingAmount, setBookingAmount] = useState(500000);
  const [commissionPercent, setCommissionPercent] = useState(2.5);
  const [closingDate, setClosingDate] = useState('');

  const [expectedCommission, setExpectedCommission] = useState(0);

  // calculate realexpected commission instantly as we alter inputs
  useEffect(() => {
    const computed = (dealValue * commissionPercent) / 100;
    setExpectedCommission(Math.round(computed));
  }, [dealValue, commissionPercent]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      alert('Must select a property project listing.');
      return;
    }
    if (!unitDetails) {
      alert('Please clarify tower/wing/unit numbers.');
      return;
    }
    if (!closingDate) return;

    try {
      await CrmDb.createDeal({
        leadId: lead.id,
        clientName: lead.name,
        projectName,
        unitDetails,
        dealValue: Number(dealValue),
        bookingAmount: Number(bookingAmount),
        commissionPercent: Number(commissionPercent),
        expectedCommission,
        receivedCommission: 0,
        pendingCommission: expectedCommission,
        stage: 'Booking',
        closingDate,
        salesPerson: lead.assignedTo,
        salesPersonName: lead.assignedToName || 'Unassigned'
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-md w-full">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Convert Lead into Booked Sub-Deal</h3>
        <form onSubmit={handleConvert} className="space-y-3 text-xs font-semibold">
          <div>
            <label className="block text-gray-500 mb-1">Target Property Project Booking</label>
            <select value={projectName} required onChange={(e) => setProjectName(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700">
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-500 mb-1">Booking Unit Details (Tower / Flat No) *</label>
            <input required type="text" value={unitDetails} onChange={(e) => setUnitDetails(e.target.value)} placeholder="e.g. Tower B, Penthouse 3204, 3BHK" className="w-full border rounded p-1.5 bg-gray-50 text-gray-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-500 mb-1">Transaction Value (₹)</label>
              <input required type="number" value={dealValue} onChange={(e) => setDealValue(Number(e.target.value))} className="w-full border rounded p-1.5 bg-gray-50 font-mono font-medium" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Booking Advance Remittance (₹)</label>
              <input required type="number" value={bookingAmount} onChange={(e) => setBookingAmount(Number(e.target.value))} className="w-full border rounded p-1.5 bg-gray-50 font-mono font-medium" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Brokerage Commission (%)</label>
              <input required type="number" step="0.1" value={commissionPercent} onChange={(e) => setCommissionPercent(Number(e.target.value))} className="w-full border rounded p-1.5 bg-gray-50 font-mono font-semibold" />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Target Agreement Closing Date</label>
              <input required type="date" value={closingDate} onChange={(e: any) => setClosingDate(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 font-medium" />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center mt-2 shrink-0">
            <div>
              <span className="text-[10px] text-emerald-800 uppercase font-bold text-gray-500">Expected Brokerage Commission</span>
              <p className="text-base font-black text-emerald-700 font-mono">₹{expectedCommission.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] block text-emerald-600 bg-emerald-100/60 font-semibold px-2 py-0.5 rounded-full">Pending Verification</span>
            </div>
          </div>

          <div className="flex justify-end space-x-1.5 pt-2">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-3.5 py-1.5 bg-emerald-600 rounded text-white hover:bg-emerald-700">Submit Deal Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===============================================
// MODAL: BULK CHANGE REPRESENTATIVE ASSIGNMENT
// ===============================================
interface BulkAssignProps {
  selectedLeadIds: string[];
  users: CRMUser[];
  onClose: () => void;
  onSuccess: () => void;
}
function BulkChangeAssignModal({ selectedLeadIds, users, onClose, onSuccess }: BulkAssignProps) {
  const [assignedTo, setAssignedTo] = useState('');
  const executives = users.filter(u => u.role === 'Sales Executive' || u.role === 'Telecaller' || u.role === 'Super Admin' && u.isActive);

  const handleBulkAssign = async () => {
    if (!assignedTo) {
      alert('Please choose an executive.');
      return;
    }
    const targetUsr = users.find(u => u.id === assignedTo);
    const targetName = targetUsr ? targetUsr.name : '';

    for (const leadId of selectedLeadIds) {
      await CrmDb.updateLead(leadId, {
        assignedTo,
        assignedToName: targetName,
        status: 'Assigned'
      });
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Re-assign {selectedLeadIds.length} leads</h3>
        <div className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-gray-500 mb-1.5">Choose New Representative</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50">
              <option value="">-- Choose executive --</option>
              {executives.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-1.5">
            <button onClick={onClose} className="px-3.5 py-1.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">Cancel</button>
            <button onClick={handleBulkAssign} className="px-3.5 py-1.5 bg-blue-600 rounded text-white hover:bg-blue-700">Apply Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// MODAL: BULK CHANGE STATUS ASSIGNMENT
// ===============================================
interface BulkStatusProps {
  selectedLeadIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}
function BulkChangeStatusModal({ selectedLeadIds, onClose, onSuccess }: BulkStatusProps) {
  const [status, setStatus] = useState<LeadStatus>('Assigned');

  const handleBulkStatus = async () => {
    for (const leadId of selectedLeadIds) {
      await CrmDb.updateLead(leadId, { status });
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Bulk status update for {selectedLeadIds.length} leads</h3>
        <div className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-gray-500 mb-1.5">Select Sales Pipeline Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700">
              <option value="Fresh">Fresh</option>
              <option value="Assigned">Assigned</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <div className="flex justify-end space-x-1.5">
            <button onClick={onClose} className="px-3.5 py-1.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">Cancel</button>
            <button onClick={handleBulkStatus} className="px-3.5 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">Apply Status Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// MODAL: ADVANCED EXCEL / CSV LEADS IMPORTER
// ===============================================
interface CSVImporterProps {
  users: CRMUser[];
  projects: Project[];
  onClose: () => void;
  onSuccess: () => void;
}
function CSVImporterModal({ users, projects, onClose, onSuccess }: CSVImporterProps) {
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({
    name: '0',
    mobile: '1',
    email: '2',
    source: '3',
    propertyType: '4',
    budgetMin: '5',
    budgetMax: '6'
  });
  const [step, setStep] = useState<number>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        // Parse CSV Rows
        const parsed: string[][] = lines.map(line => {
          // simple split with quote handling
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });

        if (parsed.length > 0) {
          setHeaders(parsed[0]);
          setParsedRows(parsed.slice(1));
          setStep(2);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      alert('No database rows matched to submit.');
      return;
    }

    const assignedAgent = users.find(u => u.id === assigneeId);
    let successCount = 0;
    let duplicateCount = 0;
    const failures: string[] = [];

    for (let index = 0; index < parsedRows.length; index++) {
      const row = parsedRows[index];
      const nameVal = row[Number(mapping.name)] || 'Unknown CSV Lead';
      const mobileVal = row[Number(mapping.mobile)] || '';
      const emailVal = row[Number(mapping.email)] || '';
      const sourceVal = (row[Number(mapping.source)] || 'Meta Ads') as LeadSource;
      const typeVal = (row[Number(mapping.propertyType)] || 'Flat') as PropertyType;
      const bMin = row[Number(mapping.budgetMin)] ? Number(row[Number(mapping.budgetMin)]) : 2000000;
      const bMax = row[Number(mapping.budgetMax)] ? Number(row[Number(mapping.budgetMax)]) : 12000000;

      if (!mobileVal) {
        failures.push(`Row ${index + 2}: Mobile phone is blank.`);
        continue;
      }

      try {
        await CrmDb.addLead({
          name: nameVal,
          mobile: mobileVal,
          email: emailVal,
          city: 'Mumbai',
          buyRentResale: 'Buy',
          budgetMin: bMin,
          budgetMax: bMax,
          propertyType: typeVal,
          source: sourceVal,
          status: assigneeId ? 'Assigned' : 'Fresh',
          priority: 'Warm',
          assignedTo: assigneeId || 'u5',
          assignedToName: assignedAgent ? assignedAgent.name : 'Neha Rao',
          createdBy: getActiveUser().id,
          createdByName: getActiveUser().name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        successCount++;
      } catch (err: any) {
        if (err.message.includes('DUPLICATE_PHONE')) {
          duplicateCount++;
        } else {
          failures.push(`Row ${index + 2}: ${err.message || 'Validation error'}`);
        }
      }
    }

    alert(`Successfully loaded ${successCount} leads! Handled ${duplicateCount} duplicate warnings. Failing count: ${failures.length}`);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-lg w-full">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4 h-10">
          <h3 className="font-bold text-gray-900 text-sm">Real Estate Lead Excel/CSV Importer</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-mono text-sm">✖</button>
        </div>

        {step === 1 ? (
          <div className="space-y-4 text-xs font-semibold py-4" id="csv-step-1">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center text-center justify-center bg-gray-50 hover:bg-slate-50 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-gray-700 font-bold mb-1">Click to Upload or Drag Spreadsheet</p>
              <p className="text-[10px] text-gray-400 mb-4">Supports .csv tabular formats containing phone identifiers.</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-csv-uploader"
              />
              <label
                htmlFor="file-csv-uploader"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                Choose Local CSV File
              </label>
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 leading-relaxed text-[10px]">
              <p className="font-bold mb-0.5">Recommended structure columns:</p>
              <p>Name, Mobile, Email, Sourcing Source, Property Type (Flat, Villa), MinBudget, MaxBudget</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-semibold" id="csv-step-2">
            <div className="p-2.5 bg-yellow-50 text-amber-800 rounded-lg border border-yellow-200 text-[10px] flex items-center space-x-1">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Parsed <strong>{parsedRows.length} potential customer rows</strong>. Map standard fields below.</span>
            </div>

            {/* Field Map Selectors */}
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Map Columns Header</label>
              <div className="grid grid-cols-2 gap-3 pb-3">
                <div>
                  <label className="block text-gray-500 mb-0.5">Name Field</label>
                  <select
                    value={mapping.name}
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="w-full border rounded p-1 bg-white font-medium text-xs"
                  >
                    {headers.map((h, i) => (<option key={i} value={i}>{h}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-0.5">Mobile Phone *</label>
                  <select
                    value={mapping.mobile}
                    onChange={(e) => setMapping({ ...mapping, mobile: e.target.value })}
                    className="w-full border rounded p-1 bg-white font-medium text-xs"
                  >
                    {headers.map((h, i) => (<option key={i} value={i}>{h}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-0.5">Email Address</label>
                  <select
                    value={mapping.email}
                    onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                    className="w-full border rounded p-1 bg-white font-medium text-xs"
                  >
                    {headers.map((h, i) => (<option key={i} value={i}>{h}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-0.5">Lead Sourcing Source</label>
                  <select
                    value={mapping.source}
                    onChange={(e) => setMapping({ ...mapping, source: e.target.value })}
                    className="w-full border rounded p-1 bg-white font-medium text-xs"
                  >
                    {headers.map((h, i) => (<option key={i} value={i}>{h}</option>))}
                  </select>
                </div>
              </div>

              {/* Assignment before Import */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-gray-500 mb-1 font-bold">Assign imported leads directly to</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full border rounded p-1.5 font-medium text-xs text-gray-700 bg-gray-50"
                >
                  <option value="">Leave Unassigned (Fresh pool)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-1.5 pt-2 border-t border-gray-100 shadow-2xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-650"
              >
                Go Back
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold"
              >
                Execute Import database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
