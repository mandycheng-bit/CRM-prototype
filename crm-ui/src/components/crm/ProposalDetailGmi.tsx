import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, MoreVertical, CheckCircle2, AlertCircle, FileText,
  PieChart, TrendingUp, BarChart2, Users, Building2, DollarSign,
  Calendar, Thermometer, ShieldCheck, Plus, Trash2, Download, Share2,
  XCircle, X, History, FileCode, Check, Send, Upload, FileUp,
  Info, Activity as ActivityIcon, Edit, User, HelpCircle, Briefcase,
  ChevronRight, ChevronDown, Layers, FileSpreadsheet, Star, Play, Award, ClipboardCheck,
  RefreshCw, Lock, Search, Archive
} from 'lucide-react';
import type { Proposal, BenefitRow, ProductFileRequirement, ChildProposal, UploadedRequirementFile } from '../../types';
import { MOCK_COMPANIES, MOCK_INDIVIDUALS, MOCK_LEADS, MOCK_CAMPAIGNS, INITIAL_MPF_SCHEMES, INITIAL_EMPLOYER_OPTIONS } from '../../constants';
import type { EmployerOptionConfig } from '../../constants';

const SALES_REPS = ['Sales Rep A', 'Sales Rep B', 'Sales Rep C', 'Sales Rep D'];
export const SALES_REP_TEAM_MAP: Record<string, string> = {
  'Sales Rep A': 'Sales Team A',
  'Sales Rep B': 'Sales Team B',
  'Sales Rep C': 'Sales Team C',
  'Sales Rep D': 'Sales Team A',
};
// Must match Proposal['lostReason'] exactly — this is the only place that enum is offered as choices.
const LOSS_REASONS: NonNullable<Proposal['lostReason']>[] = ['Price', 'Coverage', 'Competitor', 'Client Decision', 'No Response', 'Others'];
const NB_PROBABILITY_OPTIONS = [0, 10, 30, 70, 90, 100];
const RB_PROBABILITY_OPTIONS = [0, 65, 75, 85, 95, 100];

// Company/Individual Master lookup: Lead + Customer (Company/Individual), excluding Archived.
// Selection is two-step: entityType (Company/Individual) then source (Customer/Lead).
// Lapsed customers are intentionally NOT excluded — they must remain selectable when creating an Opportunity.
type MasterType = 'Lead' | 'Customer' | 'Lapsed Customer';
const COMPANY_INDIVIDUAL_OPTIONS: { id: string; label: string; entityType: 'Company' | 'Individual'; source: 'Customer' | 'Lead'; masterType: MasterType }[] = [
  ...MOCK_COMPANIES.filter(c => c.status !== 'Archived').map(c => ({ id: c.id, label: c.name, entityType: 'Company' as const, source: 'Customer' as const, masterType: (c.status === 'Lapsed' ? 'Lapsed Customer' : 'Customer') as MasterType })),
  ...MOCK_INDIVIDUALS.filter(i => i.status !== 'Archived').map(i => ({ id: i.id, label: i.fullName, entityType: 'Individual' as const, source: 'Customer' as const, masterType: (i.status === 'Lapsed' ? 'Lapsed Customer' : 'Customer') as MasterType })),
  ...MOCK_LEADS.filter(l => (l.leadStatus as string) !== 'Archived').map(l => ({ id: l.id, label: l.leadName, entityType: l.type, source: 'Lead' as const, masterType: 'Lead' as MasterType })),
];
const resolveCompanyMeta = (label: string) => {
  const match = COMPANY_INDIVIDUAL_OPTIONS.find(o => o.label === label);
  return match
    ? { entityType: match.entityType, source: match.source, masterType: match.masterType }
    : { entityType: 'Company' as const, source: 'Customer' as const, masterType: 'Customer' as MasterType };
};
const CAMPAIGN_OPTIONS = MOCK_CAMPAIGNS.filter(c => c.active).map(c => c.name);

// "Member First Name"/"Member Last Name" were removed from Product Configuration's
// field catalog, but a product saved to localStorage from before that change still
// carries them baked into its own vendorFields/premiumFields/dateTransferFields
// array — this strips them out of whatever's loaded so they stop rendering here
// regardless of when the product was last saved in Product Configuration.
const REMOVED_PRODUCT_FIELD_NAMES = ['Member First Name', 'Member Last Name', 'No. of Employee / Insured', 'Current Annual Contribution', 'Current Net Asset Value'];
const stripRemovedProductFields = (list: any[]): any[] => list.map(p => ({
  ...p,
  vendorFields: (p.vendorFields || []).filter((f: any) => !REMOVED_PRODUCT_FIELD_NAMES.includes(f.name)),
  premiumFields: (p.premiumFields || []).filter((f: any) => !REMOVED_PRODUCT_FIELD_NAMES.includes(f.name)),
  dateTransferFields: (p.dateTransferFields || []).filter((f: any) => !REMOVED_PRODUCT_FIELD_NAMES.includes(f.name)),
}));

// Mock master list for Product Opportunity Evaluation "Insurer" lookup (fixed list,
// no in-page management UI). MPF Schemes are managed on the Opportunity Configuration page.
const INITIAL_INSURERS = [
  'AIA International',
  'AXA General Insurance',
  'Manulife (International)',
  'Prudential Hong Kong',
  'Zurich Insurance',
];
// Mocked stand-in for the Employee module (not yet built) — used for the
// Member Briefing Speaker User Lookup Dropdown.
const EMPLOYEE_DIRECTORY = ['Chan Tai Man', 'Wong Siu Ling', 'Lee Ka Fai', 'Cheung Wai Yee', 'Ho Chun Kit'];

type EvalFieldType = 'text' | 'integer' | 'decimal2' | 'percent2' | 'readonly-percent2' | 'auto2' | 'mpf-lookup' | 'insurer-lookup' | 'employer-option' | 'employee-lookup' | 'date';
interface EvalFieldSpec {
  type: EvalFieldType;
  formula?: (values: Record<string, string>) => number;
}
// Field-by-field type/format spec for the Product Opportunity Evaluation section
// (Vendor / Premium / Date & Transfer columns), driving how each field renders
// regardless of which fields a given product has marked Display/Required.
const EVAL_FIELD_SPECS: Record<string, EvalFieldSpec> = {
  'Existing Scheme 1': { type: 'mpf-lookup' },
  'Existing Scheme 2': { type: 'mpf-lookup' },
  'Existing Scheme 3': { type: 'mpf-lookup' },
  'Existing Scheme 4': { type: 'mpf-lookup' },
  'Existing Scheme 5': { type: 'mpf-lookup' },
  // Sub-fields shown under each Existing Scheme N once that scheme is selected —
  // not configurable in Product Setting, always required when shown (see renderSchemeSubFields).
  'No. of Employee / Insured (Existing Scheme 1)': { type: 'integer' },
  'Current Annual Contribution (Existing Scheme 1)': { type: 'decimal2' },
  'Current Net Asset Value (Existing Scheme 1)': { type: 'integer' },
  'No. of Employee / Insured (Existing Scheme 2)': { type: 'integer' },
  'Current Annual Contribution (Existing Scheme 2)': { type: 'decimal2' },
  'Current Net Asset Value (Existing Scheme 2)': { type: 'integer' },
  'No. of Employee / Insured (Existing Scheme 3)': { type: 'integer' },
  'Current Annual Contribution (Existing Scheme 3)': { type: 'decimal2' },
  'Current Net Asset Value (Existing Scheme 3)': { type: 'integer' },
  'No. of Employee / Insured (Existing Scheme 4)': { type: 'integer' },
  'Current Annual Contribution (Existing Scheme 4)': { type: 'decimal2' },
  'Current Net Asset Value (Existing Scheme 4)': { type: 'integer' },
  'No. of Employee / Insured (Existing Scheme 5)': { type: 'integer' },
  'Current Annual Contribution (Existing Scheme 5)': { type: 'decimal2' },
  'Current Net Asset Value (Existing Scheme 5)': { type: 'integer' },
  'Proposed Service Provider': { type: 'insurer-lookup' },
  'New Scheme': { type: 'mpf-lookup' },
  'Existing Insurer': { type: 'insurer-lookup' },
  'Proposed Insurer': { type: 'insurer-lookup' },

  'Total Annual Contribution': {
    type: 'auto2',
    formula: v => [1, 2, 3, 4, 5].reduce((sum, n) => sum + (parseFloat(v[`Current Annual Contribution (Existing Scheme ${n})`]) || 0), 0)
  },
  'Total ATO': {
    type: 'auto2',
    formula: v => [1, 2, 3, 4, 5].reduce((sum, n) => sum + (parseFloat(v[`Current Net Asset Value (Existing Scheme ${n})`]) || 0), 0)
  },
  'Employer Option': { type: 'employer-option' },
  // Auto-filled and locked from the selected Employer Option's configured default weighting (Opportunity Configuration).
  'Est Conversion Rate - Contribution (%)': { type: 'readonly-percent2' },
  'Est Conversion Rate - Asset Transfer (%)': { type: 'readonly-percent2' },
  'Est Annual Contribution': {
    type: 'auto2',
    formula: v => (parseFloat(v['Current Annual Contribution']) || 0) * (parseFloat(v['Est Conversion Rate - Contribution (%)']) || 0) / 100
  },
  'Est ATO': {
    type: 'auto2',
    formula: v => (parseFloat(v['Current Net Asset Value']) || 0) * (parseFloat(v['Est Conversion Rate - Asset Transfer (%)']) || 0) / 100
  },
  'Project Fee': { type: 'decimal2' },
  'Lump Sum Amount': { type: 'decimal2' },
  'Transfer Amount': { type: 'decimal2' },
  'RSP Annualised Amount': { type: 'decimal2' },
  'Transaction Amount': { type: 'decimal2' },
  'Commission Amount': { type: 'decimal2' },
  'Est Premium': { type: 'decimal2' },
  'Est Commission Rate': { type: 'percent2' },
  'Est Commission Amount': {
    type: 'auto2',
    formula: v => (parseFloat(v['Est Premium']) || 0) * (parseFloat(v['Est Commission Rate']) || 0) / 100
  },

  'No. of Briefing Sessions': { type: 'integer' },
  'Member Briefing Speaker': { type: 'employee-lookup' },
  'Total Briefing Attendees': { type: 'integer' },
  'No. of Employee Transfer Est by ES': { type: 'integer' },
  'Actual No. of Employee Transfer': { type: 'integer' },
  'Form Received Date': { type: 'date' },
  'Application Date': { type: 'date' },
  'Date to Provider / Insurer': { type: 'date' },
  'Date to Client': { type: 'date' },
  'eMPF Submission Ref. No.': { type: 'text' },
};
const formatDecimal2 = (raw: string | number) => {
  const num = typeof raw === 'number' ? raw : parseFloat(raw);
  return isNaN(num) ? '' : num.toFixed(2);
};

// <input type="date"> accepts any year from 0001-9999 with no built-in sanity
// check, so a fat-fingered year (e.g. "0001-06-01") saves silently otherwise.
const isValidEffectiveDateYear = (dateStr: string) => {
  if (!dateStr) return true;
  const year = Number(dateStr.slice(0, 4));
  return year >= 1900 && year <= 2100;
};

// Est Sales Credit formula engine. Rule strings must match ProductsConfiguration.tsx's
// SALES_CREDIT_RULES exactly (the 7 real formulas from the Products PRD, TASK-12).
const computeEstSalesCredit = (rule: string | undefined, v: Record<string, string>): number => {
  const num = (name: string) => parseFloat(v[name]) || 0;
  switch (rule) {
    case 'Standard $1,000 sales credit for Est Sales Credit and Gross Amount':
      return 1000;
    case 'Lump Sum Amount ÷ Transfer Amount × 1%': {
      const transfer = num('Transfer Amount');
      return transfer !== 0 ? (num('Lump Sum Amount') / transfer) * 0.01 : 0;
    }
    case 'RSP Annualised Amount × 5%':
      return num('RSP Annualised Amount') * 0.05;
    case 'Est Premium × Est Commission Rate':
      return num('Est Premium') * (num('Est Commission Rate') / 100);
    case 'Commission Amount':
      return num('Commission Amount');
    case '25% × (Lump Sum Amount or Transfer Amount + RSP Annualised Amount)': {
      const base = num('Transfer Amount') || num('Lump Sum Amount');
      return 0.25 * (base + num('RSP Annualised Amount'));
    }
    case 'Sales Credit Equals to Zero':
      return 0;
    default:
      return 0;
  }
};

// Renders a field's editable control when editing, or a plain read-only value otherwise.
const FieldView: React.FC<{
  label: string;
  required?: boolean;
  editing: boolean;
  viewValue: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required, editing, viewValue, className, children }) => (
  <div className={className}>
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {editing ? children : (
      <p className="text-xs font-semibold text-gray-800 px-2.5 py-1.5 min-h-[30px]">{viewValue}</p>
    )}
  </div>
);

