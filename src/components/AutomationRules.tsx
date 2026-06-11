import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle,
  HelpCircle,
  Plus,
  Play,
  Zap,
  Trash2,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AutomationRule } from '../types';
import { CrmDb } from '../firebase';

export default function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState<'On Lead Created' | 'On Site Visit Scheduled' | 'On Deal Booked'>('On Lead Created');
  const [actionType, setActionType] = useState<'Auto Assign Users' | 'Auto WhatsApp Link' | 'Auto Task'>('Auto Assign Users');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const r = await CrmDb.getAutomationRules();
      setRules(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await CrmDb.saveAutomationRule({
        id: `rule_${Date.now()}`,
        name,
        triggerEvent,
        actionType,
        conditions: {},
        actionConfig: {},
        isActive: true
      });
      setName('');
      setShowAddModal(false);
      await loadRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActiveRule = async (id: string, current: boolean) => {
    await CrmDb.updateAutomationRuleStatus(id, !current);
    await loadRules();
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-800" id="automation-hub-outer">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-950 text-sm flex items-center space-x-1.5">
            <Zap className="w-5 h-5 text-blue-600 fill-blue-50 shrink-0" />
            <span>Workflow Automation Rules Engine</span>
          </h3>
          <p className="text-[11px] text-gray-400">Trigger round-robin assignments, auto follow-up creation, and immediate template generation logs.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-2xs"
          id="btn-add-rule"
        >
          <Plus className="w-4 h-4" />
          <span>Add Workflow Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white border border-gray-150 rounded-xl p-4 shadow-3xs flex flex-col justify-between space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[9px] uppercase">
                  ACTIVE AUTOMATION
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                  rule.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {rule.isActive ? 'Active' : 'On Hold'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-gray-950 text-sm">{rule.name}</h4>
              </div>

              {/* Step Flow Layout Indicators */}
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center space-x-2 text-xs font-semibold text-slate-700">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 uppercase font-black">Trigger Node</span>
                  <span className="text-gray-900">{rule.triggerEvent}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 uppercase font-black">Action Executed</span>
                  <span className="text-blue-600 font-bold">{rule.actionType}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => handleToggleActiveRule(rule.id, rule.isActive)}
                className={`text-[10px] font-bold px-3 py-1 rounded transition-colors ${
                  rule.isActive ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {rule.isActive ? 'Suspend automation trigger' : 'Activate pipeline Rule'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Add Custom Workflow Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-1">Rule Name *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Round-Robin Lead Assignment Map" className="w-full border rounded p-1.5 bg-gray-50 text-xs" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">When (Trigger Event)</label>
                  <select value={triggerEvent} onChange={(e: any) => setTriggerEvent(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-750 font-bold">
                    <option value="On Lead Created">On Lead Created / Uploaded</option>
                    <option value="On Site Visit Scheduled">On Site Visit Scheduled / Tours booked</option>
                    <option value="On Deal Booked">On Flat Booking Confirmed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Then (Action Type)</label>
                  <select value={actionType} onChange={(e: any) => setActionType(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50 text-blue-700 font-semibold text-xs">
                    <option value="Auto Assign Users">Auto Round-Robin Allocation (Even distributed leads)</option>
                    <option value="Auto WhatsApp Link">Generate WhatsApp Link & template</option>
                    <option value="Auto Task">Add Due Task (Follow up creation)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-1.5 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 bg-gray-150 rounded text-gray-650">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold">Launch Automation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
