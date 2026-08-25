import React, { useState } from 'react';
import { ArrowLeft, UserCheck, AlertTriangle, Star, X } from 'lucide-react';
import type { Proposal } from '../../types';
import { MOCK_LEADS } from '../../constants';
import { resolveCompanyMeta, SALES_REPS } from './ProposalDetail';

interface CustomerCreationSimProps {
  proposal: Proposal;
  onBack: () => void;
  onConfirm: (updatedProposal: Proposal) => void;
}

const REGIONS = ['Hong Kong', 'Macau'];
const MAX_SALES_REPS = 3;

// Company gets all four categories; Individual only ever shows Lead (Part 2, TASK-14).
type SalesRepCategory = 'Insurance' | 'Pension' | 'Project' | 'Lead';

// Region codes as stored on a Lead record don't line up 1:1 with the real
// target system's Region field (Hong Kong / Macau only, per PRD-Leads &
// Customers Part1) — map what we can, leave the rest for the Rep to pick.
const mapLeadRegion = (region?: string): string => {
  if (!region) return '';
  if (region === 'HK') return 'Hong Kong';
  if (region === 'Macau' || region === 'MO') return 'Macau';
  return '';
};

const splitContactName = (fullName?: string): [string, string] => {
  if (!fullName) return ['', ''];
  const parts = fullName.trim().split(/\s+/);
  return [parts[0] || '', parts.slice(1).join(' ')];
};

