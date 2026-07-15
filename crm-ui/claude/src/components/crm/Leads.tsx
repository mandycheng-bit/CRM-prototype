import React from 'react';
import type { Lead } from '../../types';
import { ArrowRight, Flame, Minus, Snowflake } from 'lucide-react';

const TEMP_ICON: Record<string, React.ReactNode> = { Hot: <Flame size={12} className="text-red-500" />, Warm: <Minus size={12} className="text-yellow-500" />, Cold: <Snowflake size={12} className="text-blue-400" /> };

interface Props {
  leads: Lead[];
  onConvert: (lead: Lead) => void;
  onView: (lead: Lead) => void;
}

export default function Leads({ leads, onConvert, onView }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Leads</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Lead</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Temp</th>
                <th className="px-6 py-4 text-left">Source</th>
                <th className="px-6 py-4 text-left">Sales Rep</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button onClick={() => onView(l)} className="text-orange-600 hover:underline font-semibold">{l.leadName}</button>
                    {l.companyName && <div className="text-xs text-gray-400">{l.companyName}</div>}
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{l.type}</span></td>
                  <td className="px-6 py-4"><span className="flex items-center gap-1">{TEMP_ICON[l.temperature]}<span className="text-[10px] font-bold">{l.temperature}</span></span></td>
                  <td className="px-6 py-4 text-gray-600">{l.source}</td>
                  <td className="px-6 py-4 text-gray-600">{l.assignedSales}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{l.leadStatus}</span></td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{l.createdDate}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onConvert(l)} className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500 text-white rounded font-semibold hover:bg-orange-600">
                      Convert <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
