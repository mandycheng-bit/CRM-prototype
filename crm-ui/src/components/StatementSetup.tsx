import { useState } from 'react';
import { X } from 'lucide-react';

export default function StatementSetup({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ period: '', type: 'Monthly', notes: '' });
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-lg mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Statement Setup</h2>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700"><X size={18} /></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Period</label>
          <input type="month" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.period} onChange={e => setForm(p => ({...p, period: e.target.value}))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Statement Type</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
            <option>Monthly</option><option>Quarterly</option><option>Annual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
          <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold">Create Statement</button>
        </div>
      </div>
    </div>
  );
}
