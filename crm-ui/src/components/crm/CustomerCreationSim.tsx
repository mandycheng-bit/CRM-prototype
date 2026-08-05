import React, { useState } from 'react';
import { ArrowLeft, UserCheck, Info } from 'lucide-react';
import type { Proposal } from '../../types';
import { resolveCompanyMeta } from './ProposalDetail';

interface CustomerCreationSimProps {
  proposal: Proposal;
  onBack: () => void;
  onConfirm: (updatedProposal: Proposal) => void;
}

// Simulated "Create Customer" page — this prototype has no standalone Customer
// database, so converting a Lead is represented as a dedicated full-page step
// (reached only after the unsaved-changes guard on the Opportunity page), not
// an inline mutation. Confirming here flips the source Proposal's masterType
// to 'Customer' and hands it back to App.tsx to persist.
export const CustomerCreationSim: React.FC<CustomerCreationSimProps> = ({ proposal, onBack, onConfirm }) => {
  const entityType = resolveCompanyMeta(proposal.client || '').entityType;
  const [name, setName] = useState(proposal.client || '');
  const [contactPerson, setContactPerson] = useState(proposal.contactPerson || '');
  const [decisionMaker, setDecisionMaker] = useState(proposal.decisionMaker || '');

  const handleCreate = () => {
    onConfirm({
      ...proposal,
      client: name,
      contactPerson: contactPerson || undefined,
      decisionMaker: decisionMaker || undefined,
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

        <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 mb-6">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <span className="font-medium">This is a simulated Customer record — this prototype has no standalone Customer database. Confirming marks this Lead as a Customer on the source Opportunity.</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{entityType} Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Entity Type</label>
              <input type="text" value={entityType} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Contact Person</label>
              <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="—" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Decision Maker</label>
              <input type="text" value={decisionMaker} onChange={e => setDecisionMaker(e.target.value)} placeholder="—" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold" />
            </div>
          </div>

          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1.5 pt-2">Carried Over From Opportunity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Primary Owner</label>
              <span className="text-xs font-semibold text-gray-700">{proposal.salesRep || '—'}</span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Campaign</label>
              <span className="text-xs font-semibold text-gray-700">{proposal.campaign || '—'}</span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Product Item</label>
              <span className="text-xs font-semibold text-gray-700">{proposal.productItem || '—'}</span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Product Category</label>
              <span className="text-xs font-semibold text-gray-700">{proposal.productCategory || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCreationSim;
