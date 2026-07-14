import React from 'react';
import { Search, Download, Plus, Filter } from 'lucide-react';
import Badge from './Badge';

interface FilterBarProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  filters: { label: string; type: 'select' | 'date' | 'text'; options?: string[]; source: any }[];
}

const FilterBar: React.FC<FilterBarProps> = ({ title, onAdd, addLabel, filters }) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <div className="flex gap-2">
          {onAdd && (
            <button 
              onClick={onAdd}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              {addLabel || 'Create New'}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 items-end">
        {filters.map((f, i) => (
          <div key={i} className="flex flex-col gap-1 whitespace-nowrap">
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center whitespace-nowrap">
              {f.label} <Badge source={f.source} />
            </label>
            {f.type === 'select' ? (
              <select className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-[160px] bg-white">
                <option>All {f.label}</option>
                {f.options?.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            ) : f.type === 'date' ? (
              <input type="date" className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-[160px]" />
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder={`Search ${f.label}...`} className="border border-gray-300 rounded pl-9 pr-3 py-1.5 text-sm min-w-[160px]" />
              </div>
            )}
          </div>
        ))}
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors border border-gray-300">
          <Filter size={14} />
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