// Simulated "Create Customer" page — this prototype has no standalone Customer
// database, so converting a Lead is represented as a dedicated full-page step
// (reached only after the unsaved-changes guard on the Opportunity page), not
// an inline mutation. The Company vs. Individual field set below is a
// simplified stand-in for the real Companies/Individuals module's create
// mode, pre-filled from the matching Lead record (constants.ts) and from the
// source Opportunity's own Sales Assignment. Confirming here flips the source
// Proposal's masterType to 'Customer' and hands it back to App.tsx to persist.
export const CustomerCreationSim: React.FC<CustomerCreationSimProps> = ({ proposal, onBack, onConfirm }) => {
  const { entityType, masterType } = resolveCompanyMeta(proposal.client || '');
  const isCompany = entityType === 'Company';
  // A Lapsed entity already has a real Company/Individual record — its Name,
  // Region, Number of Employees, etc. all carry over unchanged (Part 2,
  // TASK-14). Only the Sales Rep Assignment is actually missing (that's what
  // made it Lapsed in the first place), so that's the only thing collected here.
  const isLapsed = masterType === 'Lapsed Customer';
  const matchedLead = MOCK_LEADS.find(l => l.leadName === proposal.client);
  const [initialFirstName, initialLastName] = splitContactName(matchedLead?.contactPerson);

  // Company fields — pre-filled from the matched Lead
  const [companyName, setCompanyName] = useState(proposal.client || '');
  const [companyRegion, setCompanyRegion] = useState(mapLeadRegion(matchedLead?.region));
  const [numberOfEmployees, setNumberOfEmployees] = useState(matchedLead?.numberOfEmployees != null ? String(matchedLead.numberOfEmployees) : '');

  // Individual fields — pre-filled from the matched Lead
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [individualRegion, setIndividualRegion] = useState(mapLeadRegion(matchedLead?.region));
  const [email, setEmail] = useState(matchedLead?.email || '');
  const [phone, setPhone] = useState(matchedLead?.phone || '');
  const [mobile, setMobile] = useState('');

  // Sales Rep, per category — Company gets Insurance/Pension/Project (optional)
  // plus Lead (required); Individual only ever shows Lead. The same rep can
  // appear in more than one category (e.g. also the Insurance rep). Lead
  // starts pre-filled from the source Opportunity's own Sales Assignment
  // (Part 2, TASK-7) since that's the assignment already driving this
  // conversion; the other categories start empty.
  const categories: SalesRepCategory[] = isCompany ? ['Insurance', 'Pension', 'Project', 'Lead'] : ['Lead'];
  const [repsByCategory, setRepsByCategory] = useState<Record<SalesRepCategory, string[]>>({
    Insurance: [],
    Pension: [],
    Project: [],
    Lead: [proposal.salesRep, proposal.salesRep2, proposal.salesRep3].filter((r): r is string => !!r).slice(0, MAX_SALES_REPS),
  });
  const [repToAdd, setRepToAdd] = useState<Record<SalesRepCategory, string>>({ Insurance: '', Pension: '', Project: '', Lead: '' });
  const [error, setError] = useState('');

  const addSalesRep = (category: SalesRepCategory) => {
    const rep = repToAdd[category];
    if (!rep || repsByCategory[category].includes(rep) || repsByCategory[category].length >= MAX_SALES_REPS) return;
    setRepsByCategory(prev => ({ ...prev, [category]: [...prev[category], rep] }));
    setRepToAdd(prev => ({ ...prev, [category]: '' }));
  };

  const removeSalesRep = (category: SalesRepCategory, rep: string) => {
    setRepsByCategory(prev => ({ ...prev, [category]: prev[category].filter(r => r !== rep) }));
  };

  const validate = (): string => {
    if (repsByCategory.Lead.length === 0) return `Select at least one ${isCompany ? 'Lead' : 'Individual'} Sales Rep.`;
    if (isLapsed) return '';
    if (isCompany) {
      if (!companyName.trim()) return 'Name is required.';
      if (!companyRegion) return 'Region is required.';
      if (!numberOfEmployees.trim()) return 'Number of Employees is required.';
    } else {
      if (!firstName.trim()) return 'First Name is required.';
      if (!lastName.trim()) return 'Last Name is required.';
      if (!individualRegion) return 'Region is required.';
      if (!email.trim() && !phone.trim() && !mobile.trim()) return 'Enter at least one of Email, Phone, or Mobile.';
    }
    return '';
  };

  const handleCreate = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onConfirm({
      ...proposal,
      client: isLapsed ? proposal.client : (isCompany ? companyName : `${firstName} ${lastName}`.trim()),
      masterType: 'Customer',
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      <div className="px-6 pt-6 mx-auto w-full max-w-4xl">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 bg-white shadow-sm text-gray-500"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs text-gray-400 font-mono">Converting from Opportunity {proposal.id}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Customer</h1>
            <p className="text-xs text-gray-500 mt-1">From "{proposal.name}" · {entityType}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onBack} className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold shadow-sm transition-all">
              Cancel
            </button>
            <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
              <UserCheck size={14} />
              <span>Create Customer</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">
            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          {isLapsed ? (
            <div className="text-xs">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{isCompany ? 'Company' : 'Individual'}</label>
              <div className="px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded text-xs font-semibold text-gray-700">{proposal.client}</div>
              <p className="text-[10px] text-gray-400 mt-1">Existing record — its other details carry over unchanged. Only the Sales Rep Assignment below is being added.</p>
            </div>
          ) : (
          <>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
            {isCompany ? 'Company Information' : 'Individual Information'}
          </h3>

          {isCompany ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Name<span className="text-red-500">*</span></label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Region<span className="text-red-500">*</span></label>
                <select value={companyRegion} onChange={e => setCompanyRegion(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold">
                  <option value="">Please Select</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Number of Employees<span className="text-red-500">*</span></label>
                <input type="number" min={0} value={numberOfEmployees} onChange={e => setNumberOfEmployees(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">First Name<span className="text-red-500">*</span></label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Last Name<span className="text-red-500">*</span></label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Region<span className="text-red-500">*</span></label>
                <select value={individualRegion} onChange={e => setIndividualRegion(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold">
                  <option value="">Please Select</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email</label>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Mobile</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
              </div>
              <div className="md:col-span-2 text-[10px] text-gray-400">At least one of Email, Phone, or Mobile is required.</div>
            </div>
          )}
          </>
          )}

          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1.5 pt-2">
            Sales Rep Assignment
          </h3>

          <div className="space-y-3">
            {categories.map(category => {
              const reps = repsByCategory[category];
              const otherReps = SALES_REPS.filter(r => !reps.includes(r));
              const categoryLabel = category === 'Lead' && !isCompany ? 'Individual' : category;
              return (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {categoryLabel}{category === 'Lead' && <span className="text-red-500">*</span>}
                  </div>
                  {reps.length === 0 ? (
                    <div className="text-xs text-gray-400 italic mb-2">No sales rep assigned yet.</div>
                  ) : (
                    <div className="space-y-2 mb-2">
                      {reps.map(rep => (
                        <div key={rep} className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">{rep}</span>
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            <button type="button" onClick={() => removeSalesRep(category, rep)} className="text-red-500 hover:text-red-700">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {reps.length < MAX_SALES_REPS && (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <select value={repToAdd[category]} onChange={e => setRepToAdd(prev => ({ ...prev, [category]: e.target.value }))} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold">
                          <option value="">Sales Rep</option>
                          {otherReps.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => addSalesRep(category)}
                        disabled={!repToAdd[category]}
                        className="px-4 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCreationSim;
