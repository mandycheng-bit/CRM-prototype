import { Users } from 'lucide-react';

const TEAMS = [
  { id: 1, name: 'HK Island Team', lead: 'Mandy Cheng', members: 4, proposals: 12, won: 5 },
  { id: 2, name: 'Kowloon Team', lead: 'Peter Ho', members: 3, proposals: 8, won: 3 },
  { id: 3, name: 'NT Team', lead: 'Alice Lam', members: 3, proposals: 6, won: 2 },
];

export default function SalesTeamsWorkspace() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Users size={20} className="text-orange-500" />
        <h1 className="text-xl font-bold text-gray-900">Sales Teams</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-4">
          {TEAMS.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="font-bold text-gray-900 text-base mb-1">{t.name}</div>
              <div className="text-xs text-gray-500 mb-4">Lead: {t.lead}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-lg font-bold text-gray-900">{t.members}</div><div className="text-[10px] text-gray-400 uppercase font-bold">Members</div></div>
                <div><div className="text-lg font-bold text-blue-600">{t.proposals}</div><div className="text-[10px] text-gray-400 uppercase font-bold">Pipeline</div></div>
                <div><div className="text-lg font-bold text-green-600">{t.won}</div><div className="text-[10px] text-gray-400 uppercase font-bold">Won</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
