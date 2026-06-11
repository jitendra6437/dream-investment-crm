import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Globe,
  Trash2,
  RefreshCw,
  HelpCircle,
  FileText,
  CheckCircle,
  Key
} from 'lucide-react';
import { CrmDb } from '../firebase';

export default function Settings() {
  const [metaWebhookUrl, setMetaWebhookUrl] = useState('https://agency-api.dreaminvestment.com/webhooks/facebook-lead-ads');
  const [metaPixelId, setMetaPixelId] = useState('149582034812938');
  const [googleSheetSyncUrl, setGoogleSheetSyncUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKv1a39w_rWutF_9m6Y8BwgC0m/edit');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  const handleClearDatabase = () => {
    if (window.confirm('WARNING: This will wipe out all temporary local storage database records (leads, followups, sitevisits, projects, deals) and reload pristine default mock datasets. Do you absolutely intend to format storage?')) {
      localStorage.clear();
      CrmDb.resetSimulatorData();
      alert('Local Storage data wiped cleanly. Refresh the browser to apply initial seeds.');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-801" id="settings-view-outer">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <h3 className="font-bold text-gray-950 text-sm">CRM Global System Configurations</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Configure Google Sheets pipelines, Meta Lead Ads lead gen webhooks and clean system registries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* API Settings Section */}
        <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-2xs space-y-4">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
            <Globe className="w-4 h-4 text-blue-600 mr-1.5" />
            <span>Lead Ads API & Webhooks</span>
          </h4>

          <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs font-semibold text-gray-600">
            <div>
              <label className="block text-gray-500 mb-1">Meta Facebook Lead-Ads Webhook Endpoint</label>
              <input
                type="text"
                value={metaWebhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2 font-mono text-[11px] text-gray-700"
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Facebook Pixel ID / Conversion SDK Trigger key</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Google Sheets Real-time Sync sheet link</label>
              <input
                type="text"
                value={googleSheetSyncUrl}
                onChange={(e) => setGoogleSheetSyncUrl(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2 text-xs"
              />
            </div>

            {success && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-bold flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Configurations updated successfully! Webhook endpoint bound.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-2xs transition-colors"
            >
              {saving ? 'Binding API...' : 'Save Pipeline Sync'}
            </button>
          </form>
        </div>

        {/* Database simulator wipes settings Section */}
        <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-2xs space-y-4">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
            <Database className="w-4 h-4 text-red-500 mr-1.5" />
            <span>Database Simulator Controls</span>
          </h4>

          <div className="space-y-3.5 text-xs font-semibold leading-relaxed text-gray-600">
            <p>
              Dream Investment CRM runs on an integrated fallback <strong>Local Storage Mock database Simulator</strong>, mimicking instant Firestore latency.
            </p>
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg leading-relaxed text-[10.5px]">
              <p className="font-black mb-1">CRITICAL REMOVAL SYSTEM WARNING:</p>
              <p>Clearing simulator records deletes all temporary leads, uploaded csv datasets, completed site visited metrics, closed booking ledger deals and custom template models from browser memory instantly.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClearDatabase}
                className="bg-red-650 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Wipe Database & Seed Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // little simple hack for ts type definitions
  function setWebhookUrl(v: string) {
    setMetaWebhookUrl(v);
  }
}
