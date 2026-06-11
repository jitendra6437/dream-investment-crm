import React, { useState, useEffect } from 'react';
import {
  Plus,
  Building,
  MapPin,
  HelpCircle,
  FileText,
  Trash2,
  DollarSign,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Project, PropertyType, BHKOption } from '../types';
import { CrmDb, getActiveUser } from '../firebase';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [builderName, setBuilderName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [priceMin, setPriceMin] = useState(2500000);
  const [priceMax, setPriceMax] = useState(15000000);
  const [reraNumber, setReraNumber] = useState('');
  const [possessionStatus, setPossessionStatus] = useState<'Ready to Move' | 'Under Construction' | 'Newly Launched' | 'On Hold'>('Ready to Move');
  const [commissionStructure, setCommissionStructure] = useState('2.5% agreement percentage');
  const [availableInventory, setAvailableInventory] = useState('10 Units');
  const [googleMapLink, setGoogleMapLink] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const p = await CrmDb.getProjects();
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload: Project = {
        id: `p_${Date.now()}`,
        name,
        builderName,
        location,
        city,
        propertyType: ['Flat'],
        bhkOptions: ['2BHK', '3BHK'],
        priceMin: Number(priceMin),
        priceMax: Number(priceMax),
        possessionStatus,
        reraNumber,
        commissionStructure,
        availableInventory,
        googleMapLink,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await CrmDb.saveProject(payload);
      setShowAddModal(false);
      resetForm();
      await loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this project listing?')) {
      await CrmDb.deleteProject(id);
      await loadProjects();
    }
  };

  const resetForm = () => {
    setName('');
    setBuilderName('');
    setLocation('');
    setCity('Mumbai');
    setPriceMin(3500000);
    setPriceMax(15000000);
    setReraNumber('');
    setPossessionStatus('Ready to Move');
    setCommissionStructure('2% referral fee');
    setAvailableInventory('');
    setGoogleMapLink('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" id="projects-view-interface">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Real Estate Listing Projects</h3>
          <p className="text-[11px] text-gray-400">Brokerage active buildings, builder terms and commission configurations.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center space-x-1 shadow-2xs"
          id="btn-add-project"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-3xs hover:border-blue-200 transition-all flex flex-col justify-between" id={`project-card-${project.id}`}>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-950 text-sm">{project.name}</h4>
                  <p className="text-xs text-gray-400">By {project.builderName}</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                  {project.possessionStatus}
                </span>
              </div>

              <div className="flex items-center text-xs text-gray-500 space-x-1.5 pt-1.5 border-t border-gray-50">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">{project.location}, {project.city}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-semibold text-gray-600">
                <div>
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider block">Price Category Range</span>
                  <span className="text-red-500 font-bold font-mono">₹{(project.priceMin / 100000).toFixed(0)}L - ₹{(project.priceMax / 10000000).toFixed(2)} Cr</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider block">Co-Brokerage Terms</span>
                  <span className="text-emerald-700 font-bold flex items-center">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{project.commissionStructure}</span>
                  </span>
                </div>
                {project.reraNumber && (
                  <div className="col-span-2 pt-1 border-t border-gray-50">
                    <span className="text-gray-400 text-[9px] uppercase tracking-wider block">Approved RERA Registry</span>
                    <span className="text-gray-700 font-mono font-bold text-[10px]">{project.reraNumber}</span>
                  </div>
                )}
                {project.availableInventory && (
                  <div className="col-span-2 pt-1">
                    <span className="text-gray-400 text-[9px] uppercase tracking-wider block">Remaining Inventory Status</span>
                    <span className="text-slate-700 text-[10px] font-sans font-bold">{project.availableInventory}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3.5 mt-3.5 border-t border-gray-100 flex items-center justify-between shadow-2xs">
              {project.googleMapLink && (
                <a
                  href={project.googleMapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline font-bold decoration-dotted"
                >
                  Locate on Google Maps
                </a>
              )}
              <div className="flex space-x-1.5 ml-auto">
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove Listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <p className="text-xs text-gray-400 col-span-2 text-center py-8">No property projects listed.</p>
        )}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="add-project-modal">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-md w-full">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Add Real Estate Listing Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-500 mb-1">Project Name *</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Godrej Horizon" className="w-full border rounded p-1.5 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Builder Name *</label>
                  <input required type="text" value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="e.g. Godrej Properties" className="w-full border rounded p-1.5 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Approved RERA Registration</label>
                  <input type="text" value={reraNumber} onChange={(e) => setReraNumber(e.target.value)} placeholder="P51900034821" className="w-full border rounded p-1.5 bg-gray-50 font-mono" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Locality Region *</label>
                  <input required type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Wadala" className="w-full border rounded p-1.5 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">City Limit</label>
                  <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded p-1.5 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Inventory Remaining Status</label>
                  <input type="text" value={availableInventory} onChange={(e) => setAvailableInventory(e.target.value)} placeholder="e.g. 14 flats remaining" className="w-full border rounded p-1.5 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Brokerage Commission structure (%)</label>
                  <input type="text" value={commissionStructure} onChange={(e) => setCommissionStructure(e.target.value)} placeholder="e.g. 2.5% flat" className="w-full border rounded p-1.5 bg-gray-50 font-bold" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Min Price Range (₹)</label>
                  <input type="number" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} className="w-full border rounded p-1.5 bg-gray-50 font-mono" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Max Price Range (₹)</label>
                  <input type="number" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full border rounded p-1.5 bg-gray-50 font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 mb-1">Possession State</label>
                  <select value={possessionStatus} onChange={(e) => setPossessionStatus(e.target.value as any)} className="w-full border rounded p-1.5 bg-gray-50 text-gray-700">
                    <option value="Ready to Move">Ready to Move</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Newly Launched">Newly Launched / Upcoming</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 mb-1">Maps Location URL link</label>
                  <input type="text" value={googleMapLink} onChange={(e) => setGoogleMapLink(e.target.value)} placeholder="https://maps.google.com/..." className="w-full border rounded p-1.5 bg-gray-50" />
                </div>
              </div>

              <div className="flex justify-end space-x-1.5 pt-3 border-t border-gray-50">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="px-3 py-1.5 bg-gray-150 rounded text-gray-600 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold">List Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
