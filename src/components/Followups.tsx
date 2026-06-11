import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  MessageSquare,
  Search,
  Filter,
  ArrowRight,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Task, TaskType, TaskStatus, CRMUser } from '../types';
import { CrmDb, getActiveUser } from '../firebase';

export default function Followups() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');

  // Search input
  const [searchTerm, setSearchTerm] = useState('');

  // Outcome Dialog Modal
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [completionOutcome, setCompletionOutcome] = useState('');

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadFollowUpData();
  }, []);

  const loadFollowUpData = async () => {
    setLoading(true);
    try {
      // Force overdue updating
      CrmDb.checkAndUpdateOverdueTasks();
      const t = await CrmDb.getTasks();
      const u = await CrmDb.getUsers();
      setTasks(t);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshTasksList = async () => {
    const t = await CrmDb.getTasks();
    setTasks(t);
  };

  // Run sequential filters
  const getFilteredTasks = () => {
    let result = [...tasks];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Tab filters
    if (activeTab === 'today') {
      result = result.filter(t => t.dueDate === todayStr && t.status !== 'Completed');
    } else if (activeTab === 'upcoming') {
      result = result.filter(t => t.dueDate > todayStr && t.status !== 'Completed');
    } else if (activeTab === 'overdue') {
      result = result.filter(t => t.status === 'Overdue');
    } else if (activeTab === 'completed') {
      result = result.filter(t => t.status === 'Completed');
    }

    // 2. Search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.clientName.toLowerCase().includes(term) ||
        t.mobile.includes(term) ||
        t.notes.toLowerCase().includes(term)
      );
    }

    // 3. Dropdowns
    if (selectedUser !== 'all') {
      result = result.filter(t => t.assignedTo === selectedUser);
    }
    if (selectedType !== 'all') {
      result = result.filter(t => t.type === selectedType);
    }

    return result.sort((a, b) => new Date(`${a.dueDate}T${a.dueTime}`).getTime() - new Date(`${b.dueDate}T${b.dueTime}`).getTime());
  };

  const processedTasks = getFilteredTasks();

  const handleMarkCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToComplete) return;

    try {
      await CrmDb.updateTaskStatus(taskToComplete.id, 'Completed', completionOutcome);
      setTaskToComplete(null);
      setCompletionOutcome('');
      await refreshTasksList();
    } catch (err) {
      console.error(err);
    }
  };

  // Calendar Utility
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // empty blocks for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= numDays; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  return (
    <div className="p-4 space-y-4" id="followups-manager-outer">
      {/* Search & filters bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="task-search-input"
            placeholder="Search tasks by client name, mobile or remarks..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* User Filter */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border bg-gray-50 border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-2"
          >
            <option value="all">Agent: All</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border bg-gray-50 border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-2"
          >
            <option value="all">Medium: All</option>
            <option value="Call">Phone Call</option>
            <option value="WhatsApp">WhatsApp Message</option>
            <option value="Site Visit">Site Visit Walk</option>
            <option value="Meeting">Joint Meeting</option>
            <option value="Document">Paperwork Docs</option>
          </select>

          {/* View Toggles */}
          <div className="border border-gray-200 rounded-lg flex overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}
              title="List layout"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 transition-colors ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}
              title="Calendar grid"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={loadFollowUpData}
            className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg shrink-0 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      {viewMode === 'list' && (
        <div className="flex border-b border-gray-150 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            All Scheduled ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'today' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Today Followups ({tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0] && t.status !== 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'upcoming' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Upcoming Feed ({tasks.filter(t => t.dueDate > new Date().toISOString().split('T')[0] && t.status !== 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'overdue' ? 'border-red-600 text-red-600 animate-pulse' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            🚨 Overdue ({tasks.filter(t => t.status === 'Overdue').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'completed' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Completed logs ({tasks.filter(t => t.status === 'Completed').length})
          </button>
        </div>
      )}

      {/* Main Panel views layout */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 gap-3.5" id="followups-list-grid">
          {processedTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white border p-4 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300 ${
                task.status === 'Overdue' ? 'border-red-150 bg-red-50/5' : 'border-gray-100'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                    task.type === 'Call' ? 'bg-blue-50 text-blue-700' :
                    task.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-700' :
                    task.type === 'Site Visit' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {task.type}
                  </span>
                  <span className={`text-[10px] font-semibold font-mono ${
                    task.priority === 'High' ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5 pt-0.5">
                  <span>{task.clientName}</span>
                  <span className="text-gray-400 font-normal font-mono text-[11px]">({task.mobile})</span>
                </h4>
                <p className="text-gray-650 text-xs italic mt-0.5 font-medium leading-relaxed font-sans">"{task.notes}"</p>
                {task.status === 'Completed' && task.outcome && (
                  <p className="text-emerald-700 text-xs font-bold mt-1.5 flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Outcome: {task.outcome}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-4 shrink-0">
                <div className="text-right text-xs">
                  <p className="font-bold text-gray-800 font-mono flex items-center justify-end space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{task.dueDate} at {task.dueTime}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Assigned to: {task.assignedToName || 'Representative'}</p>
                </div>

                <div className="flex items-center space-x-1.5">
                  {task.status !== 'Completed' ? (
                    <button
                      onClick={() => setTaskToComplete(task)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg text-white text-xs flex items-center space-x-1 shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve Task</span>
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">Resolved</span>
                  )}
                  <button
                    onClick={() => {
                      const msg = `Hello ${task.clientName}, regarding our scheduled ${task.type} follow-up session:`;
                      window.open(`https://wa.me/${task.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="p-1.5 bg-slate-50 border hover:bg-gray-100 rounded-lg shrink-0 text-gray-500"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {processedTasks.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white border border-gray-100 rounded-xl shadow-2xs p-6">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold">Zero Tasks Outstanding</p>
              <p className="text-[10px] text-gray-400 mt-1">All real estate broker tasks has been completed for selected filters.</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar view grid */
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-2xs" id="followups-calendar-view">
          {/* Calendar month controller header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 h-10">
            <h4 className="font-bold text-gray-900 text-sm">
              {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  const m = new Date(currentMonth);
                  m.setMonth(m.getMonth() - 1);
                  setCurrentMonth(m);
                }}
                className="px-2 py-1 bg-gray-50 border hover:bg-gray-100 text-xs rounded"
              >
                Prev Month
              </button>
              <button
                onClick={() => {
                  const m = new Date(currentMonth);
                  m.setMonth(m.getMonth() + 1);
                  setCurrentMonth(m);
                }}
                className="px-2 py-1 bg-gray-50 border hover:bg-gray-100 text-xs rounded"
              >
                Next Month
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 text-center text-xs">
            {/* Days title headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="font-bold text-gray-400 text-[10px] uppercase py-1">{d}</div>
            ))}

            {/* Calendar alignment mappings */}
            {calendarDays.map((elem, idx) => {
              if (elem === null) return (<div key={`empty-${idx}`} className="h-20 bg-gray-50/20 rounded"></div>);

              const dateCompareStr = elem.toISOString().split('T')[0];
              const dateTasks = tasks.filter(t => t.dueDate === dateCompareStr);

              return (
                <div key={dateCompareStr} className="border border-slate-100 h-20 text-left p-1 rounded-lg flex flex-col justify-between hover:bg-slate-50 relative">
                  <span className="text-[10px] font-black text-gray-400 block p-0.5">{elem.getDate()}</span>
                  <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[48px] pr-0.5">
                    {dateTasks.slice(0, 3).map(dt => (
                      <div
                        key={dt.id}
                        title={`${dt.clientName}: ${dt.notes}`}
                        onClick={() => { setTaskToComplete(dt); }}
                        className={`text-[8px] font-bold p-0.5 rounded truncate cursor-pointer ${
                          dt.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          dt.status === 'Overdue' ? 'bg-red-50 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {dt.type}: {dt.clientName}
                      </div>
                    ))}
                    {dateTasks.length > 3 && (
                      <span className="text-[7px] text-gray-400 font-bold block">+{dateTasks.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESOLUTION NOTE COLLECTOR modal */}
      {taskToComplete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-sm mb-2">Resolve CRM task walkthrough details</h3>
            <form onSubmit={handleMarkCompleteSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-1">Enter Call Outcome *</label>
                <textarea
                  required
                  rows={3}
                  value={completionOutcome}
                  onChange={(e) => setCompletionOutcome(e.target.value)}
                  placeholder="e.g. Client requested master plans, site visit has been scheduled or requested negotiation."
                  className="w-full border rounded p-2 bg-gray-50 text-xs focus:bg-white"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setTaskToComplete(null)} className="px-3 py-1.5 bg-gray-100 rounded text-gray-600 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">Mark as Completed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
