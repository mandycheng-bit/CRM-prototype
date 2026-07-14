import Sidebar from './components/Sidebar';
import type { ModuleId } from './components/Sidebar';
import ProposalPipeline from './components/crm/ProposalPipeline';
import ProposalDetail from './components/crm/ProposalDetail';
import ProductsConfiguration from './components/crm/ProductsConfiguration';
import { MOCK_PROPOSALS } from './constants';
import type { Proposal } from './types';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('perspective-pipeline');
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const renderModule = () => {
    if (activeModule === 'perspective-pipeline' && selectedProposal) {
      return (
        <ProposalDetail
          proposal={selectedProposal}
          onBack={() => setSelectedProposal(null)}
          onSave={(p) => {
            setProposals(prev => prev.map(x => x.id === p.id ? p : x));
            setSelectedProposal(p);
          }}
        />
      );
    }
    if (activeModule === 'perspective-pipeline') {
      return <ProposalPipeline proposals={proposals} onProposalClick={setSelectedProposal} />;
    }
    return <ProductsConfiguration />;
  };

  const handleModuleChange = (id: ModuleId) => {
    setActiveModule(id);
    setSelectedProposal(null);
  };

  const MODULE_LABEL: Record<ModuleId, string> = {
    'perspective-pipeline': 'Prospect Pipeline',
    'products': 'Product Configuration',
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Workspace</div>
            <ChevronRight size={14} className="text-gray-300" />
            <div className="text-sm font-bold text-gray-900">{MODULE_LABEL[activeModule]}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">MC</div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-900">Demo User</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Demo Company</div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {renderModule()}
        </div>
      </main>
    </div>
  );
}
