import { AlertTriangle } from 'lucide-react';

const CONFLICTS = [
  { id: 1, client: 'Company 001', reps: ['Sales Rep A', 'Sales Rep B'], stage: 'Proposal', filed: '2024-03-10', status: 'Open' },
  { id: 2, client: 'Company 002', reps: ['Agent 01', 'Agent 02'], stage: 'Qualification', filed: '2024-03-18', status: 'Resolved' },
];

export default function SalesConflictsWorkspace() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <AlertTriangle size={20} className="text-orange-500" />
        <h1 className="text-xl font-bold text-gray-900">Sales Conflicts</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Client</th>
                <th className="px-6 py-4 text-left">Sales Reps</th>
                <th className="px-6 py-4 text-left">Stage</th>
                <th className="px-6 py-4 text-left">Filed</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CONFLICTS.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.client}</td>
                  <td className="px-6 py-4 text-gray-600">{c.reps.join(' vs ')}</td>
                  <td className="px-6 py-4 text-gray-600">{c.stage}</td>
                  <td className="px-6 py-4 text-gray-500">{c.filed}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
