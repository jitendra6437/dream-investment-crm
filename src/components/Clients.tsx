import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  FileText,
  Search,
  Briefcase,
  Layers,
  Calendar
} from 'lucide-react';
import { Client, Lead } from '../types';
import { CrmDb } from '../firebase';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientsData();
  }, []);

  const loadClientsData = async () => {
    setLoading(true);
    try {
      const c = await CrmDb.getClients();
      const l = await CrmDb.getLeads();
      setClients(c);
      setLeads(l);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 font-sans text-slate-800" id="clients-view-outer">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100">
        <h3 className="font-bold text-gray-950 text-sm mb-1">CRM Client Portfolio Directory</h3>
        <p className="text-[11px] text-gray-400 mb-3 ml-0.5">Contacts who completed agreement registry or site visit clearances with Dream Investment.</p>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search verified clients by name, active number, location city limits..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-gray-50 text-sm rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="clients-main-grid-row">
        {/* Contacts column list */}
        <div className="lg:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredClients.map((client) => {
            const clientClosedBooking = leads.filter(l => l.mobile === client.mobile && (l.status === 'Booking Done' || l.status === 'Deal Closed'));

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`bg-white border rounded-xl p-3 shadow-3xs cursor-pointer transition-all hover:border-blue-300 ${
                  selectedClient?.id === client.id ? 'border-2 border-blue-600 bg-blue-50/20 shadow-2xs' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs capitalize shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-bold text-gray-950 text-xs truncate">{client.name}</h4>
                    <p className="text-[10px] text-gray-400 font-mono font-medium">{client.mobile}</p>
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 text-[8px] bg-slate-100 font-bold text-gray-500 rounded uppercase">
                        {client.purchasedType || 'HNI Client'}
                      </span>
                      {clientClosedBooking.length > 0 && (
                        <span className="text-[7.5px] bg-emerald-100/70 border border-emerald-200 font-black text-emerald-800 px-1 py-0.2 rounded font-sans">
                          Closed Booking
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <p className="text-xs text-center py-6 text-gray-400">No matching contacts available.</p>
          )}
        </div>

        {/* Selected Contact details card summary */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-xs border border-gray-100 p-4">
          {selectedClient ? (
            <div className="space-y-4 text-xs font-semibold animate-fade-in" id="client-selected-details">
              <div className="pb-3 border-b border-gray-100 flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-black shrink-0 capitalize">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-950">{selectedClient.name}</h3>
                    <p className="text-xs text-gray-405 font-medium">Customer Profile registered on {new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Core contacts parameters list */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">Primary Phone Mobile</span>
                  <p className="font-bold text-gray-800 font-mono flex items-center">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" />
                    <span>{selectedClient.mobile}</span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">Email Correspondence</span>
                  <p className="font-bold text-slate-800 truncate flex items-center">
                    <Mail className="w-3.5 h-3.5 text-blue-500 mr-1 shrink-0" />
                    <span>{selectedClient.email || 'None Registered'}</span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">City limit</span>
                  <p className="font-bold text-gray-850 flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-red-500 mr-1" />
                    <span>{selectedClient.city}</span>
                  </p>
                </div>
              </div>

              {/* CRM Transactions tracker */}
              <div className="pt-3 border-t border-gray-50">
                <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2 flex items-center">
                  <Briefcase className="w-4 h-4 text-blue-500 mr-1.5" />
                  <span>Closed real estate deals and negotiations</span>
                </h4>
                <div className="space-y-2">
                  {leads.filter(l => l.mobile === selectedClient.mobile).map(l => (
                    <div key={l.id} className="p-3 bg-fuchsia-50/20 border border-fuchsia-100 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="px-1.5 py-0.5 text-[8.5px] bg-slate-100 rounded text-gray-500 font-bold mr-1.5 shrink-0 align-middle">
                          {l.buyRentResale}
                        </span>
                        <span className="font-bold text-gray-800 align-middle">{l.bhk || l.propertyType} in Dadar / Godrej Listing</span>
                        <p className="text-[10px] text-gray-400 mt-1">Lead Pipeline Status: <strong>{l.status}</strong></p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-gray-400">Min budget target:</span>
                        <p className="font-bold font-mono text-gray-800 text-[11px]">₹{(l.budgetMin/100000).toFixed(0)}L - ₹{(l.budgetMax/10000000).toFixed(2)}Cr</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <User className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-xs font-semibold">Select a Verified Client profile</p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-sm">Tap on any name in left panel list to view correspondence details, closed deal listings, pending collections logs and active portfolios.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
