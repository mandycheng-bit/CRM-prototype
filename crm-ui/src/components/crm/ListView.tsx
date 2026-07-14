import { Plus } from 'lucide-react';

interface Col { key: string; label: string; }
interface Props {
  title: string;
  description: string;
  columns: Col[];
  data: Record<string, unknown>[];
  onAdd: () => void;
}

export default function ListView({ title, description, columns, data, onAdd }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600">
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>{columns.map(c => <th key={c.key} className="px-6 py-4 text-left">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400 text-sm">No records yet.</td></tr>
              ) : data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {columns.map(c => <td key={c.key} className="px-6 py-4 text-gray-700">{String(row[c.key] ?? '—')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
