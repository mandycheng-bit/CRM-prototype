import Sidebar from './components/Sidebar';
import type { ModuleId } from './components/Sidebar';
import ProposalPipeline from './components/crm/ProposalPipeline';
import ProposalDetail from './components/crm/ProposalDetail';
import ProposalPipelineGmi from './components/crm/ProposalPipelineGmi';
import ProposalDetailGmi from './components/crm/ProposalDetailGmi';
import ProductsConfiguration from './components/crm/ProductsConfiguration';
import OpportunityConfiguration from './components/crm/OpportunityConfiguration';
import { CustomerCreationSim } from './components/crm/CustomerCreationSim';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toast, useToast } from './components/Toast';
import { MOCK_PROPOSALS } from './constants';
import type { Proposal } from './types';
import { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

// Blank starting point for "+ New Prospect" — every field ProposalDetail's Save
// Payload Completeness check reads from `...proposal` must already be present,
// same as buildInitialOpportunity's defaults for a NB/Renewal record.
const buildBlankProposal = (businessType: 'NB' | 'Renewal'): Proposal => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `P-${Date.now().toString().slice(-8)}`,
    name: '',
    stage: businessType === 'NB' ? 'Draft' : 'SOB',
    probability: businessType === 'NB' ? 10 : 75,
    expectedRevenueGross: 0,
    expectedRevenueNet: 0,
    salesRep: '',
    splitRatio: '100%',
    campaign: '',
    source: 'Manual',
    businessType,
    productCategory: '',
    productItem: '',
    effectiveDate: '',
    remarks: '',
    mcr: 0,
    lossRatio: 0,
    conversionRate: 0,
    estimatedContribution: 0,
    estimatedCommission: 0,
    estimatedRevenue: 0,
    aum: 0,
    createdDate: today,
    lastUpdated: today,
    stageLastUpdated: today,
    owner: '',
    sourceSystem: 'CRM',
  };
};

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('perspective-pipeline');
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isNewProspect, setIsNewProspect] = useState(false);
  const [pipelineBusinessType, setPipelineBusinessType] = useState<'NB' | 'Renewal'>('NB');
  // Set when a Prospect(2026) Opportunity's "Convert to Customer" button is
  // clicked (after the unsaved-changes guard) — swaps the page for the
  // simulated Customer Creation page, prefilled from this Proposal.
  const [convertingProposal, setConvertingProposal] = useState<Proposal | null>(null);
  const { toast, showToast } = useToast();
  // Demo-only role switcher — this prototype has no real auth/permission system;
  // this lets a PM demo the "only Admin can delete a 100% Opportunity" rule.
  const [currentRole, setCurrentRole] = useState<'Sales Rep' | 'Admin'>('Sales Rep');
  // Set by ProposalDetail whenever its Opportunity draft has unsaved edits — a
  // ref (not state) since it only needs to be read at click-time, not re-render the app.
  const hasUnsavedOpportunityChangesRef = useRef(false);

  const renderModule = () => {
    if (activeModule === 'perspective-pipeline' && convertingProposal) {
      return (
        <ErrorBoundary moduleLabel="Create Customer" onReset={() => setConvertingProposal(null)}>
          <CustomerCreationSim
            proposal={convertingProposal}
            onBack={() => setConvertingProposal(null)}
            onConfirm={(updated) => {
              setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
              setSelectedProposal(updated);
              setConvertingProposal(null);
              showToast(`"${updated.client}" created as a Customer.`);
            }}
          />
        </ErrorBoundary>
      );
    }
    if (activeModule === 'perspective-pipeline' && selectedProposal) {
      return (
        <ErrorBoundary moduleLabel="Opportunity Detail" onReset={() => setSelectedProposal(null)} key={selectedProposal.id}>
          <ProposalDetail
            key={selectedProposal.id}
            proposal={selectedProposal}
            allProposals={proposals}
            isNew={isNewProspect}
            onBack={() => {
              setPipelineBusinessType(selectedProposal.businessType === 'Renewal' ? 'Renewal' : 'NB');
              setSelectedProposal(null);
              setIsNewProspect(false);
            }}
            onSave={(p) => {
              setProposals(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
              setSelectedProposal(p);
              setIsNewProspect(false);
            }}
            onNavigateToProspect={(p) => setSelectedProposal(p)}
            onDelete={(id) => setProposals(prev => prev.filter(p => p.id !== id))}
            currentRole={currentRole}
            onDirtyStateChange={(dirty) => { hasUnsavedOpportunityChangesRef.current = dirty; }}
            onTagRenamed={(oldName, newName) => setProposals(prev => prev.map(p => ({
              ...p,
              tags: (p.tags || []).map(t => t === oldName ? newName : t),
            })))}
            onTagDeleted={(name) => setProposals(prev => prev.map(p => ({
              ...p,
              tags: (p.tags || []).filter(t => t !== name),
            })))}
            onConvertToCustomer={(p) => setConvertingProposal(p)}
          />
        </ErrorBoundary>
      );
    }
    if (activeModule === 'perspective-pipeline') {
      return (
        <ErrorBoundary moduleLabel="Prospect Pipeline">
          <ProposalPipeline
            proposals={proposals}
            onProposalClick={setSelectedProposal}
            initialBusinessType={pipelineBusinessType}
            onImportProposals={(newOnes) => setProposals(prev => [...prev, ...newOnes])}
            onUpdateProposal={(p) => setProposals(prev => prev.map(x => x.id === p.id ? p : x))}
            onDeleteProposal={(id) => setProposals(prev => prev.filter(p => p.id !== id))}
            onCreateProspect={(businessType) => {
              setIsNewProspect(true);
              setSelectedProposal(buildBlankProposal(businessType));
            }}
          />
        </ErrorBoundary>
      );
    }
    if (activeModule === 'prospect-2027' && selectedProposal) {
      return (
        <ErrorBoundary moduleLabel="Opportunity Detail" onReset={() => setSelectedProposal(null)} key={selectedProposal.id}>
          <ProposalDetailGmi
            key={selectedProposal.id}
            proposal={selectedProposal}
            allProposals={proposals}
            onBack={() => {
              setPipelineBusinessType(selectedProposal.businessType === 'Renewal' ? 'Renewal' : 'NB');
              setSelectedProposal(null);
            }}
            onSave={(p) => {
              setProposals(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
              setSelectedProposal(p);
            }}
            onCreateRenewal={(renewalProspect) => {
              setProposals(prev => [...prev, renewalProspect]);
            }}
            onNavigateToProspect={(p) => setSelectedProposal(p)}
            onDelete={(id) => setProposals(prev => prev.filter(p => p.id !== id))}
            currentRole={currentRole}
            onDirtyStateChange={(dirty) => { hasUnsavedOpportunityChangesRef.current = dirty; }}
          />
        </ErrorBoundary>
      );
    }
    if (activeModule === 'prospect-2027') {
      return (
        <ErrorBoundary moduleLabel="Prospect Pipeline">
          <ProposalPipelineGmi
            proposals={proposals}
            onProposalClick={setSelectedProposal}
            initialBusinessType={pipelineBusinessType}
            onImportProposals={(newOnes) => setProposals(prev => [...prev, ...newOnes])}
            onUpdateProposal={(p) => setProposals(prev => prev.map(x => x.id === p.id ? p : x))}
            onDeleteProposal={(id) => setProposals(prev => prev.filter(p => p.id !== id))}
            onCreateProspect={(businessType) => {
              setSelectedProposal(buildBlankProposal(businessType));
            }}
          />
        </ErrorBoundary>
      );
    }
    if (activeModule === 'opportunity-config') {
      return <OpportunityConfiguration proposals={proposals} />;
    }
    return <ProductsConfiguration proposals={proposals} />;
  };

  // Mirrors the in-page discard guard inside ProposalDetail — this one covers
  // leaving via the Sidebar instead of a click inside the Opportunity page.
  const [pendingModuleChange, setPendingModuleChange] = useState<ModuleId | null>(null);

  const handleModuleChange = (id: ModuleId) => {
    if (hasUnsavedOpportunityChangesRef.current) {
      setPendingModuleChange(id);
      return;
    }
    setActiveModule(id);
    setSelectedProposal(null);
    setIsNewProspect(false);
  };

  const confirmModuleChange = () => {
    if (pendingModuleChange) {
      setActiveModule(pendingModuleChange);
      setSelectedProposal(null);
      setIsNewProspect(false);
    }
    setPendingModuleChange(null);
  };

  const MODULE_LABEL: Record<ModuleId, string> = {
    'perspective-pipeline': 'Prospect Pipeline (2026)',
    'prospect-2027': 'Prospect Pipeline (2027)',
    'products': 'Product Configuration',
    'opportunity-config': 'Opportunity Configuration',
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
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1" title="Demo-only role switcher — controls whether Delete is allowed on a 100% Opportunity">
              {(['Sales Rep', 'Admin'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${currentRole === role ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {role}
                </button>
              ))}
            </div>
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
      <ConfirmDialog
        open={pendingModuleChange != null}
        title="Leave without saving?"
        message="This Opportunity has unsaved changes. Leaving this page will discard them."
        confirmLabel="Discard Changes"
        confirmVariant="danger"
        onConfirm={confirmModuleChange}
        onClose={() => setPendingModuleChange(null)}
      />
      <Toast message={toast} />
    </div>
  );
}
