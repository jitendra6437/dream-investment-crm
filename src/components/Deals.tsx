import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  ArrowRight,
  TrendingDown,
  Building,
  Briefcase,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { Deal } from '../types';
import { CrmDb } from '../firebase';

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const [dealToVerify, setDealToVerify] = useState<Deal | null>(null);
  const [verificationRemarks, setVerificationRemarks] = useState('');

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const d = await CrmDb.getDeals();
      setDeals(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDeals = () => {
    let base = [...deals];
    if (stageFilter !== 'all') {
      base = base.filter(d => d.stage === stageFilter);
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      base = base.filter(d =>
        d.clientName.toLowerCase().includes(term) ||
        d.projectName.toLowerCase().includes(term) ||
        d.unitDetails.toLowerCase().includes(term)
      );
    }
    return base;
  };

  const processedDeals = getFilteredDeals();

  const handleVerifyDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealToVerify) return;

    try {
      await CrmDb.updateDealStage(dealToVerify.id, 'Agreement');
      // Set received Commission to expected once fully verified
      await CrmDb.receiveDealCommission(dealToVerify.id, dealToVerify.expectedCommission);
      setDealToVerify(null);
      await loadDeals();
    } catch (error) {
      console.error(error);
    }
  };

  // KPI Calculations
  const totalInvoicedValue = deals.reduce((acc, d) => acc + d.dealValue, 0);
  const expectedBrokerageTotal = deals.reduce((acc, d) => acc + d.expectedCommission, 0);
  const collectedCommission = deals.reduce((acc, d) => acc + d.receivedCommission, 0);
  const pendingCollection = expectedBrokerageTotal - collectedCommission;

  return (
    <div className="p-4 space-y-4 font-sans text-slate-800" id="deals-hub-container">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="deals-metric-badges">
        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-3xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] block">Total Traded Sells Volume</span>
          <p className="text-lg font-black font-mono text-gray-950 mt-1">₹{(totalInvoicedValue / 10000000).toFixed(2)} Cr</p>
          <span className="text-[10px] text-gray-400 mt-1 flex items-center font-semibold">
            <Briefcase className="w-3.5 h-3.5 text-blue-500 mr-1" />
            <span>Across {deals.length} booked flats</span>
          </span>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-3xs">
          <span className="text-pink-500 font-bold uppercase tracking-wider text-[9px] block">Expected Broker commissions</span>
          <p className="text-lg font-black font-mono text-slate-900 mt-1">₹{(expectedBrokerageTotal / 100000).toFixed(1)} Lac</p>
          <span className="text-[10px] text-gray-400 mt-1 flex items-center font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            <span>Average ~2.5% rate</span>
          </span>
        </div>

        <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-xl shadow-3xs">
          <span className="text-blue-800 font-bold uppercase tracking-wider text-[9px] block">Collected commission Cash</span>
          <p className="text-lg font-black font-mono text-blue-700 mt-1">₹{(collectedCommission / 100000).toFixed(1)} Lac</p>
          <span className="text-[10px] text-blue-600 mt-1 flex items-center font-semibold text-ellipsis truncate">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1 shrink-0" />
            <span>Paid by builder partners</span>
          </span>
        </div>

        <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl shadow-3xs">
          <span className="text-amber-800 font-bold uppercase tracking-wider text-[9px] block">Pending Brokerage receivable</span>
          <p className="text-lg font-black font-mono text-amber-700 mt-1">₹{(pendingCollection / 100000).toFixed(1)} Lac</p>
          <span className="text-[10px] text-amber-600 mt-1 flex items-center font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-500 mr-1" />
            <span>Agreement pending verification</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bookings by client, property, registry flat numbers..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors font-medium"
          />
        </div>

        <div className="flex shrink-0 space-x-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="border bg-gray-50 border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">Stage: All Booking Streams</option>
            <option value="Booking">Advance Token Booked</option>
            <option value="Agreement Registered">Agreement Registered Done</option>
            <option value="Cancelled">Cancelled/Refunded</option>
          </select>
        </div>
      </div>

      {/* Main Deals sheet */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs" id="deals-data-table-shell">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-55/70 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Booking client detail</th>
              <th className="py-3 px-4">Project listing & Unit</th>
              <th className="py-3 px-4">Sold pricing</th>
              <th className="py-3 px-4">Broker commissions</th>
              <th className="py-3 px-4">Remitted Token Advance</th>
              <th className="py-3 px-4">Commission Status</th>
              <th className="py-3 px-4 text-right">Verification Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedDeals.map((deal) => (
              <tr key={deal.id} className="hover:bg-slate-50/60 transition-all">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-bold text-gray-900">{deal.clientName}</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Rep: {deal.salesPersonName || 'Unassigned'}</p>
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-gray-700">
                  <div>
                    <p className="text-slate-800 font-bold">{deal.projectName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{deal.unitDetails}</p>
                  </div>
                </td>
                <td className="py-3 px-4 font-bold font-mono text-gray-800">
                  ₹{(deal.dealValue / 100000).toFixed(0)} Lac
                </td>
                <td className="py-3 px-4 font-bold font-mono text-emerald-700">
                  ₹{(deal.expectedCommission / 100000).toFixed(2)} Lac ({deal.commissionPercent}%)
                </td>
                <td className="py-3 px-4 font-bold font-mono text-gray-500">
                  ₹{deal.bookingAmount.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  {deal.stage === 'Agreement Registered' ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded text-[9px] uppercase">
                      Paid & Cleared
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold border border-amber-100 rounded text-[9px] uppercase">
                      Receivable
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {deal.stage === 'Booking' ? (
                    <button
                      onClick={() => setDealToVerify(deal)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] transition-colors"
                    >
                      Clear Receivable Code
                    </button>
                  ) : (
                    <span className="text-gray-400 font-semibold italic text-[10px]">Verified: {deal.closingDate}</span>
                  )}
                </td>
              </tr>
            ))}

            {processedDeals.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  No active sales booking transactions recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VERIFY TRANSACTION COMMISSION RECEIVING MODAL */}
      {dealToVerify && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Complete Brokerage Settlement</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
              Confirm that builder has verified RERA coordinates and agreement is successfully registered. This marks ₹{dealToVerify.expectedCommission.toLocaleString()} as fully collected cash.
            </p>
            <form onSubmit={handleVerifyDealSubmit} className="space-y-4 text-xs font-semibold">
              <div className="flex justify-end space-x-1.5 pt-2">
                <button type="button" onClick={() => setDealToVerify(null)} className="px-3.5 py-1.5 bg-gray-150 rounded text-gray-650">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">Confirm Settlement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
