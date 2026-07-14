import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Policy } from '../types';

export default function Policy360({ policy, onClose }: { policy: Policy; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded"><ArrowLeft size={18} /></button>
        <ShieldCheck size={20} className="text-orange-500" />
        <div>
          <div className="text-base font-bold text-gray-900">{policy.policyNo}</div>
          <div className="text-xs text-gray-500">{policy.customer} · {policy.provider}</div>
        </div>
        <span className={`ml-4 px-2 py-1 rounded text-[10px] font-bold uppercase ${policy.status === 'Active' ? 'bg-green-100 text-green-700' : policy.status === 'Renewal Due' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{policy.status}</span>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Policy No', policy.policyNo],
            ['Proposal ID', policy.crmProposalId],
            ['Customer', policy.customer],
            ['Provider', policy.provider],
            ['Effective Date', policy.effectiveDate],
            ['Expiry Date', policy.expiryDate],
            ['Premium Total', `HKD ${policy.premiumTotal.toLocaleString()}`],
            ['CRM Status', policy.crmProposalStatus],
            ['Renewal Required', policy.renewRequired ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">{label}</div>
              <div className="text-sm font-semibold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
