import { Phone, Mail, Users, Calendar } from 'lucide-react';

const ACTIVITIES = [
  { id: 1, type: 'Call', subject: 'Follow-up on proposal', contact: 'User D', date: '2024-03-25', status: 'Done' },
  { id: 2, type: 'Email', subject: 'MPF scheme comparison', contact: 'User C', date: '2024-03-26', status: 'Planned' },
  { id: 3, type: 'Meeting', subject: 'Presentation – Company A', contact: 'User B', date: '2024-03-28', status: 'Planned' },
  { id: 4, type: 'Call', subject: 'Renewal reminder', contact: 'User A', date: '2024-03-20', status: 'Done' },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  Call: <Phone size={14} />, Email: <Mail size={14} />, Meeting: <Users size={14} />, Task: <Calendar size={14} />,
};

export default function Activities() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Activities</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Subject</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ACTIVITIES.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="flex items-center gap-1.5 text-gray-500">{TYPE_ICON[a.type]}{a.type}</span></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{a.subject}</td>
                  <td className="px-6 py-4 text-gray-600">{a.contact}</td>
                  <td className="px-6 py-4 text-gray-500">{a.date}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
