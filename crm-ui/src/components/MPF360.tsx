import { ArrowLeft } from 'lucide-react';
import type { MPFAccount } from '../types';

export default function MPF360({ account, onClose }: { account: MPFAccount; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded"><ArrowLeft size={18} /></button>
        <div>
          <div className="text-base font-bold text-gray-900">{account.accountId}</div>
          <div className="text-xs text-gray-500">{account.customer} · {account.scheme}</div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Account ID', account.accountId],
            ['Proposal ID', account.crmProposalId],
            ['Customer', account.customer],
            ['Provider', account.provider],
            ['Scheme', account.scheme],
            ['Client Code', account.clientCode],
            ['Latest AUM', `HKD ${account.latestAUM.toLocaleString()}`],
            ['Status', account.status],
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
