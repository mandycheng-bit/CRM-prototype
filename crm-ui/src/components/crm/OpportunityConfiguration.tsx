import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, XCircle } from 'lucide-react';
import { INITIAL_MPF_SCHEMES, INITIAL_EMPLOYER_OPTIONS } from '../../constants';
import type { EmployerOptionConfig } from '../../constants';

type ConfigTab = 'mpf-scheme' | 'employer-option';

const TABS: { id: ConfigTab; label: string }[] = [
  { id: 'mpf-scheme', label: 'MPF Scheme' },
  { id: 'employer-option', label: 'Employer Option' },
];

const formatDecimal2 = (raw: string | number) => {
  const num = typeof raw === 'number' ? raw : parseFloat(raw);
  return isNaN(num) ? '' : num.toFixed(2);
};

export default function OpportunityConfiguration() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('mpf-scheme');

  // MPF Scheme master list (shared with the Prospect's Product Opportunity Evaluation
  // "Vendor Fields" lookup), persisted to localStorage under 'pr2_mpf_schemes'.
  const [mpfSchemes, setMpfSchemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('pr2_mpf_schemes');
    return saved ? JSON.parse(saved) : INITIAL_MPF_SCHEMES;
  });
  useEffect(() => { localStorage.setItem('pr2_mpf_schemes', JSON.stringify(mpfSchemes)); }, [mpfSchemes]);

  const [showMpfForm, setShowMpfForm] = useState(false);
  const [mode, setMode] = useState<'create' | 'rename'>('create');
  const [originalValue, setOriginalValue] = useState('');
  const [input, setInput] = useState('');

  const cancelEdit = () => {
    setShowMpfForm(false);
    setMode('create');
    setOriginalValue('');
    setInput('');
  };

  const handleSave = () => {
    const trimmed = input.trim();
    if (!trimmed) { alert('MPF Scheme name is required.'); return; }
    if (mode === 'create') {
      if (mpfSchemes.some(i => i.toLowerCase() === trimmed.toLowerCase())) { alert('A MPF Scheme with this name already exists.'); return; }
      setMpfSchemes([...mpfSchemes, trimmed]);
    } else {
      if (mpfSchemes.some(i => i.toLowerCase() === trimmed.toLowerCase() && i !== originalValue)) { alert('A MPF Scheme with this name already exists.'); return; }
      setMpfSchemes(mpfSchemes.map(i => i === originalValue ? trimmed : i));
    }
    cancelEdit();
  };

  const handleDelete = (value: string) => {
    if (mpfSchemes.length <= 1) { alert('At least one MPF Scheme must exist.'); return; }
    if (confirm(`Are you sure you want to delete "${value}"?`)) {
      setMpfSchemes(mpfSchemes.filter(i => i !== value));
    }
  };

  // Employer Option master list — feeds the Prospect's Product Opportunity Evaluation
  // "Employer Option" lookup. Selecting one there auto-fills (and locks) Est Conversion
  // Rate - Contribution (%) / Est Conversion Rate - Asset Transfer (%) with the weighting set here.
  const [employerOptions, setEmployerOptions] = useState<EmployerOptionConfig[]>(() => {
    const saved = localStorage.getItem('pr2_employer_options');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYER_OPTIONS;
  });
  useEffect(() => { localStorage.setItem('pr2_employer_options', JSON.stringify(employerOptions)); }, [employerOptions]);

  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [employerMode, setEmployerMode] = useState<'create' | 'edit'>('create');
  const [employerOriginalName, setEmployerOriginalName] = useState('');
  const [employerNameInput, setEmployerNameInput] = useState('');
  const [contributionInput, setContributionInput] = useState('');
  const [assetTransferInput, setAssetTransferInput] = useState('');

  const cancelEmployerEdit = () => {
    setShowEmployerForm(false);
    setEmployerMode('create');
    setEmployerOriginalName('');
    setEmployerNameInput('');
    setContributionInput('');
    setAssetTransferInput('');
  };

  const handleEmployerSave = () => {
    const trimmedName = employerNameInput.trim();
    if (!trimmedName) { alert('Employer Name is required.'); return; }
    const contribution = parseFloat(contributionInput);
    const assetTransfer = parseFloat(assetTransferInput);
    if (isNaN(contribution) || contribution < 0 || contribution > 100) { alert('Def projected weighting - contribution must be a number between 0 and 100.'); return; }
    if (isNaN(assetTransfer) || assetTransfer < 0 || assetTransfer > 100) { alert('Def projected weighting - asset transfer must be a number between 0 and 100.'); return; }

    const record: EmployerOptionConfig = { name: trimmedName, contributionWeighting: contribution, assetTransferWeighting: assetTransfer };
    if (employerMode === 'create') {
      if (employerOptions.some(e => e.name.toLowerCase() === trimmedName.toLowerCase())) { alert('An Employer Option with this name already exists.'); return; }
      setEmployerOptions([...employerOptions, record]);
    } else {
      if (employerOptions.some(e => e.name.toLowerCase() === trimmedName.toLowerCase() && e.name !== employerOriginalName)) { alert('An Employer Option with this name already exists.'); return; }
      setEmployerOptions(employerOptions.map(e => e.name === employerOriginalName ? record : e));
    }
    cancelEmployerEdit();
  };

  const handleEmployerDelete = (name: string) => {
    if (employerOptions.length <= 1) { alert('At least one Employer Option must exist.'); return; }
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setEmployerOptions(employerOptions.filter(e => e.name !== name));
    }
  };

  return (
    <div className="flex flex-col gap-5 p-6 min-h-screen bg-gray-50 text-left font-sans text-gray-950">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 text-xs text-gray-500 font-semibold">
        <span>Configuration</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-bold">Opportunity Configuration</span>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'mpf-scheme' && (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-700">MPF Scheme List</span>
            <button
              type="button"
              onClick={() => setShowMpfForm(true)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm h-9 flex items-center gap-1"
            >
              <Plus size={11} /> Add MPF Scheme
            </button>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto border rounded-xl divide-y p-2 bg-gray-50/50">
            {mpfSchemes.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 px-2 hover:bg-white rounded transition-colors text-xs font-semibold text-gray-700">
                <span>{item}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setInput(item); setMode('rename'); setOriginalValue(item); setShowMpfForm(true); }}
                    className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                    title="Rename MPF Scheme"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete MPF Scheme"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'employer-option' && (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-700">Employer Option List</span>
            <button
              type="button"
              onClick={() => setShowEmployerForm(true)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm h-9 flex items-center gap-1"
            >
              <Plus size={11} /> Add Employer Option
            </button>
          </div>

          <div className="border rounded-xl overflow-hidden bg-gray-50/50">
            <div className="grid grid-cols-[1fr_repeat(2,minmax(0,10rem))_4.5rem] gap-2 px-3 py-2 text-[9px] font-black uppercase text-gray-400 border-b bg-gray-50">
              <span>Employer Name</span>
              <span>Def Projected Weighting - Contribution</span>
              <span>Def Projected Weighting - Asset Transfer</span>
              <span></span>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y">
              {employerOptions.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_repeat(2,minmax(0,10rem))_4.5rem] gap-2 items-center px-3 py-1.5 hover:bg-white transition-colors text-xs font-semibold text-gray-700">
                  <span>{item.name}</span>
                  <span className="font-mono">{formatDecimal2(item.contributionWeighting)}%</span>
                  <span className="font-mono">{formatDecimal2(item.assetTransferWeighting)}%</span>
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEmployerNameInput(item.name);
                        setContributionInput(formatDecimal2(item.contributionWeighting));
                        setAssetTransferInput(formatDecimal2(item.assetTransferWeighting));
                        setEmployerMode('edit');
                        setEmployerOriginalName(item.name);
                        setShowEmployerForm(true);
                      }}
                      className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                      title="Edit Employer Option"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEmployerDelete(item.name)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Employer Option"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Rename MPF Scheme popup */}
      {showMpfForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 px-5 py-3.5 bg-gray-50">
              <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                {mode === 'create' ? 'Add New MPF Scheme' : 'Rename MPF Scheme'}
              </span>
              <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer">
                <XCircle size={15} />
              </button>
            </div>

            <div className="p-5 space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 block">MPF Scheme Name</label>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. Manulife MPF (Global Select) Plan"
                autoFocus
                className="w-full px-3 py-1.5 border rounded-lg border-gray-300 focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-white h-9"
              />
            </div>

            <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm cursor-pointer"
              >
                {mode === 'create' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employer Option popup */}
      {showEmployerForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 px-5 py-3.5 bg-gray-50">
              <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                {employerMode === 'create' ? 'Add New Employer Option' : 'Edit Employer Option'}
              </span>
              <button onClick={cancelEmployerEdit} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer">
                <XCircle size={15} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Employer Name</label>
                <input
                  type="text"
                  value={employerNameInput}
                  onChange={e => setEmployerNameInput(e.target.value)}
                  placeholder="Employer Name"
                  autoFocus
                  className="w-full px-3 py-1.5 border rounded-lg border-gray-300 focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-white h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Def Projected Weighting - Contribution</label>
                <div className="relative">
                  <input
                    type="number" step="0.01" min={0} max={100}
                    value={contributionInput}
                    onChange={e => setContributionInput(e.target.value)}
                    onBlur={e => {
                      const num = parseFloat(e.target.value);
                      const capped = isNaN(num) ? e.target.value : Math.min(100, Math.max(0, num));
                      setContributionInput(e.target.value === '' ? '' : formatDecimal2(capped));
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 pr-6 border rounded-lg border-gray-300 focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-white h-9 font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Def Projected Weighting - Asset Transfer</label>
                <div className="relative">
                  <input
                    type="number" step="0.01" min={0} max={100}
                    value={assetTransferInput}
                    onChange={e => setAssetTransferInput(e.target.value)}
                    onBlur={e => {
                      const num = parseFloat(e.target.value);
                      const capped = isNaN(num) ? e.target.value : Math.min(100, Math.max(0, num));
                      setAssetTransferInput(e.target.value === '' ? '' : formatDecimal2(capped));
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 pr-6 border rounded-lg border-gray-300 focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-white h-9 font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEmployerEdit}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmployerSave}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm cursor-pointer"
              >
                {employerMode === 'create' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
