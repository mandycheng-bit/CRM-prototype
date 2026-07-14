import { useState } from 'react';
import { Settings } from 'lucide-react';

const TABS = ['General', 'Sales Stages', 'Product Categories', 'Regions', 'Users'];

export default function Configuration() {
  const [tab, setTab] = useState('General');
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={20} className="text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900">Configuration</h1>
        </div>
        <div className="flex gap-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${t === tab ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500">{tab} configuration options will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}
