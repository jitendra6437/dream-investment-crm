import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { CRMUser } from '../types';
import { CrmDb } from '../firebase';

export default function TeamUsers() {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Super Admin' | 'Telecaller' | 'Sales Executive'>('Sales Executive');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const u = await CrmDb.getUsers();
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      await CrmDb.saveUser({
        id: `u_${Date.now()}`,
        name,
        email,
        role,
        isActive: true,
        dailyTarget: 10,
        createdAt: new Date().toISOString()
      });
      setName('');
      setEmail('');
      setRole('Sales Executive');
      setShowAddModal(false);
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await CrmDb.updateUserStatus(id, !currentStatus);
      await loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-800" id="team-users-view-outer">
      {/* Header Panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-950 text-sm">Real Estate Agency Team Management</h3>
          <p className="text-[11px] text-gray-400">Configure role allocations, daily follow-up load targets, and user credentials directories.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1 shadow-2xs"
          id="btn-add-agent"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Representative</span>
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="team-users-cards">
        {users.map((u) => (
          <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                  u.role === 'Super Admin' ? 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100' :
                  u.role === 'Telecaller' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-105'
                }`}>
                  {u.role}
                </span>

                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                  u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {u.isActive ? 'Active Duty' : 'Inactive'}
                </span>
              </div>

              <h4 className="font-bold text-gray-950 text-sm pt-1">{u.name}</h4>
              <p className="text-[11px] text-gray-400 font-mono">{u.email}</p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold">Daily Sprints: {u.dailyTarget || 10} Call goals</span>
              <button
                onClick={() => handleToggleActive(u.id, u.isActive)}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                  u.isActive ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {u.isActive ? 'Suspend agent access' : 'Reinstate representative'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Add Agent Representative</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-1">Executive Name *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anand Shah" className="w-full border rounded p-1.5 bg-gray-50 text-xs font-semibold" />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Email Address *</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anand@dreaminvestment.com" className="w-full border rounded p-1.5 bg-gray-50 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Agency Role Access</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700 font-bold">
                  <option value="Sales Executive">Sales Executive (Site Walkthrough Accompany, Deal Closing)</option>
                  <option value="Telecaller">Telecaller (Fresh Calling Leads, Followups booking)</option>
                  <option value="Super Admin">Super Admin (Assign leads, reports visibility, manage templates)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-1.5 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold">Register Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
