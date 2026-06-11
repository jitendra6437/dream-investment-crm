import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Navigation,
  Clock,
  Phone,
  MessageSquare,
  Search,
  Sparkles,
  MapPin,
  RefreshCw,
  Star
} from 'lucide-react';
import { SiteVisit } from '../types';
import { CrmDb } from '../firebase';

export default function SiteVisits() {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Scheduled' | 'Done' | 'Cancelled' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Feedbacks rating logger modal
  const [feedbackVisit, setFeedbackVisit] = useState<SiteVisit | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackRemarks, setFeedbackRemarks] = useState('');

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const v = await CrmDb.getSiteVisits();
      setVisits(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVisits = () => {
    let base = [...visits];
    if (activeTab !== 'all') {
      base = base.filter(v => v.status === activeTab);
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      base = base.filter(v =>
        v.clientName.toLowerCase().includes(term) ||
        v.projectName.toLowerCase().includes(term) ||
        v.mobile.includes(term)
      );
    }
    return base.sort((a,b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  };

  const processedVisits = getFilteredVisits();

  const handleCancelVisit = async (id: string, leadId: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled site visit walk?')) {
      await CrmDb.updateSiteVisitStatus(id, 'Cancelled');
      await loadVisits();
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackVisit) return;

    try {
      await CrmDb.updateSiteVisitFeedback(feedbackVisit.id, rating, feedbackRemarks);
      setFeedbackVisit(null);
      setFeedbackRemarks('');
      setRating(5);
      await loadVisits();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans" id="site-visits-hub-outer">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search walkthroughs by client, project listing..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
          />
        </div>

        <div className="flex space-x-2">
          {/* Tabs Toggles */}
          <div className="border border-gray-200 rounded-lg flex overflow-hidden text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
            >
              All Tours
            </button>
            <button
              onClick={() => setActiveTab('Scheduled')}
              className={`px-3 py-2 transition-all ${activeTab === 'Scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
            >
              Planned ({visits.filter(v => v.status === 'Scheduled').length})
            </button>
            <button
              onClick={() => setActiveTab('Done')}
              className={`px-3 py-2 transition-all ${activeTab === 'Done' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
            >
              Completed ({visits.filter(v => v.status === 'Done').length})
            </button>
            <button
              onClick={() => setActiveTab('Cancelled')}
              className={`px-3 py-2 transition-all ${activeTab === 'Cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
            >
              Cancelled
            </button>
          </div>

          <button
            onClick={loadVisits}
            className="p-2 border border-gray-200 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="visits-grids-row">
        {processedVisits.map((v) => (
          <div
            key={v.id}
            className={`bg-white border p-4 rounded-xl shadow-3xs flex flex-col justify-between hover:border-purple-200 transition-all ${
              v.status === 'Done' ? 'border-l-4 border-l-emerald-500' :
              v.status === 'Cancelled' ? 'border-l-4 border-l-red-400 opacity-75' : 'border-l-4 border-l-purple-600'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-950 text-sm flex items-center space-x-1">
                    <span>{v.clientName}</span>
                    <span className="font-mono text-gray-400 font-normal text-[11px]">({v.mobile})</span>
                  </h4>
                  <p className="text-xs text-gray-400 font-semibold p-0.5">Project Visit: <strong className="text-purple-700">{v.projectName}</strong></p>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                  v.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  v.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-purple-50 text-purple-700 border-purple-150'
                }`}>
                  {v.status}
                </span>
              </div>

              {/* Timing metrics bar */}
              <div className="flex items-center space-x-3.5 text-xs text-gray-600 pt-1">
                <span className="flex items-center font-bold text-gray-800 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-purple-500 mr-1 shrink-0" />
                  <span>{v.visitDate}</span>
                </span>
                <span className="flex items-center text-gray-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-purple-400 mr-1 shrink-0" />
                  <span>{v.visitTime}</span>
                </span>
              </div>

              {/* Vehicle pickup settings */}
              {v.pickupRequired === 'Yes' && (
                <div className="p-2 bg-slate-50 border border-slate-100 text-xs font-semibold rounded-lg text-slate-700 flex items-start space-x-2">
                  <Navigation className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-wider text-emerald-600">Complimentary Cab Arranged</span>
                    <p className="font-bold text-[11px] text-slate-800">{v.meetingLocation || 'Coordinates specified with driver'}</p>
                  </div>
                </div>
              )}

              {v.notes && (
                <p className="text-xs italic bg-gray-50 p-1.5 rounded-lg text-gray-600 leading-relaxed font-medium">"{v.notes}"</p>
              )}

              {/* Feedback remarks rendering */}
              {v.status === 'Done' && v.clientRating && (
                <div className="p-2.5 bg-yellow-50/60 rounded-lg border border-yellow-100 flex flex-col space-y-1 mt-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-[9px] uppercase font-bold text-yellow-800 tracking-wider">Client Site rating:</span>
                    <div className="flex space-x-0.5">
                      {Array.from({ length: v.clientRating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  {v.clientFeedback && (
                    <p className="text-xs italic text-gray-700 font-medium font-sans">"{v.clientFeedback}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons row */}
            {v.status === 'Scheduled' && (
              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-1.5 mt-3.5 shrink-0">
                <button
                  onClick={() => handleCancelVisit(v.id, v.leadId)}
                  className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Visit</span>
                </button>
                <button
                  onClick={() => setFeedbackVisit(v)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Walkthrough Completed</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {processedVisits.length === 0 && (
          <p className="text-xs text-center py-8 text-gray-400 col-span-2">No tour walkthroughs configured with selected statuses.</p>
        )}
      </div>

      {/* FEEDBACK LOGGER MODAL */}
      {feedbackVisit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Rate Client Walkthrough Outcome</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-1">Scale Rating Score (1 to 5 Stars)</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full border rounded p-1.5 bg-gray-50 font-bold font-mono">
                  <option value={5}>⭐⭐⭐⭐⭐ 5 Star (Highly Interested)</option>
                  <option value={4}>⭐⭐⭐⭐ 4 Star (Warm/Good)</option>
                  <option value={3}>⭐⭐⭐ 3 Star (Needs more options)</option>
                  <option value={2}>⭐⭐ 2 Star (Not happy with layout/price)</option>
                  <option value={1}>⭐ 1 Star (Completely rejected)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Feedback Remarks Summary *</label>
                <textarea
                  required
                  rows={3}
                  value={feedbackRemarks}
                  onChange={(e) => setFeedbackRemarks(e.target.value)}
                  placeholder="What specifically did they say about the living room layout, or agreement terms?"
                  className="w-full border rounded p-2 text-xs focus:bg-white"
                />
              </div>
              <div className="flex justify-end space-x-1.5">
                <button type="button" onClick={() => setFeedbackVisit(null)} className="px-3.5 py-1.5 bg-gray-150 rounded text-gray-650">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold">Register Walkthrough Done</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
