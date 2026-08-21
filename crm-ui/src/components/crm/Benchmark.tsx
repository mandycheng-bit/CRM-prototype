import { useState } from 'react';
import { Plus, Trash2, BarChart2 } from 'lucide-react';

// Market Comparison Benchmark — promoted from a per-proposal workspace tab to a
// top-level CRM module. It is cross-proposal analyst research (GUM Analyst
// Engine), not owned by any single Opportunity, so it lives on the left sidebar.
export default function Benchmark() {
  interface BenchmarkRow {
    id: string;
    category: string;
    item: string;
    current: string;
    propA: string;
    propB: string;
    market: string;
    industry: string;
    rating: 'Better' | 'Same' | 'Lower';
    remarks: string;
  }
  const [benchmarkRows, setBenchmarkRows] = useState<BenchmarkRow[]>([
    {
      id: 'b1',
      category: 'Hospitalization',
      item: 'Room & Board Bedding',
      current: 'Ward level cover',
      propA: 'Semi-Private Room',
      propB: 'Ward Room',
      market: 'Ward Room / Semi-Private',
      industry: 'Ward Room',
      rating: 'Better',
      remarks: 'AIA option upgrades staff to semi-private room, boosting talent retention.'
    },
    {
      id: 'b2',
      category: 'Surgical',
      item: 'Surgeon Fee Cap',
      current: 'HK$40,000',
      propA: 'HK$120,000',
      propB: 'HK$60,000',
      market: 'HK$80,000',
      industry: 'HK$75,000',
      rating: 'Better',
      remarks: 'Proposed surgeon limits significantly surpass industry and market standards.'
    },
    {
      id: 'b3',
      category: 'Outpatient',
      item: 'GP Network Co-pay',
      current: 'HK$80 co-pay',
      propA: 'Free (Network)',
      propB: 'HK$50 co-pay',
      market: 'HK$50 co-pay',
      industry: 'HK$50 co-pay',
      rating: 'Better',
      remarks: 'Co-pay eliminated under Proposal A, highly attractive for staff.'
    },
    {
      id: 'b4',
      category: 'Dental',
      item: 'Dental Scaling',
      current: 'Not Covered',
      propA: 'Full Cover (2 visits)',
      propB: '80% up to HK$1,000',
      market: '50% up to HK$1,200',
      industry: 'Not Covered',
      rating: 'Better',
      remarks: 'Addresses the client objective of introducing preventative dental benefits.'
    }
  ]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
          <BarChart2 size={18} className="text-blue-700" />
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Market Comparison Benchmark</h1>
          <p className="text-xs text-gray-500 font-medium">Cross-proposal competitive analysis — GUM Analyst Engine</p>
        </div>
      </div>
                <div className="space-y-4">
                  {/* Premium Ratios & Competitive Scoring Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Premium Index competitiveness</span>
                        <h4 className="text-base font-black text-emerald-900 mt-1 flex items-center gap-1.5">
                          <span>Excellent rate index</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded-full uppercase tracking-widest">-6.2% below market</span>
                        </h4>
                      </div>
                      <p className="text-emerald-700 mt-1 text-[11px]">Proposed group premium compares exceptionally well against general peer sets in Entertainment and Media.</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">Actuarial Loss Ratio Margin</span>
                        <h4 className="text-base font-black text-blue-900 mt-1">68.0% Base Ratio</h4>
                      </div>
                      <p className="text-blue-700 mt-1 text-[11px]">Quoted levels sit accurately under the insurer minimum commission limits, allowing lower renewal volatility.</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex flex-col justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Benefit design index score</span>
                        <h4 className="text-base font-black text-amber-900 mt-1">A- Tier Coverage</h4>
                      </div>
                      <p className="text-amber-700 mt-1 text-[11px]">Preventative dental and specialist cover elements score high in GUM regional competitive analytics surveys.</p>
                    </div>
                  </div>

                  {/* Benchmark Excel comparison grid */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Excel Side-by-Side Benchmark</h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[9px] font-mono border border-blue-200 rounded font-bold uppercase tracking-wider">GUM Analyst Engine</span>
                      </div>
                      <button 
                        onClick={() => setBenchmarkRows([
                          ...benchmarkRows, 
                          { 
                            id: `bench_row_${Date.now()}`, 
                            category: 'Clinical', 
                            item: 'New Comparison Metric', 
                            current: 'No Limit', 
                            propA: 'HK$20,000 Cap', 
                            propB: 'HK$15,000 Cap', 
                            market: 'HK$18,000 Avg', 
                            industry: 'HK$15,000', 
                            rating: 'Better', 
                            remarks: 'Custom compiled metrics.' 
                          }
                        ])} 
                        className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                      >
                        <Plus size={11} />
                        <span>Insert Row</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse font-mono">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-150 font-sans">
                          <tr>
                            <th className="px-3 py-2 border-r border-gray-150 w-32">Metric Group</th>
                            <th className="px-3 py-2 border-r border-gray-150 w-44">Benefit Elements</th>
                            <th className="px-3 py-2 border-r border-gray-150 text-gray-600 bg-gray-50/50 min-w-[100px] text-center">Current AIA Ward</th>
                            <th className="px-3 py-2 border-r border-gray-150 text-blue-700 font-extrabold min-w-[120px] bg-blue-50/20 text-center">Proposal Option A (AIA)</th>
                            <th className="px-3 py-2 border-r border-gray-150 text-purple-700 font-bold min-w-[120px] bg-purple-50/20 text-center">Proposal Option B (Bupa)</th>
                            <th className="px-3 py-2 border-r border-gray-150 text-gray-600 bg-gray-50/50 min-w-[100px] text-center">GUM Benchmark Avg</th>
                            <th className="px-3 py-2 border-r border-gray-150 w-24 text-center font-sans">Compare Rating</th>
                            <th className="px-3 py-2 w-56 font-sans">Analyst Notes</th>
                            <th className="px-3 py-2 text-right w-10 font-sans">Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {benchmarkRows.map(row => (
                            <tr key={row.id} className="border-b border-gray-150 hover:bg-gray-50/40 transition-all">
                              <td className="p-1 border-r border-gray-150 font-sans font-bold text-gray-600">
                                <select 
                                  value={row.category} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, category: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-[10px] font-bold text-gray-500"
                                >
                                  <option value="Hospitalization">Hospitalization</option>
                                  <option value="Surgical">Surgical</option>
                                  <option value="Outpatient">Outpatient</option>
                                  <option value="Dental">Dental</option>
                                  <option value="Riders">Riders</option>
                                </select>
                              </td>
                              <td className="p-1 border-r border-gray-150 font-sans font-medium text-gray-800">
                                <input 
                                  type="text" 
                                  value={row.item} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, item: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs font-semibold" 
                                />
                              </td>
                              <td className="p-1 border-r border-gray-150 text-center text-gray-600 bg-gray-50/20">
                                <input 
                                  type="text" 
                                  value={row.current} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, current: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-center text-gray-600" 
                                />
                              </td>
                              <td className="p-1 border-r border-gray-150 text-center bg-blue-50/10">
                                <input 
                                  type="text" 
                                  value={row.propA} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, propA: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-center font-bold text-blue-900" 
                                />
                              </td>
                              <td className="p-1 border-r border-gray-150 text-center bg-purple-50/10">
                                <input 
                                  type="text" 
                                  value={row.propB} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, propB: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-center font-semibold text-purple-900" 
                                />
                              </td>
                              <td className="p-1 border-r border-gray-150 text-center text-gray-600 bg-gray-50/20">
                                <input 
                                  type="text" 
                                  value={row.market} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, market: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-center text-gray-500" 
                                />
                              </td>
                              <td className="p-1 border-r border-gray-150 text-center font-sans">
                                <select 
                                  value={row.rating} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, rating: e.target.value as any} : r))} 
                                  className={`p-1 border border-transparent bg-transparent hover:border-gray-200 rounded text-[10px] font-bold outline-none text-center ${
                                    row.rating === 'Better' ? 'text-emerald-600 bg-emerald-50' : row.rating === 'Same' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'
                                  }`}
                                >
                                  <option value="Better">▲ Better</option>
                                  <option value="Same">■ Same</option>
                                  <option value="Lower">▼ Lower</option>
                                </select>
                              </td>
                              <td className="p-1 border-r border-gray-150 font-sans">
                                <input 
                                  type="text" 
                                  value={row.remarks} 
                                  onChange={e => setBenchmarkRows(benchmarkRows.map(r => r.id === row.id ? {...r, remarks: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-gray-600 font-medium" 
                                />
                              </td>
                              <td className="p-1 text-center">
                                <button 
                                  onClick={() => setBenchmarkRows(benchmarkRows.filter(r => r.id !== row.id))} 
                                  className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
    </div>
  );
}
