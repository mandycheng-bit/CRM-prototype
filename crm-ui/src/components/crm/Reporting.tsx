
const METRICS = [
  { label: 'Total Pipeline Value', value: 'HKD 4.2M', change: '+12%' },
  { label: 'Won This Quarter', value: 'HKD 1.8M', change: '+8%' },
  { label: 'Avg. Deal Cycle', value: '47 days', change: '-3 days' },
  { label: 'Conversion Rate', value: '34%', change: '+2%' },
];

export default function Reporting() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Reporting</h1>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {METRICS.map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">{m.label}</div>
              <div className="text-2xl font-bold text-gray-900">{m.value}</div>
              <div className="text-xs text-green-600 font-semibold mt-1">{m.change} vs last quarter</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Pipeline by Stage</h3>
          <div className="space-y-3">
            {[['Qualification', 40], ['Proposal', 25], ['Negotiation', 20], ['Won', 15]].map(([stage, pct]) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-600">{stage}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs font-semibold text-gray-700 w-8">{pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
