import { Upload } from 'lucide-react';

export function MonthlyRatioReport() {
  const data = [
    { month: 'Jan', mcr: 68, lr: 62 }, { month: 'Feb', mcr: 71, lr: 65 },
    { month: 'Mar', mcr: 74, lr: 70 }, { month: 'Apr', mcr: 69, lr: 64 },
    { month: 'May', mcr: 73, lr: 68 }, { month: 'Jun', mcr: 76, lr: 72 },
  ];
  return (
    <div className="m-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4">Monthly Ratio Report</h2>
      <div className="flex items-end gap-4 h-32">
        {data.map(d => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end h-24">
              <div className="flex-1 bg-blue-200 rounded-t" style={{ height: `${d.mcr}%` }} title={`MCR: ${d.mcr}%`} />
              <div className="flex-1 bg-orange-200 rounded-t" style={{ height: `${d.lr}%` }} title={`LR: ${d.lr}%`} />
            </div>
            <div className="text-[10px] text-gray-500">{d.month}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded inline-block" /> MCR</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-200 rounded inline-block" /> Loss Ratio</span>
      </div>
    </div>
  );
}

export function MCRUpload() {
  return (
    <div className="mx-6 mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4">MCR Data Upload</h2>
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-orange-300 transition-colors cursor-pointer">
        <Upload size={28} className="text-gray-300" />
        <div className="text-sm">Drop MCR Excel file here or click to browse</div>
      </div>
    </div>
  );
}