// Unified searchable dropdown used everywhere a long option list needs filtering
// (Company/Individual, Campaign, Product Item). The search box sits fixed at the top
// of the open panel; only the option list beneath it scrolls, and filtering is instant.
interface SearchableDropdownOption {
  id: string;
  label: string;
  value: string;
  suffix?: string;
}
const SearchableDropdown: React.FC<{
  value: string;
  options: SearchableDropdownOption[];
  onSelect: (value: string) => void;
  placeholder: string;
  // Shown (in muted gray, like a text input's placeholder) on the closed button
  // when nothing is selected yet — not a selectable option, unlike a native
  // <select>'s placeholder row. Defaults to `placeholder` if not given.
  buttonPlaceholder?: string;
  className?: string;
}> = ({ value, options, onSelect, placeholder, buttonPlaceholder, className }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-left"
      >
        <span className={`truncate ${value ? 'font-semibold text-gray-800' : 'font-normal text-gray-400'}`}>{value || buttonPlaceholder || placeholder}</span>
        <ChevronDown size={12} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col max-h-64 overflow-hidden">
          <div className="p-1.5 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-6 pr-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && <div className="px-2.5 py-2 text-xs text-gray-400 italic">No matches</div>}
            {filtered.map(o => (
              <button
                type="button"
                key={o.id}
                onClick={() => { onSelect(o.value); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-2.5 py-1.5 text-xs hover:bg-orange-50 ${o.value === value ? 'bg-orange-50 font-bold text-orange-700' : 'text-gray-700'}`}
              >
                {o.label}{o.suffix || ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProposalDetailProps {
  proposal: Proposal;
  allProposals?: Proposal[];
  onBack: () => void;
  onSave?: (updatedProposal: Proposal) => void;
  onCreateRenewal?: (renewalProspect: Proposal) => void;
  onNavigateToProspect?: (targetProspect: Proposal) => void;
  onDelete?: (proposalId: string) => void;
  currentRole?: 'Sales Rep' | 'Admin';
  // Fired whenever the unsaved-edit state changes, so a parent-level navigation
  // action (e.g. switching Sidebar modules) can also guard against discarding
  // an in-progress Opportunity edit.
  onDirtyStateChange?: (isDirty: boolean) => void;
}

// Master lists for resolution inside Proposal
const CONFIG_GMI_GROUPS_MASTER = [
  { id: 'GMI-GRP-001', name: 'CONTRACTOR ALL RISK INSURANCE( CAR )', status: 'Active', benefits: ['BEN-014', 'BEN-016'], coverages: ['COV-001', 'COV-003'] },
  { id: 'GMI-GRP-002', name: 'EMPLOYEE BENEFIT PROGRAM( EBP )', status: 'Active', benefits: ['BEN-001', 'BEN-002', 'BEN-003', 'BEN-014', 'BEN-015', 'BEN-017'], coverages: ['COV-002', 'COV-003'] },
  { id: 'GMI-GRP-003', name: 'EMPLOYEE COMPENSATION( EC )', status: 'Active', benefits: ['BEN-016'], coverages: ['COV-003'] },
  { id: 'GMI-GRP-004', name: 'HEALTH MAINTENANCE PROGRAM( HMP )', status: 'Active', benefits: ['BEN-017'], coverages: ['COV-002'] },
  { id: 'GMI-GRP-005', name: 'LIABILITY INSURANCE( LIA )', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001', 'COV-003'] },
  { id: 'GMI-GRP-006', name: 'MARINE INSURANCE( MAR )', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'] },
  { id: 'GMI-GRP-007', name: 'MOTOR INSURANCE( MOTOR )', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'] },
  { id: 'GMI-GRP-008', name: 'PROPERTY & CASUALTY INSURANCE( P&C )', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'] },
  { id: 'GMI-GRP-009', name: 'PERSONAL LINE INSURANCE( PER )', status: 'Active', benefits: ['BEN-001', 'BEN-002', 'BEN-007', 'BEN-014'], coverages: ['COV-001', 'COV-002'] },
  { id: 'GMI-GRP-010', name: 'CONSULTANCY FEE( PFP )', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-003'] },
  { id: 'GMI-GRP-011', name: 'TRAVEL INSURANCE( TRA )', status: 'Active', benefits: ['BEN-005', 'BEN-010', 'BEN-011', 'BEN-013'], coverages: ['COV-002'] },
  { id: 'GMI-GRP-012', name: 'INDIVIDUAL SAVING( IS )', status: 'Active', benefits: ['BEN-001', 'BEN-006'], coverages: ['COV-001'] }
];

const CONFIG_BENEFITS_MASTER = [
  { id: 'BEN-001', name: 'LIFE INSURANCE' },
  { id: 'BEN-002', name: 'ACCIDENTAL DEATH AND DISMEMBERMENT (AD&D)' },
  { id: 'BEN-003', name: 'TOTAL AND PERMANENT DISABILITY (TPD) INSURANCE' },
  { id: 'BEN-004', name: 'GROUP PERSONAL ACCIDENT' },
  { id: 'BEN-005', name: 'GROUP BUSINESS TRAVEL INSURANCE' },
  { id: 'BEN-006', name: 'Other Special Items' },
  { id: 'BEN-007', name: 'CRITICAL ILLNESS (CI)' },
  { id: 'BEN-008', name: 'LONG TERM DISABILITY INCOME' },
  { id: 'BEN-009', name: 'GROUP DISABILITY INCOME' },
  { id: 'BEN-010', name: 'SOS PROGRAM' },
  { id: 'BEN-011', name: 'ACCIDENTAL EMERGENCY MEDICAL' },
  { id: 'BEN-012', name: 'GROUP PLUS' },
  { id: 'BEN-013', name: 'ACCIDENTAL MEDICAL EXPENSES' },
  { id: 'BEN-014', name: 'Group Medical' },
  { id: 'BEN-015', name: 'Risk Protection' },
  { id: 'BEN-016', name: 'Statutory' },
  { id: 'BEN-017', name: 'Group Health Maintenance' }
];

const CONFIG_COVERAGES_MASTER = [
  { id: 'COV-001', name: 'Amount of Fixed Benefits' },
  { id: 'COV-002', name: 'Medical Expenses' },
  { id: 'COV-003', name: 'Number of Covered Employees' }
];

const CONFIG_PRODUCT_NAMES = [
  'MPF - Personal Account (PAC)',
  'MPF - Personal Account (PAP)',
  'MPF - Payment Method (PM form)',
  'MPF - Portfolio Consolidation (PC form)',
  'MPF - TVC Account Creation',
  'MPF - TVC Transfer',
  'Life - QDAP',
  'Life - VHIS',
  'GI - VHIS',
  'HKMC - Annuity',
  'SFC - RA4 - New Contribution',
  'SFC - RA9 - New Contribution',
  'SFC - RA4 - RSP',
  'SFC - RA4 - Transaction',
  'SFC - RA4 - RSP Termination',
  'SFC - RA4 - Withdrawal',
  'SFC - RA9 - Withdrawal',
  '[Record Keeping] Risk Profile Questionnaire Submission (RPQ)',
  'GI - Critical Illness',
  'GI - Domestic Helper',
  'GI - Domestic Helper (Supplemental Medical)',
  'GI - Fire',
  'GI - Household',
  'GI - Individual Annual Travel',
  'GI - Individual China Medical',
  'GI - Life Insurance',
  'GI - Individual Medical',
  'GI - Individual Personal Accident',
  'GI - Individual Single Travel',
  'GI - Motor Vehicle Comprehensive',
  'Pension - MPF Add Provider',
  'GI - Motor Vehicle Third Party',
  'Pension - MPF Re-Opt',
  'Pension - Voluntary Contribution (VC)',
  'Pension - ORSO',
  'Pension - MPF/ORSO Appointed Case Only',
  'EB - Group Medical',
  'EB - Group Life',
  'EB - Highend Medical',
  'EB - Tender / Consultancy Project',
  'GI - Personal Accident (PA)',
  'GI - Statutory (Employee Compensation)',
  'GI - Travel Insurance',
  'GI - Property and Casualty Insurance',
  'GI - Liability Insurance',
  'GI - Contractor All Risk Insurance',
  'GI - Motor Insurance',
  'GI - Marine Insurance',
  'GI - Others',
  'GI - Personal Line Insurance',
  'Health Maintenance - Dental',
  'Health Maintenance - Checkup / Pre-employment Checkup',
  'Project - LSP/SP',
  'Project - NGO',
  'Project - MPF',
  'Project - Pension Tender',
  'Project - Others',
  'PowerUP',
  'MVP',
  'Wellness / Financial Talk',
  'Other Wellness Activities',
  'PA Consolidation',
  'ECAM',
  'MBS',
  'VC',
  'TVC - New Account',
  'TVC - Asset Transfer',
  'QDAP',
  'VHIS',
  'Mutual Fund',
  'Annuity',
  'Reverse Mortgage',
  'eMPF Appointment Letter Campaign (12 Aug - 30 Nov 2025)',
  'MPF - SVC Account Creation',
  'PAC',
  'CONTRACTOR ALL RISKS',
  'SURETY BOND',
  'CONTRACTOR ALL RISKS - MACAU',
  'SURETY BOND - MACAU',
  'PUBLIC LIABILITY',
  'PROFESSIONAL LIABILITY',
  'PRODUCT LIABILITY',
  'DIRECTORS AND OFFICERS',
  'MALPRACTICE LIABILITY',
  'ERRORS & OMISSION LIABILITY',
  'BUILDING THIRD PARTY LIABILITY',
  'MEDIA PROFESSIONAL LIABILITY',
  'FREIGHT FORWARDER LIABILITY',
  'RENTAL PROTECTOR',
  'CYBEREDGE INSURANCE',
  'CRIME INSURANCE',
  'MOTOR TRADE',
  'PUBLIC LIABILITY - MACAU',
  'PROFESSIONAL LIABILITY - MACAU',
  'PRODUCT LIABILITY - MACAU',
  'DIRECTORS AND OFFICERS - MACAU',
  'MALPRACTICE LIABILITY - MACAU',
  'ERRORS & OMISSION LIABILITY - MACAU',
  'BUILDING THIRD PARTY LIABILITY - MACAU',
  'MEDIA PROFESSIONAL LIABILITY - MACAU',
  'FREIGHT FORWARDER LIABILITY - MACAU',
  'RENTAL PROTECTOR - MACAU',
  'CYBEREDGE INSURANCE - MACAU',
  'CRIME INSURANCE - MACAU',
  'MOTOR TRADE - MACAU',
  'MARINE CARGO',
  'MARINE HULL',
  'PLEASURE CRAFT',
  'GOODS IN TRANSIT',
  'REMOVAL INSURANCE',
  'MARINE CARGO - MACAU',
  'MARINE HULL - MACAU',
  'PLEASURE CRAFT - MACAU',
  'GOODS IN TRANSIT - MACAU',
  'REMOVAL INSURANCE - MACAU',
  'COMM. VEHICLE COMPREHENSIVE',
  'COMM. VEHICLE THIRD PARTY',
  'MOTOR VEHICLE COMPREHENSIVE',
  'MOTOR VEHICLE THIRD PARTY',
  'TRAILER COMPREHENSIVE',
  'TRAILER THIRD PARTY',
  'TRACTOR COMPREHENSIVE',
  'TRACTOR THIRD PARTY',
  'COMM. VEHICLE COMPREHENSIVE - MACAU',
  'COMM. VEHICLE THIRD PARTY - MACAU',
  'MOTOR VEHICLE COMPREHENSIVE - MACAU',
  'MOTOR VEHICLE THIRD PARTY - MACAU',
  'TRAILER COMPREHENSIVE - MACAU',
  'TRAILER THIRD PARTY - MACAU',
  'TRACTOR COMPREHENSIVE - MACAU',
  'TRACTOR THIRD PARTY - MACAU',
  'SHOP PACKAGE - MACAU',
  'PROPERTY ALL RISKS - MACAU',
  'PROPERTY ALL RISKS',
  'COMMERCIAL ALL RISKS',
  'BURGLARY',
  'BUSINESS INTERRUPTION',
  'SHOP PACKAGE',
  'MONEY INSURANCE',
  'OFFICE',
  'PLATE GLASS',
  'COMPUTER ALL RISKS',
  'MACHINERY ALL RISKS',
  'BUSINESS PACKAGE',
  'FIDELITY GUARANTEE',
  'ELECTRONIC EQUIPMENT INSURANCE',
  'ACCIDENTAL DAMAGE (PROPERTY)',
  'COMMERCIAL ALL RISKS - MACAU',
  'BURGLARY - MACAU',
  'BUSINESS INTERRUPTION - MACAU',
  'MONEY INSURANCE - MACAU',
  'OFFICE - MACAU',
  'PLATE GLASS - MACAU',
  'COMPUTER ALL RISKS - MACAU',
  'MACHINERY ALL RISKS - MACAU',
  'BUSINESS PACKAGE - MACAU',
  'FIDELITY GUARANTEE - MACAU',
  'ELECTRONIC EQUIPMENT INSURANCE - MACAU',
  'ACCIDENTAL DAMAGE (PROPERTY) - MACAU',
  'DOMESTIC HELPER',
  'HOUSEHOLD',
  'GOLFER\'S',
  'INDIVIDUAL MEDICAL',
  'INDIVIDUAL PERSONAL ACCIDENT',
  'FIRE',
  'INDIVIDUAL LIFE INSURANCE',
  'DOMESTIC HELPER SUPP. MEDICAL',
  'INDIVIDUAL CHINA MEDICAL',
  'DOMESTIC HELPER - MACAU',
  'HOUSEHOLD - MACAU',
  'GOLFER\'S - MACAU',
  'INDIVIDUAL MEDICAL - MACAU',
  'INDIVIDUAL PERSONAL ACCIDENT - MACAU',
  'FIRE - MACAU',
  'INDIVIDUAL LIFE INSURANCE - MACAU',
  'DOMESTIC HELPER SUPP. MEDICAL - MACAU',
  'INDIVIDUAL CHINA MEDICAL - MACAU',
  'PROVIDENT FUND - MPF',
  'PROVIDENT FUND - ORSO',
  'TRUSTEE FEE',
  'CONSULTANCY FEE',
  'MEMBER BRIEFING',
  'TRUSTEE FEE - MACAU',
  'CONSULTANCY FEE - MACAU',
  'MEMBER BRIEFING - MACAU',
  'INDIVIDUAL SINGLE TRAVEL',
  'INDIVIDUAL ANNUAL TRAVEL',
  'INDIVIDUAL SINGLE TRAVEL - MACAU',
  'INDIVIDUAL ANNUAL TRAVEL - MACAU',
  'Genesis 2 Year 250',
  'Genesis 1 Year - MACAU',
  'Genesis 2 Year - MACAU',
  'Genesis 1 Year',
  'Genesis 3 Year - MACAU',
  'Genesis 2 Year',
  'Genesis 3 Year',
  'Prestige Saver 3 Year - MACAU',
  'Genesis 5 Year',
  'Genesis 2 Year 250 - MACAU',
  'Prestige Saver 1 Year - MACAU',
  'Prestige Saver 1 Year',
  'Prestige Saver 3 Year',
  'Prestige Saver 5 Year - MACAU',
  'Prestige Saver 5 Year',
  'Future Assure 3 Year - MACAU',
  'Genesis 5 Year - MACAU',
  'Future Assure 2 Year',
  'Future Assure 1 Year - MACAU',
  'Future Assure 1 Year',
  'Future Assure 2 Year - MACAU',
  'Future Assure 3 Year',
  'Future Assure 5 Year - MACAU',
  'Future Assure 5 Year',
  'Genesis Centurion 5 Year - MACAU',
  'Genesis Centurion 1 Year - MACAU',
  'Genesis Centurion 2 Year - MACAU',
  'Prestige Achiever 1 Year - MACAU',
  'Group Medical',
  'Risk Protection',
  'Statutory',
  'Group Health Maintenance'
];

const resolveProductTeam = (name: string): string => {
  if (/^EB -|^Group Medical|^Group Life|^Group Health|^Highend Medical|^Tender/i.test(name)) return 'EB (GMED / GL / Tender)';
  if (/^GI -|Travel|Motor|Car|Marine|Cargo|Hull|Helper|Household|Fire|Burglary|Liability|Surety|Contractor|All Risks|Shop Package|Office|Plate Glass|Business Package/i.test(name)) return 'GI (GPA / GBT)';
  if (/Project|NGO|LSP|MBS|ECAM|SFC/i.test(name)) return 'PIES';
  if (/eMPF|MPF|PAC|PAP|SVC|Annuity|QDAP|VHIS|Genesis|Saver|Assure|Achiever|Centurion|Provident/i.test(name)) return 'LSP Projects';
  if (/Wellness|PowerUP|MVP|Talk/i.test(name)) return 'Wellness';
  return 'Others';
};

const resolveProductCategory = (name: string): string => {
  if (/MPF - SVC|MPF - TVC|Individual - TVC|TVC -/i.test(name)) return 'Individual - TVC';
  if (/MPF -|PAC|PAP/i.test(name)) return 'MPF';
  if (/ORSO|Provident|Pension -/i.test(name)) return 'Pension';
  if (/LSP|Project|Tender|NGO/i.test(name)) return 'Project';
  if (/Wellness|PowerUP|MVP|Talk/i.test(name)) return 'Wellness';
  if (/SFC|RA4|RA9/i.test(name)) return 'iFast';
  if (/Annuity|HKMC/i.test(name)) return 'HKMC';
  if (/QDAP/i.test(name)) return 'Individual - QDAP';
  if (/VHIS/i.test(name)) return 'Individual - Individual Medical / VHIS';
  if (/Mutual Fund/i.test(name)) return 'Individual - Mutual Fund';
  if (/Annuity/i.test(name)) return 'Individual - Annuity';
  if (/Medical|Dental|Checkup|EB -|Group/i.test(name)) return 'Employee Benefit & General Insurance';
  return 'Individual - PA';
};

const resolveFallbackGmiProductGroup = (name: string): string => {
  if (/CONTRACTOR|CAR|All Risk/i.test(name)) return 'CONTRACTOR ALL RISK INSURANCE( CAR )';
  if (/EMPLOYEE BENEFIT|EB -|Group Medical|Group Life|Group Health|Group Plus/i.test(name)) return 'EMPLOYEE BENEFIT PROGRAM( EBP )';
  if (/COMPENSATION|Statutory|EC/i.test(name)) return 'EMPLOYEE COMPENSATION( EC )';
  if (/HEALTH|Wellness|Dental|Checkup|Talk/i.test(name)) return 'HEALTH MAINTENANCE PROGRAM( HMP )';
  if (/LIABILITY|Liability|BOND|Surety/i.test(name)) return 'LIABILITY INSURANCE( LIA )';
  if (/MARINE|Cargo|Hull|TRANSIT|REMOVAL/i.test(name)) return 'MARINE INSURANCE( MAR )';
  if (/MOTOR|Motor|VEHICLE|TRAILER|TRACTOR/i.test(name)) return 'MOTOR INSURANCE( MOTOR )';
  if (/PROPERTY|All Risks|BURGLARY|INTERRUPTION|SHOP|MONEY|OFFICE|PLATE|COMPUTER|MACHINERY|PACKAGE|FIDELITY|EQUIPMENT|DAMAGE|Fire/i.test(name)) return 'PROPERTY & CASUALTY INSURANCE( P&C )';
  if (/PERSONAL|Personal|Helper|Household|GOLFER|Individual Medical|Individual Personal Accident|Individual Life|Annuity|Mutual Fund|Genesis|Saver|Assure|Centurion|Achiever/i.test(name)) return 'PERSONAL LINE INSURANCE( PER )';
  if (/CONSULTANCY|Project|Tender|NGO|LSP|MBS|ECAM/i.test(name)) return 'CONSULTANCY FEE( PFP )';
  if (/TRAVEL|Travel/i.test(name)) return 'TRAVEL INSURANCE( TRA )';
  return 'INDIVIDUAL SAVING( IS )';
};

const CONFIG_PRODUCTS = CONFIG_PRODUCT_NAMES.map(name => ({
  name,
  gmiProductGroup: resolveFallbackGmiProductGroup(name)
}));

export const ProposalDetail: React.FC<ProposalDetailProps> = ({ proposal, allProposals, onBack, onSave, onCreateRenewal, onNavigateToProspect, onDelete, currentRole = 'Sales Rep', onDirtyStateChange }) => {

  // Helper: is this product configured (Product Configuration module) as
  // "Applied to Individual" + "Is Insurance Product" = No — the one carve-out
  // where a Lead auto-converts to Customer at 100% probability, no button needed.
  const isNonInsuranceIndividualProduct = (productItemName: string) => {
    try {
      const saved = localStorage.getItem('pr2_products_list');
      const products = saved ? JSON.parse(saved) : CONFIG_PRODUCTS;
      const prod = products.find((p: any) => p.name === productItemName);
      return prod?.appliedCompanyType === 'Individual' && prod?.isInsuranceProduct === 'No';
    } catch (e) {
      return false;
    }
  };

  // Helper: stages this product is restricted from being moved to (Product
  // Configuration module > Restriction Parameters), separately configured for NB and RB.
  const getRestrictedStages = (productItemName: string, isRenewal: boolean): number[] => {
    try {
      const saved = localStorage.getItem('pr2_products_list');
      const products = saved ? JSON.parse(saved) : CONFIG_PRODUCTS;
      const prod = products.find((p: any) => p.name === productItemName);
      return (isRenewal ? prod?.restrictedStagesRB : prod?.restrictedStages) || [];
    } catch (e) {
      return [];
    }
  };

  // Helper: this product's configured Document Requirements (Product Configuration
  // module), cumulative up to and including the given stage — moving straight from
  // 10% to 70% still carries the 30% requirements along. NB and RB are configured
  // separately since both stage sets include a 100% stage.
  const getDocumentRequirements = (productItemName: string, isRenewal: boolean) => {
    try {
      const savedProducts = localStorage.getItem('pr2_products_list');
      const products = savedProducts ? JSON.parse(savedProducts) : CONFIG_PRODUCTS;
      const prod = products.find((p: any) => p.name === productItemName);
      const requirements: { id: string; stage: number; attachmentName: string }[] =
        (isRenewal ? prod?.documentRequirementsRB : prod?.documentRequirements) || [];

      const savedAttachments = localStorage.getItem('pr2_attachment_definitions');
      const attachments: { name: string; fileType: 'Compulsory' | 'Optional' }[] = savedAttachments ? JSON.parse(savedAttachments) : [];

      return requirements.map(r => ({
        ...r,
        fileType: attachments.find(a => a.name === r.attachmentName)?.fileType || 'Optional' as const,
      }));
    } catch (e) {
      return [];
    }
  };

  // Stages the Opportunity may not be moved to yet because an earlier-or-equal stage's
  // Compulsory document (Product Configuration module) hasn't been uploaded — checked
  // cumulatively, so an unmet 10% requirement also blocks jumping straight to 30%+.
  const getUploadBlockedStages = (productItemName: string, isRenewal: boolean, uploadedRequirements: ProductFileRequirement[]): number[] => {
    const requirements = getDocumentRequirements(productItemName, isRenewal);
    const isSatisfied = (r: { stage: number; attachmentName: string }) => uploadedRequirements.some(f =>
      f.relatedProductItem === productItemName && f.checkStage === `${r.stage}%` && f.name === r.attachmentName && (f.files?.length || 0) > 0
    );
    const unmetStages = requirements.filter(r => r.fileType === 'Compulsory' && !isSatisfied(r)).map(r => r.stage);
    if (unmetStages.length === 0) return [];
    const earliestUnmetStage = Math.min(...unmetStages);
    const allStages = (isRenewal ? RB_PROBABILITY_OPTIONS : NB_PROBABILITY_OPTIONS).filter(s => s > 0);
    return allStages.filter(s => s >= earliestUnmetStage);
  };

  // Helper to get assigned GMI Product Group of productItem from config
  const getAssignedGmiProductGroup = (productItemName: string) => {
    try {
      const saved = localStorage.getItem('pr2_products_list');
      const products = saved ? JSON.parse(saved) : CONFIG_PRODUCTS;
      const prod = products.find((p: any) => p.name === productItemName);
      return prod?.gmiProductGroup || resolveFallbackGmiProductGroup(productItemName);
    } catch (e) {
      return resolveFallbackGmiProductGroup(productItemName);
    }
  };

  // Helper to list Detailed Product Items configured under a GMI Product Group
  // (Product Configuration module) — drives the Proposal's "Product Item Details" dropdown.
  const getDetailedProductOptions = (gmiProductGroupName: string): { id: string; name: string }[] => {
    try {
      const savedGroups = localStorage.getItem('pr2_gmi_groups_master');
      const gmiGroups = savedGroups ? JSON.parse(savedGroups) : [];
      const group = gmiGroups.find((g: any) => g.name.toLowerCase() === gmiProductGroupName.toLowerCase());
      if (!group || !Array.isArray(group.detailedProducts)) return [];
      return group.detailedProducts
        .filter((dp: any) => dp.status !== 'Archived')
        .map((dp: any) => ({ id: dp.id, name: dp.name }));
    } catch (e) {
      return [];
    }
  };

  // Helper to resolve benefits & coverages names based on GMI Group name
  const resolveBenefitsAndCoverages = (gmiProductGroupName: string) => {
    try {
      const savedGroups = localStorage.getItem('pr2_gmi_groups_master');
      const gmiGroups = savedGroups ? JSON.parse(savedGroups) : CONFIG_GMI_GROUPS_MASTER;

      const savedBenefits = localStorage.getItem('pr2_benefits_master');
      const benefitsMaster = savedBenefits ? JSON.parse(savedBenefits) : CONFIG_BENEFITS_MASTER;

      const savedCoverages = localStorage.getItem('pr2_coverages_master');
      const coveragesMaster = savedCoverages ? JSON.parse(savedCoverages) : CONFIG_COVERAGES_MASTER;

      const group = gmiGroups.find((g: any) => g.name.toLowerCase() === gmiProductGroupName.toLowerCase());
      if (!group) return { benefits: [], coverages: [] };

      const benefits = (group.benefits || []).map((id: string) => {
        const b = benefitsMaster.find((item: any) => item.id === id);
        return b ? b.name : id;
      });

      const coverages = (group.coverages || []).map((id: string) => {
        const c = coveragesMaster.find((item: any) => item.id === id);
        return c ? c.name : id;
      });

      return { benefits, coverages };
    } catch (e) {
      return { benefits: [], coverages: [] };
    }
  };

  const initialProductItem = proposal.productItem || 'Sample Care Gold';
  const initialProductTeam = resolveProductTeam(initialProductItem);
  const initialProductCategory = resolveProductCategory(initialProductItem);

  // State for Opportunity Page (Commercial)
  const buildInitialOpportunity = () => ({
    name: proposal.name,
    stage: proposal.stage || 'Draft',
    probability: proposal.probability || 30,
    // Effective Date, captured per stage: Date 1 shown Draft/Finalize/Policy, Date 2 shown Finalize/Policy, Date 3 shown Policy only
    effectiveDate1: proposal.effectiveDate || '2026-05-01',
    effectiveDate2: proposal.effectiveDate2 || '',
    effectiveDate3: proposal.effectiveDate3 || '',
    // Customer Info
    company: proposal.client || 'DEMO COMPANY CO. LTD.',
    masterType: proposal.masterType || resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.').masterType,
    // Product Info
    productTeam: initialProductTeam,
    productCategory: initialProductCategory,
    productItem: initialProductItem,
    detailedProductItem: proposal.detailedProductItem || '',
    businessType: proposal.businessType === 'Renewal' ? 'Renewal' : 'NB',
    campaign: proposal.campaign || CAMPAIGN_OPTIONS[0],
    // Sales Assignment — a single rep always holds the full 100% split
    salesRep1: proposal.salesRep || 'Sales Rep A',
    split1: proposal.split1 ?? 100,
    salesRep2: proposal.salesRep2 || '',
    split2: proposal.split2 ?? 0,
    salesRep3: proposal.salesRep3 || '',
    split3: proposal.split3 ?? 0,
    // Evaluation & Lifecycle
    lossReason: proposal.lostReason || '',
    tags: proposal.tags ?? ['Corporate', 'Q2 Outreach'],
    opportunityNotes: proposal.remarks || 'Sample company requested comparison for Ward vs Semi-Private coverage for demo members.',
    // System fields — system-generated, not user-editable
    opptyOdooId: proposal.opptyOdooId || `ODOO-${proposal.id}`,
    createdOn: '2026-03-20',
    opptyStageChangeDate: '2026-04-10',
    // Report & Dashboard
    salesRep1GrossAmount: proposal.salesRep1GrossAmount ?? 0,
    salesRep1NetAmount: proposal.salesRep1NetAmount ?? 0,
    salesRep2GrossAmount: proposal.salesRep2GrossAmount ?? 0,
    salesRep2NetAmount: proposal.salesRep2NetAmount ?? 0,
    salesRep3GrossAmount: proposal.salesRep3GrossAmount ?? 0,
    salesRep3NetAmount: proposal.salesRep3NetAmount ?? 0,
    opptyRejectDate: proposal.opptyRejectDate || '',
    opptyRejectFrequency: proposal.opptyRejectFrequency ?? 0,
    // Product File Requirements
    productFileRequirements: proposal.productFileRequirements ?? [
      { id: 'DOC-SEED-1', name: 'Appointment Letter', type: 'Compulsory' as const, relatedProductItem: 'Pension - MPF/ORSO Appointed Case Only', checkStage: 'Won 100%' }
    ],
  });
  const [editedOpportunity, setEditedOpportunity] = useState(buildInitialOpportunity);

  // Records open in read-only View mode by default; Edit must be explicitly entered
  const [isEditMode, setIsEditMode] = useState(false);

  // Add Sales Rep: Rep 1 is always shown; up to 2 more can be added (max 3 total)
  // Initialized from whichever reps are already saved, so reopening a multi-rep
  // Opportunity doesn't silently collapse back down to a single rep.
  const [numSalesReps, setNumSalesReps] = useState(() => proposal.salesRep3 ? 3 : proposal.salesRep2 ? 2 : 1);
  const [tagInput, setTagInput] = useState('');

  // Default Split % Allocation whenever a rep is added/removed (1 -> 100; 2 -> 75/25;
  // 3 -> 50/25/25) — applied only on an actual rep-count change, not on every re-entry
  // into edit mode, so a manually-adjusted split isn't silently reset.
  const prevNumSalesRepsRef = useRef(numSalesReps);
  useEffect(() => {
    if (!isEditMode) return;
    if (prevNumSalesRepsRef.current === numSalesReps) return;
    prevNumSalesRepsRef.current = numSalesReps;
    setEditedOpportunity(prev => {
      if (numSalesReps === 1) return { ...prev, split1: 100, split2: 0, split3: 0 };
      if (numSalesReps === 2) return { ...prev, split1: 75, split2: 25, split3: 0 };
      return { ...prev, split1: 50, split2: 25, split3: 25 };
    });
  }, [numSalesReps, isEditMode]);

  // Whole numbers only, clamped to 0-100 — a stray decimal or out-of-range paste
  // is normalized here regardless of what slipped past the input's own key filter.
  const clampSplit = (raw: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(raw) ? raw : 0)));

  const handleSplit1Change = (raw: number) => {
    const val = clampSplit(raw);
    setEditedOpportunity(prev => {
      if (numSalesReps === 2) return { ...prev, split1: val, split2: 100 - val };
      if (numSalesReps === 3) {
        // If Rep 1's new value no longer leaves room for Rep 2's current split,
        // deduct the difference from Rep 2 instead of just zeroing Rep 3 into overflow.
        const split2 = Math.min(prev.split2, 100 - val);
        return { ...prev, split1: val, split2, split3: 100 - val - split2 };
      }
      return { ...prev, split1: val };
    });
  };
  const handleSplit2Change = (raw: number) => {
    const val = clampSplit(raw);
    setEditedOpportunity(prev => {
      // Same auto-deduction, mirrored: Rep 2's new value takes priority, Rep 1 yields room.
      const split1 = Math.min(prev.split1, 100 - val);
      return { ...prev, split1, split2: val, split3: 100 - split1 - val };
    });
  };
  // Blocks decimal/negative/exponent characters at the keystroke level; clampSplit
  // above is the backstop for anything that still gets through (e.g. paste).
  const blockNonIntegerKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };
  // Number inputs change value on scroll when focused, which is easy to trigger
  // by accident while scrolling the page — blur so a stray wheel event is a no-op.
  const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur();

  // Company / Individual selector: two-step (entityType then source); name search is
  // handled inline by the SearchableDropdown itself.
  const initialCompanyMeta = resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.');
  const [companyEntityType, setCompanyEntityType] = useState<'Company' | 'Individual'>(initialCompanyMeta.entityType);
  const [companySource, setCompanySource] = useState<'Customer' | 'Lead'>(initialCompanyMeta.source);
  const filteredCompanyOptions = COMPANY_INDIVIDUAL_OPTIONS.filter(o =>
    o.entityType === companyEntityType && o.source === companySource
  );

  const handleToggleCompanyEntityType = (t: 'Company' | 'Individual') => {
    setCompanyEntityType(t);
    const opts = COMPANY_INDIVIDUAL_OPTIONS.filter(o => o.entityType === t && o.source === companySource);
    setEditedOpportunity(prev => ({ ...prev, company: opts[0]?.label || '', masterType: opts[0]?.masterType || 'Customer' }));
  };
  const handleToggleCompanySource = (t: 'Customer' | 'Lead') => {
    setCompanySource(t);
    const opts = COMPANY_INDIVIDUAL_OPTIONS.filter(o => o.entityType === companyEntityType && o.source === t);
    setEditedOpportunity(prev => ({ ...prev, company: opts[0]?.label || '', masterType: opts[0]?.masterType || 'Customer' }));
  };

  const handleCancelEdit = () => {
    setEditedOpportunity(buildInitialOpportunity());
    setNumSalesReps(1);
    const meta = resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.');
    setCompanyEntityType(meta.entityType);
    setCompanySource(meta.source);
    setIsEditMode(false);
  };

  // Whether the Opportunity draft has been touched since entering Edit mode —
  // compares against a freshly-built baseline from the saved `proposal`, the
  // same "recompute and diff" approach used for unsaved-changes checks in the
  // Product Configuration module.
  const isOpportunityDirty = () => isEditMode && JSON.stringify(editedOpportunity) !== JSON.stringify(buildInitialOpportunity());

  // Guards any navigation away from this Opportunity (back to Pipeline, jumping
  // to a Linked Prospect, switching modules) so an in-progress, unsaved edit
  // isn't silently discarded by a stray click elsewhere.
  const confirmDiscardOpportunityChanges = () => {
    if (!isOpportunityDirty()) return true;
    return confirm('You have unsaved changes to this Opportunity. Leave and discard them?');
  };

  // State for Child Proposals Map. Real progress is persisted onto proposal.childProposals
  // (see the sync effect below) so it survives navigating away and back. Only fall back to
  // the static demo seed when this Opportunity has never had any Proposal saved before —
  // and only if it has already reached 100% (the Proposal tab is locked below 100%, so an
  // Opportunity that hasn't reached 100% yet — including a freshly auto-created renewal
  // Prospect — must start with no Proposal content at all).
  const [childProposals, setChildProposals] = useState<ChildProposal[]>(() => proposal.childProposals ?? (proposal.probability !== 100 ? [] : [
    {
      id: 'P-2026-0001',
      name: 'Demo Company Healthcare Plan Option A',
      version: 'v1.0',
      status: 'Approved',
      vendor: 'AIA',
      premium: 145000,
      commissionRate: 15,
      effectiveDate: '2026-05-01',
      createdDate: '2026-03-01',
      lastUpdated: '2026-04-10',
      createdBy: 'Sales Rep A',
      updatedBy: 'Sales Rep C',
      summary: 'Comprehensive scheme offering premium semi-private hospitalization limits with $50 clinical network co-pay.',
      isCurrent: true,
      locationType: 'Hong Kong',
      productTeam: 'EBP Team',
      productCategory: 'Group Medical',
      productItem: 'Sample Care Gold',
      gmiProductGroup: 'General Insurance',
      selectedProducts: ['Sample Insurer Medical Option A', 'Demo Premium Plan'],
      standardPremium: 145000,
      premiumFrequency: 'Annual',
      currency: 'HKD',
      renewRequired: undefined,
      benefitType: 'Core Benefit',
      finalizedDate: '',
      debitNoteNo: 'DN-DEMO-001',
      policyStatus: 'Active',
      loadedBenefits: ['Critical Illness Benefit', 'Major Medical Coverage'],
      loadedCoverages: ['Worldwide', 'Worldwide (excluding US)'],
      industry: 'Entertainment and Media',
      classOfProtection: 'Statutory',
      internalReference: 'Gain Miles Billing',
      clientDiscountAmount: 0,
      endDate: '2027-04-30',
      salesCode: 'SR-A01',
      salesPercentage: 100,
      presentIncurredAmount: 0,
      presentPaidAmount: 0,
      previousIncurredAmount: 0,
      previousPaidAmount: 0,
      premiumType: 'Per Rate',
      premiumAdjustment: 0,
      proposalPremium: 145000,
      premiumBreakdown: [
        { employeeClass: 'Key Executive', gmCategory: '1', premium: 90000, employee: 8, spouse: 2, children: 1, other: 0 },
        { employeeClass: 'Supervisory Staff', gmCategory: '2', premium: 35000, employee: 12, spouse: 3, children: 2, other: 0 },
        { employeeClass: 'General Staff', gmCategory: '3', premium: 20000, employee: 25, spouse: 5, children: 3, other: 0 },
      ],
      benefitPremiums: [{ benefit: 'GROUP MEDICAL INSURANCE', customerCategory: '1', perPlanPremium: 145000 }],
      expiryDate: '2027-04-30',
      billingMethod: 'Gain Miles Billing'
    },
    {
      id: 'P-2026-0002',
      name: 'Demo Company Alternative Budget Option B',
      version: 'v1.1',
      status: 'In Progress',
      vendor: 'Bupa',
      premium: 128000,
      commissionRate: 12.5,
      effectiveDate: '2026-05-01',
      createdDate: '2026-03-15',
      lastUpdated: '2026-04-02',
      createdBy: 'Sales Rep A',
      updatedBy: 'Sales Rep A',
      summary: 'Value-focused alternative with ward-level accommodation and 20% clinical cost-sharing co-insurance.',
      isCurrent: false,
      locationType: 'Macau',
      productTeam: 'EBP Team',
      productCategory: 'Group Medical',
      productItem: 'Demo Ward Plan',
      gmiProductGroup: 'Employee Benefit & General Insurance',
      selectedProducts: ['Bupa Premium Plan'],
      standardPremium: 128000,
      premiumFrequency: 'Annual',
      currency: 'HKD',
      renewRequired: 'Yes',
      benefitType: 'Co-Share',
      finalizedDate: '',
      debitNoteNo: '',
      policyStatus: '',
      industry: 'Retail',
      classOfProtection: 'Voluntary',
      internalReference: 'Direct Billing',
      clientDiscountAmount: 500,
      endDate: '2027-04-30',
      salesCode: 'SR-A01',
      salesPercentage: 100,
      presentIncurredAmount: 0,
      presentPaidAmount: 0,
      previousIncurredAmount: 0,
      previousPaidAmount: 0,
      premiumType: 'Per Rate',
      premiumAdjustment: 0,
      proposalPremium: 128000,
      premiumBreakdown: [{ employeeClass: 'General Staff', gmCategory: '1', premium: 128000, employee: 40, spouse: 6, children: 4, other: 0 }],
      benefitPremiums: [{ benefit: 'GROUP MEDICAL INSURANCE', customerCategory: '1', perPlanPremium: 128000 }],
      expiryDate: '2027-04-30',
      billingMethod: 'Direct Billing'
    }
  ]));

  // Persist Proposal-workspace progress onto the Opportunity itself so it survives
  // navigating away and back — otherwise it only ever lived in this component's local
  // state and got silently discarded (replaced by the demo seed above) on remount.
  const isFirstChildProposalsRender = React.useRef(true);
  useEffect(() => {
    if (isFirstChildProposalsRender.current) {
      isFirstChildProposalsRender.current = false;
      return;
    }
    onSave?.({ ...proposal, childProposals });
  }, [childProposals]);

  // Product File Requirement uploads are available regardless of Edit mode, so they
  // persist immediately too — otherwise a file uploaded outside an explicit "Save
  // Opportunity" would only live in the local draft and vanish on navigating away.
  const isFirstProductFileRequirementsRender = React.useRef(true);
  useEffect(() => {
    if (isFirstProductFileRequirementsRender.current) {
      isFirstProductFileRequirementsRender.current = false;
      return;
    }
    onSave?.({ ...proposal, productFileRequirements: editedOpportunity.productFileRequirements });
  }, [editedOpportunity.productFileRequirements]);

  // EB Fact Finding State (Case Setup)
  const [factFinding, setFactFinding] = useState({
    companyName: 'DEMO COMPANY CO. LTD.',
    industry: 'Entertainment and Media',
    employeeCount: 45,
    existingCustomer: 'No',
    currentInsurer: 'Sample Insurer Ltd',
    existingScheme: 'Demo Group Health Plan',
    policyRenewalDate: '2026-05-01',
    policyEffectiveDate: '2026-05-01',
    currentBroker: 'Demo Broker Agent',
    mpfScheme: 'Demo MPF Retirement Plan',
    annualContribution: 840000,
    assetValue: 4200000,
    employerOption: 'Voluntary Scheme Available',
    insuredEmployeesCount: 45,
    benefitSummary: 'Ward level cover for general staff, GP consultation limit HK$150 network.',
    lossRatio: '68.0%',
    claimHistory: 'Sample claim history data for demo purposes.',
    renewalObjective: 'Maintain standard premium while enhancing dental benefits.',
    budget: 'HK$150,000 max annual budget',
    specialRequirements: 'Must include 2 visits of annual dental scaling coverage without co-pay.'
  });

  // Benefit Design Plans Column State
  interface MatrixPlan {
    id: string;
    name: string;
    class: string;
    eligibility: string;
    emp: string;
    spouse: string;
    child: string;
  }
  const [plansList, setPlansList] = useState<MatrixPlan[]>([
    { id: 'p1', name: 'Plan 1: Executive', class: 'Grade A Executive', eligibility: 'Directors', emp: '5', spouse: '2', child: '2' },
    { id: 'p2', name: 'Plan 2: General', class: 'Grade B General', eligibility: 'All Staff', emp: '40', spouse: '0', child: '0' }
  ]);

  // Excel-style Benefit Matrix State
  interface MatrixRow {
    id: string;
    category: string;
    item: string;
    values: { [key: string]: string };
    marketAvg: string;
  }
  const [benefitMatrix, setBenefitMatrix] = useState<MatrixRow[]>([
    {
      id: 'rb',
      category: 'Hospitalization & Surgical',
      item: 'Room & Board (Per Day Cap)',
      values: { 'p1': 'Semi-Private (Full Cover)', 'p2': 'Ward Room (Full Cover)' },
      marketAvg: 'Semi-Private Room'
    },
    {
      id: 'surg',
      category: 'Hospitalization & Surgical',
      item: 'Surgeon Fee (Per Disability)',
      values: { 'p1': 'HK$120,000', 'p2': 'HK$60,000' },
      marketAvg: 'HK$80,000'
    },
    {
      id: 'icu',
      category: 'Hospitalization & Surgical',
      item: 'Intensive Care Unit (ICU)',
      values: { 'p1': 'Full Cover (Max 120 Days)', 'p2': 'Full Cover (Max 60 Days)' },
      marketAvg: 'Full Cover'
    },
    {
      id: 'hosp_misc',
      category: 'Hospitalization & Surgical',
      item: 'Hospital Miscellaneous Limits',
      values: { 'p1': 'HK$40,000', 'p2': 'HK$20,000' },
      marketAvg: 'HK$30,000'
    },
    {
      id: 'gp',
      category: 'Clinical & Outpatient',
      item: 'General Practitioner Consultation',
      values: { 'p1': 'Network: Free · Non-network: 80%', 'p2': 'Network: HK$50 co-pay' },
      marketAvg: 'Network: HK$50 co-pay'
    },
    {
      id: 'sp',
      category: 'Clinical & Outpatient',
      item: 'Specialist Outpatient Consultation',
      values: { 'p1': 'HK$1,000 / Visit (Max 30 Visits)', 'p2': 'HK$500 / Visit (Max 15 Visits)' },
      marketAvg: 'HK$600 Per Visit'
    },
    {
      id: 'diag',
      category: 'Clinical & Outpatient',
      item: 'Diagnostic, X-ray & Lab Test',
      values: { 'p1': 'HK$5,000 / Year', 'p2': 'HK$2,500 / Year' },
      marketAvg: 'HK$3,000 / Year'
    },
    {
      id: 'dent_scale',
      category: 'Dental Care',
      item: 'Scaling & Polishing (Annual)',
      values: { 'p1': 'Full Cover (2 visits)', 'p2': '80% up to HK$1,000' },
      marketAvg: '80% up to HK$1,500'
    },
    {
      id: 'dent_ext',
      category: 'Dental Care',
      item: 'Extraction & Fillings',
      values: { 'p1': 'HK$3,000 / Year', 'p2': 'Not Covered' },
      marketAvg: 'HK$2,000 / Year'
    }
  ]);

  // Coverage Schedule State — flat coverage-line model mirroring the live GMI "Coverages" step
  // (Benefit -> Coverage -> Category -> Employee Class -> Coverage Value -> Benchmark median).
  interface CoverageLine {
    id: string;
    benefit: string;
    coverage: string;
    category: string;
    employeeClass: string;
    coverageValue: string;
    benchmarkMedian: string;
  }
  const COVERAGE_CATEGORIES = ['Hospitalization & Surgical', 'Clinical & Outpatient', 'Dental Care', 'Supplementary Medical Rider'];
  const [coverageRows, setCoverageRows] = useState<CoverageLine[]>([
    { id: 'cov1', benefit: 'Hospital & Surgical', coverage: 'Room & Board (Per Day)', category: 'Hospitalization & Surgical', employeeClass: 'Plan 1: Executive', coverageValue: 'Semi-Private (Full Cover)', benchmarkMedian: 'Semi-Private Room' },
    { id: 'cov2', benefit: 'Hospital & Surgical', coverage: 'Surgeon Fee (Per Disability)', category: 'Hospitalization & Surgical', employeeClass: 'Plan 2: General', coverageValue: 'HK$60,000', benchmarkMedian: 'HK$80,000' },
    { id: 'cov3', benefit: 'Outpatient', coverage: 'GP Consultation', category: 'Clinical & Outpatient', employeeClass: 'Plan 1: Executive', coverageValue: 'Network: Free', benchmarkMedian: 'HK$50 co-pay' },
    { id: 'cov4', benefit: 'Dental', coverage: 'Scaling & Polishing (Annual)', category: 'Dental Care', employeeClass: 'Plan 2: General', coverageValue: '80% up to HK$1,000', benchmarkMedian: '80% up to HK$1,500' }
  ]);
  const [covDraft, setCovDraft] = useState({ benefit: '', coverage: '', category: 'Hospitalization & Surgical', employeeClass: '' });
  const [covSearch, setCovSearch] = useState('');
  const [covInsurerAlias, setCovInsurerAlias] = useState('');
  const [covBenchmarkTag, setCovBenchmarkTag] = useState('');
  const [covSelected, setCovSelected] = useState<string[]>([]);
  const [covPageSize, setCovPageSize] = useState(25);
  const [covPage, setCovPage] = useState(1);
  const [covGroupFilter, setCovGroupFilter] = useState('ALL');
  const [covPlanFilter, setCovPlanFilter] = useState('ALL');

  const addCoverageRow = () => {
    if (!covDraft.benefit.trim() || !covDraft.coverage.trim()) return;
    const employeeClass = covDraft.employeeClass || (plansList[0]?.name ?? '');
    setCoverageRows(prev => [...prev, {
      id: `cov_${Date.now()}`,
      benefit: covDraft.benefit.trim(),
      coverage: covDraft.coverage.trim(),
      category: covDraft.category,
      employeeClass,
      coverageValue: '',
      benchmarkMedian: ''
    }]);
    setCovDraft({ benefit: '', coverage: '', category: covDraft.category, employeeClass: '' });
  };
  const updateCoverageRow = (id: string, patch: Partial<CoverageLine>) =>
    setCoverageRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const deleteCoverageRow = (id: string) => {
    setCoverageRows(prev => prev.filter(r => r.id !== id));
    setCovSelected(prev => prev.filter(s => s !== id));
  };
  const deleteSelectedCoverages = () => {
    setCoverageRows(prev => prev.filter(r => !covSelected.includes(r.id)));
    setCovSelected([]);
  };

  // Premium Rate Calculation State — editable Sum Insured x Rate -> Per Plan Premium,
  // mirroring the live GMI "Premium" step (per-benefit rate lines + plan totals).
  interface PremiumRateLine {
    id: string;
    benefit: string;
    employeeClass: string;
    sumInsured: number;
    rate: number; // percent
  }
  const [premiumRates, setPremiumRates] = useState<PremiumRateLine[]>([
    { id: 'pr1', benefit: 'Hospital & Surgical', employeeClass: 'Plan 1: Executive', sumInsured: 120000, rate: 6.5 },
    { id: 'pr2', benefit: 'Hospital & Surgical', employeeClass: 'Plan 2: General', sumInsured: 60000, rate: 8 },
    { id: 'pr3', benefit: 'Outpatient', employeeClass: 'Plan 1: Executive', sumInsured: 8000, rate: 12 },
    { id: 'pr4', benefit: 'Dental', employeeClass: 'Plan 2: General', sumInsured: 5000, rate: 15 }
  ]);
  const [rateDraft, setRateDraft] = useState({ benefit: '', employeeClass: '', sumInsured: '', rate: '' });
  const perPlanPremium = (line: { sumInsured: number; rate: number }) =>
    Math.round(line.sumInsured * line.rate / 100 * 100) / 100;
  const addRateRow = () => {
    if (!rateDraft.benefit.trim()) return;
    setPremiumRates(prev => [...prev, {
      id: `pr_${Date.now()}`,
      benefit: rateDraft.benefit.trim(),
      employeeClass: rateDraft.employeeClass || (plansList[0]?.name ?? ''),
      sumInsured: Number(rateDraft.sumInsured) || 0,
      rate: Number(rateDraft.rate) || 0
    }]);
    setRateDraft({ benefit: '', employeeClass: '', sumInsured: '', rate: '' });
  };
  const updateRateRow = (id: string, patch: Partial<PremiumRateLine>) =>
    setPremiumRates(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const deleteRateRow = (id: string) => setPremiumRates(prev => prev.filter(r => r.id !== id));

  // Employee Class Census State — Basic Info block mirroring the live GMI "Employee Class"
  // entry (GMI Research Sum Class Category + Customer Plan Class + EE/SP/CH/OH counts).
  interface EmpClassRow {
    id: string;
    gmiResearchSumClass: string;
    customerPlanClass: string;
    emp: number;
    spouse: number;
    child: number;
    other: number;
  }
  const GMI_RESEARCH_SUM_CLASSES = ['UNI Class', 'Executive Class', 'General Class', 'Manager Class', 'Assistant Class'];
  const [empClassCensus, setEmpClassCensus] = useState<EmpClassRow[]>([
    { id: 'ec1', gmiResearchSumClass: 'UNI Class', customerPlanClass: 'Plan 1', emp: 7, spouse: 0, child: 0, other: 0 }
  ]);
  const [empDraft, setEmpDraft] = useState({ gmiResearchSumClass: 'UNI Class', customerPlanClass: '', emp: '', spouse: '', child: '', other: '' });
  const addEmpClassRow = () => {
    if (!empDraft.customerPlanClass.trim()) return;
    setEmpClassCensus(prev => [...prev, {
      id: `ec_${Date.now()}`,
      gmiResearchSumClass: empDraft.gmiResearchSumClass,
      customerPlanClass: empDraft.customerPlanClass.trim(),
      emp: Number(empDraft.emp) || 0,
      spouse: Number(empDraft.spouse) || 0,
      child: Number(empDraft.child) || 0,
      other: Number(empDraft.other) || 0
    }]);
    setEmpDraft({ gmiResearchSumClass: empDraft.gmiResearchSumClass, customerPlanClass: '', emp: '', spouse: '', child: '', other: '' });
  };
  const updateEmpClassRow = (id: string, patch: Partial<EmpClassRow>) =>
    setEmpClassCensus(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const deleteEmpClassRow = (id: string) => setEmpClassCensus(prev => prev.filter(r => r.id !== id));

  // Selected Child Proposal State (null = Opportunity Page, object = Proposal Workspace)
  const [selectedChild, setSelectedChild] = useState<ChildProposal | null>(null);

  // Keep the parent childProposals list in sync with the selectedChild (Proposal Workspace)
  useEffect(() => {
    if (selectedChild) {
      setChildProposals(prev =>
        prev.map(item => item.id === selectedChild.id ? selectedChild : item)
      );
    }
  }, [selectedChild]);

  // Dynamic resolution for active child proposal in Benefit Design
  const activeChildGmiResolution = useMemo(() => {
    if (!selectedChild) return { group: '', benefits: [], coverages: [] };
    const childItemName = selectedChild.productItem || 'Sample Care Gold';
    const group = getAssignedGmiProductGroup(childItemName);
    const { benefits, coverages } = resolveBenefitsAndCoverages(group);
    return { group, benefits, coverages };
  }, [selectedChild?.productItem]);

  // Load products to drive the Evaluation matrix
  const [productList, setProductList] = useState<any[]>(() => {
    const saved = localStorage.getItem('pr2_products_list');
    if (saved) {
      try { return stripRemovedProductFields(JSON.parse(saved)); } catch (e) { /* fall through to defaults below */ }
    }
    return [
      {
        id: 'PROD-001',
        name: 'Demo Pension Choice Premium',
        team: 'EB(GMED/GL/Tender)',
        group: 'Pension',
        appliedCompanyType: 'Company',
        salesCreditRule: 'Formula 1',
        vendorFields: [
          { name: 'Existing Scheme 1', visible: true, required: false },
          { name: 'Existing Scheme 2', visible: true, required: false },
          { name: 'Proposed Service Provider', visible: true, required: true },
          { name: 'Proposed Insurer', visible: true, required: true }
        ],
        premiumFields: [
          { name: 'Total Annual Contribution', visible: true, required: false },
          { name: 'Total ATO', visible: true, required: false },
          { name: 'Employer Option', visible: true, required: false }
        ],
        dateTransferFields: [
          { name: 'No. of Briefing Sessions', visible: true, required: false },
          { name: 'Member Briefing Speaker', visible: true, required: false },
          { name: 'Total Briefing Attendees', visible: true, required: false },
          { name: 'No. of Employee Transfer Est by ES', visible: true, required: false }
        ]
      },
      {
        id: 'PROD-002',
        name: 'Demo Medical Care Tier A',
        team: 'EB(GMED/GL/Tender)',
        group: 'Employee Benefit & General Insurance',
        appliedCompanyType: 'Company',
        salesCreditRule: 'Formula 2',
        vendorFields: [
          { name: 'Proposed Service Provider', visible: true, required: true },
          { name: 'Existing Insurer', visible: true, required: false }
        ],
        premiumFields: [
          { name: 'Est Premium', visible: true, required: true },
          { name: 'Commission Amount', visible: true, required: false }
        ],
        dateTransferFields: [
          { name: 'Application Date', visible: true, required: false },
          { name: 'Form Received Date', visible: true, required: false }
        ]
      },
      {
        id: 'PROD-003',
        name: 'Demo Growth iFast Account',
        team: 'Others',
        group: 'iFast',
        appliedCompanyType: 'Individual',
        salesCreditRule: 'Formula 4',
        vendorFields: [],
        premiumFields: [
          { name: 'Lump Sum Amount', visible: true, required: true },
          { name: 'Transaction Amount', visible: true, required: false }
        ],
        dateTransferFields: [
          { name: 'Date to Client', visible: true, required: false },
          { name: 'Form Received Date', visible: true, required: false }
        ]
      },
      {
        id: 'PROD-005',
        name: 'Sample Care Gold',
        team: 'EB(GMED/GL/Tender)',
        group: 'Employee Benefit & General Insurance',
        appliedCompanyType: 'Company',
        salesCreditRule: 'Formula 2',
        vendorFields: [
          { name: 'Proposed Service Provider', visible: true, required: true },
          { name: 'Existing Insurer', visible: true, required: false }
        ],
        premiumFields: [
          { name: 'Est Premium', visible: true, required: true },
          { name: 'Commission Amount', visible: true, required: false }
        ],
        dateTransferFields: [
          { name: 'Application Date', visible: true, required: false },
          { name: 'Form Received Date', visible: true, required: false }
        ]
      },
      {
        id: 'PROD-006',
        name: 'Demo Shield Bronze',
        team: 'EB(GMED/GL/Tender)',
        group: 'Employee Benefit & General Insurance',
        appliedCompanyType: 'Company',
        salesCreditRule: 'Formula 3',
        vendorFields: [
          { name: 'Proposed Service Provider', visible: true, required: true },
          { name: 'Existing Insurer', visible: true, required: false }
        ],
        premiumFields: [
          { name: 'Est Premium', visible: true, required: true }
        ],
        dateTransferFields: [
          { name: 'Application Date', visible: true, required: false }
        ]
      }
    ];
  });

  const selectedProduct = useMemo(() => {
    return productList.find(p => p.name === editedOpportunity.productItem) || productList[0];
  }, [productList, editedOpportunity.productItem]);

  const [evaluationValues, setEvaluationValues] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`pr2_opp_eval_${proposal.id}`);
    const fallback = {
      'Proposed Service Provider': 'AIA International',
      'Existing Insurer': 'Manulife (International)',
      'Est Premium': '150000.00',
      'Est Commission Rate': '15.00',
      'Application Date': '2026-03-25',
      'Form Received Date': '2026-03-24',
      'No. of Briefing Sessions': '2',
      'Member Briefing Speaker': 'Chan Tai Man',
      'Total Briefing Attendees': '38',
      'No. of Employee Transfer Est by ES': '40'
    };
    if (!saved) return fallback;
    try { return JSON.parse(saved); } catch (e) { return fallback; }
  });

  const handleSaveEvaluation = (values: Record<string, string>) => {
    setEvaluationValues(values);
    localStorage.setItem(`pr2_opp_eval_${proposal.id}`, JSON.stringify(values));
  };

  // MPF Scheme master list (shared across proposals via localStorage)
  // MPF Scheme master list — read-only here; managed on the Opportunity Configuration page.
  const [mpfSchemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('pr2_mpf_schemes');
    if (!saved) return INITIAL_MPF_SCHEMES;
    try { return JSON.parse(saved); } catch (e) { return INITIAL_MPF_SCHEMES; }
  });

  // Employer Option master list — read-only here; managed on the Opportunity Configuration page.
  const [employerOptions] = useState<EmployerOptionConfig[]>(() => {
    const saved = localStorage.getItem('pr2_employer_options');
    if (!saved) return INITIAL_EMPLOYER_OPTIONS;
    try { return JSON.parse(saved); } catch (e) { return INITIAL_EMPLOYER_OPTIONS; }
  });

  // Generic renderer for a Product Opportunity Evaluation field, driven by EVAL_FIELD_SPECS
  const renderEvalField = (f: { name: string; required?: boolean }) => {
    const spec = EVAL_FIELD_SPECS[f.name] || { type: 'text' as const };
    const rawValue = evaluationValues[f.name] || '';
    const commonInputClass = "w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium";

    if (spec.type === 'auto2') {
      const computed = spec.formula ? spec.formula(evaluationValues) : 0;
      return (
        <FieldView key={f.name} label={f.name} required={f.required} editing={isEditMode} viewValue={formatDecimal2(computed)}>
          <input type="text" value={formatDecimal2(computed)} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono font-bold cursor-not-allowed outline-none" />
        </FieldView>
      );
    }

    let control: React.ReactNode;
    let viewValue: React.ReactNode = rawValue || '—';

    switch (spec.type) {
      case 'integer':
        control = (
          <input
            type="number" step={1} value={rawValue}
            onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value.replace(/[^0-9-]/g, '') })}
            placeholder={`Enter ${f.name}`} className={`${commonInputClass} font-mono`}
          />
        );
        break;
      case 'decimal2':
        control = (
          <input
            type="number" step="0.01" value={rawValue}
            onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
            onBlur={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: formatDecimal2(e.target.value) })}
            placeholder={`Enter ${f.name}`} className={`${commonInputClass} font-mono`}
          />
        );
        viewValue = rawValue ? formatDecimal2(rawValue) : '—';
        break;
      case 'percent2':
        control = (
          <div className="relative">
            <input
              type="number" step="0.01" max={100} value={rawValue}
              onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
              onBlur={e => {
                const num = parseFloat(e.target.value);
                const capped = isNaN(num) ? e.target.value : Math.min(100, num);
                handleSaveEvaluation({ ...evaluationValues, [f.name]: formatDecimal2(capped) });
              }}
              placeholder={`Enter ${f.name}`} className={`${commonInputClass} font-mono pr-6`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
          </div>
        );
        viewValue = rawValue ? `${formatDecimal2(rawValue)}%` : '—';
        break;
      case 'date':
        control = (
          <input
            type="date" value={rawValue}
            onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
            className={`${commonInputClass} font-mono`}
          />
        );
        break;
      case 'mpf-lookup':
      case 'insurer-lookup': {
        const options = spec.type === 'mpf-lookup' ? mpfSchemes : INITIAL_INSURERS;
        const manageLabel = spec.type === 'mpf-lookup' ? 'MPF Scheme' : 'Insurer';
        control = (
          <SearchableDropdown
            className="w-full"
            value={rawValue}
            options={options.map(o => ({ id: o, label: o, value: o }))}
            onSelect={o => handleSaveEvaluation({ ...evaluationValues, [f.name]: o })}
            placeholder={`Search ${manageLabel}...`}
            buttonPlaceholder={`Select ${manageLabel}`}
          />
        );
        break;
      }
      case 'employer-option':
        control = (
          <SearchableDropdown
            className="w-full"
            value={rawValue}
            options={employerOptions.map(o => ({ id: o.name, label: o.name, value: o.name }))}
            onSelect={employerName => {
              const employer = employerOptions.find(o => o.name === employerName);
              handleSaveEvaluation({
                ...evaluationValues,
                [f.name]: employerName,
                'Est Conversion Rate - Contribution (%)': employer ? formatDecimal2(employer.contributionWeighting) : '',
                'Est Conversion Rate - Asset Transfer (%)': employer ? formatDecimal2(employer.assetTransferWeighting) : '',
              });
            }}
            placeholder="Search Employer Option..."
            buttonPlaceholder="Select Employer Option"
          />
        );
        break;
      case 'readonly-percent2':
        control = (
          <div className="relative">
            <input type="text" value={rawValue ? formatDecimal2(rawValue) : ''} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono font-bold outline-none cursor-not-allowed pr-6" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
          </div>
        );
        viewValue = rawValue ? `${formatDecimal2(rawValue)}%` : '—';
        break;
      case 'employee-lookup':
        control = (
          <SearchableDropdown
            className="w-full"
            value={rawValue}
            options={EMPLOYEE_DIRECTORY.map(o => ({ id: o, label: o, value: o }))}
            onSelect={o => handleSaveEvaluation({ ...evaluationValues, [f.name]: o })}
            placeholder="Search Employee..."
            buttonPlaceholder="Select Employee"
          />
        );
        break;
      default:
        control = (
          <input
            type="text" value={rawValue}
            onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
            placeholder={`Enter ${f.name}`} className={commonInputClass}
          />
        );
    }

    return (
      <FieldView key={f.name} label={f.name} required={f.required} editing={isEditMode} viewValue={viewValue}>
        {control}
      </FieldView>
    );
  };

  // Not configurable in Product Setting: these 3 sub-fields appear under an
  // Existing Scheme N field the moment that scheme has a value, and are always
  // required while shown (independent of Existing Scheme N's own required flag).
  const renderSchemeSubFields = (fieldName: string) => {
    const match = fieldName.match(/^Existing Scheme (\d)$/);
    if (!match || !evaluationValues[fieldName]) return null;
    const n = match[1];
    return (
      <React.Fragment key={`${fieldName}-subfields`}>
        {renderEvalField({ name: `No. of Employee / Insured (Existing Scheme ${n})`, required: true })}
        {renderEvalField({ name: `Current Annual Contribution (Existing Scheme ${n})`, required: true })}
        {renderEvalField({ name: `Current Net Asset Value (Existing Scheme ${n})`, required: true })}
      </React.Fragment>
    );
  };

  // Gross Amount is read-only, sourced from Product Opportunity Evaluation.
  // No formula engine exists yet for the per-product "Formula 1/2/3/4" rules, so this
  // mirrors the proposal's base revenue figure rather than fabricating a calculation.
  const grossAmount = proposal.expectedRevenueGross || 0;
  const netAmount = Math.round(grossAmount * (editedOpportunity.probability / 100));

  // Listen to any external changes to localStorage for product list
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('pr2_products_list');
      if (saved) {
        // A corrupted write from another tab shouldn't crash this one — keep
        // whatever product list is already loaded if the new value is unreadable.
        try { setProductList(JSON.parse(saved)); } catch (e) { /* ignore, keep current list */ }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Warn on tab close/refresh while an Opportunity edit is in progress and unsaved —
  // in-page navigation (Back, Linked Prospect) is guarded separately above, this
  // covers leaving the page/app entirely.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isOpportunityDirty()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  useEffect(() => {
    onDirtyStateChange?.(isOpportunityDirty());
    // Report on unmount too, so a parent that cached "dirty" doesn't stay stuck
    // once this Opportunity is no longer the one being viewed.
    return () => onDirtyStateChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editedOpportunity]);

  // Navigations state
  const [activeProspectTab, setActiveProspectTab] = useState<'Opportunity' | 'Proposal'>('Opportunity');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'proposal' | 'premium' | 'documents' | 'benefits' | 'renewal-history' | 'preview'>('proposal');
  const [previewSubTab, setPreviewSubTab] = useState<'summary' | 'coverage' | 'expired' | 'premium'>('summary');
  const [previewingDoc, setPreviewingDoc] = useState<any | null>(null);

  // Activities Log State
  const [activities, setActivities] = useState([
    { id: 1, type: 'Call', subject: 'Initial Discovery', date: '2026-03-22', notes: 'Discussed employee budget and basic inpatient needs with HR contact.', user: 'Sales Rep A' },
    { id: 2, type: 'Meeting', subject: 'Plan Presentation', date: '2026-03-28', notes: 'Presented Option A and gathered feedback on plan structures.', user: 'Sales Rep A' }
  ]);
  const [newActivity, setNewActivity] = useState({ type: 'Call', subject: '', notes: '' });

  // Document Upload State
  const [documents, setDocuments] = useState([
    { id: 'D1', name: 'demo_quotation.pdf', category: 'Bills and Policy Doc.', date: '2026-03-25', size: '2.4 MB' },
    { id: 'D2', name: 'sample_benefit_comparison.pdf', category: 'Correspondence', date: '2026-04-01', size: '1.8 MB' }
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Filing Service X — GUM CSPA typed folder taxonomy (2027 P4)
  const CSPA_FOLDERS = ['AML & BR', 'Claim Exp Report', 'Claims', 'Correspondence', 'Insurance Bill', 'Leaflet', 'Member List', 'Movement & Adj Rep', 'Policy & End & Benefit Schedule', 'Quotation & MCR', 'Underwriting'];
  const [filingFolder, setFilingFolder] = useState('Quotation & MCR');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [expandedFolder, setExpandedFolder] = useState<string | null>('Quotation & MCR');
  const filingInputRef = useRef<HTMLInputElement>(null);

  // Audit Trails
  const [auditLogs, setAuditLogs] = useState([
    { id: 'A1', action: 'Proposal v1.0 Created', user: 'Sales Rep A', date: '2026-03-25 10:00', details: 'Initialized from standard group medical template.' },
    { id: 'A2', action: 'MCR Validation Approved', user: 'System', date: '2026-04-01 11:15', details: 'Validated against HK MCR regulations successfully.' }
  ]);

  // Proposal Workspace: view/edit toggle + audit history modal
  const [isProposalEditMode, setIsProposalEditMode] = useState(false);
  const [renewRequiredError, setRenewRequiredError] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // GMED (Group Medical) drives whether the SOB approval step is required (real GMI workflow).
  const isGmed = /medical|gmed/i.test(`${editedOpportunity.productCategory || ''} ${editedOpportunity.productItem || ''}`);

  const handleApproveSob = (child: ChildProposal) => {
    setSelectedChild({ ...child, sobApproved: true, sobApprovedBy: editedOpportunity.salesRep1 || 'CSPA', sobApprovedDate: new Date().toISOString().slice(0, 10), sobRejectReason: undefined });
    setAuditLogs(prev => [{ id: `A${prev.length + 1}`, action: 'SOB Approved (CSPA)', user: 'CSPA', date: new Date().toISOString().replace('T', ' ').substring(0, 16), details: 'Schedule of Benefits checked plan-by-plan against insurer claims, then approved.' }, ...prev]);
  };

  const handleRejectSob = (child: ChildProposal) => {
    const reason = prompt('Reject SOB — reason (returned to Sales to revise):');
    if (reason === null) return;
    setSelectedChild({ ...child, sobApproved: false, sobRejectReason: reason });
    setAuditLogs(prev => [{ id: `A${prev.length + 1}`, action: 'SOB Rejected (CSPA)', user: 'CSPA', date: new Date().toISOString().replace('T', ' ').substring(0, 16), details: `SOB rejected: ${reason || '(no reason given)'}` }, ...prev]);
  };

  const handleUploadMcr = (child: ChildProposal) => {
    setSelectedChild({ ...child, mcrUploaded: true });
    setAuditLogs(prev => [{ id: `A${prev.length + 1}`, action: 'MCR File Uploaded & Processed', user: editedOpportunity.salesRep1 || 'Sales', date: new Date().toISOString().replace('T', ' ').substring(0, 16), details: 'MCR file uploaded; preliminary company benefits and premium breakdown identified.' }, ...prev]);
    alert('MCR file uploaded and processed (prototype mock). Preliminary benefits & premium breakdown identified.');
  };

  // Finalize → push the quotation to Odoo (real flow: Finalize hands the proposal to Odoo Sales
  // once; premium state advances Presales → Quotation). Orthogonal to the status chevron so the
  // existing Approved→Convert path is untouched.
  const handleFinalizePush = (child: ChildProposal) => {
    if (isGmed && !child.sobApproved) {
      alert('Group Medical (GMED): the SOB must be approved (CSPA) before finalizing and pushing to Odoo.');
      return;
    }
    if (child.odooPushed) return;
    setSelectedChild({ ...child, odooPushed: true, odooPushDate: new Date().toISOString().slice(0, 10) });
    setAuditLogs(prev => [{ id: `A${prev.length + 1}`, action: 'Finalized → pushed to Odoo', user: editedOpportunity.salesRep1 || 'Sales', date: new Date().toISOString().replace('T', ' ').substring(0, 16), details: `Quotation pushed to Odoo Sales for ${child.id}. Premium state: Presales → Quotation.` }, ...prev]);
    alert('Proposal finalized. Quotation pushed to Odoo (prototype mock). Premium state advanced: Presales → Quotation.');
  };

  const handleExportMcrReport = (child: ChildProposal) => {
    const content = [
      'MCR Report',
      `Proposal: ${child.id} - ${child.name}`,
      `Product: ${child.productItem || ''}`,
      `MCR: ${(proposal.mcr * 100).toFixed(1)}%`,
      `Loss Ratio: ${(proposal.lossRatio * 100).toFixed(1)}%`,
      `Generated: ${new Date().toISOString()}`,
    ].join('\n');
    downloadTextFile(`MCR_Report_${child.id}.txt`, content);
  };

  const handleDownloadSobReport = (child: ChildProposal) => {
    const content = [
      'Schedule of Benefits',
      `Proposal: ${child.id} - ${child.name}`,
      `Product: ${child.productItem || ''}`,
      'Benefits:',
      ...(child.loadedBenefits || []).map(b => `- ${b}`),
      'Coverages:',
      ...(child.loadedCoverages || []).map(c => `- ${c}`),
    ].join('\n');
    downloadTextFile(`SOB_Report_${child.id}.txt`, content);
  };

  // Save changes to opportunity
  const handleSaveOpportunity = () => {
    const missingFields: string[] = [];
    if (!editedOpportunity.name.trim()) missingFields.push('Oppty Name');
    if (editedOpportunity.probability === undefined || editedOpportunity.probability === null || Number.isNaN(editedOpportunity.probability)) missingFields.push('Probability');
    if (!editedOpportunity.company.trim()) missingFields.push('Company / Individual');
    if (!editedOpportunity.campaign.trim()) missingFields.push('Campaign');
    if (!editedOpportunity.salesRep1.trim()) missingFields.push('Sales Rep 1');
    if (!editedOpportunity.productItem.trim()) missingFields.push('Product Item');
    if (missingFields.length > 0) {
      alert(`Please fill in the following required field(s) before saving:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    const invalidDateFields: string[] = [];
    if (!isValidEffectiveDateYear(editedOpportunity.effectiveDate1)) invalidDateFields.push('Effective Date');
    if (editedOpportunity.effectiveDate2 && !isValidEffectiveDateYear(editedOpportunity.effectiveDate2)) invalidDateFields.push('Effective Date 2 (Finalize)');
    if (editedOpportunity.effectiveDate3 && !isValidEffectiveDateYear(editedOpportunity.effectiveDate3)) invalidDateFields.push('Effective Date 3 (Policy)');
    if (invalidDateFields.length > 0) {
      alert(`Please enter a valid year (1900–2100) for:\n- ${invalidDateFields.join('\n- ')}`);
      return;
    }

    const isRep2Active = numSalesReps >= 2;
    const isRep3Active = numSalesReps >= 3;
    const totalSplitPercent = editedOpportunity.split1 + (isRep2Active ? editedOpportunity.split2 : 0) + (isRep3Active ? editedOpportunity.split3 : 0);
    if (totalSplitPercent !== 100) {
      alert(`Sales Rep Split % must total 100% (currently ${totalSplitPercent}%). Please adjust the Multi-Sales Split % Allocation before saving.`);
      return;
    }

    // Master Type conversion is only committed once a 100% probability is actually
    // saved — not while the value is still being edited in the draft.
    let savedMasterType = editedOpportunity.masterType;
    if (editedOpportunity.probability === 100) {
      if (editedOpportunity.masterType === 'Lapsed Customer') {
        savedMasterType = 'Customer';
      } else if (editedOpportunity.masterType === 'Lead' && isNonInsuranceIndividualProduct(editedOpportunity.productItem)) {
        savedMasterType = 'Customer';
      }
    }
    const updatedProposal: Proposal = {
      ...proposal,
      name: editedOpportunity.name,
      stage: editedOpportunity.stage as any,
      probability: editedOpportunity.probability,
      effectiveDate: editedOpportunity.effectiveDate1,
      effectiveDate2: editedOpportunity.effectiveDate2 || undefined,
      effectiveDate3: editedOpportunity.effectiveDate3 || undefined,
      campaign: editedOpportunity.campaign,
      expectedRevenueGross: grossAmount,
      salesRep: editedOpportunity.salesRep1,
      salesRep2: isRep2Active ? editedOpportunity.salesRep2 || undefined : undefined,
      salesRep3: isRep3Active ? editedOpportunity.salesRep3 || undefined : undefined,
      split1: editedOpportunity.split1,
      split2: isRep2Active ? editedOpportunity.split2 : undefined,
      split3: isRep3Active ? editedOpportunity.split3 : undefined,
      client: editedOpportunity.company,
      masterType: savedMasterType,
      remarks: editedOpportunity.opportunityNotes,
      lostReason: (editedOpportunity.lossReason || undefined) as Proposal['lostReason'],
      tags: editedOpportunity.tags,
      productCategory: editedOpportunity.productCategory,
      productItem: editedOpportunity.productItem,
      detailedProductItem: editedOpportunity.detailedProductItem,
      salesRep1GrossAmount: editedOpportunity.salesRep1GrossAmount,
      salesRep1NetAmount: editedOpportunity.salesRep1NetAmount,
      salesRep2GrossAmount: editedOpportunity.salesRep2GrossAmount,
      salesRep2NetAmount: editedOpportunity.salesRep2NetAmount,
      salesRep3GrossAmount: editedOpportunity.salesRep3GrossAmount,
      salesRep3NetAmount: editedOpportunity.salesRep3NetAmount,
      opptyRejectDate: editedOpportunity.opptyRejectDate,
      opptyRejectFrequency: editedOpportunity.opptyRejectFrequency,
      productFileRequirements: editedOpportunity.productFileRequirements,
    };

    // Data-loss guard (see CLAUDE.md "Save Payload Completeness" rule): every
    // editable Opportunity field must be reflected in updatedProposal above,
    // under whatever key actually gets saved for it. If a new draft field is
    // added but never mapped here, this catches the silent loss at save-time
    // instead of the edit just vanishing.
    const editableFieldChecks: [string, unknown, unknown][] = [
      ['Oppty Name', editedOpportunity.name, updatedProposal.name],
      ['Probability', editedOpportunity.probability, updatedProposal.probability],
      ['Effective Date', editedOpportunity.effectiveDate1, updatedProposal.effectiveDate],
      ['Effective Date 2', editedOpportunity.effectiveDate2 || undefined, updatedProposal.effectiveDate2],
      ['Effective Date 3', editedOpportunity.effectiveDate3 || undefined, updatedProposal.effectiveDate3],
      ['Campaign', editedOpportunity.campaign, updatedProposal.campaign],
      ['Company / Individual', editedOpportunity.company, updatedProposal.client],
      ['Sales Rep 1', editedOpportunity.salesRep1, updatedProposal.salesRep],
      ['Sales Rep 1 Split %', editedOpportunity.split1, updatedProposal.split1],
      ['Sales Rep 2', isRep2Active ? editedOpportunity.salesRep2 || undefined : undefined, updatedProposal.salesRep2],
      ['Sales Rep 2 Split %', isRep2Active ? editedOpportunity.split2 : undefined, updatedProposal.split2],
      ['Sales Rep 3', isRep3Active ? editedOpportunity.salesRep3 || undefined : undefined, updatedProposal.salesRep3],
      ['Sales Rep 3 Split %', isRep3Active ? editedOpportunity.split3 : undefined, updatedProposal.split3],
      ['Loss Reason', editedOpportunity.lossReason || undefined, updatedProposal.lostReason],
      ['Tags', editedOpportunity.tags, updatedProposal.tags],
      ['Remark', editedOpportunity.opportunityNotes, updatedProposal.remarks],
      ['Product Item', editedOpportunity.productItem, updatedProposal.productItem],
      ['Product Category', editedOpportunity.productCategory, updatedProposal.productCategory],
    ];
    const unsavedFields = editableFieldChecks
      .filter(([, draftValue, savedValue]) => JSON.stringify(draftValue) !== JSON.stringify(savedValue))
      .map(([label]) => label);
    if (unsavedFields.length > 0) {
      console.warn(
        `[ProposalDetailGmi] handleSaveOpportunity: these edited field(s) did not make it into the save payload — check the field mapping: ${unsavedFields.join(', ')}`,
        { editedOpportunity, updatedProposal }
      );
      alert(`Warning: the following edited field(s) may NOT have been saved — please check with engineering:\n- ${unsavedFields.join('\n- ')}`);
    }

    onSave?.(updatedProposal);
    setEditedOpportunity(prev => ({ ...prev, masterType: savedMasterType }));
    setIsEditMode(false);
    alert("Opportunity changes saved successfully!");
  };

  const handleDeleteOpportunity = () => {
    if (editedOpportunity.probability === 100 && currentRole !== 'Admin') {
      alert('Only Admin can delete an Opportunity that has reached 100% probability.');
      return;
    }
    if (!confirm(`Delete Opportunity "${editedOpportunity.name}" (${proposal.id})? This cannot be undone.`)) return;
    onDelete?.(proposal.id);
    onBack();
  };

  const handleToggleArchiveOpportunity = () => {
    const nextStatus: 'Active' | 'Archived' = proposal.status === 'Archived' ? 'Active' : 'Archived';
    onSave?.({ ...proposal, status: nextStatus });
    alert(`Opportunity ${nextStatus === 'Archived' ? 'archived' : 'activated'}.`);
  };

  // Manual conversion for a Lead that reached 100% probability (already saved) on a
  // product NOT covered by the auto-convert rule (Applied to Individual + non-insurance).
  // No standalone Customer record page exists in this prototype, so the conversion is
  // reflected inline and committed immediately — it's its own lifecycle action, not a draft edit.
  const handleConvertLeadToCustomer = () => {
    onSave?.({ ...proposal, masterType: 'Customer' });
    setEditedOpportunity(prev => ({ ...prev, masterType: 'Customer' }));
    alert(`"${proposal.client}" has been converted to a Customer. Existing Lead data has been carried over to the new Customer record.`);
  };

  // Product File Requirements — entirely config-driven (Product Configuration module's
  // Document Requirements, separately configured for NB and RB); the only user action
  // here is uploading the required file(s) per row. The underlying productFileRequirements
  // row is found-or-created on first upload, then files are appended to it.
  const filesFromFileList = (fileList: FileList): UploadedRequirementFile[] => {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(fileList).map((file, i) => ({
      id: `FILE-${Date.now()}-${i}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedDate: today,
    }));
  };
  const addFilesToConfigRequirement = (checkStage: string, attachmentName: string, fileType: 'Compulsory' | 'Optional', docId: string, fileList: FileList) => {
    const newFiles = filesFromFileList(fileList);
    setEditedOpportunity(prev => {
      const idx = prev.productFileRequirements.findIndex(f =>
        f.relatedProductItem === prev.productItem && f.checkStage === checkStage && f.name === attachmentName
      );
      if (idx >= 0) {
        const existing = prev.productFileRequirements[idx];
        const updatedRow = { ...existing, files: [...(existing.files || []), ...newFiles] };
        return { ...prev, productFileRequirements: prev.productFileRequirements.map((f, i) => i === idx ? updatedRow : f) };
      }
      const newRow: ProductFileRequirement = {
        id: docId, name: attachmentName, type: fileType, relatedProductItem: prev.productItem, checkStage, files: newFiles,
      };
      return { ...prev, productFileRequirements: [...prev.productFileRequirements, newRow] };
    });
  };
  const removeFileFromConfigRequirement = (checkStage: string, attachmentName: string, fileId: string) => {
    setEditedOpportunity(prev => ({
      ...prev,
      productFileRequirements: prev.productFileRequirements.map(f =>
        f.relatedProductItem === prev.productItem && f.checkStage === checkStage && f.name === attachmentName
          ? { ...f, files: (f.files || []).filter(file => file.id !== fileId) }
          : f
      )
    }));
  };

  // An Opportunity that just reached 100% probability (this session) has no Proposal
  // yet — build a fresh blank one, seeded from the Opportunity's own fields, the first
  // time the Proposal tab is opened. Keeps "reach 100% -> Save -> open Proposal tab"
  // working in a single session, without requiring a re-visit from the pipeline.
  const createBlankChildProposal = (): ChildProposal => {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `P-${Date.now().toString().slice(-6)}`,
      name: editedOpportunity.name,
      version: 'v1.0',
      status: 'Draft',
      vendor: '',
      premium: 0,
      commissionRate: 0,
      effectiveDate: editedOpportunity.effectiveDate1 || today,
      createdDate: today,
      lastUpdated: today,
      createdBy: editedOpportunity.salesRep1,
      updatedBy: editedOpportunity.salesRep1,
      summary: '',
      isCurrent: true,
      productTeam: editedOpportunity.productTeam,
      productCategory: editedOpportunity.productCategory,
      productItem: editedOpportunity.productItem,
      productItemDetails: editedOpportunity.detailedProductItem || '',
      gmiProductGroup: getAssignedGmiProductGroup(editedOpportunity.productItem),
      currency: 'HKD',
    };
  };

  // Create new child proposal
  // Renewal Proposal Creator
  const handleRenewProposal = (propToRenew: ChildProposal) => {
    const nextNum = childProposals.length + 1;
    const code = `P-2026-000${nextNum}`;
    
    // Parse current version and increment it
    let nextVersion = 'v2.0';
    try {
      const currentVerNum = parseFloat(propToRenew.version.replace('v', ''));
      if (!isNaN(currentVerNum)) {
        nextVersion = `v${(currentVerNum + 1.0).toFixed(1)}`;
      }
    } catch (e) {
      nextVersion = 'v2.0';
    }

    const renewed: ChildProposal = {
      ...propToRenew,
      id: code,
      name: `${propToRenew.name} (Renewed)`,
      version: nextVersion,
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      createdBy: editedOpportunity.salesRep1 || 'Sales Rep',
      updatedBy: editedOpportunity.salesRep1 || 'Sales Rep',
      renewedFrom: propToRenew.id,
      renewDate: new Date().toISOString().split('T')[0],
      isCurrent: false,
      policyId: undefined,
      debitNoteNo: undefined,
      policyStatus: undefined
    };

    setChildProposals([...childProposals, renewed]);
    setSelectedChild(renewed);
    setActiveWorkspaceTab('proposal');
    alert(`Renewed proposal created: ${code} linked from ${propToRenew.id}. Switched to new proposal workspace.`);
  };

  // Convert Proposal to Policy
  const handleConvertToPolicy = (p: ChildProposal) => {
    if (!p.renewRequired) {
      setRenewRequiredError(true);
      alert('Please set "Renew Required" (Basic Information tab) before converting this proposal to a policy.');
      return;
    }
    setRenewRequiredError(false);

    if (isGmed && !p.sobApproved) {
      alert('This is a Group Medical (GMED) proposal — its Schedule of Benefits (SOB) must be approved (CSPA) before converting to a policy.');
      return;
    }

    const newPolicyId = `POL-MEDIA-${Date.now().toString().slice(-5)}`;
    const convertedChild: ChildProposal = { ...p, status: 'Converted to Policy', policyId: newPolicyId };
    setChildProposals(prev => prev.map(item => item.id === p.id ? convertedChild : item));
    if (selectedChild?.id === p.id) {
      setSelectedChild(convertedChild);
    }

    if (p.renewRequired !== 'Yes') {
      alert(`Proposal converted to policy successfully! Policy Number Generated: ${newPolicyId}\n\nRenew Required = "${p.renewRequired}" — no renewal Prospect was auto-created.`);
      return;
    }

    // Auto-create next year's renewal Prospect, linked back to this one (trigger: Proposal converted to Policy, gated on Renew Required = Yes)
    const today = new Date().toISOString().split('T')[0];
    let nextEffectiveDate = proposal.effectiveDate;
    const parsedDate = new Date(proposal.effectiveDate);
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setFullYear(parsedDate.getFullYear() + 1);
      nextEffectiveDate = parsedDate.toISOString().split('T')[0];
    }

    const renewalId = `P-REN-${Date.now().toString().slice(-6)}`;
    const renewalProspect: Proposal = {
      ...proposal,
      id: renewalId,
      name: `${editedOpportunity.name} (Renewal)`,
      stage: 'Draft',
      probability: 65, // RB entry-level (lowest valid Renewal probability); 30 was invalid for RB
      businessType: 'Renewal',
      client: editedOpportunity.company,
      salesRep: editedOpportunity.salesRep1,
      productCategory: editedOpportunity.productCategory,
      productItem: editedOpportunity.productItem,
      // "Product Item Details (Copied from Previous Proposal)" carries forward the
      // actual Product Item Details selected on the Proposal being renewed from (p),
      // not the Opportunity's own (legacy/unused) detailedProductItem field.
      detailedProductItem: p.productItemDetails || '',
      linkedPreviousProspectId: proposal.id,
      linkedPolicyId: newPolicyId,
      effectiveDate: nextEffectiveDate,
      createdDate: today,
      lastUpdated: today,
      stageLastUpdated: today,
      remarks: `Auto-created renewal from ${proposal.id} upon conversion to policy.`,
      // Report & Dashboard figures are specific to this year's deal — the new renewal starts fresh.
      // Product File Requirements carry over via the ...proposal spread, since compliance requirements are typically stable year over year.
      salesRep1GrossAmount: 0,
      salesRep1NetAmount: 0,
      salesRep2GrossAmount: 0,
      salesRep2NetAmount: 0,
      salesRep3GrossAmount: 0,
      salesRep3NetAmount: 0,
      opptyRejectDate: undefined,
      opptyRejectFrequency: 0,
      // A fresh renewal starts at 65% (RB entry-level) with no Proposal of its own yet — must not
      // inherit the original Opportunity's Proposal history via the ...proposal spread.
      childProposals: [],
    };

    onCreateRenewal?.(renewalProspect);
    // Set the forward link on this (original) Prospect so both sides show Linked Prospect
    onSave?.({ ...proposal, linkedNextProspectId: renewalId });

    alert(`Proposal converted to policy successfully! Policy Number Generated: ${newPolicyId}\n\nRenew Required = "Yes" — a renewal Prospect "${renewalProspect.name}" (${renewalId}) has been automatically created for next year, linked back to this Prospect.`);
  };

  // Simulated drag-drop upload
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setDocuments(curr => [...curr, {
            id: `D${curr.length + 1}`,
            name: file.name,
            category: filingFolder,
            date: new Date().toISOString().split('T')[0],
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
          }]);
          setAuditLogs(logs => [{
            id: `A${logs.length + 1}`,
            action: 'Document Uploaded',
            user: 'Current User',
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            details: `Uploaded file: ${file.name}`
          }, ...logs]);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  // Linked Prospect — smart-button style, shared by the Opportunity and Proposal
  // workspace headers (Odoo/Salesforce pattern: top of page, icon + label).
  const linkedProspectBadges = (proposal.linkedPreviousProspectId || proposal.linkedNextProspectId) && (
    <div className="flex items-center gap-2 flex-wrap">
      {proposal.linkedPreviousProspectId && (() => {
        const prevProspect = allProposals?.find(p => p.id === proposal.linkedPreviousProspectId);
        return (
          <button
            onClick={() => prevProspect && confirmDiscardOpportunityChanges() && onNavigateToProspect?.(prevProspect)}
            disabled={!prevProspect}
            title={`Renewed from ${prevProspect ? prevProspect.name : proposal.linkedPreviousProspectId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[11px] font-semibold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors disabled:cursor-default disabled:hover:bg-white"
          >
            <History size={13} />
            <span>Renewed from {prevProspect ? prevProspect.name : proposal.linkedPreviousProspectId}</span>
          </button>
        );
      })()}
      {proposal.linkedNextProspectId && (() => {
        const nextProspect = allProposals?.find(p => p.id === proposal.linkedNextProspectId);
        return (
          <button
            onClick={() => nextProspect && confirmDiscardOpportunityChanges() && onNavigateToProspect?.(nextProspect)}
            disabled={!nextProspect}
            title={`Renewed into ${nextProspect ? nextProspect.name : proposal.linkedNextProspectId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors disabled:cursor-default disabled:hover:bg-white"
          >
            <History size={13} />
            <span>Renewed into {nextProspect ? nextProspect.name : proposal.linkedNextProspectId}</span>
          </button>
        );
      })()}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      {/* Shared Header + Tabs — identical across the Opportunity and Proposal tabs */}
      <div className={`px-6 pt-6 mx-auto w-full ${selectedChild ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (confirmDiscardOpportunityChanges()) onBack(); }}
              className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 bg-white shadow-sm text-gray-500"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs text-gray-400 font-mono">{proposal.id}</span>
          </div>
          {linkedProspectBadges && (
            <div className="mt-2">
              {linkedProspectBadges}
            </div>
          )}
        </div>
        {/* Top Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {([
            { id: 'Opportunity', label: 'Opportunity', icon: TrendingUp },
            { id: 'Proposal', label: 'Proposal', icon: FileText }
          ] as const).map(tab => {
            const Icon = tab.icon;
            const proposalLocked = tab.id === 'Proposal' && editedOpportunity.probability < 100;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'Proposal') {
                    if (editedOpportunity.probability < 100) {
                      alert('This Opportunity must reach 100% probability before a Proposal can be created.');
                      return;
                    }
                    if (childProposals.length === 0) {
                      const fresh = createBlankChildProposal();
                      setChildProposals([fresh]);
                      setSelectedChild(fresh);
                    } else {
                      setSelectedChild(childProposals.find(p => p.isCurrent) || childProposals[0]);
                    }
                    setActiveWorkspaceTab('proposal');
                  } else {
                    setSelectedChild(null);
                  }
                  setActiveProspectTab(tab.id);
                }}
                id={`tab-${tab.id.toLowerCase()}`}
                title={proposalLocked ? 'Reach 100% probability to unlock the Proposal tab' : undefined}
                className={`px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
                  proposalLocked
                    ? 'text-gray-300 cursor-not-allowed'
                    : activeProspectTab === tab.id
                      ? 'text-orange-500 font-black border-b-2 border-orange-500'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={14} className={proposalLocked ? 'text-gray-300' : activeProspectTab === tab.id ? 'text-orange-500' : 'text-gray-400'} />
                <span>{tab.label}</span>
                {proposalLocked && <Lock size={11} className="text-gray-300" />}
              </button>
            );
          })}
        </div>
      </div>
      {!selectedChild ? (
        // ==========================================
        // OPPORTUNITY (COMMERCIAL) WORKSPACE
        // ==========================================
        <div className="px-6 pb-6 max-w-7xl mx-auto w-full flex-1">
          <div className="flex flex-col gap-6">

              {/* Title + Edit controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  {isEditMode ? (
                    <>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Oppty Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={editedOpportunity.name}
                        onChange={e => setEditedOpportunity({...editedOpportunity, name: e.target.value})}
                        className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-orange-300 focus:border-orange-500 outline-none px-0.5 -ml-0.5"
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-gray-900">{editedOpportunity.name}</h1>
                      {proposal.status === 'Archived' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200 text-gray-600">Archived</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Customer: {editedOpportunity.company} · Rep: {editedOpportunity.salesRep1}</p>
                </div>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <button onClick={handleCancelEdit} className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                        <span>Cancel</span>
                      </button>
                      <button onClick={handleSaveOpportunity} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                        <Save size={14} />
                        <span>Save Opportunity</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleToggleArchiveOpportunity}
                        className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Archive size={14} />
                        <span>{proposal.status === 'Archived' ? 'Activate' : 'Archive'}</span>
                      </button>
                      <button
                        onClick={handleDeleteOpportunity}
                        disabled={editedOpportunity.probability === 100 && currentRole !== 'Admin'}
                        title={editedOpportunity.probability === 100 && currentRole !== 'Admin' ? 'Only Admin can delete a completed (100%) opportunity' : undefined}
                        className={`px-4 py-2 border rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${
                          editedOpportunity.probability === 100 && currentRole !== 'Admin'
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white hover:bg-red-50 border-gray-200 hover:border-red-200 text-red-600'
                        }`}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                      <button onClick={() => setIsEditMode(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Gross Amount / Probability — most prominent element on the page */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Gross Amount <span className="text-red-500">*</span></label>
                    <span className="text-3xl font-black text-gray-900">HK${grossAmount.toLocaleString()}</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-400 pb-1.5">at</span>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Probability <span className="text-red-500">*</span></label>
                    {isEditMode ? (
                      <select value={editedOpportunity.probability} onChange={e => setEditedOpportunity({...editedOpportunity, probability: Number(e.target.value)})} className="text-2xl font-black text-gray-900 bg-transparent border-b-2 border-orange-300 focus:border-orange-500 outline-none">
                        {(() => {
                          const isRenewal = editedOpportunity.businessType === 'Renewal';
                          const restricted = getRestrictedStages(editedOpportunity.productItem, isRenewal);
                          const uploadBlocked = getUploadBlockedStages(editedOpportunity.productItem, isRenewal, editedOpportunity.productFileRequirements);
                          const options = (isRenewal ? RB_PROBABILITY_OPTIONS : NB_PROBABILITY_OPTIONS)
                            .filter(p => !restricted.includes(p) && !uploadBlocked.includes(p));
                          return (
                            <>
                              {!options.includes(editedOpportunity.probability) && (
                                <option value={editedOpportunity.probability}>{editedOpportunity.probability}% (invalid for {editedOpportunity.businessType === 'Renewal' ? 'RB' : 'NB'})</option>
                              )}
                              {options.map(p => (
                                <option key={p} value={p}>{p}%</option>
                              ))}
                            </>
                          );
                        })()}
                      </select>
                    ) : (
                      <span className="text-3xl font-black text-gray-900">{editedOpportunity.probability}%</span>
                    )}
                  </div>
                </div>
                {editedOpportunity.probability === 0 && (
                  <div className="mt-4 max-w-xs">
                    <FieldView label="Loss Reason" required editing={isEditMode} viewValue={editedOpportunity.lossReason || '—'}>
                      <select value={editedOpportunity.lossReason} onChange={e => setEditedOpportunity({...editedOpportunity, lossReason: e.target.value})} className="w-full px-2.5 py-1.5 border border-red-200 bg-red-50/20 rounded text-xs text-red-900 font-semibold">
                        <option value="">-- Select Loss Reason --</option>
                        {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </FieldView>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 -mt-2">Net Amount: <span className="font-bold text-gray-700">HK${netAmount.toLocaleString()}</span></p>

              {/* Opportunity Information */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-orange-500" />
                  Opportunity Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Company / Individual <span className="text-red-500">*</span></label>
                    {isEditMode ? (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            {(['Company', 'Individual'] as const).map(t => (
                              <button key={t} onClick={() => handleToggleCompanyEntityType(t)} className={`px-3 py-1 text-xs font-semibold rounded transition-all ${companyEntityType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
                            ))}
                          </div>
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            {(['Customer', 'Lead'] as const).map(t => (
                              <button key={t} onClick={() => handleToggleCompanySource(t)} className={`px-3 py-1 text-xs font-semibold rounded transition-all ${companySource === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
                            ))}
                          </div>
                        </div>
                        <SearchableDropdown
                          className="max-w-sm"
                          value={editedOpportunity.company}
                          options={filteredCompanyOptions.map(o => ({
                            id: o.id,
                            label: o.label,
                            value: o.label,
                            suffix: o.masterType === 'Lapsed Customer' ? ' (Lapsed)' : undefined
                          }))}
                          onSelect={label => {
                            const chosen = filteredCompanyOptions.find(o => o.label === label);
                            setEditedOpportunity({...editedOpportunity, company: label, masterType: chosen?.masterType || editedOpportunity.masterType});
                          }}
                          placeholder="Search by name..."
                          buttonPlaceholder="Select Company / Individual"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-2.5 py-1.5">
                        <span className="text-xs font-semibold text-gray-800">{editedOpportunity.company}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{companyEntityType}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          editedOpportunity.masterType === 'Lapsed Customer' ? 'bg-red-50 text-red-600' :
                          editedOpportunity.masterType === 'Lead' ? 'bg-orange-50 text-orange-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>{editedOpportunity.masterType || 'Customer'}</span>
                      </div>
                    )}
                    {/* Only surfaces after a 100% probability has actually been saved — not while still being edited in the draft */}
                    {proposal.probability === 100 && proposal.masterType === 'Lead' && (
                      <div className="mt-2">
                        <button
                          onClick={handleConvertLeadToCustomer}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          <span>Convert to Customer</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Oppty Status</label>
                    <input type="text" value={editedOpportunity.stage} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                  </div>
                  <FieldView label="Campaign" required editing={isEditMode} viewValue={editedOpportunity.campaign}>
                    <SearchableDropdown
                      value={editedOpportunity.campaign}
                      options={CAMPAIGN_OPTIONS.map(name => ({ id: name, label: name, value: name }))}
                      onSelect={c => setEditedOpportunity({...editedOpportunity, campaign: c})}
                      placeholder="Search campaign..."
                      buttonPlaceholder="Select Campaign"
                    />
                  </FieldView>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Oppty Odoo ID</label>
                    <input type="text" value={editedOpportunity.opptyOdooId} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono outline-none cursor-not-allowed" />
                  </div>
                  {['Draft', 'Finalize', 'Policy'].includes(editedOpportunity.stage) && (
                    <FieldView label="Effective Date" editing={isEditMode} viewValue={editedOpportunity.effectiveDate1 || '—'}>
                      <input type="date" min="1900-01-01" max="2100-12-31" value={editedOpportunity.effectiveDate1} onChange={e => setEditedOpportunity({...editedOpportunity, effectiveDate1: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                    </FieldView>
                  )}
                  {['Finalize', 'Policy'].includes(editedOpportunity.stage) && (
                    <FieldView label="Effective Date 2 (Finalize)" editing={isEditMode} viewValue={editedOpportunity.effectiveDate2 || '—'}>
                      <input type="date" min="1900-01-01" max="2100-12-31" value={editedOpportunity.effectiveDate2} onChange={e => setEditedOpportunity({...editedOpportunity, effectiveDate2: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                    </FieldView>
                  )}
                  {editedOpportunity.stage === 'Policy' && (
                    <FieldView label="Effective Date 3 (Policy)" editing={isEditMode} viewValue={editedOpportunity.effectiveDate3 || '—'}>
                      <input type="date" min="1900-01-01" max="2100-12-31" value={editedOpportunity.effectiveDate3} onChange={e => setEditedOpportunity({...editedOpportunity, effectiveDate3: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                    </FieldView>
                  )}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editedOpportunity.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {tag}
                          {isEditMode && (
                            <button onClick={() => setEditedOpportunity({...editedOpportunity, tags: editedOpportunity.tags.filter((_, i) => i !== idx)})} className="hover:text-orange-900">
                              <XCircle size={11} />
                            </button>
                          )}
                        </span>
                      ))}
                      {editedOpportunity.tags.length === 0 && <span className="text-xs text-gray-400">—</span>}
                    </div>
                    {isEditMode && (
                      <div className="flex gap-1.5 max-w-sm">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              setEditedOpportunity({...editedOpportunity, tags: [...editedOpportunity.tags, tagInput.trim()]});
                              setTagInput('');
                            }
                          }}
                          placeholder="Add a tag and press Enter"
                          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50"
                        />
                        <button
                          onClick={() => {
                            if (tagInput.trim()) {
                              setEditedOpportunity({...editedOpportunity, tags: [...editedOpportunity.tags, tagInput.trim()]});
                              setTagInput('');
                            }
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded text-xs font-bold text-gray-600"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  <FieldView label="Remark" editing={isEditMode} viewValue={editedOpportunity.opportunityNotes || '—'} className="md:col-span-3">
                    <textarea value={editedOpportunity.opportunityNotes} onChange={e => setEditedOpportunity({...editedOpportunity, opportunityNotes: e.target.value})} className="w-full h-20 px-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 resize-none" placeholder="Provide any comments or deal constraints..." />
                  </FieldView>
                  <p className="md:col-span-3 text-[10px] text-gray-400 pt-2 border-t border-gray-100">Oppty Stage Change Date: <span className="font-mono text-gray-600">{editedOpportunity.opptyStageChangeDate}</span> · Created on: <span className="font-mono text-gray-600">{editedOpportunity.createdOn}</span></p>
                </div>
              </div>

            {/* 2. Product Information */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <Briefcase size={14} className="text-orange-500" />
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <FieldView label="Product Item" required editing={isEditMode} viewValue={editedOpportunity.productItem} className="md:col-span-2">
                  <SearchableDropdown
                    className="max-w-sm"
                    value={editedOpportunity.productItem}
                    options={CONFIG_PRODUCT_NAMES.map(name => ({ id: name, label: name, value: name }))}
                    onSelect={selectedItem => setEditedOpportunity({
                      ...editedOpportunity,
                      productItem: selectedItem,
                      productTeam: resolveProductTeam(selectedItem),
                      productCategory: resolveProductCategory(selectedItem)
                    })}
                    placeholder="Search product item..."
                    buttonPlaceholder="Select Product Item"
                  />
                </FieldView>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Team</label>
                  <input type="text" value={editedOpportunity.productTeam} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Category</label>
                  <input type="text" value={editedOpportunity.productCategory} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                </div>
                {/* Only surfaces on a renewal prospect that was auto-created by the system (linkedPreviousProspectId) — carries the prior year's detailed product item forward, read-only. */}
                {proposal.linkedPreviousProspectId && (
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Item Details (Copied from Previous Proposal)</label>
                    <input type="text" value={editedOpportunity.detailedProductItem || '—'} readOnly className="w-full max-w-sm px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Sales Assignment */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-orange-500" />
                Sales Assignment
              </h3>
              <div className="text-xs">
                <div className="max-w-xs mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Sales Team</label>
                  <input type="text" value={SALES_REP_TEAM_MAP[editedOpportunity.salesRep1] || 'Unassigned'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Multi-Sales Split % Allocation</label>
                  <table className="w-full border text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b">
                        <th className="p-2 text-left">Sales Representative <span className="text-red-500">*</span></th>
                        <th className="p-2 text-right w-24">Split %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      <tr>
                        <td className="p-2">
                          {isEditMode ? (
                            <select value={editedOpportunity.salesRep1} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep1: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs">
                              {SALES_REPS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : <span>{editedOpportunity.salesRep1}</span>}
                        </td>
                        <td className="p-2">{isEditMode ? (
                          numSalesReps === 1 ? (
                            <input type="text" value="100" readOnly className="w-full p-1 border border-gray-100 bg-gray-100 rounded text-xs text-right font-mono text-gray-500 cursor-not-allowed" />
                          ) : (
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={editedOpportunity.split1}
                              onChange={e => handleSplit1Change(Number(e.target.value))}
                              onFocus={e => e.currentTarget.select()}
                              onKeyDown={blockNonIntegerKeys}
                              onWheel={blurOnWheel}
                              className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono"
                            />
                          )
                        ) : <span className="block text-right font-mono">{editedOpportunity.split1}</span>}</td>
                      </tr>
                      {(isEditMode ? numSalesReps >= 2 : !!editedOpportunity.salesRep2) && (
                        <tr>
                          <td className="p-2">
                            {isEditMode ? (
                              <select value={editedOpportunity.salesRep2} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep2: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs">
                                <option value="">-- Select --</option>
                                {SALES_REPS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : <span>{editedOpportunity.salesRep2}</span>}
                          </td>
                          <td className="p-2">{isEditMode ? (
                            numSalesReps === 2 ? (
                              <input type="text" value={editedOpportunity.split2} readOnly title="Auto-calculated to complete 100%" className="w-full p-1 border border-gray-100 bg-gray-100 rounded text-xs text-right font-mono text-gray-500 cursor-not-allowed" />
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={editedOpportunity.split2}
                                onChange={e => handleSplit2Change(Number(e.target.value))}
                                onFocus={e => e.currentTarget.select()}
                                onKeyDown={blockNonIntegerKeys}
                                onWheel={blurOnWheel}
                                className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono"
                              />
                            )
                          ) : <span className="block text-right font-mono">{editedOpportunity.split2}</span>}</td>
                        </tr>
                      )}
                      {(isEditMode ? numSalesReps >= 3 : !!editedOpportunity.salesRep3) && (
                        <tr>
                          <td className="p-2">
                            {isEditMode ? (
                              <select value={editedOpportunity.salesRep3} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep3: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs">
                                <option value="">-- Select --</option>
                                {SALES_REPS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : <span>{editedOpportunity.salesRep3}</span>}
                          </td>
                          <td className="p-2">{isEditMode ? (
                            <input type="text" value={editedOpportunity.split3} readOnly title="Auto-calculated to complete 100%" className="w-full p-1 border border-gray-100 bg-gray-100 rounded text-xs text-right font-mono text-gray-500 cursor-not-allowed" />
                          ) : <span className="block text-right font-mono">{editedOpportunity.split3}</span>}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {isEditMode && numSalesReps < 3 && (
                    <button onClick={() => setNumSalesReps(n => Math.min(3, n + 1))} className="mt-2 flex items-center gap-1 text-orange-600 hover:text-orange-700 text-[11px] font-bold">
                      <Plus size={12} />
                      <span>Add Sales Rep</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Product Opportunity Evaluation */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <ClipboardCheck size={14} className="text-orange-500" />
                Product Opportunity Evaluation
              </h3>

              {/* Est Sales Credit — computed from the product's Sales Credit Calculation Rule (Product Config) */}
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200">
                <Award size={18} className="text-orange-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">Est Sales Credit</span>
                  <span className="text-lg font-black text-orange-700 font-mono tabular-nums">
                    {formatDecimal2(computeEstSalesCredit(selectedProduct?.salesCreditRule, evaluationValues))}
                  </span>
                </div>
                {selectedProduct?.salesCreditRule && (
                  <span className="ml-auto text-[10px] text-orange-600/70 font-semibold max-w-xs text-right hidden md:block">
                    Rule: {selectedProduct.salesCreditRule}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vendor Column */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 flex-wrap">
                    <Building2 size={13} className="text-gray-500" />
                    Vendor Fields
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct?.vendorFields?.filter((f: any) => f.visible).map((f: any) => (
                      <React.Fragment key={f.name}>
                        {renderEvalField(f)}
                        {renderSchemeSubFields(f.name)}
                      </React.Fragment>
                    ))}
                    {(!selectedProduct?.vendorFields || selectedProduct.vendorFields.filter((f: any) => f.visible).length === 0) && (
                      <p className="text-gray-400 text-xs italic">No visible vendor fields are configured for this product.</p>
                    )}
                  </div>
                </div>

                {/* Premium Column */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <DollarSign size={13} className="text-gray-500" />
                    Premium Fields
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct?.premiumFields?.filter((f: any) => f.visible).map((f: any) => renderEvalField(f))}
                    {(!selectedProduct?.premiumFields || selectedProduct.premiumFields.filter((f: any) => f.visible).length === 0) && (
                      <p className="text-gray-400 text-xs italic">No visible premium fields are configured for this product.</p>
                    )}
                  </div>
                </div>

                {/* Date & Transfer Column */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <Calendar size={13} className="text-gray-500" />
                    Date & Transfer Fields
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct?.dateTransferFields?.filter((f: any) => f.visible).map((f: any) => renderEvalField(f))}
                    {(!selectedProduct?.dateTransferFields || selectedProduct.dateTransferFields.filter((f: any) => f.visible).length === 0) && (
                      <p className="text-gray-400 text-xs italic">No visible date & transfer fields are configured for this product.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Report & Dashboard */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <BarChart2 size={14} className="text-orange-500" />
                Report &amp; Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sales Rep 1 Gross Amount</label>
                  <input type="text" value={`HK$${editedOpportunity.salesRep1GrossAmount.toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sales Rep 1 Net Amount</label>
                  <input type="text" value={`HK$${editedOpportunity.salesRep1NetAmount.toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                </div>
                {!!editedOpportunity.salesRep2 && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sales Rep 2 Gross Amount</label>
                      <input type="text" value={`HK$${editedOpportunity.salesRep2GrossAmount.toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sales Rep 2 Net Amount</label>
                      <input type="text" value={`HK$${editedOpportunity.salesRep2NetAmount.toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                    </div>
                  </>
                )}
                {!!editedOpportunity.salesRep3 && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sales Rep 3 Gross Amount</label>
                      <input type="text" value={`HK$${editedOpportunity.salesRep3GrossAmount.toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sales Rep 3 Net Amount</label>
                      <input type="text" value={`HK$${editedOpportunity.salesRep3NetAmount.toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3 border-t border-gray-100">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Oppty Reject Date</label>
                  <input type="text" value={editedOpportunity.opptyRejectDate || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Oppty Reject Frequency</label>
                  <input type="text" value={String(editedOpportunity.opptyRejectFrequency)} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono cursor-not-allowed outline-none" />
                </div>
              </div>
            </div>

            {/* 7. Product File Requirements */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <FileUp size={14} className="text-orange-500" />
                Product File Requirements
              </h3>
              {(() => {
                const isRenewal = editedOpportunity.businessType === 'Renewal';
                const effectiveRequirements = getDocumentRequirements(editedOpportunity.productItem, isRenewal);
                return (
                <>
                  <p className="text-[10px] text-gray-400 font-semibold mb-3">
                    Driven by this Product Item's Document Requirements (Product Configuration module) — every configured stage is listed upfront. Upload is always available, regardless of Edit mode. A Compulsory document that hasn't been uploaded blocks the Opportunity from reaching that stage (and any later stage).
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <th className="text-left py-2 pr-3">Attachment Name</th>
                          <th className="text-left py-2 pr-3">Type</th>
                          <th className="text-left py-2 pr-3">Check Stage</th>
                          <th className="text-left py-2 pr-3">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {effectiveRequirements.map(row => {
                          const checkStage = `${row.stage}%`;
                          const uploaded = editedOpportunity.productFileRequirements.find(f =>
                            f.relatedProductItem === editedOpportunity.productItem && f.checkStage === checkStage && f.name === row.attachmentName
                          );
                          return (
                            <tr key={row.id}>
                              <td className="py-2 pr-3">
                                <span className="font-semibold text-gray-800">{row.attachmentName}</span>
                              </td>
                              <td className="py-2 pr-3">
                                <span className={`inline-flex px-2 py-0.5 border text-[10px] font-black rounded uppercase tracking-wider ${row.fileType === 'Compulsory' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{row.fileType}</span>
                              </td>
                              <td className="py-2 pr-3">
                                <span className="text-gray-700 font-mono">{checkStage}</span>
                              </td>
                              <td className="py-2 pr-3 min-w-[160px]">
                                <div className="flex flex-col gap-1">
                                  {(uploaded?.files || []).map(f => (
                                    <div key={f.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-[11px]">
                                      <FileUp size={10} className="text-gray-400 shrink-0" />
                                      <span className="truncate max-w-[100px] text-gray-700" title={f.name}>{f.name}</span>
                                      <span className="text-gray-400 shrink-0">({f.size})</span>
                                      <button type="button" onClick={() => removeFileFromConfigRequirement(checkStage, row.attachmentName, f.id)} className="ml-auto text-gray-400 hover:text-red-600 shrink-0">
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700 cursor-pointer font-semibold">
                                    <Plus size={11} />
                                    <span>Add File</span>
                                    <input type="file" multiple className="hidden" onChange={e => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        addFilesToConfigRequirement(checkStage, row.attachmentName, row.fileType, uploaded?.id || `DOC-${row.id}`, e.target.files);
                                      }
                                      e.target.value = '';
                                    }} />
                                  </label>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {effectiveRequirements.length === 0 && (
                          <tr><td colSpan={4} className="py-4 text-center text-gray-400 italic">No document requirements configured for this Product Item.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
                );
              })()}
            </div>

            </div>
        </div>
      ) : (
        // ==========================================
        // PROPOSAL WORKSPACE (STANDALONE WORKSPACE)
        // ==========================================
        <div className="px-4 pb-4 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-4 text-xs">
          {/* Top Status Chevron Progress Bar (Odoo 19 Style) */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-mono font-black text-[10px] rounded">{selectedChild.id}</span>
                <h2 className="text-sm font-bold text-gray-900">{selectedChild.name}</h2>
                {isGmed && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 font-black text-[10px] rounded uppercase tracking-wider">GMED</span>}
                {isGmed && selectedChild.sobApproved && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded">SOB Approved</span>}
                {isGmed && !selectedChild.sobApproved && selectedChild.sobRejectReason && <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] rounded" title={selectedChild.sobRejectReason}>SOB Rejected</span>}
                {selectedChild.odooPushed && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] rounded">Quotation → Odoo</span>}
              </div>
              <p className="text-[10px] text-gray-500">Opportunity: <span className="font-semibold text-gray-700">{editedOpportunity.name}</span> · Customer: {editedOpportunity.company}</p>
            </div>

            {/* Chevron Trail */}
            <div className="flex items-center self-stretch md:self-auto overflow-x-auto border border-gray-200 rounded divide-x divide-gray-200 bg-gray-50">
              {([
                { label: 'Draft', status: 'Draft' },
                { label: 'In Progress', status: 'In Progress' },
                { label: 'Pending Approval', status: 'Pending Internal Approval' },
                { label: 'Underwriter Sync', status: 'Pending Insurer' },
                { label: 'Approved', status: 'Approved' },
                { label: 'Converted', status: 'Converted to Policy' }
              ] as const).map((step, idx) => {
                const isActive = selectedChild.status === step.status;
                return (
                  <button
                    key={step.status}
                    onClick={() => {
                      setSelectedChild({ ...selectedChild, status: step.status as any });
                      // Log status transition
                      setAuditLogs(prev => [
                        {
                          id: `A${prev.length + 1}`,
                          action: `Status updated to ${step.label}`,
                          user: editedOpportunity.salesRep1,
                          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                          details: `Proposal transitioned to ${step.label} status.`
                        },
                        ...prev
                      ]);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{step.label}</span>
                    {isActive && <CheckCircle2 size={10} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          {/* Action Ribbon */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAuditHistory(true)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold transition-all flex items-center gap-1.5"
              >
                <History size={13} />
                <span>View Audit History</span>
              </button>
              {isProposalEditMode ? (
                <button
                  onClick={() => setIsProposalEditMode(false)}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>Done Editing</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsProposalEditMode(true)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold transition-all flex items-center gap-1.5"
                >
                  <Edit size={13} />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={() => handleExportMcrReport(selectedChild)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet size={13} />
                <span>Export MCR Report</span>
              </button>
              <button
                onClick={() => handleDownloadSobReport(selectedChild)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold transition-all flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Download SOB Report</span>
              </button>
              <button
                onClick={() => handleUploadMcr(selectedChild)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold transition-all flex items-center gap-1.5"
              >
                <Upload size={13} />
                <span>{selectedChild.mcrUploaded ? 'MCR Uploaded ✓' : 'Upload MCR'}</span>
              </button>
              {isGmed && !selectedChild.sobApproved && (
                <>
                  <button
                    onClick={() => handleApproveSob(selectedChild)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Check size={13} />
                    <span>Approve SOB (CSPA)</span>
                  </button>
                  <button
                    onClick={() => handleRejectSob(selectedChild)}
                    className="px-3 py-1.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded font-bold transition-all flex items-center gap-1.5"
                  >
                    <XCircle size={13} />
                    <span>Reject SOB</span>
                  </button>
                </>
              )}
              {!selectedChild.odooPushed && (
                <button
                  onClick={() => handleFinalizePush(selectedChild)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Finalize → Push to Odoo</span>
                </button>
              )}
              {selectedChild.status === 'Approved' && (
                <button
                  onClick={() => handleConvertToPolicy(selectedChild)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>Convert to Policy</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Strip */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
            <div className="flex items-start gap-2">
              <Users size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px] font-sans">EBP Name</span>
                <span className="font-bold text-gray-900 text-xs">{selectedChild.name}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px] font-sans">Total Premium</span>
                <span className="font-bold text-gray-900 text-xs">{selectedChild.currency} {selectedChild.premium.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px] font-sans">Present Incurred Amount</span>
                <span className="font-bold text-gray-900 text-xs">HK$ {(selectedChild.presentIncurredAmount || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px] font-sans">Present Paid Amount</span>
                <span className="font-bold text-gray-900 text-xs">HK$ {(selectedChild.presentPaidAmount || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <History size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px] font-sans">Previous Incurred Amount</span>
                <span className="font-bold text-gray-900 text-xs">HK$ {(selectedChild.previousIncurredAmount || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RefreshCw size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px] font-sans">Previous Paid Amount</span>
                <span className="font-bold text-gray-900 text-xs">HK$ {(selectedChild.previousPaidAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Sidebar / Tabs and Workspace Columns */}
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-48 shrink-0 flex flex-col gap-2">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-2.5 py-1.5">Quotation Steps</span>
                
                {([
                  { id: 'proposal', label: 'Basic Information', icon: Briefcase },
                  { id: 'premium', label: 'Premium', icon: DollarSign },
                  { id: 'benefits', label: 'Coverage', icon: Layers },
                  { id: 'documents', label: 'Filing Service X', icon: FileText },
                  { id: 'renewal-history', label: 'Renewal History', icon: History },
                  { id: 'preview', label: 'Preview', icon: ClipboardCheck }
                ] as const).map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeWorkspaceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveWorkspaceTab(tab.id)}
                      className={`w-full text-left px-2.5 py-2 text-[11px] font-bold rounded transition-all flex items-center gap-2 ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600 font-extrabold border-l-2 border-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={13} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status card in sidebar */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-1.5 text-[10px]">
                <span className="font-bold text-gray-700 block border-b border-gray-200 pb-1 uppercase tracking-wider">Commercial Target</span>
                <p className="text-gray-500">Effective Date: <span className="font-bold text-gray-800">{selectedChild.effectiveDate}</span></p>
                <p className="text-gray-500">Rep Account: <span className="font-bold text-gray-800">{editedOpportunity.salesRep1}</span></p>
                <p className="text-gray-500">Customer Class: <span className="font-bold text-gray-800">{factFinding.industry}</span></p>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {/* Tab 1: Basic Information */}
              {activeWorkspaceTab === 'proposal' && (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                      <div className="p-1 bg-blue-50 rounded text-blue-600"><Briefcase size={14} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Basic Info</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Customer</label>
                          <input type="text" value={editedOpportunity.company} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Industry</label>
                          {isProposalEditMode ? (
                            <input type="text" value={selectedChild.industry || ''} onChange={e => setSelectedChild({...selectedChild, industry: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          ) : (
                            <input type="text" value={selectedChild.industry || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Class of Protection</label>
                          {isProposalEditMode ? (
                            <select value={selectedChild.classOfProtection || 'Statutory'} onChange={e => setSelectedChild({...selectedChild, classOfProtection: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                              <option value="Statutory">Statutory</option>
                              <option value="Voluntary">Voluntary</option>
                            </select>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase">{selectedChild.classOfProtection || '—'}</span>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Premium</label>
                          <input type="text" value={`${selectedChild.currency} ${selectedChild.premium.toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono font-bold cursor-not-allowed outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Linked Policy Number</label>
                          <input type="text" value={selectedChild.renewedFrom || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Insurer</label>
                          {isProposalEditMode ? (
                            <input type="text" value={selectedChild.vendor} onChange={e => setSelectedChild({...selectedChild, vendor: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          ) : (
                            <input type="text" value={selectedChild.vendor} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Debit Note No.</label>
                          {isProposalEditMode ? (
                            <input type="text" value={selectedChild.debitNoteNo || ''} onChange={e => setSelectedChild({...selectedChild, debitNoteNo: e.target.value})} placeholder="e.g. DN-94811" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          ) : (
                            <input type="text" value={selectedChild.debitNoteNo || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Internal Reference</label>
                          {isProposalEditMode ? (
                            <input type="text" value={selectedChild.internalReference || ''} onChange={e => setSelectedChild({...selectedChild, internalReference: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          ) : (
                            <input type="text" value={selectedChild.internalReference || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Product Item Details</label>
                          {isProposalEditMode ? (
                            <select
                              value={selectedChild.productItemDetails || ''}
                              onChange={e => setSelectedChild({...selectedChild, productItemDetails: e.target.value})}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                              <option value="">Please select</option>
                              {getDetailedProductOptions(getAssignedGmiProductGroup(selectedChild.productItem || 'Sample Care Gold')).map(dp => (
                                <option key={dp.id} value={dp.name}>{dp.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input type="text" value={selectedChild.productItemDetails || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Subsidiary</label>
                          {isProposalEditMode ? (
                            <input type="text" value={selectedChild.subsidiary || ''} onChange={e => setSelectedChild({...selectedChild, subsidiary: e.target.value})} placeholder="e.g. HK Branch" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          ) : (
                            <input type="text" value={selectedChild.subsidiary || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Existing Policy No</label>
                          {isProposalEditMode ? (
                            <input type="text" value={selectedChild.existingPolicyNo || ''} onChange={e => setSelectedChild({...selectedChild, existingPolicyNo: e.target.value})} placeholder="e.g. HTE0000986" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                          ) : (
                            <input type="text" value={selectedChild.existingPolicyNo || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Currency</label>
                          {isProposalEditMode ? (
                            <select value={selectedChild.currency || 'HKD'} onChange={e => setSelectedChild({...selectedChild, currency: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                              {['HKD', 'USD', 'CNY', 'GBP', 'EUR', 'SGD'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : (
                            <input type="text" value={selectedChild.currency || 'HKD'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Billing Method</label>
                          {isProposalEditMode ? (
                            <div className="flex gap-1">
                              {(['By Insurer', 'By Gainmiles'] as const).map(m => (
                                <button key={m} type="button" onClick={() => setSelectedChild({...selectedChild, billingMethod2: m})} className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold border transition-colors ${selectedChild.billingMethod2 === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{m}</button>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">{selectedChild.billingMethod2 || '—'}</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><DollarSign size={11} /> Commission Rate</span>
                          {isProposalEditMode ? (
                            <input type="number" max={100} value={selectedChild.commissionRate} onChange={e => setSelectedChild({...selectedChild, commissionRate: Math.min(100, Number(e.target.value))})} className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm font-bold text-emerald-700 bg-white focus:border-blue-500 outline-none" />
                          ) : (
                            <div className="text-sm font-bold text-emerald-700 mt-1">{selectedChild.commissionRate}%</div>
                          )}
                        </div>
                        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><DollarSign size={11} /> Client Discount Amount</span>
                          {isProposalEditMode ? (
                            <input type="number" value={selectedChild.clientDiscountAmount || 0} onChange={e => setSelectedChild({...selectedChild, clientDiscountAmount: Number(e.target.value)})} className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm font-bold text-emerald-700 bg-white focus:border-blue-500 outline-none" />
                          ) : (
                            <div className="text-sm font-bold text-emerald-700 mt-1">{selectedChild.currency} {(selectedChild.clientDiscountAmount || 0).toLocaleString()}</div>
                          )}
                        </div>
                        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={11} /> Start Date</span>
                          {isProposalEditMode ? (
                            <input type="date" value={selectedChild.effectiveDate} onChange={e => setSelectedChild({...selectedChild, effectiveDate: e.target.value})} className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm font-bold text-gray-900 bg-white font-mono focus:border-blue-500 outline-none" />
                          ) : (
                            <div className="text-sm font-bold text-gray-900 mt-1 font-mono">{selectedChild.effectiveDate}</div>
                          )}
                        </div>
                        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={11} /> End Date</span>
                          {isProposalEditMode ? (
                            <input type="date" value={selectedChild.endDate || ''} onChange={e => setSelectedChild({...selectedChild, endDate: e.target.value})} className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm font-bold text-gray-900 bg-white font-mono focus:border-blue-500 outline-none" />
                          ) : (
                            <div className="text-sm font-bold text-gray-900 mt-1 font-mono">{selectedChild.endDate || '—'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Policy Owner Information */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                      <div className="p-1 bg-purple-50 rounded text-purple-600"><ShieldCheck size={14} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Policy Owner Information</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Policy Number</label>
                        {isProposalEditMode ? (
                          <input type="text" value={selectedChild.policyId || ''} onChange={e => setSelectedChild({...selectedChild, policyId: e.target.value})} placeholder="e.g. POL-MEDIA-78321" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={selectedChild.policyId || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-500 font-mono font-bold cursor-not-allowed outline-none" />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Status</label>
                        {isProposalEditMode && selectedChild.status !== 'Converted to Policy' ? (
                          <select
                            value={selectedChild.status}
                            onChange={e => setSelectedChild({...selectedChild, status: e.target.value as ChildProposal['status']})}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            {(['Draft', 'In Progress', 'Pending Internal Approval', 'Pending Insurer', 'Approved', 'Accepted', 'Declined', 'Finalized'] as const).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 border text-[10px] font-black rounded uppercase tracking-wider ${
                            selectedChild.status === 'Converted to Policy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            selectedChild.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>{selectedChild.status}</span>
                        )}
                        {selectedChild.status === 'Converted to Policy' && isProposalEditMode && (
                          <p className="mt-1 text-[9px] text-gray-400">Locked — already converted to policy</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Sales Code</label>
                        {isProposalEditMode ? (
                          <input type="text" value={selectedChild.salesCode || ''} onChange={e => setSelectedChild({...selectedChild, salesCode: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={selectedChild.salesCode || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Sales Name</label>
                        <input type="text" value={editedOpportunity.salesRep1} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Sales Percentage</label>
                        {isProposalEditMode ? (
                          <input type="number" max={100} value={selectedChild.salesPercentage ?? 100} onChange={e => setSelectedChild({...selectedChild, salesPercentage: Math.min(100, Number(e.target.value))})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={`${selectedChild.salesPercentage ?? 100}%`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Renew Required <span className="text-red-500">*</span></label>
                        {isProposalEditMode ? (
                          <select
                            value={selectedChild.renewRequired || ''}
                            onChange={e => { setSelectedChild({...selectedChild, renewRequired: e.target.value as ChildProposal['renewRequired']}); setRenewRequiredError(false); }}
                            className={`w-full px-2.5 py-1.5 border rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${renewRequiredError ? 'border-red-400' : 'border-gray-200'}`}
                          >
                            <option value="" disabled>Please select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 border text-[10px] font-black rounded uppercase tracking-wider ${selectedChild.renewRequired === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedChild.renewRequired ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{selectedChild.renewRequired || 'Please select'}</span>
                        )}
                        {renewRequiredError && <p className="mt-1 text-[10px] text-red-500 font-semibold">Renew Required must be set before converting to policy.</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Proposer / Owner ID</label>
                        {isProposalEditMode ? (
                          <input type="text" value={selectedChild.proposerId || ''} onChange={e => setSelectedChild({...selectedChild, proposerId: e.target.value})} placeholder="e.g. O-000038" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={selectedChild.proposerId || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Proposer / Owner Name</label>
                        {isProposalEditMode ? (
                          <input type="text" value={selectedChild.proposerName || ''} onChange={e => setSelectedChild({...selectedChild, proposerName: e.target.value})} placeholder="Policy owner legal name" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={selectedChild.proposerName || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none" />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Sales Code 2</label>
                        {isProposalEditMode ? (
                          <input type="text" value={selectedChild.salesCode2 || ''} onChange={e => setSelectedChild({...selectedChild, salesCode2: e.target.value})} placeholder="Secondary" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={selectedChild.salesCode2 || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Sales Code 3</label>
                        {isProposalEditMode ? (
                          <input type="text" value={selectedChild.salesCode3 || ''} onChange={e => setSelectedChild({...selectedChild, salesCode3: e.target.value})} placeholder="Tertiary" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={selectedChild.salesCode3 || '—'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Employee Class Census — mirrors the live GMI Basic-Info "Employee Class" block */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                      <div className="p-1 bg-teal-50 rounded text-teal-600"><Users size={14} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Employee Class Census</h3>
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[9px] font-mono border border-teal-200 rounded font-bold uppercase tracking-wider">GMI Research Sum Class</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-3">
                      <select value={empDraft.gmiResearchSumClass} onChange={e => setEmpDraft({...empDraft, gmiResearchSumClass: e.target.value})} className="md:col-span-2 px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-teal-500 outline-none">
                        {GMI_RESEARCH_SUM_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="text" value={empDraft.customerPlanClass} onChange={e => setEmpDraft({...empDraft, customerPlanClass: e.target.value})} placeholder="Customer Plan Class" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" />
                      <input type="number" value={empDraft.emp} onChange={e => setEmpDraft({...empDraft, emp: e.target.value})} placeholder="EE #" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-teal-500 outline-none" />
                      <input type="number" value={empDraft.spouse} onChange={e => setEmpDraft({...empDraft, spouse: e.target.value})} placeholder="SP #" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-teal-500 outline-none" />
                      <input type="number" value={empDraft.child} onChange={e => setEmpDraft({...empDraft, child: e.target.value})} placeholder="CH #" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-teal-500 outline-none" />
                      <button onClick={addEmpClassRow} disabled={!empDraft.customerPlanClass.trim()} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                        <Plus size={13} /><span>Add</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                          <tr>
                            <th className="px-3 py-2">EIB Res'ch Sum Class Category</th>
                            <th className="px-3 py-2">Customer Plan Class</th>
                            <th className="px-3 py-2 text-right">Employee</th>
                            <th className="px-3 py-2 text-right">Spouse</th>
                            <th className="px-3 py-2 text-right">Children</th>
                            <th className="px-3 py-2 text-right">Other</th>
                            <th className="px-3 py-2 text-right w-12">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {empClassCensus.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-1">
                                <select value={r.gmiResearchSumClass} onChange={e => updateEmpClassRow(r.id, { gmiResearchSumClass: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-teal-500 outline-none text-xs text-gray-700 font-medium">
                                  {Array.from(new Set([...GMI_RESEARCH_SUM_CLASSES, r.gmiResearchSumClass])).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </td>
                              <td className="p-1"><input type="text" value={r.customerPlanClass} onChange={e => updateEmpClassRow(r.id, { customerPlanClass: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-teal-500 outline-none text-xs font-semibold text-gray-800" /></td>
                              <td className="p-1"><input type="number" value={r.emp} onChange={e => updateEmpClassRow(r.id, { emp: Number(e.target.value) || 0 })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-teal-500 outline-none text-xs font-mono text-right text-teal-700 font-bold" /></td>
                              <td className="p-1"><input type="number" value={r.spouse} onChange={e => updateEmpClassRow(r.id, { spouse: Number(e.target.value) || 0 })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-teal-500 outline-none text-xs font-mono text-right text-gray-700" /></td>
                              <td className="p-1"><input type="number" value={r.child} onChange={e => updateEmpClassRow(r.id, { child: Number(e.target.value) || 0 })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-teal-500 outline-none text-xs font-mono text-right text-gray-700" /></td>
                              <td className="p-1"><input type="number" value={r.other} onChange={e => updateEmpClassRow(r.id, { other: Number(e.target.value) || 0 })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-teal-500 outline-none text-xs font-mono text-right text-gray-700" /></td>
                              <td className="p-1 text-center"><button onClick={() => deleteEmpClassRow(r.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={12} /></button></td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold font-mono">
                            <td className="px-3 py-2 font-sans" colSpan={2}>Total</td>
                            <td className="px-3 py-2 text-right text-teal-700">{empClassCensus.reduce((s, r) => s + r.emp, 0)}</td>
                            <td className="px-3 py-2 text-right">{empClassCensus.reduce((s, r) => s + r.spouse, 0)}</td>
                            <td className="px-3 py-2 text-right">{empClassCensus.reduce((s, r) => s + r.child, 0)}</td>
                            <td className="px-3 py-2 text-right">{empClassCensus.reduce((s, r) => s + r.other, 0)}</td>
                            <td className="px-3 py-2"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Premium */}
              {activeWorkspaceTab === 'premium' && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-1 border-b border-gray-100 pb-2">Premium State Model</h3>
                    <p className="text-[11px] text-gray-500 mb-3 mt-2">One premium object across the merged system — the same figure is no longer renamed 4× across GMI + Odoo.</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {(() => {
                        const state = (selectedChild.policyId || selectedChild.status === 'Converted to Policy') ? 'Invoice' : (selectedChild.odooPushed || selectedChild.status === 'Finalized') ? 'Quotation' : 'Presales';
                        const steps = [
                          { k: 'Presales', label: 'Presales Premium', sys: 'GMI · proposal' },
                          { k: 'Quotation', label: 'Quotation Premium', sys: 'Odoo Sales' },
                          { k: 'Invoice', label: 'Invoice Premium', sys: 'Odoo · billed' },
                          { k: 'Actual', label: 'Actual Premium', sys: 'Odoo · settled' },
                        ];
                        const cur = steps.findIndex(x => x.k === state);
                        return steps.map((st, i) => (
                          <React.Fragment key={st.k}>
                            <div className={`px-3 py-2 rounded-lg border text-center ${i === cur ? 'bg-orange-500 border-orange-500 text-white' : i < cur ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                              <div className="text-[11px] font-bold whitespace-nowrap">{st.label}</div>
                              <div className="text-[9px] opacity-80 whitespace-nowrap">{st.sys}</div>
                            </div>
                            {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
                          </React.Fragment>
                        ));
                      })()}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Premium by Employee Class</h3>
                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                          <tr>
                            <th className="px-3 py-2">Employee Class</th>
                            <th className="px-3 py-2">GM Category</th>
                            <th className="px-3 py-2 text-right">Premium</th>
                            <th className="px-3 py-2 text-right">Employee</th>
                            <th className="px-3 py-2 text-right">Spouse</th>
                            <th className="px-3 py-2 text-right">Children</th>
                            <th className="px-3 py-2 text-right">Other</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono divide-y divide-gray-100">
                          {(selectedChild.premiumBreakdown || []).map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-sans font-semibold text-gray-800">{row.employeeClass}</td>
                              <td className="px-3 py-2">{row.gmCategory}</td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900">{selectedChild.currency} {row.premium.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right">{row.employee}</td>
                              <td className="px-3 py-2 text-right">{row.spouse}</td>
                              <td className="px-3 py-2 text-right">{row.children}</td>
                              <td className="px-3 py-2 text-right">{row.other}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-3 py-2 font-sans" colSpan={2}>Total</td>
                            <td className="px-3 py-2 text-right">{selectedChild.currency} {(selectedChild.premiumBreakdown || []).reduce((s, r) => s + r.premium, 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right">{(selectedChild.premiumBreakdown || []).reduce((s, r) => s + r.employee, 0)}</td>
                            <td className="px-3 py-2 text-right">{(selectedChild.premiumBreakdown || []).reduce((s, r) => s + r.spouse, 0)}</td>
                            <td className="px-3 py-2 text-right">{(selectedChild.premiumBreakdown || []).reduce((s, r) => s + r.children, 0)}</td>
                            <td className="px-3 py-2 text-right">{(selectedChild.premiumBreakdown || []).reduce((s, r) => s + r.other, 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Premium Frequency</label>
                      {isProposalEditMode ? (
                        <select value={selectedChild.premiumFrequency || 'Annual'} onChange={e => setSelectedChild({...selectedChild, premiumFrequency: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                          <option value="Single Premium">Single Premium</option>
                          <option value="Annual">Annual</option>
                          <option value="Semi-Annual">Semi-Annual</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">{selectedChild.premiumFrequency || 'Annual'}</span>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Premium Type</label>
                      {isProposalEditMode ? (
                        <select value={selectedChild.premiumType || 'Per Rate'} onChange={e => setSelectedChild({...selectedChild, premiumType: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                          <option value="Per Rate">Per Rate</option>
                          <option value="Flat Rate">Flat Rate</option>
                        </select>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-gray-800 text-white rounded text-[10px] font-bold">{selectedChild.premiumType || 'Per Rate'}</span>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Premium Adjustment</label>
                      {isProposalEditMode ? (
                        <input type="number" value={selectedChild.premiumAdjustment || 0} onChange={e => setSelectedChild({...selectedChild, premiumAdjustment: Number(e.target.value)})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                      ) : (
                        <input type="text" value={`${selectedChild.currency} ${(selectedChild.premiumAdjustment || 0).toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Proposal Premium</label>
                      <input type="text" value={`${selectedChild.currency} ${(selectedChild.proposalPremium ?? selectedChild.premium).toLocaleString()}`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-emerald-700 font-mono font-black cursor-not-allowed outline-none" />
                    </div>
                  </div>

                  {/* Premium Rate Calculation — mirrors the live GMI Premium step (Sum Insured x Rate -> Per Plan Premium) */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-emerald-50 rounded text-emerald-600"><DollarSign size={14} /></div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Premium Rate Calculation</h3>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-mono border border-emerald-200 rounded font-bold uppercase tracking-wider">Mirrors GMI Premium Step</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedChild.premiumType || 'Per Rate'} · {selectedChild.premiumFrequency || 'Annual'}</span>
                    </div>

                    {/* Add rate line */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                      <input type="text" value={rateDraft.benefit} onChange={e => setRateDraft({...rateDraft, benefit: e.target.value})} placeholder="Benefit" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      <select value={rateDraft.employeeClass} onChange={e => setRateDraft({...rateDraft, employeeClass: e.target.value})} className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 outline-none">
                        <option value="">Employee Class…</option>
                        {plansList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                      <input type="number" value={rateDraft.sumInsured} onChange={e => setRateDraft({...rateDraft, sumInsured: e.target.value})} placeholder="Sum Insured" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      <input type="number" value={rateDraft.rate} onChange={e => setRateDraft({...rateDraft, rate: e.target.value})} placeholder="Rate %" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      <button onClick={addRateRow} disabled={!rateDraft.benefit.trim()} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                        <Plus size={13} /><span>Add</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                          <tr>
                            <th className="px-3 py-2">Benefit</th>
                            <th className="px-3 py-2">Employee Class</th>
                            <th className="px-3 py-2 text-right">Sum Insured ({selectedChild.currency || 'HKD'})</th>
                            <th className="px-3 py-2 text-right">Rate (%)</th>
                            <th className="px-3 py-2 text-right">Per Plan Premium ({selectedChild.currency || 'HKD'})</th>
                            <th className="px-3 py-2 text-right w-12">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {premiumRates.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-1"><input type="text" value={r.benefit} onChange={e => updateRateRow(r.id, { benefit: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-xs font-semibold text-gray-800" /></td>
                              <td className="p-1">
                                <select value={r.employeeClass} onChange={e => updateRateRow(r.id, { employeeClass: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-[11px] text-gray-600 font-medium">
                                  {Array.from(new Set([...plansList.map(p => p.name), r.employeeClass].filter(Boolean))).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </td>
                              <td className="p-1"><input type="number" value={r.sumInsured} onChange={e => updateRateRow(r.id, { sumInsured: Number(e.target.value) || 0 })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-xs font-mono text-right text-gray-900" /></td>
                              <td className="p-1"><input type="number" value={r.rate} onChange={e => updateRateRow(r.id, { rate: Number(e.target.value) || 0 })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-xs font-mono text-right text-gray-700" /></td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">{perPlanPremium(r).toLocaleString()}</td>
                              <td className="p-1 text-center">
                                <button onClick={() => deleteRateRow(r.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                              </td>
                            </tr>
                          ))}
                          {premiumRates.length === 0 && (
                            <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-xs italic">No rate lines. Add one above.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Premium by Plan (derived totals) */}
                    {(() => {
                      const totals: Record<string, number> = {};
                      premiumRates.forEach(r => { totals[r.employeeClass] = (totals[r.employeeClass] || 0) + perPlanPremium(r); });
                      const entries = Object.entries(totals);
                      const grand = entries.reduce((s, [, v]) => s + v, 0);
                      const cur = selectedChild.currency || 'HKD';
                      return (
                        <div className="mt-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Premium by Plan (Derived)</h4>
                          <div className="overflow-x-auto border border-gray-150 rounded">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                                <tr>
                                  <th className="px-3 py-2">Plan Name</th>
                                  <th className="px-3 py-2 text-right">Premium ({cur})</th>
                                </tr>
                              </thead>
                              <tbody className="font-mono divide-y divide-gray-100">
                                {entries.map(([plan, val]) => (
                                  <tr key={plan}>
                                    <td className="px-3 py-2 font-sans font-semibold text-gray-800">{plan || '(Unassigned)'}</td>
                                    <td className="px-3 py-2 text-right font-bold text-gray-900">{val.toLocaleString()}</td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50 font-bold">
                                  <td className="px-3 py-2 font-sans">Total</td>
                                  <td className="px-3 py-2 text-right text-emerald-700">{cur} {grand.toLocaleString()}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Premium by Benefit</h3>
                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                          <tr>
                            <th className="px-3 py-2">Benefit</th>
                            <th className="px-3 py-2">Customer Category</th>
                            <th className="px-3 py-2 text-right">Per Plan Premium</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono divide-y divide-gray-100">
                          {(selectedChild.benefitPremiums || []).map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-sans font-semibold text-gray-800">{row.benefit}</td>
                              <td className="px-3 py-2">{row.customerCategory}</td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900">{row.perPlanPremium.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Documents */}
              {activeWorkspaceTab === 'documents' && (
                <div className="space-y-4">
                  {/* GUM CSPA Storage — typed folder tree (mirrors the live Filing Service X step) */}
                  <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-50 rounded text-blue-600"><Archive size={14} /></div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">GUM CSPA Storage</h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-mono font-bold uppercase tracking-wider">Typed Folder Tree</span>
                      </div>
                      {selectedFolders.length > 0 && (
                        <button onClick={() => { setDocuments(prev => prev.filter(d => !selectedFolders.includes(d.category))); setSelectedFolders([]); }} className="px-2.5 py-1 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"><Trash2 size={11} /> Clear files in {selectedFolders.length}</button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 mb-3 flex-wrap">
                      <span className="text-gray-600 font-bold">GUM CSPA Storage</span><ChevronRight size={11} /><span>policy</span><ChevronRight size={11} /><span>group</span><ChevronRight size={11} /><span className="text-blue-600 truncate max-w-[420px]">{editedOpportunity.company || 'Proposal'}_{selectedChild.classOfProtection || 'Risk Protection'}_{selectedChild.vendor}</span>
                    </div>

                    <input ref={filingInputRef} type="file" onChange={handleUploadFile} className="hidden" disabled={uploading} />

                    <div className="border border-gray-150 rounded divide-y divide-gray-100">
                      {CSPA_FOLDERS.map(folder => {
                        const files = documents.filter(d => d.category === folder);
                        const isOpen = expandedFolder === folder;
                        return (
                          <div key={folder}>
                            <div className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${filingFolder === folder ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}>
                              <input type="checkbox" checked={selectedFolders.includes(folder)} onChange={e => setSelectedFolders(prev => e.target.checked ? [...prev, folder] : prev.filter(f => f !== folder))} className="accent-blue-600" />
                              <button onClick={() => setExpandedFolder(isOpen ? null : folder)} className="flex items-center gap-1.5 flex-1 text-left">
                                {isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                                <FileText size={13} className="text-blue-500 shrink-0" />
                                <span className="font-bold text-gray-700">{folder}</span>
                                {files.length > 0 && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold">{files.length}</span>}
                              </button>
                              <button onClick={() => { setFilingFolder(folder); filingInputRef.current?.click(); }} className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 hover:border-blue-200 rounded text-[10px] font-bold flex items-center gap-1 transition-all"><Upload size={10} /> Upload</button>
                            </div>
                            {isOpen && (
                              <div className="pl-9 pr-3 pb-2 space-y-1 bg-gray-50/30">
                                {files.length === 0 ? (
                                  <p className="text-[10px] text-gray-400 italic py-1">Empty folder.</p>
                                ) : files.map(doc => (
                                  <div key={doc.id} className="flex items-center justify-between text-[11px] py-1">
                                    <span className="flex items-center gap-1.5 text-gray-600"><FileCode size={11} className="text-blue-400" /> {doc.name} <span className="text-gray-400">· {doc.size}</span></span>
                                    <button onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))} className="text-gray-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50"><Trash2 size={11} /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Uploading to: <span className="font-bold text-blue-600">{filingFolder}</span> — use a folder's Upload button to change the target.</p>
                  </div>

                  <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2 font-sans">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Filing Service X</h3>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold uppercase tracking-wider">GUM CSPA Storage</span>
                    </div>

                    {/* File Upload zone with drag & drop and manual selection support */}
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer group mb-4">
                      <input type="file" onChange={handleUploadFile} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                      <div className="flex flex-col items-center justify-center">
                        <Upload size={24} className="text-gray-400 mb-1 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-bold text-gray-700">Click or Drag & Drop underwriting sheets here</span>
                        <span className="text-[9px] text-gray-400 mt-0.5">Supports PDF, XLSX files up to 10MB</span>
                      </div>
                    </div>

                    {uploading && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs mb-4">
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-blue-800">Uploading File Archive...</span>
                          <span className="text-blue-800 font-mono">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-blue-100 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Bills and Policy Doc. / Claims / Correspondence</h4>
                      {documents.map(doc => (
                        <div key={doc.id} className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <FileCode className="text-blue-500" size={14} />
                            <div>
                              <p className="font-bold text-gray-800 font-sans">{doc.name}</p>
                              <span className="text-[10px] text-gray-400">Type: {doc.category} · Size: {doc.size || '1.8 MB'} · Uploaded: {doc.date}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 font-sans">
                            <button 
                              onClick={() => setPreviewingDoc(doc)} 
                              className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-600 border border-gray-200 hover:border-orange-200 font-bold text-[10px] rounded flex items-center gap-1 transition-all"
                              title="Preview Document"
                            >
                              <Play size={10} />
                              <span>Preview</span>
                            </button>
                            <button 
                              onClick={() => alert(`Downloaded file ${doc.name} successfully!`)} 
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-gray-200 hover:border-blue-200 font-bold text-[10px] rounded flex items-center gap-1 transition-all" 
                              title="Download File"
                            >
                              <Download size={10} />
                              <span>Download</span>
                            </button>
                            <button 
                              onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))} 
                              className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded border border-transparent hover:border-red-100 transition-colors" 
                              title="Delete File"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Preview Dialog */}
                  {previewingDoc && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-5 font-sans">
                      <div className="flex justify-between items-center mb-3 border-b border-amber-200 pb-1.5">
                        <span className="flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wider">
                          <Info size={14} />
                          <span>Interactive Previewing: {previewingDoc.name}</span>
                        </span>
                        <button 
                          onClick={() => setPreviewingDoc(null)}
                          className="p-1 hover:bg-amber-100 text-amber-800 rounded transition-colors"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-4 text-[11px] font-mono shadow-inner max-h-72 overflow-y-auto">
                        <div className="border-b border-gray-100 pb-2 mb-2 text-gray-400 flex justify-between font-mono">
                          <span>[COMPILING PREVIEW ENGINE...]</span>
                          <span>SIZE: {previewingDoc.size || '2.4 MB'}</span>
                        </div>
                        {previewingDoc.name.endsWith('.pdf') ? (
                          <div className="space-y-2 text-gray-800 font-mono">
                            <p className="font-bold text-gray-900 border-b border-gray-100 pb-1">GAIN MILES UNDERWRITING REPORT SUMMARY</p>
                            <p><strong>Quotation Source:</strong> {selectedChild.vendor} Insurance (HK) Ltd.</p>
                            <p><strong>Insured Sponsor:</strong> {editedOpportunity.company}</p>
                            <p><strong>Proposal ID:</strong> {selectedChild.id} ({selectedChild.version})</p>
                            <p><strong>Class Coverage:</strong> Core Employee + Spouse Dependents Option</p>
                            <p className="pt-2 text-gray-500 italic font-sans">[Simulated PDF Preview: Full compliance terms, premium factors, actuarial claims curves and standard exclusions are verified for delivery to sponsor board.]</p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-gray-800 font-mono">
                            <p className="font-bold text-gray-900 border-b border-gray-100 pb-1">BENEFIT MATRIX SCHEME COMPARISON SHEET (.XLSX)</p>
                            <div className="grid grid-cols-4 gap-2 border-b border-gray-100 py-1 font-bold">
                              <span>Benefit Item</span>
                              <span>AIA Tier 1</span>
                              <span>Bupa Ward</span>
                              <span>Market Avg</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 border-b border-gray-50 py-0.5 text-gray-600">
                              <span>Daily Room</span>
                              <span>$3,200 (Semi)</span>
                              <span>$1,800 (Ward)</span>
                              <span>$2,200</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 border-b border-gray-50 py-0.5 text-gray-600">
                              <span>Surgical Limit</span>
                              <span>$95,000</span>
                              <span>$60,000</span>
                              <span>$72,000</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 border-b border-gray-50 py-0.5 text-gray-600">
                              <span>Outpatient Co-Pay</span>
                              <span>$50 Network</span>
                              <span>20% Co-Ins</span>
                              <span>$100 Flat</span>
                            </div>
                            <p className="pt-2 text-gray-500 italic font-sans">[Simulated Excel Grid: Calculated totals and benefit margins align with broker expectations.]</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Benefit Design */}
              {activeWorkspaceTab === 'benefits' && (
                <div className="space-y-4">
                  {/* Coverage Schedule — mirrors the live GMI "Coverages" step (flat Benefit/Coverage/Category/Class/Value/Benchmark rows) */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-emerald-50 rounded text-emerald-600"><Layers size={14} /></div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Coverage Schedule</h3>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-mono border border-emerald-200 rounded font-bold uppercase tracking-wider">Mirrors GMI Coverages Step</span>
                      </div>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black border border-gray-200 rounded uppercase tracking-wider">{coverageRows.length} Coverages</span>
                    </div>

                    {/* Add / filter row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                      <input type="text" value={covDraft.benefit} onChange={e => setCovDraft({...covDraft, benefit: e.target.value})} placeholder="Benefit" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      <input type="text" value={covDraft.coverage} onChange={e => setCovDraft({...covDraft, coverage: e.target.value})} placeholder="Coverage" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      <select value={covDraft.category} onChange={e => setCovDraft({...covDraft, category: e.target.value})} className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 outline-none">
                        {COVERAGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={covDraft.employeeClass} onChange={e => setCovDraft({...covDraft, employeeClass: e.target.value})} className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 outline-none">
                        <option value="">Employee Class…</option>
                        {plansList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                      <button onClick={addCoverageRow} disabled={!covDraft.benefit.trim() || !covDraft.coverage.trim()} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                        <Plus size={13} /><span>Add</span>
                      </button>
                    </div>

                    {/* Controls row: pagination · search · insurer alias · benchmark tag · delete multiple */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                      <select value={covPageSize} onChange={e => { setCovPageSize(Number(e.target.value)); setCovPage(1); }} className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-600 focus:border-emerald-500 outline-none">
                        {[10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                      </select>
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={covSearch} onChange={e => { setCovSearch(e.target.value); setCovPage(1); }} placeholder="Search benefit / coverage / class" className="w-full pl-7 pr-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      </div>
                      <select value={covInsurerAlias || selectedChild.vendor || ''} onChange={e => setCovInsurerAlias(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-700 focus:border-emerald-500 outline-none" title="Insurer Alias">
                        {Array.from(new Set([selectedChild.vendor || 'Chubb Insurance HK Limited', 'AIA International', 'AXA General Insurance', 'Bupa (Asia)'])).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <input type="text" value={covBenchmarkTag} onChange={e => setCovBenchmarkTag(e.target.value)} placeholder="Benchmark Tag" className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      <button onClick={deleteSelectedCoverages} disabled={covSelected.length === 0} className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                        <Trash2 size={12} /><span>Delete ({covSelected.length})</span>
                      </button>
                    </div>

                    {/* Grouping tabs: by benefit + by employee class */}
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">Benefit</span>
                      {['ALL', ...Array.from(new Set(coverageRows.map(r => r.benefit)))].map(b => (
                        <button key={b} onClick={() => { setCovGroupFilter(b); setCovPage(1); }} className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${covGroupFilter === b ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                          {b}{b !== 'ALL' && <span className="ml-1 opacity-70">({coverageRows.filter(r => r.benefit === b).length})</span>}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mb-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">Plan</span>
                      {['ALL', ...Array.from(new Set(coverageRows.map(r => r.employeeClass).filter(Boolean)))].map(pl => (
                        <button key={pl} onClick={() => { setCovPlanFilter(pl); setCovPage(1); }} className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${covPlanFilter === pl ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                          {pl === 'ALL' ? 'Plan All' : pl}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const q = covSearch.trim().toLowerCase();
                      const filtered = coverageRows.filter(r =>
                        (covGroupFilter === 'ALL' || r.benefit === covGroupFilter) &&
                        (covPlanFilter === 'ALL' || r.employeeClass === covPlanFilter) &&
                        (q === '' || [r.benefit, r.coverage, r.category, r.employeeClass, r.coverageValue].some(v => v.toLowerCase().includes(q)))
                      );
                      const total = filtered.length;
                      const pages = Math.max(1, Math.ceil(total / covPageSize));
                      const page = Math.min(covPage, pages);
                      const start = (page - 1) * covPageSize;
                      const pageRows = filtered.slice(start, start + covPageSize);
                      const allOnPageSelected = pageRows.length > 0 && pageRows.every(r => covSelected.includes(r.id));
                      const catOpts = (cur: string) => Array.from(new Set([...COVERAGE_CATEGORIES, cur]));
                      const planOpts = (cur: string) => Array.from(new Set([...plansList.map(p => p.name), cur].filter(Boolean)));
                      return (
                        <>
                          <div className="overflow-x-auto border border-gray-150 rounded">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                                <tr>
                                  <th className="px-2 py-2 w-8 text-center">
                                    <input type="checkbox" checked={allOnPageSelected} onChange={e => {
                                      const ids = pageRows.map(r => r.id);
                                      setCovSelected(prev => e.target.checked ? Array.from(new Set([...prev, ...ids])) : prev.filter(s => !ids.includes(s)));
                                    }} className="accent-emerald-600" />
                                  </th>
                                  <th className="px-3 py-2">Benefits</th>
                                  <th className="px-3 py-2">Coverages</th>
                                  <th className="px-3 py-2">Categories</th>
                                  <th className="px-3 py-2">Employee Class</th>
                                  <th className="px-3 py-2">Coverage Value</th>
                                  <th className="px-3 py-2">BenchMark (median)</th>
                                  <th className="px-3 py-2 text-right w-12">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {pageRows.map(r => (
                                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-2 py-1 text-center">
                                      <input type="checkbox" checked={covSelected.includes(r.id)} onChange={e => setCovSelected(prev => e.target.checked ? [...prev, r.id] : prev.filter(s => s !== r.id))} className="accent-emerald-600" />
                                    </td>
                                    <td className="p-1"><input type="text" value={r.benefit} onChange={e => updateCoverageRow(r.id, { benefit: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-xs font-semibold text-gray-800" /></td>
                                    <td className="p-1"><input type="text" value={r.coverage} onChange={e => updateCoverageRow(r.id, { coverage: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-xs text-gray-700" /></td>
                                    <td className="p-1">
                                      <select value={r.category} onChange={e => updateCoverageRow(r.id, { category: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-[11px] text-gray-600 font-medium">
                                        {catOpts(r.category).map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                    </td>
                                    <td className="p-1">
                                      <select value={r.employeeClass} onChange={e => updateCoverageRow(r.id, { employeeClass: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-[11px] text-gray-600 font-medium">
                                        {planOpts(r.employeeClass).map(p => <option key={p} value={p}>{p}</option>)}
                                      </select>
                                    </td>
                                    <td className="p-1"><input type="text" value={r.coverageValue} onChange={e => updateCoverageRow(r.id, { coverageValue: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-xs font-bold text-gray-900" /></td>
                                    <td className="p-1"><input type="text" value={r.benchmarkMedian} onChange={e => updateCoverageRow(r.id, { benchmarkMedian: e.target.value })} className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 outline-none text-xs text-gray-500" /></td>
                                    <td className="p-1 text-center">
                                      <button onClick={() => deleteCoverageRow(r.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                                    </td>
                                  </tr>
                                ))}
                                {pageRows.length === 0 && (
                                  <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400 text-xs italic">No coverages match the current filter.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex justify-between items-center mt-2 text-[11px] text-gray-500">
                            <span>Showing {total === 0 ? 0 : start + 1} to {Math.min(start + covPageSize, total)} of {total} entries</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setCovPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">«</button>
                              <span className="px-2 font-bold text-gray-600">{page} / {pages}</span>
                              <button onClick={() => setCovPage(Math.min(pages, page + 1))} disabled={page >= pages} className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">»</button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Loaded Product Hierarchy Snapshot (Read-only) */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-50 rounded text-blue-600">
                          <Layers size={14} />
                        </div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Loaded Product Hierarchy (Read-only Snapshot)</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black border border-gray-200 rounded uppercase tracking-wider">Snapshot Locked</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Product details */}
                      <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3.5 space-y-1 text-xs">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Assigned GMI Group</span>
                        <div className="font-extrabold text-gray-900 text-sm mt-1">{activeChildGmiResolution.group || 'General Insurance'}</div>
                        <p className="text-gray-400 text-[10px] mt-1.5">Based on Product Item: <span className="font-bold text-gray-700">{selectedChild.productItem || 'Sample Care Gold'}</span></p>
                      </div>

                      {/* Loaded Benefits */}
                      <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3.5 space-y-2 text-xs">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Loaded Benefit Items ({activeChildGmiResolution.benefits.length})</span>
                        {activeChildGmiResolution.benefits.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {activeChildGmiResolution.benefits.map((bName: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-150 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                                <Check size={10} className="text-blue-500 shrink-0" />
                                <span>{bName}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-[10px] italic">No benefits loaded from GMI Group.</p>
                        )}
                      </div>

                      {/* Loaded Coverages */}
                      <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3.5 space-y-2 text-xs">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Loaded Coverage Items ({activeChildGmiResolution.coverages.length})</span>
                        {activeChildGmiResolution.coverages.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {activeChildGmiResolution.coverages.map((cName: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                                <Check size={10} className="text-emerald-500 shrink-0" />
                                <span>{cName}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-[10px] italic">No coverages loaded from GMI Group.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plan Census & Option Codes */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-1.5">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Plan Census Composition</h3>
                      <button 
                        onClick={() => setPlansList([
                          ...plansList, 
                          { 
                            id: `p${plansList.length + 1}`, 
                            name: `Plan ${plansList.length + 1}: Custom`, 
                            class: 'Grade B General', 
                            eligibility: 'Assigned Staff', 
                            emp: '10', 
                            spouse: '0', 
                            child: '0' 
                          }
                        ])} 
                        className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                      >
                        <Plus size={11} />
                        <span>Add Option Code</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse font-mono">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-150 font-sans">
                          <tr>
                            <th className="px-3 py-2 border-r border-gray-150">Plan Code / Name</th>
                            <th className="px-3 py-2 border-r border-gray-150">Assigned Class Tier</th>
                            <th className="px-3 py-2 border-r border-gray-150">Eligibility Terms</th>
                            <th className="px-3 py-2 text-center border-r border-gray-150 w-24">Employee Headcount</th>
                            <th className="px-3 py-2 text-center border-r border-gray-150 w-24">Spouse Dependents</th>
                            <th className="px-3 py-2 text-center border-r border-gray-150 w-24">Child Dependents</th>
                            <th className="px-3 py-2 text-right w-16">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plansList.map(pl => (
                            <tr key={pl.id} className="border-b border-gray-150 hover:bg-gray-50/50 transition-colors">
                              <td className="p-1 border-r border-gray-150">
                                <input 
                                  type="text" 
                                  value={pl.name} 
                                  onChange={e => setPlansList(plansList.map(p => p.id === pl.id ? {...p, name: e.target.value} : p))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" 
                                />
                              </td>
                              <td className="p-1 border-r border-gray-150">
                                <select 
                                  value={pl.class} 
                                  onChange={e => setPlansList(plansList.map(p => p.id === pl.id ? {...p, class: e.target.value} : p))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs font-sans font-medium"
                                >
                                  <option value="Grade A Executive">Grade A Executive</option>
                                  <option value="Grade B General">Grade B General</option>
                                  <option value="Grade C Assistant">Grade C Assistant</option>
                                </select>
                              </td>
                              <td className="p-1 border-r border-gray-150">
                                <input 
                                  type="text" 
                                  value={pl.eligibility} 
                                  onChange={e => setPlansList(plansList.map(p => p.id === pl.id ? {...p, eligibility: e.target.value} : p))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs font-sans font-medium" 
                                />
                              </td>
                              <td className="p-1 text-center border-r border-gray-150">
                                <input 
                                  type="number" 
                                  value={pl.emp} 
                                  onChange={e => setPlansList(plansList.map(p => p.id === pl.id ? {...p, emp: e.target.value} : p))} 
                                  className="w-16 p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-center font-bold text-blue-700" 
                                />
                              </td>
                              <td className="p-1 text-center border-r border-gray-150">
                                <input 
                                  type="number" 
                                  value={pl.spouse} 
                                  onChange={e => setPlansList(plansList.map(p => p.id === pl.id ? {...p, spouse: e.target.value} : p))} 
                                  className="w-16 p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-center font-bold text-gray-700" 
                                />
                              </td>
                              <td className="p-1 text-center border-r border-gray-150">
                                <input 
                                  type="number" 
                                  value={pl.child} 
                                  onChange={e => setPlansList(plansList.map(p => p.id === pl.id ? {...p, child: e.target.value} : p))} 
                                  className="w-16 p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-xs text-center font-bold text-gray-700" 
                                />
                              </td>
                              <td className="p-1 text-center">
                                <button 
                                  onClick={() => setPlansList(plansList.filter(p => p.id !== pl.id))} 
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

                  {/* Excel-style Benefit Matrix */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Excel Benefit Matrix</h3>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-mono border border-emerald-200 rounded font-bold uppercase tracking-wider">Source: GMI Template</span>
                      </div>
                      <button 
                        onClick={() => setBenefitMatrix([
                          ...benefitMatrix, 
                          { 
                            id: `b_row_${Date.now()}`, 
                            category: 'Clinical & Outpatient', 
                            item: 'New Benefit Parameter', 
                            values: plansList.reduce((acc, plan) => ({ ...acc, [plan.id]: 'HK$500 / Cap' }), {}), 
                            marketAvg: 'HK$400' 
                          }
                        ])} 
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                      >
                        <Plus size={11} />
                        <span>Insert Row</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse font-mono">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-150 font-sans">
                          <tr>
                            <th className="px-3 py-2 border-r border-gray-150 w-44">Category</th>
                            <th className="px-3 py-2 border-r border-gray-150 w-52">Benefit</th>
                            {plansList.map(plan => (
                              <th key={plan.id} className="px-3 py-2 border-r border-gray-150 text-blue-700 font-extrabold min-w-[120px] bg-blue-50/20">
                                {plan.name}
                              </th>
                            ))}
                            <th className="px-3 py-2 border-r border-gray-150 w-40 text-gray-600 bg-gray-50/50">Market Baseline</th>
                            <th className="px-3 py-2 text-right w-12 font-sans">Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {benefitMatrix.map(row => (
                            <tr key={row.id} className="border-b border-gray-150 hover:bg-gray-50/40 transition-all">
                              <td className="p-1 border-r border-gray-150 font-sans font-bold text-gray-600">
                                <select 
                                  value={row.category} 
                                  onChange={e => setBenefitMatrix(benefitMatrix.map(r => r.id === row.id ? {...r, category: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 outline-none text-[11px] font-bold text-gray-600"
                                >
                                  <option value="Hospitalization & Surgical">Hospitalization & Surgical</option>
                                  <option value="Clinical & Outpatient">Clinical & Outpatient</option>
                                  <option value="Dental Care">Dental Care</option>
                                  <option value="Supplementary Medical Rider">Supplementary Medical Rider</option>
                                </select>
                              </td>
                              <td className="p-1 border-r border-gray-150 font-sans font-medium text-gray-800">
                                <input 
                                  type="text" 
                                  value={row.item} 
                                  onChange={e => setBenefitMatrix(benefitMatrix.map(r => r.id === row.id ? {...r, item: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-semibold" 
                                />
                              </td>
                              {plansList.map(plan => (
                                <td key={plan.id} className="p-1 border-r border-gray-150 bg-blue-50/10 hover:bg-white focus-within:bg-white">
                                  <input 
                                    type="text" 
                                    value={row.values[plan.id] || ''} 
                                    onChange={e => {
                                      const newVal = e.target.value;
                                      setBenefitMatrix(benefitMatrix.map(r => r.id === row.id ? {
                                        ...r,
                                        values: { ...r.values, [plan.id]: newVal }
                                      } : r));
                                    }} 
                                    className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-bold text-gray-900 text-center" 
                                  />
                                </td>
                              ))}
                              <td className="p-1 border-r border-gray-150 bg-gray-50/20">
                                <input 
                                  type="text" 
                                  value={row.marketAvg} 
                                  onChange={e => setBenefitMatrix(benefitMatrix.map(r => r.id === row.id ? {...r, marketAvg: e.target.value} : r))} 
                                  className="w-full p-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-gray-500 text-center" 
                                />
                              </td>
                              <td className="p-1 text-center font-sans">
                                <button 
                                  onClick={() => setBenefitMatrix(benefitMatrix.filter(r => r.id !== row.id))} 
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
              )}


              {/* Tab 4: Renewal History */}
              {activeWorkspaceTab === 'preview' && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                      <div className="p-1 bg-indigo-50 rounded text-indigo-600"><ClipboardCheck size={14} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Preview</h3>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-mono font-bold uppercase tracking-wider">Read-only</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-100">
                      {([['summary', 'Summary'], ['coverage', 'Coverage'], ['expired', 'Expired Policy'], ['premium', 'Premium']] as const).map(([k, label]) => (
                        <button key={k} onClick={() => setPreviewSubTab(k)} className={`px-3 py-1.5 text-xs font-bold border-b-2 -mb-px transition-colors ${previewSubTab === k ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{label}</button>
                      ))}
                    </div>

                    {previewSubTab === 'summary' && (
                      <div className="overflow-x-auto border border-gray-150 rounded">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                            <tr>{['Name', 'Customer', 'Industry', 'Class of Protection', 'Premium', 'Insurer', 'Subsidiary', 'Effective', 'End Date'].map(h => <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>)}</tr>
                          </thead>
                          <tbody className="font-mono">
                            <tr>
                              <td className="px-3 py-2 font-sans font-semibold text-gray-800">{selectedChild.name}</td>
                              <td className="px-3 py-2">{editedOpportunity.company}</td>
                              <td className="px-3 py-2">{selectedChild.industry || '—'}</td>
                              <td className="px-3 py-2">{selectedChild.classOfProtection || '—'}</td>
                              <td className="px-3 py-2 font-bold text-emerald-700">{selectedChild.currency} {selectedChild.premium.toLocaleString()}</td>
                              <td className="px-3 py-2">{selectedChild.vendor}</td>
                              <td className="px-3 py-2">{selectedChild.subsidiary || '—'}</td>
                              <td className="px-3 py-2">{selectedChild.effectiveDate}</td>
                              <td className="px-3 py-2">{selectedChild.endDate || '—'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {previewSubTab === 'coverage' && (
                      <div className="overflow-x-auto border border-gray-150 rounded">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                            <tr>{['Customer Category', 'Benefit', 'Coverage', 'Category', 'Coverage Value'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {coverageRows.map(r => (
                              <tr key={r.id}>
                                <td className="px-3 py-2 font-semibold text-gray-800">{r.employeeClass}</td>
                                <td className="px-3 py-2">{r.benefit}</td>
                                <td className="px-3 py-2">{r.coverage}</td>
                                <td className="px-3 py-2">{r.category}</td>
                                <td className="px-3 py-2 font-mono font-bold text-gray-900">{r.coverageValue || '—'}</td>
                              </tr>
                            ))}
                            {coverageRows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400 italic">No coverages.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {previewSubTab === 'expired' && (
                      <div className="overflow-x-auto border border-gray-150 rounded">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                            <tr>{['Policy Number', 'Insurer', 'Product', 'Status', 'Expiry Date', 'Premium', 'Billing Method', 'Debit Note No.', 'Commission Rate'].map(h => <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>)}</tr>
                          </thead>
                          <tbody className="font-mono divide-y divide-gray-100">
                            {selectedChild.renewedFrom ? (
                              <tr>
                                <td className="px-3 py-2 font-bold">{selectedChild.renewedFrom}</td>
                                <td className="px-3 py-2">{selectedChild.vendor}</td>
                                <td className="px-3 py-2">{selectedChild.productItem || '—'}</td>
                                <td className="px-3 py-2">Expired</td>
                                <td className="px-3 py-2">{selectedChild.expiryDate || '—'}</td>
                                <td className="px-3 py-2">{selectedChild.currency} {selectedChild.premium.toLocaleString()}</td>
                                <td className="px-3 py-2">{selectedChild.billingMethod || '—'}</td>
                                <td className="px-3 py-2">{selectedChild.debitNoteNo || '—'}</td>
                                <td className="px-3 py-2">{selectedChild.commissionRate}%</td>
                              </tr>
                            ) : (
                              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400 italic font-sans">No Data — full record in the Renewal History tab.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {previewSubTab === 'premium' && (
                      <div className="overflow-x-auto border border-gray-150 rounded">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150">
                            <tr>{['Benefit', 'Employee Class', 'Sum Insured', 'Rate (%)', 'Per Plan Premium'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                          </thead>
                          <tbody className="font-mono divide-y divide-gray-100">
                            {premiumRates.map(r => (
                              <tr key={r.id}>
                                <td className="px-3 py-2 font-sans font-semibold text-gray-800">{r.benefit}</td>
                                <td className="px-3 py-2">{r.employeeClass}</td>
                                <td className="px-3 py-2 text-right">{r.sumInsured.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">{r.rate}%</td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-700">{perPlanPremium(r).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold">
                              <td className="px-3 py-2 font-sans" colSpan={4}>Total ({selectedChild.currency})</td>
                              <td className="px-3 py-2 text-right text-emerald-700">{premiumRates.reduce((s, r) => s + perPlanPremium(r), 0).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeWorkspaceTab === 'renewal-history' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Expired Policies</h3>
                      {(selectedChild.status === 'Finalized' || selectedChild.status === 'Converted to Policy' || selectedChild.policyId) && (
                        <button
                          onClick={() => handleRenewProposal(selectedChild)}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded text-xs transition-all flex items-center gap-1.5 shadow-sm border border-purple-700 font-sans"
                        >
                          <RefreshCw size={13} />
                          <span>Renew Proposal</span>
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150 font-sans">
                          <tr>
                            <th className="px-3 py-2.5">Policy Number</th>
                            <th className="px-3 py-2.5">Customer</th>
                            <th className="px-3 py-2.5">Insurer</th>
                            <th className="px-3 py-2.5">Product</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">Effective Date</th>
                            <th className="px-3 py-2.5">Expiry Date</th>
                            <th className="px-3 py-2.5 text-right">Premium</th>
                            <th className="px-3 py-2.5">Billing Method</th>
                            <th className="px-3 py-2.5">Debit Note No.</th>
                            <th className="px-3 py-2.5 text-right">Commission Rate.</th>
                            <th className="px-3 py-2.5 text-right">Commission Fee.</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono divide-y divide-gray-100">
                          {childProposals.map(p => (
                            <tr key={p.id} className={p.id === selectedChild.id ? 'bg-orange-50/10 font-bold' : ''}>
                              <td className="px-3 py-2.5">{p.renewedFrom || p.policyId || p.id}</td>
                              <td className="px-3 py-2.5 font-sans">{editedOpportunity.company}</td>
                              <td className="px-3 py-2.5">{p.vendor}</td>
                              <td className="px-3 py-2.5">
                                <span className="text-orange-600 font-sans font-bold">{p.classOfProtection || '—'}</span>
                              </td>
                              <td className="px-3 py-2.5 font-sans">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                  p.status === 'Converted to Policy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  p.status === 'Finalized' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>{p.status}</span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-500">{p.effectiveDate}</td>
                              <td className="px-3 py-2.5 text-gray-500">{p.expiryDate || '—'}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-gray-900">{p.currency} {p.premium.toLocaleString()}</td>
                              <td className="px-3 py-2.5 font-sans">{p.billingMethod || '—'}</td>
                              <td className="px-3 py-2.5">{p.debitNoteNo || '—'}</td>
                              <td className="px-3 py-2.5 text-right">{p.commissionRate}%</td>
                              <td className="px-3 py-2.5 text-right">{p.currency} {Math.round(p.premium * (p.commissionRate / 100)).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-3 py-2.5 font-sans" colSpan={7}>Total</td>
                            <td className="px-3 py-2.5 text-right">{childProposals[0]?.currency} {childProposals.reduce((s, p) => s + p.premium, 0).toLocaleString()}</td>
                            <td colSpan={2}></td>
                            <td className="px-3 py-2.5"></td>
                            <td className="px-3 py-2.5 text-right">{childProposals[0]?.currency} {Math.round(childProposals.reduce((s, p) => s + p.premium * (p.commissionRate / 100), 0)).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Audit History */}
      {showAuditHistory && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setShowAuditHistory(false)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-lg w-full max-h-[75vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-50 border-b border-gray-150 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Audit History</h3>
              <button
                onClick={() => setShowAuditHistory(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-gray-100">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 text-xs">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-gray-800">{log.action}</span>
                    <span className="text-gray-400 font-mono text-[10px] whitespace-nowrap">{log.date}</span>
                  </div>
                  <p className="text-gray-500 mt-1">{log.details}</p>
                  <p className="text-gray-400 text-[10px] mt-1">By {log.user}</p>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="p-6 text-xs text-gray-400 text-center">No audit history yet.</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProposalDetail;
