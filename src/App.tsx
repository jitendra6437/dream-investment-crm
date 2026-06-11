import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Car,
  Briefcase,
  Contact2,
  MessageSquareCode,
  PieChart,
  UserCheck2,
  Cpu,
  Settings2,
  Menu,
  X,
  Phone,
  HelpCircle,
  Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import Followups from './components/Followups';
import Projects from './components/Projects';
import SiteVisits from './components/SiteVisits';
import Deals from './components/Deals';
import Clients from './components/Clients';
import Communication from './components/Communication';
import Reports from './components/Reports';
import TeamUsers from './components/TeamUsers';
import AutomationRules from './components/AutomationRules';
import Settings from './components/Settings';

import { getActiveUser, CrmDb } from './firebase';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = getActiveUser();

  // Load baseline statistics counts
  const [counts, setCounts] = useState({
    leads: 0,
    tasks: 0,
    visits: 0,
    deals: 0
  });

  useEffect(() => {
    // Initial fetch for count badges
    const getCounts = async () => {
      const l = await CrmDb.getLeads();
      const t = await CrmDb.getTasks();
      const v = await CrmDb.getSiteVisits();
      const d = await CrmDb.getDeals();

      setCounts({
        leads: l.length,
        tasks: t.filter(x => x.status !== 'Completed').length,
        visits: v.filter(x => x.status === 'Scheduled').length,
        deals: d.length
      });
    };
    getCounts();

    // poll slightly to keep state synced nicely
    const interval = setInterval(getCounts, 5000);
    return () => clearInterval(interval);
  }, [activeView]);

  const navItems = [
    { id: 'dashboard', label: 'Overview Metrics', icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, badge: null },
    { id: 'leads', label: 'Leads Management', icon: <Users className="w-4 h-4 shrink-0" />, badge: counts.leads },
    { id: 'followups', label: 'Call Follow-ups', icon: <Calendar className="w-4 h-4 shrink-0" />, badge: counts.tasks },
    { id: 'projects', label: 'Project Listings', icon: <Building2 className="w-4 h-4 shrink-0" />, badge: null },
    { id: 'sitevisits', label: 'Site Walkthroughs', icon: <Car className="w-4 h-4 shrink-0" />, badge: counts.visits },
    { id: 'deals', label: 'Bookings Ledger', icon: <Briefcase className="w-4 h-4 shrink-0" />, badge: counts.deals },
    { id: 'clients', label: 'Client Portfolio', icon: <Contact2 className="w-4 h-4 shrink-0" />, badge: null },
    { id: 'communication', label: 'WhatsApp Studio', icon: <MessageSquareCode className="w-4 h-4 shrink-0" />, badge: null },
    { id: 'reports', label: 'Advanced Reports', icon: <PieChart className="w-4 h-4 shrink-0" />, badge: null },
    { id: 'team', label: 'Duty Allocations', icon: <UserCheck2 className="w-4 h-4 shrink-0" />, badge: null },
    { id: 'automation', label: 'Rules Automation', icon: <Cpu className="w-4 h-4 shrink-0" />, badge: null },
    { id: 'settings', label: 'App Settings', icon: <Settings2 className="w-4 h-4 shrink-0" />, badge: null },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <Leads />;
      case 'followups':
        return <Followups />;
      case 'projects':
        return <Projects />;
      case 'sitevisits':
        return <SiteVisits />;
      case 'deals':
        return <Deals />;
      case 'clients':
        return <Clients />;
      case 'communication':
        return <Communication />;
      case 'reports':
        return <Reports />;
      case 'team':
        return <TeamUsers />;
      case 'automation':
        return <AutomationRules />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row relative text-slate-800 antialiased" id="dream-crm-app">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#0F172A] border-b border-slate-800 text-white p-3.5 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <Gem className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm tracking-wider uppercase font-sans">Dream Invest</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-gray-300 hover:text-white"
          id="btn-mobile-toggle"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sticky sidebar for desktop */}
      <aside
        id="crm-left-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0F172A] text-slate-300 border-r border-slate-800 p-5 shrink-0 flex flex-col justify-between z-30 transition-transform md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:block'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo text details */}
          <div className="pb-4 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0">
                DI
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight leading-none block">Dream Invest</span>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">REAL ESTATE CRM</p>
              </div>
            </div>
          </div>

          {/* Navigation Items menu list */}
          <nav className="space-y-1 overflow-y-auto max-h-[65vh] pr-1" id="sidebar-nav">
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-between group ${
                    active
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'hover:bg-slate-800 text-slate-350 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={active ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold font-mono rounded-full ${
                      active ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-800 text-blue-400 group-hover:bg-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile bottom bar */}
        <div className="pt-4 border-t border-slate-800 shrink-0 flex items-center space-x-3" id="sidebar-user-footer">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[9px] text-slate-400 font-medium truncate">Role: Super Admin</p>
          </div>
        </div>
      </aside>

      {/* Main Content Pane wrapper */}
      <main className="flex-1 min-w-0 flex flex-col pt-0 bg-[#F8FAFC] relative overflow-x-hidden" id="crm-main-view-pane">
        {/* Header Breadcrumbs status info */}
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Portal /</span>
            <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">{activeView} Workspace</span>
          </div>
          <div className="text-right text-[11px] font-semibold text-slate-400 font-mono hidden md:block">
            <span>Server Datetime UTC: {new Date().toISOString().split('T')[0]}</span>
          </div>
        </header>

        {/* Frame routing content container */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 overflow-y-auto"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
