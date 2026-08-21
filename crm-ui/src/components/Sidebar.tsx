import { useState } from 'react';
import { Briefcase, Package, Settings, SlidersHorizontal, ChevronDown, BarChart2 } from 'lucide-react';

export type ModuleId = 'perspective-pipeline' | 'prospect-2027' | 'benchmark' | 'products' | 'opportunity-config';

interface Props {
  activeModule: ModuleId;
  onModuleChange: (id: ModuleId) => void;
}

const SETTINGS_CHILDREN = [
  { id: 'products' as ModuleId, label: 'Product Configuration', icon: Package },
  { id: 'opportunity-config' as ModuleId, label: 'Opportunity Configuration', icon: SlidersHorizontal },
];

export default function Sidebar({ activeModule, onModuleChange }: Props) {
  const isSettingsChildActive = SETTINGS_CHILDREN.some(c => c.id === activeModule);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsChildActive);

  return (
    <div className="w-64 bg-[#1a1a1a] text-white h-screen flex flex-col border-r border-white/10">
      <div className="p-6 flex flex-col gap-1 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-xl">G</div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight leading-none">GUM CRM</span>
            <span className="text-[8px] text-gray-500 uppercase tracking-widest">GIVE U MORE</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <button
          onClick={() => onModuleChange('perspective-pipeline')}
          className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors relative whitespace-nowrap ${
            activeModule === 'perspective-pipeline' ? 'bg-orange-500/10 text-orange-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Briefcase size={16} />
          <span className="flex-1 text-left">Prospect(2026)</span>
          {activeModule === 'perspective-pipeline' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500" />}
        </button>

        <button
          onClick={() => onModuleChange('prospect-2027')}
          className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors relative whitespace-nowrap ${
            activeModule === 'prospect-2027' ? 'bg-orange-500/10 text-orange-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Briefcase size={16} />
          <span className="flex-1 text-left">Prospect(2027)</span>
          {activeModule === 'prospect-2027' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500" />}
        </button>

        <button
          onClick={() => onModuleChange('benchmark')}
          className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors relative whitespace-nowrap ${
            activeModule === 'benchmark' ? 'bg-orange-500/10 text-orange-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart2 size={16} />
          <span className="flex-1 text-left">Benchmark</span>
          {activeModule === 'benchmark' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500" />}
        </button>

        <button
          onClick={() => setSettingsOpen(o => !o)}
          className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors relative whitespace-nowrap ${
            isSettingsChildActive ? 'text-orange-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={16} />
          <span className="flex-1 text-left">Settings</span>
          <ChevronDown size={14} className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
        </button>

        {settingsOpen && SETTINGS_CHILDREN.map(item => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`w-full flex items-center gap-3 pl-12 pr-6 py-2.5 text-sm transition-colors relative whitespace-nowrap ${
                isActive ? 'bg-orange-500/10 text-orange-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={14} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-900 flex items-center justify-center text-[10px] font-bold">DU</div>
        <div className="flex flex-col">
          <span className="text-xs font-bold">Demo User</span>
          <span className="text-[10px] text-gray-500">Demo Company</span>
        </div>
      </div>
    </div>
  );
}
