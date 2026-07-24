import React, { useState } from 'react';
import type { Proposal, ProposalStage } from '../../types';
import { MOCK_PROPOSALS } from '../../constants';
import { MoreHorizontal, Plus, Filter, Search, LayoutGrid, List as ListIcon, ChevronRight } from 'lucide-react';

interface ProposalPipelineProps {
  onProposalClick: (proposal: Proposal) => void;
  proposals: Proposal[];
  initialBusinessType?: 'NB' | 'Renewal';
}

const STAGES: ProposalStage[] = ['Draft', 'SOB', 'Finalize', 'Policy'];

const ProposalPipeline: React.FC<ProposalPipelineProps> = ({ onProposalClick, proposals, initialBusinessType = 'NB' }) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showLost, setShowLost] = useState(false);
  const [businessTypeFilter, setBusinessTypeFilter] = useState<'NB' | 'Renewal'>(initialBusinessType);

  // Unshadowed reference to the full, unfiltered list — a linked previous Prospect
  // may sit in a different stage/business-type bucket than the current filters show.
  const allProposals = proposals;

  const filteredProposals = proposals.filter(p =>
    (showLost ? p.stage === 'Lost' : p.stage !== 'Lost') && p.businessType === businessTypeFilter
  );

  const getProposalsByStage = (stage: ProposalStage) => {
    return filteredProposals.filter(p => p.stage === stage);
  };

  const displayStages = showLost ? ['Lost'] as ProposalStage[] : STAGES;

  const renderBoardView = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
      {displayStages.map(stage => {
        const proposals = getProposalsByStage(stage);
        const totalValue = proposals.reduce((sum, p) => sum + p.expectedRevenueGross, 0);

        return (
          <div key={stage} className="flex-1 min-w-[260px] flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${stage === 'Lost' ? 'text-red-500' : 'text-gray-500'}`}>{stage}</span>
                <span className={`${stage === 'Lost' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'} text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>
                  {proposals.length}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={14} />
              </button>
            </div>
            
            <div className="mb-3 px-1">
              <div className="text-xs font-medium text-gray-400">Total: ${totalValue.toLocaleString()}</div>
            </div>

            <div className={`flex flex-col gap-3 flex-1 min-h-[550px] ${stage === 'Lost' ? 'bg-red-50/30' : 'bg-gray-50/50'} p-3 rounded-xl border border-gray-200 shadow-inner`}>
              <div className="flex-1 flex flex-col gap-3">
                {proposals.map(proposal => (
                  <div 
                    key={proposal.id}
                    onClick={() => onProposalClick(proposal)}
                    className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-orange-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[190px] ${proposal.stage === 'Lost' ? 'border-l-4 border-l-red-500' : 'border-t border-t-gray-100 hover:translate-y-[-2px]'}`}
                  >
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tight bg-orange-50 px-1.5 py-0.5 rounded">
                            {proposal.productCategory}
                          </span>
                          {proposal.businessType === 'Renewal' && (
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight bg-blue-50 px-1.5 py-0.5 rounded">
                              Renewal
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{proposal.id}</span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors truncate" title={proposal.name}>
                        {proposal.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate" title={proposal.client}>{proposal.client}</p>
                      {proposal.linkedPreviousProspectId && (() => {
                        const prevProspect = allProposals.find(p => p.id === proposal.linkedPreviousProspectId);
                        return prevProspect ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onProposalClick(prevProspect); }}
                            className="text-[9px] text-blue-500 hover:text-blue-700 hover:underline font-semibold truncate text-left mt-0.5"
                            title={`Linked Prospect: ${prevProspect.name}`}
                          >
                            ↳ Linked Prospect: {prevProspect.name}
                          </button>
                        ) : null;
                      })()}
                      {proposal.linkedNextProspectId && (() => {
                        const nextProspect = allProposals.find(p => p.id === proposal.linkedNextProspectId);
                        return nextProspect ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onProposalClick(nextProspect); }}
                            className="text-[9px] text-emerald-600 hover:text-emerald-800 hover:underline font-semibold truncate text-left mt-0.5"
                            title={`Linked Prospect: ${nextProspect.name}`}
                          >
                            ↳ Linked Prospect: {nextProspect.name}
                          </button>
                        ) : null;
                      })()}
                    </div>
                    
                    <div className="flex-shrink-0 mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">Revenue</span>
                          <span className="text-xs font-bold text-gray-900">${proposal.expectedRevenueGross.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">Prob.</span>
                          <span className="text-xs font-bold text-gray-900">{proposal.probability}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600 border border-white flex-shrink-0">
                          {proposal.salesRep.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium truncate">{proposal.salesRep}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {!showLost && (
                <button className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/20 transition-all flex items-center justify-center gap-2 text-xs font-medium mt-auto">
                  <Plus size={14} />
                  <span>Add Card</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left">Prospect ID</th>
              <th className="px-6 py-4 text-left">Prospect Name</th>
              <th className="px-6 py-4 text-left">Company</th>
              <th className="px-6 py-4 text-left">Stage</th>
              <th className="px-6 py-4 text-right">Gross Revenue</th>
              <th className="px-6 py-4 text-right">Net Revenue</th>
              <th className="px-6 py-4 text-left">Sales Owner</th>
              <th className="px-6 py-4 text-left">Last Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProposals.map(proposal => (
              <tr 
                key={proposal.id} 
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => onProposalClick(proposal)}
              >
                <td className="px-6 py-4 font-mono text-xs text-blue-600 font-medium">{proposal.id}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{proposal.name}</span>
                    {proposal.businessType === 'Renewal' && (
                      <span className="text-[9px] font-bold text-blue-600 uppercase">Renewal</span>
                    )}
                    {proposal.linkedPreviousProspectId && (() => {
                      const prevProspect = allProposals.find(p => p.id === proposal.linkedPreviousProspectId);
                      return prevProspect ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onProposalClick(prevProspect); }}
                          className="text-[9px] text-blue-500 hover:text-blue-700 hover:underline font-semibold text-left mt-0.5"
                          title={`Linked Prospect: ${prevProspect.name}`}
                        >
                          ↳ Linked Prospect: {prevProspect.name}
                        </button>
                      ) : null;
                    })()}
                    {proposal.linkedNextProspectId && (() => {
                      const nextProspect = allProposals.find(p => p.id === proposal.linkedNextProspectId);
                      return nextProspect ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onProposalClick(nextProspect); }}
                          className="text-[9px] text-emerald-600 hover:text-emerald-800 hover:underline font-semibold text-left mt-0.5"
                          title={`Linked Prospect: ${nextProspect.name}`}
                        >
                          ↳ Linked Prospect: {nextProspect.name}
                        </button>
                      ) : null;
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{proposal.client}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    proposal.stage === 'Policy' ? 'bg-green-100 text-green-700' :
                    proposal.stage === 'Finalize' ? 'bg-purple-100 text-purple-700' :
                    proposal.stage === 'Lost' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {proposal.stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">${proposal.expectedRevenueGross.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-600">${proposal.expectedRevenueNet.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">
                      {proposal.salesRep.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs text-gray-600">{proposal.salesRep}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">{proposal.lastUpdated}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 text-gray-400 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-orange-50 border border-orange-200 rounded-lg p-1">
            <button
              onClick={() => setBusinessTypeFilter('NB')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                businessTypeFilter === 'NB' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-600 hover:bg-orange-100'
              }`}
            >
              New Business
            </button>
            <button
              onClick={() => setBusinessTypeFilter('Renewal')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                businessTypeFilter === 'Renewal' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-600 hover:bg-orange-100'
              }`}
            >
              Renewal Business
            </button>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={12} />
              <span>Board</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ListIcon size={12} />
              <span>List</span>
            </button>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1 ml-2">
            <button
              onClick={() => setShowLost(false)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                !showLost ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Active Deals</span>
            </button>
            <button
              onClick={() => setShowLost(true)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                showLost ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Lost Deals</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search prospects..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Filter size={14} />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20">
            <Plus size={16} />
            <span>New Prospect</span>
          </button>
        </div>
      </div>

      {viewMode === 'board' ? renderBoardView() : renderListView()}
    </div>
  );
};

export default ProposalPipeline;
