import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Proposal, ProposalStage } from '../../types';
import { MOCK_PROPOSALS, MOCK_COMPANIES, MOCK_INDIVIDUALS } from '../../constants';
import { getConfiguredProducts } from './ProductsConfiguration';
import { SALES_REP_TEAM_MAP } from './ProposalDetailGmi';
import { MoreHorizontal, MoreVertical, Plus, Filter, Search, LayoutGrid, List as ListIcon, History, Download, Upload, FileDown, Archive, Trash2 } from 'lucide-react';

interface ProposalPipelineProps {
  onProposalClick: (proposal: Proposal) => void;
  proposals: Proposal[];
  initialBusinessType?: 'NB' | 'Renewal';
  onImportProposals?: (newProposals: Proposal[]) => void;
  onUpdateProposal?: (proposal: Proposal) => void;
  onDeleteProposal?: (id: string) => void;
}

type DealsView = 'active' | 'lost' | 'archived';

const STAGES: ProposalStage[] = ['Draft', 'SOB', 'Finalize', 'Policy'];

const FILTER_FIELDS: { key: FilterKey; label: string }[] = [
  { key: 'salesRep', label: 'Sales Rep 1' },
  { key: 'salesTeam', label: 'Sales Team' },
  { key: 'productItem', label: 'Product Item' },
  { key: 'productTeam', label: 'Product Team' },
  { key: 'productCategory', label: 'Product Category' },
  { key: 'gmiProductGroup', label: 'GMI Product Group' },
];

type FilterKey = 'salesRep' | 'salesTeam' | 'productItem' | 'productTeam' | 'productCategory' | 'gmiProductGroup';

// Export column catalog — user can freely check/uncheck any subset, or select all.
const EXPORT_FIELD_DEFS: { key: string; label: string }[] = [
  { key: 'id', label: 'Oppty ID' },
  { key: 'name', label: 'Oppty Name' },
  { key: 'opptyOdooId', label: 'Oppty Odoo ID' },
  { key: 'businessType', label: 'Oppty Business' },
  { key: 'stage', label: 'Stage' },
  { key: 'probability', label: 'Probability' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'companyId', label: 'Company ID' },
  { key: 'masterType', label: 'Master Type' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'source', label: 'Source' },
  { key: 'salesRep1', label: 'Sales Rep 1' },
  { key: 'salesTeam', label: 'Sales Team' },
  { key: 'productItem', label: 'Product Item' },
  { key: 'productTeam', label: 'Product Team' },
  { key: 'productCategory', label: 'Product Category' },
  { key: 'gmiProductGroup', label: 'GMI Product Group' },
  { key: 'expectedRevenueGross', label: 'Expected Revenue (Gross)' },
  { key: 'expectedRevenueNet', label: 'Expected Revenue (Net)' },
  { key: 'effectiveDate', label: 'Effective Date' },
  { key: 'createdDate', label: 'Created Date' },
  { key: 'lastUpdated', label: 'Last Updated' },
  { key: 'owner', label: 'Owner' },
  { key: 'lostReason', label: 'Lost Reason' },
  { key: 'lostDate', label: 'Lost Date' },
  { key: 'wonDate', label: 'Won Date' },
];

// Columns every import row must have a non-blank value for. Probability is not
// collected — imported Opportunities always start at the business type's
// entry-level probability (see handleImportFile).
const REQUIRED_IMPORT_COLUMNS = ['Oppty ID', 'Oppty Name', 'Company Name', 'Company ID', 'Campaign', 'Sales Rep 1', 'Product Item', 'Oppty Business'];
// Not required — Oppty Odoo ID auto-derives from Oppty ID when left blank
// (see handleImportFile), but a real legacy Odoo ID can be supplied here instead.
const OPTIONAL_IMPORT_COLUMNS = ['Oppty Odoo ID'];
const IMPORT_TEMPLATE_COLUMNS = [...REQUIRED_IMPORT_COLUMNS, ...OPTIONAL_IMPORT_COLUMNS];
const IMPORT_TEMPLATE_SAMPLE_ROW = ['OPP-1001', 'Sample Opportunity', 'Sample Company Co. Ltd.', 'COMP-001', 'Website Lead Gen', 'Sales Rep A', 'Group Medical', 'New Business', ''];

