import { Building2, User } from 'lucide-react';

const COMPANIES = [
  { id: 1, name: 'Company 001', industry: 'Technology', contact: 'User A', proposals: 2, status: 'Active' },
  { id: 2, name: 'Company 002', industry: 'Finance', contact: 'User B', proposals: 1, status: 'Active' },
  { id: 3, name: 'Company 003', industry: 'Manufacturing', contact: 'User C', proposals: 3, status: 'Inactive' },
];

const INDIVIDUALS = [
  { id: 1, name: 'User A', email: 'user.a@demo.com', region: 'HK Island', proposals: 1, status: 'Active' },
  { id: 2, name: 'User B', email: 'user.b@demo.com', region: 'Kowloon', proposals: 0, status: 'Lead' },
];

export default function Customers({ type }: { type: 'Company' | 'Individual' }) {
  const data = type === 'Company' ? COMPANIES : INDIVIDUALS;
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">{type === 'Company' ? 'Companies' : 'Individuals'}</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                {type === 'Company' ? <th className="px-6 py-4 text-left">Industry</th> : <th className="px-6 py-4 text-left">Email</th>}
                <th className="px-6 py-4 text-left">{type === 'Company' ? 'Contact' : 'Region'}</th>
                <th className="px-6 py-4 text-left">Proposals</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    {type === 'Company' ? <Building2 size={14} className="text-gray-400" /> : <User size={14} className="text-gray-400" />}
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{type === 'Company' ? c.industry : c.email}</td>
                  <td className="px-6 py-4 text-gray-600">{type === 'Company' ? c.contact : c.region}</td>
                  <td className="px-6 py-4 text-gray-700">{c.proposals}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
