import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  HelpCircle,
  Clock,
  Layers,
  Phone,
  User,
  Info,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Lead, WhatsAppTemplate } from '../types';
import { CrmDb } from '../firebase';

export default function Communication() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Generated results
  const [compiledMessage, setCompiledMessage] = useState('');
  const [outboxUrl, setOutboxUrl] = useState('');

  // Add Template Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  useEffect(() => {
    loadCommunicationData();
  }, []);

  const loadCommunicationData = async () => {
    setLoading(true);
    try {
      const l = await CrmDb.getLeads();
      const t = await CrmDb.getWhatsAppTemplates();
      setLeads(l);
      setTemplates(t);

      if (l.length > 0) setSelectedLeadId(l[0].id);
      if (t.length > 0) setSelectedTemplateId(t[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;

    try {
      await CrmDb.addWhatsAppTemplate({
        name: newTitle,
        category: 'Utility',
        body: newBody,
        variables: ['ClientName']
      });
      setNewTitle('');
      setNewBody('');
      setShowAddModal(false);
      // reload
      const updatedTemps = await CrmDb.getWhatsAppTemplates();
      setTemplates(updatedTemps);
    } catch (err) {
      console.error(err);
    }
  };

  // Compile instantly as selector values alter
  useEffect(() => {
    if (!selectedLeadId || !selectedTemplateId) {
      setCompiledMessage('');
      setOutboxUrl('');
      return;
    }

    const leadObj = leads.find(l => l.id === selectedLeadId);
    const tempObj = templates.find(t => t.id === selectedTemplateId);

    if (!leadObj || !tempObj) return;

    // Substitute template parameters
    // Placeholders: {ClientName}, {ProjectName}, {SalesPerson}, {SiteVisitDate}, {Budget}
    let body = tempObj.body;
    body = body.replace(/{ClientName}/g, leadObj.name);
    body = body.replace(/{ProjectName}/g, leadObj.projectInterested || 'our premium property projects');
    body = body.replace(/{SalesPerson}/g, leadObj.assignedToName || 'Dream Investment Coordinator');
    body = body.replace(/{SiteVisitDate}/g, leadObj.nextFollowUpDate || 'Tomorrow');

    // format budget
    const formatB = `₹${(leadObj.budgetMin / 100000).toFixed(0)}L - ₹${(leadObj.budgetMax / 10000000).toFixed(2)} Cr`;
    body = body.replace(/{Budget}/g, formatB);

    setCompiledMessage(body);

    const targetUrl = `https://wa.me/${leadObj.mobile}?text=${encodeURIComponent(body)}`;
    setOutboxUrl(targetUrl);

  }, [selectedLeadId, selectedTemplateId, leads, templates]);

  return (
    <div className="p-4 space-y-4 font-sans text-slate-800" id="communication-view-outer">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-950 text-sm">WhatsApp Communication Studio</h3>
          <p className="text-[11px] text-gray-400">Compose and launch instant template outbound campaigns to target lead pools.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1 shadow-2xs"
          id="btn-add-template"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="communication-grid-row">
        {/* Templates Panel Column */}
        <div className="lg:col-span-4 space-y-3.5">
          <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Communication Templates list</h4>
          <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`bg-white border p-3 rounded-xl cursor-pointer shadow-3xs transition-all hover:border-emerald-300 ${
                  selectedTemplateId === t.id ? 'border-2 border-emerald-500 bg-emerald-50/10' : 'border-gray-100'
                }`}
              >
                <h4 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>{t.name}</span>
                </h4>
                <p className="text-[10.5px] italic text-gray-500 leading-relaxed font-sans mt-1.5 line-clamp-3">
                  "{t.body}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Prefills Outbox Campaigner Column */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4" id="communication-outbox-campaigner">
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider pb-1.5 border-b border-gray-50 flex items-center">
              <Send className="w-4 h-4 text-emerald-600 mr-1.5" />
              <span>Broadcast Outbox Prefills Composer</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select target customer */}
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-1">Target Client Profile</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="">-- Choose Client Lead --</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.name} ({lead.mobile})</option>
                  ))}
                </select>
              </div>

              {/* Confirm Schedulers */}
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-1">Template Outbox Theme</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2 text-xs font-semibold"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compiled template display */}
            <div className="p-3 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-black text-emerald-800 tracking-wider">Compiled Output preview block</span>
                <span className="text-[8.5px] uppercase font-black text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">Encrypted wa.me Format ready</span>
              </div>
              <p className="text-xs font-semibold text-gray-800 leading-relaxed font-sans min-h-[80px]">
                {compiledMessage || 'Select representative options to compose preview.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between shadow-3xs">
            <div className="flex items-center space-x-1 text-[11px] text-gray-400">
              <Info className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span>Uses standard business WhatsApp redirect URIs.</span>
            </div>
            {outboxUrl && (
              <a
                href={outboxUrl}
                target="_blank"
                rel="noreferrer"
                id="btn-launch-whatsapp"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all text-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Launch Chat Outbox</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* CREATE TEMPLATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Add WhatsApp Message Template</h3>
            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-1">Template Topic / Title *</label>
                <input required type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Confirm Site visit booking" className="w-full border rounded p-1.5 bg-gray-50" />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Message Text Block *</label>
                <textarea
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Dear {ClientName}, your view of {ProjectName} is confirmed for {SiteVisitDate}..."
                  className="w-full border rounded p-2 bg-gray-50 leading-relaxed focus:bg-white"
                />
              </div>
              <div className="p-2 bg-blue-50/70 text-blue-800 rounded border border-blue-105 leading-relaxed text-[9.5px]">
                <p className="font-black mb-0.5">Custom variables you can use:</p>
                <p>{`{ClientName}, {ProjectName}, {SalesPerson}, {SiteVisitDate}, {Budget}`}</p>
              </div>
              <div className="flex justify-end space-x-1.5">
                <button type="button" onClick={() => { setShowAddModal(false); }} className="px-3.5 py-1.5 bg-gray-150 rounded text-gray-650">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold">Add Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
