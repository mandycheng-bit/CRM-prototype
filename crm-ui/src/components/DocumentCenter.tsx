import { FileText, Download } from 'lucide-react';

const DOCS = [
  { name: 'sample_market_report.pdf', type: 'Report', date: '2024-03-31', size: '2.4 MB' },
  { name: 'demo_product_brochure.pdf', type: 'Brochure', date: '2024-02-15', size: '1.8 MB' },
  { name: 'test_mpf_summary.xlsx', type: 'Data', date: '2024-03-01', size: '450 KB' },
  { name: 'sample_compliance_checklist.docx', type: 'Compliance', date: '2024-01-10', size: '120 KB' },
];

export default function DocumentCenter() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Document Center</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DOCS.map(d => (
                <tr key={d.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 flex items-center gap-2"><FileText size={14} className="text-gray-400" />{d.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{d.type}</span></td>
                  <td className="px-6 py-4 text-gray-500">{d.date}</td>
                  <td className="px-6 py-4 text-gray-500">{d.size}</td>
                  <td className="px-6 py-4 text-right"><button className="p-1.5 text-gray-400 hover:text-blue-600"><Download size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