// Import errors are layered — each level either stops everything or just skips
// the affected row, and the summary alert says which happened so a partial
// import is never mistaken for a total success or a total failure:
//   1. File-level  (can't read the file at all)     -> nothing imported
//   2. Structural  (a required column is missing)   -> nothing imported
//   3. Row-level   (one row has bad/missing data)    -> only that row skipped
//   4. Unexpected  (a bug slips past 1-3)            -> caught, nothing imported, reported instead of failing silently
const MAX_DISPLAYED_ROW_ERRORS = 15;

const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const toCsvCell = (val: string | number | undefined): string => {
  const str = String(val ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// Minimal RFC 4180-ish parser: handles quoted fields with embedded commas/newlines
// and doubled-quote escaping, which a naive split(',') would break on.
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += char;
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field); field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim() !== ''));
};

const ProposalPipeline: React.FC<ProposalPipelineProps> = ({ onProposalClick, proposals, initialBusinessType = 'NB', onImportProposals, onUpdateProposal, onDeleteProposal }) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [dealsView, setDealsView] = useState<DealsView>('active');
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const [businessTypeFilter, setBusinessTypeFilter] = useState<'NB' | 'Renewal'>(initialBusinessType);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, string>>({
    salesRep: '', salesTeam: '', productItem: '', productTeam: '', productCategory: '', gmiProductGroup: '',
  });
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<Set<string>>(() => new Set(EXPORT_FIELD_DEFS.map(f => f.key)));
  const exportPanelRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  // Which rows (List view) are checked for export — defaults to "everything
  // currently visible under the active filters" and re-syncs to that whenever
  // the filters change, but the user can still deselect individual rows.
  const [selectedProposalIds, setSelectedProposalIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false);
      }
      if (exportPanelRef.current && !exportPanelRef.current.contains(e.target as Node)) {
        setShowExportPanel(false);
      }
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
        setOpenRowMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unshadowed reference to the full, unfiltered list — a linked previous Prospect
  // may sit in a different stage/business-type bucket than the current filters show.
  const allProposals = proposals;

  const configuredProducts = useMemo(() => getConfiguredProducts(), []);
  const getProductMeta = (productItemName: string) => configuredProducts.find(p => p.name === productItemName);

  // Derives each Proposal's Sales Team / Product Team / GMI Product Group from the
  // shared lookup tables (Sales Rep → Team map, Product Configuration module) rather
  // than storing them redundantly on the Proposal record.
  const getSalesTeam = (p: Proposal) => SALES_REP_TEAM_MAP[p.salesRep] || '';
  const getProductTeam = (p: Proposal) => getProductMeta(p.productItem)?.team || '';
  const getGmiProductGroup = (p: Proposal) => getProductMeta(p.productItem)?.gmiProductGroup || '';
  const getCompanyId = (p: Proposal) =>
    MOCK_COMPANIES.find(c => c.name === p.client)?.id || MOCK_INDIVIDUALS.find(i => i.fullName === p.client)?.id || '';

  const getExportValue = (p: Proposal, key: string): string | number => {
    switch (key) {
      case 'companyName': return p.client || '';
      case 'companyId': return getCompanyId(p);
      case 'opptyOdooId': return p.opptyOdooId || `ODOO-${p.id}`;
      case 'salesRep1': return p.salesRep;
      case 'salesTeam': return getSalesTeam(p);
      case 'productTeam': return getProductTeam(p);
      case 'gmiProductGroup': return getGmiProductGroup(p);
      default: return (p as unknown as Record<string, string | number | undefined>)[key] ?? '';
    }
  };

  const handleExportCsv = () => {
    const fields = EXPORT_FIELD_DEFS.filter(f => selectedExportFields.has(f.key));
    if (fields.length === 0) { alert('Select at least one column to export.'); return; }
    if (selectedProposals.length === 0) { alert('Select at least one row to export (see the checkboxes in List view).'); return; }
    const header = fields.map(f => toCsvCell(f.label)).join(',');
    const dataRows = selectedProposals.map(p => fields.map(f => toCsvCell(getExportValue(p, f.key))).join(','));
    downloadFile(`Prospect_Export_${selectedProposals.length}.csv`, [header, ...dataRows].join('\r\n'), 'text/csv;charset=utf-8;');
    setShowExportPanel(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => {
      alert(`Could not read "${file.name}". The file may be locked, corrupted, or removed — please try selecting it again.`);
    };
    reader.onload = () => {
      try {
        handleParsedImport(String(reader.result || ''));
      } catch (err) {
        console.error('Unexpected error while importing CSV:', err);
        alert(`Import failed unexpectedly and no rows were added. Please check the file and try again.\n\nDetails: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
  };

  const handleParsedImport = (fileText: string) => {
    const rows = parseCsv(fileText);
    if (rows.length < 2) { alert('The CSV file has no data rows to import.'); return; }

    const header = rows[0].map(h => h.trim());
    const colIndex = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const missingColumns = REQUIRED_IMPORT_COLUMNS.filter(c => colIndex(c) === -1);
    if (missingColumns.length > 0) {
      alert(`Import stopped — the CSV is missing required column(s):\n- ${missingColumns.join('\n- ')}\n\nNo rows were imported. Download the template for the exact column names.`);
      return;
    }

    const existingIds = new Set(allProposals.map(p => p.id));
    const newProposals: Proposal[] = [];
    const errors: string[] = [];

    rows.slice(1).forEach((cells, i) => {
      const rowNum = i + 2; // +1 for header row, +1 for 1-indexing
      const get = (name: string) => (cells[colIndex(name)] || '').trim();

      const rowMissing = REQUIRED_IMPORT_COLUMNS.filter(c => !get(c));
      if (rowMissing.length > 0) {
        errors.push(`Row ${rowNum}: missing ${rowMissing.join(', ')}`);
        return;
      }

      const opptyId = get('Oppty ID');
      if (existingIds.has(opptyId)) {
        errors.push(`Row ${rowNum}: Oppty ID "${opptyId}" already exists — skipped (import only adds new records)`);
        return;
      }

      const businessRaw = get('Oppty Business');
      const businessType: 'NB' | 'Renewal' | null =
        /^(nb|new business)$/i.test(businessRaw) ? 'NB' : /^(renewal|renewal business|rb)$/i.test(businessRaw) ? 'Renewal' : null;
      if (!businessType) {
        errors.push(`Row ${rowNum}: Oppty Business "${businessRaw}" must be NB/New Business or Renewal/Renewal Business/RB`);
        return;
      }

      existingIds.add(opptyId); // guard against duplicate IDs within the same file

      const companyName = get('Company Name');
      const companyId = get('Company ID');
      // Matches the codebase's existing resolveCompanyMeta convention: an
      // unmatched Company ID/Name defaults to Customer, not Lead.
      const companyStatus = MOCK_COMPANIES.find(c => c.id === companyId || c.name === companyName)?.status
        || MOCK_INDIVIDUALS.find(ind => ind.id === companyId || ind.fullName === companyName)?.status;
      const masterType: 'Lead' | 'Customer' | 'Lapsed Customer' = companyStatus === 'Lapsed' ? 'Lapsed Customer' : 'Customer';

      // Business rule: imported Opportunities skip Draft and start at the
      // business type's entry-level probability/stage — Probability is not a
      // CSV column at all, it's always derived from Oppty Business.
      const probability = businessType === 'NB' ? 10 : 75;
      const stage: ProposalStage = businessType === 'NB' ? 'Draft' : 'SOB';
      const today = new Date().toISOString().slice(0, 10);
      const productItem = get('Product Item');
      const productMeta = getProductMeta(productItem);
      // Optional — if left blank, ProposalDetail's buildInitialOpportunity falls
      // back to deriving `ODOO-${id}` on the fly.
      const opptyOdooId = get('Oppty Odoo ID') || undefined;

      newProposals.push({
        id: opptyId,
        name: get('Oppty Name'),
        opptyOdooId,
        stage,
        probability,
        expectedRevenueGross: 0,
        expectedRevenueNet: 0,
        salesRep: get('Sales Rep 1'),
        splitRatio: '100%',
        campaign: get('Campaign'),
        source: 'Import',
        businessType,
        productCategory: productMeta?.group || '',
        productItem,
        effectiveDate: '',
        remarks: '',
        client: companyName,
        masterType,
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
        owner: get('Sales Rep 1'),
        sourceSystem: 'CRM',
      });
    });

    if (newProposals.length > 0) onImportProposals?.(newProposals);

    const summary = [`${newProposals.length} Opportunity(s) imported successfully.`];
    if (errors.length > 0) {
      const shown = errors.slice(0, MAX_DISPLAYED_ROW_ERRORS);
      const remaining = errors.length - shown.length;
      summary.push(`${errors.length} row(s) skipped:\n- ${shown.join('\n- ')}${remaining > 0 ? `\n...and ${remaining} more` : ''}`);
    }
    alert(summary.join('\n\n'));
  };

  const handleDownloadImportTemplate = () => {
    const csv = [IMPORT_TEMPLATE_COLUMNS.map(toCsvCell).join(','), IMPORT_TEMPLATE_SAMPLE_ROW.map(toCsvCell).join(',')].join('\r\n');
    downloadFile('Prospect_Import_Template.csv', csv, 'text/csv;charset=utf-8;');
  };

  const fieldValueGetters: Record<FilterKey, (p: Proposal) => string> = {
    salesRep: p => p.salesRep,
    salesTeam: getSalesTeam,
    productItem: p => p.productItem,
    productTeam: getProductTeam,
    productCategory: p => p.productCategory,
    gmiProductGroup: getGmiProductGroup,
  };

  const filterOptions = useMemo(() => {
    const options: Record<FilterKey, string[]> = {
      salesRep: [], salesTeam: [], productItem: [], productTeam: [], productCategory: [], gmiProductGroup: [],
    };
    FILTER_FIELDS.forEach(({ key }) => {
      options[key] = Array.from(new Set(allProposals.map(fieldValueGetters[key]).filter(Boolean))).sort();
    });
    return options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProposals, configuredProducts]);

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProposals = proposals.filter(p => {
    const isArchived = p.status === 'Archived';
    if (dealsView === 'archived') {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false;
      if (dealsView === 'lost' ? p.stage !== 'Lost' : p.stage === 'Lost') return false;
    }
    if (p.businessType !== businessTypeFilter) return false;

    if (normalizedQuery) {
      const haystack = [p.id, p.name, getCompanyId(p), p.client || ''].join(' ').toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }

    for (const { key } of FILTER_FIELDS) {
      if (activeFilters[key] && fieldValueGetters[key](p) !== activeFilters[key]) return false;
    }

    return true;
  });

  // Re-select "everything currently filtered" whenever the filter criteria (or
  // the underlying data) change, so the export checklist always defaults to
  // matching the active filter without needing the user to re-check it.
  useEffect(() => {
    setSelectedProposalIds(new Set(filteredProposals.map(p => p.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposals, searchQuery, businessTypeFilter, dealsView, activeFilters]);

  const toggleProposalSelected = (id: string) => {
    setSelectedProposalIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredProposals.length > 0 && filteredProposals.every(p => selectedProposalIds.has(p.id));
  const toggleSelectAllFiltered = () => {
    setSelectedProposalIds(allFilteredSelected ? new Set() : new Set(filteredProposals.map(p => p.id)));
  };

  const selectedProposals = filteredProposals.filter(p => selectedProposalIds.has(p.id));

  const handleToggleArchiveProposal = (p: Proposal) => {
    const nextStatus: 'Active' | 'Archived' = p.status === 'Archived' ? 'Active' : 'Archived';
    onUpdateProposal?.({ ...p, status: nextStatus });
    setOpenRowMenuId(null);
  };

  const handleDeleteProposalRow = (p: Proposal) => {
    if (confirm(`Delete Opportunity "${p.name}" (${p.id})? This cannot be undone.`)) {
      onDeleteProposal?.(p.id);
    }
    setOpenRowMenuId(null);
  };

  const getProposalsByStage = (stage: ProposalStage) => {
    return filteredProposals.filter(p => p.stage === stage);
  };

  const displayStages = dealsView === 'lost' ? ['Lost'] as ProposalStage[] : STAGES;

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
                        {/* Linked Prospect indicators live in the header row (icon-only) so linked
                            cards stay the same height as every other card in the column. */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {proposal.linkedPreviousProspectId && (() => {
                            const prevProspect = allProposals.find(p => p.id === proposal.linkedPreviousProspectId);
                            return prevProspect ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); onProposalClick(prevProspect); }}
                                className="text-blue-500 hover:text-blue-700"
                                title={`Renewed from: ${prevProspect.name}`}
                              >
                                <History size={11} />
                              </button>
                            ) : null;
                          })()}
                          {proposal.linkedNextProspectId && (() => {
                            const nextProspect = allProposals.find(p => p.id === proposal.linkedNextProspectId);
                            return nextProspect ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); onProposalClick(nextProspect); }}
                                className="text-emerald-600 hover:text-emerald-800"
                                title={`Renewed into: ${nextProspect.name}`}
                              >
                                <History size={11} />
                              </button>
                            ) : null;
                          })()}
                          <span className="text-[10px] text-gray-400 font-mono">{proposal.id}</span>
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenRowMenuId(openRowMenuId === proposal.id ? null : proposal.id); }}
                              className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-gray-100"
                            >
                              <MoreVertical size={12} />
                            </button>
                            {openRowMenuId === proposal.id && (
                              <div
                                ref={rowMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-5 z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-[11px] text-gray-700 font-semibold text-left"
                              >
                                <button onClick={() => handleToggleArchiveProposal(proposal)} className="w-full px-3 py-1.5 hover:bg-gray-50 text-left flex items-center gap-2">
                                  <Archive size={11} className="text-gray-400" />
                                  {proposal.status === 'Archived' ? 'Activate' : 'Archive'}
                                </button>
                                <button onClick={() => handleDeleteProposalRow(proposal)} className="w-full px-3 py-1.5 hover:bg-red-50 text-red-600 text-left flex items-center gap-2">
                                  <Trash2 size={11} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="text-xs font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate" title={proposal.name}>
                          {proposal.name}
                        </h3>
                        {proposal.status === 'Archived' && (
                          <span className="text-[9px] font-bold uppercase tracking-tight bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">Archived</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate" title={proposal.client}>{proposal.client}</p>
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
              
              {dealsView === 'active' && (
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
              {showExportPanel && (
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    title="Select/deselect all filtered rows for export"
                  />
                </th>
              )}
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
                {showExportPanel && (
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedProposalIds.has(proposal.id)}
                      onChange={() => toggleProposalSelected(proposal.id)}
                    />
                  </td>
                )}
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
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      proposal.stage === 'Policy' ? 'bg-green-100 text-green-700' :
                      proposal.stage === 'Finalize' ? 'bg-purple-100 text-purple-700' :
                      proposal.stage === 'Lost' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {proposal.stage}
                    </span>
                    {proposal.status === 'Archived' && (
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-200 text-gray-600">Archived</span>
                    )}
                  </div>
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
                <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenRowMenuId(openRowMenuId === proposal.id ? null : proposal.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg inline-flex items-center"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openRowMenuId === proposal.id && (
                    <div ref={rowMenuRef} className="absolute right-6 top-10 z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-xs text-gray-700 font-semibold text-left">
                      <button
                        onClick={() => handleToggleArchiveProposal(proposal)}
                        className="w-full px-3 py-2 hover:bg-gray-50 text-left flex items-center gap-2"
                      >
                        <Archive size={12} className="text-gray-400" />
                        {proposal.status === 'Archived' ? 'Activate' : 'Archive'}
                      </button>
                      <button
                        onClick={() => handleDeleteProposalRow(proposal)}
                        className="w-full px-3 py-2 hover:bg-red-50 text-red-600 text-left flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
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
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-orange-50 border border-orange-200 rounded-lg p-1">
            <button
              onClick={() => setBusinessTypeFilter('NB')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all whitespace-nowrap ${
                businessTypeFilter === 'NB' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-600 hover:bg-orange-100'
              }`}
            >
              New Business
            </button>
            <button
              onClick={() => setBusinessTypeFilter('Renewal')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all whitespace-nowrap ${
                businessTypeFilter === 'Renewal' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-600 hover:bg-orange-100'
              }`}
            >
              Renewal Business
            </button>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={12} />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ListIcon size={12} />
              <span>List</span>
            </button>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1 ml-2">
            <button
              onClick={() => setDealsView('active')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                dealsView === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Active Deals</span>
            </button>
            <button
              onClick={() => setDealsView('lost')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                dealsView === 'lost' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Lost Deals</span>
            </button>
            <button
              onClick={() => setDealsView('archived')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                dealsView === 'archived' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Archived</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center bg-white border rounded-lg focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 ${
            activeFilterCount > 0 ? 'border-orange-300' : 'border-gray-200'
          }`}>
            <Search className="ml-3 text-gray-400 shrink-0" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Company ID/Name, Oppty ID/Name..."
              className="pl-2 pr-3 py-2 w-64 bg-transparent text-sm outline-none"
            />
            <div className="w-px self-stretch my-1.5 bg-gray-200" />
            <div className="relative" ref={filterPanelRef}>
              <button
                onClick={() => setShowFilterPanel(prev => !prev)}
                className={`flex items-center gap-1.5 pl-3 pr-3 py-2 text-sm font-medium hover:bg-gray-50 rounded-r-lg whitespace-nowrap ${
                  activeFilterCount > 0 ? 'text-orange-600' : 'text-gray-600'
                }`}
              >
                <Filter size={14} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {showFilterPanel && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => setActiveFilters({ salesRep: '', salesTeam: '', productItem: '', productTeam: '', productCategory: '', gmiProductGroup: '' })}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {FILTER_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{label}</label>
                      <select
                        value={activeFilters[key]}
                        onChange={(e) => setActiveFilters(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="">All</option>
                        {filterOptions[key].map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
          <div className="relative" ref={exportPanelRef}>
            <button
              onClick={() => { setViewMode('list'); setShowExportPanel(prev => !prev); }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            {showExportPanel && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
                <p className="text-[11px] text-gray-500 mb-2">
                  {selectedProposals.length} of {filteredProposals.length} filtered row(s) selected — check/uncheck rows in List view.
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">Export Columns</span>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedExportFields(new Set(EXPORT_FIELD_DEFS.map(f => f.key)))} className="text-[11px] text-orange-600 hover:text-orange-700 font-medium">All</button>
                    <button onClick={() => setSelectedExportFields(new Set())} className="text-[11px] text-gray-500 hover:text-gray-700 font-medium">None</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 mb-3 max-h-64 overflow-y-auto">
                  {EXPORT_FIELD_DEFS.map(f => (
                    <label key={f.key} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedExportFields.has(f.key)}
                        onChange={() => setSelectedExportFields(prev => {
                          const next = new Set(prev);
                          if (next.has(f.key)) next.delete(f.key); else next.add(f.key);
                          return next;
                        })}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
                <button onClick={handleExportCsv} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600">
                  <Download size={12} />
                  <span>Export {selectedProposals.length} row(s) as CSV</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleDownloadImportTemplate}
            title="Download a blank CSV template with the required import columns"
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
          >
            <FileDown size={14} />
            <span>Template</span>
          </button>
          <input type="file" accept=".csv" ref={importInputRef} onChange={handleImportFile} className="hidden" />
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20 whitespace-nowrap">
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
