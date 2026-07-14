import { ShieldCheck } from 'lucide-react';

const RECORDS = [
  { id: 1, client: 'James Liu', type: 'KYC', status: 'Approved', date: '2024-02-10', reviewer: 'Compliance Team' },
  { id: 2, client: 'Mary Tam', type: 'AML', status: 'Pending', date: '2024-03-15', reviewer: '—' },
  { id: 3, client: 'Alpha Corp', type: 'KYC', status: 'Approved', date: '2023-11-20', reviewer: 'Compliance Team' },
];

export default function ComplianceView() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <ShieldCheck size={20} className="text-orange-500" />
        <h1 className="text-xl font-bold text-gray-900">Compliance</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Client</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Reviewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RECORDS.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.client}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{r.type}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td>
                  <td className="px-6 py-4 text-gray-500">{r.date}</td>
                  <td className="px-6 py-4 text-gray-600">{r.reviewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
