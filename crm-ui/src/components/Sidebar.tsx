import { useState } from 'react';
import { Briefcase, Package, Settings, SlidersHorizontal, ChevronDown, BarChart2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export type ModuleId = 'perspective-pipeline' | 'prospect-2027' | 'benchmark' | 'products' | 'opportunity-config';

interface Props {
  activeModule: ModuleId;
  onModuleChange: (id: ModuleId) => void;
}

const MAIN_ITEMS: { id: ModuleId; label: string; icon: typeof Briefcase }[] = [
  { id: 'perspective-pipeline', label: 'Prospect(2026)', icon: Briefcase },
  { id: 'prospect-2027', label: 'Prospect(2027)', icon: Briefcase },
  { id: 'benchmark', label: 'Benchmark', icon: BarChart2 },
];

const SETTINGS_CHILDREN = [
  { id: 'products' as ModuleId, label: 'Product Configuration', icon: Package },
  { id: 'opportunity-config' as ModuleId, label: 'Opportunity Configuration', icon: SlidersHorizontal },
];

export default function Sidebar({ activeModule, onModuleChange }: Props) {
  const isSettingsChildActive = SETTINGS_CHILDREN.some(c => c.id === activeModule);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsChildActive);
  // Collapsed = icon-only rail, so the sidebar stops eating horizontal space
  // when the user wants the full width for the data table / board.
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-[#1a1a1a] text-white h-screen flex flex-col border-r border-white/10 transition-[width] duration-200 ease-in-out`}>
      <div className={`flex items-center border-b border-white/10 ${collapsed ? 'flex-col gap-3 py-4 px-2' : 'justify-between p-6'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-xl flex-shrink-0">G</div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight leading-none truncate">GUM CRM</span>
              <span className="text-[8px] text-gray-500 uppercase tracking-widest">GIVE U MORE</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-gray-500 hover:text-white hover:bg-white/10 rounded p-1.5 transition-colors flex-shrink-0"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {MAIN_ITEMS.map(item => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors relative whitespace-nowrap ${collapsed ? 'justify-center px-0' : 'px-6'} ${
                isActive ? 'bg-orange-500/10 text-orange-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500" />}
            </button>
          );
        })}

        <button
          onClick={() => {
            // While collapsed, expand first so the child items have room to show.
            if (collapsed) { setCollapsed(false); setSettingsOpen(true); }
            else setSettingsOpen(o => !o);
          }}
          title={collapsed ? 'Settings' : undefined}
          className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors relative whitespace-nowrap ${collapsed ? 'justify-center px-0' : 'px-6'} ${
            isSettingsChildActive ? 'text-orange-500 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={16} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Settings</span>}
          {!collapsed && <ChevronDown size={14} className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />}
          {collapsed && isSettingsChildActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500" />}
        </button>

        {!collapsed && settingsOpen && SETTINGS_CHILDREN.map(item => {
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

      <div className={`border-t border-white/10 flex items-center ${collapsed ? 'justify-center p-3' : 'gap-3 p-4'}`}>
        <div className="w-8 h-8 rounded-full bg-orange-900 flex items-center justify-center text-[10px] font-bold flex-shrink-0">DU</div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xs font-bold">Demo User</span>
            <span className="text-[10px] text-gray-500">Demo Company</span>
          </div>
        )}
      </div>
    </div>
  );
}
