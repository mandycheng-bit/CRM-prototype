import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Lead } from '../../types';

interface Props {
  lead: Lead;
  onBack: () => void;
  onUpdate: (l: Lead) => void;
  onViewCompliance: (id: string) => void;
}

export default function LeadDetail({ lead, onBack, onViewCompliance }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-1.5 text-gray-400 hover:text-gray-700 rounded"><ArrowLeft size={18} /></button>
        <div>
          <div className="text-base font-bold text-gray-900">{lead.leadName}</div>
          {lead.companyName && <div className="text-xs text-gray-500">{lead.companyName}</div>}
        </div>
        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">{lead.temperature}</span>
        <button onClick={() => onViewCompliance(lead.id)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold">
          <ShieldCheck size={14} /> View Compliance
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
          {[
            ['Lead ID', lead.id], ['Type', lead.type], ['Region', lead.region],
            ['Source', lead.source], ['Campaign', lead.campaign || '—'], ['Assigned Sales', lead.assignedSales],
            ['Status', lead.leadStatus], ['Created', lead.createdDate],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">{label}</div>
              <div className="text-sm font-semibold text-gray-900">{value}</div>
            </div>
          ))}
          <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Notes</div>
            <div className="text-sm text-gray-700">{lead.notesSummary || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
