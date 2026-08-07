import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, CheckCircle2,
  TrendingUp, BarChart2, Users, Building2, DollarSign,
  Calendar, Plus, Trash2,
  XCircle, X, History, Check, Upload, FileUp,
  Info, Edit, User, Briefcase,
  ChevronDown, Award, ClipboardCheck,
  Search, Archive, AlertTriangle, Settings, Pencil
} from 'lucide-react';
import type { Proposal, BenefitRow, ProductFileRequirement, UploadedRequirementFile } from '../../types';
import { MOCK_COMPANIES, MOCK_INDIVIDUALS, MOCK_LEADS, MOCK_CAMPAIGNS, INITIAL_MPF_SCHEMES, INITIAL_EMPLOYER_OPTIONS, INITIAL_TAGS } from '../../constants';
import type { EmployerOptionConfig } from '../../constants';
import { ConfirmDialog } from '../ConfirmDialog';
import { ErrorDialog } from '../ErrorDialog';
import { Toast, useToast } from '../Toast';

export const SALES_REPS = ['Sales Rep A', 'Sales Rep B', 'Sales Rep C', 'Sales Rep D'];
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
export const resolveCompanyMeta = (label: string) => {
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
const REMOVED_PRODUCT_FIELD_NAMES = ['Member First Name', 'Member Last Name'];
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
  'Proposed Service Provider': { type: 'insurer-lookup' },
  'New Scheme': { type: 'mpf-lookup' },
  'Existing Insurer': { type: 'insurer-lookup' },
  'Proposed Insurer': { type: 'insurer-lookup' },

  'No. of Employee / Insured': { type: 'integer' },
  'Current Annual Contribution': { type: 'decimal2' },
  'Current Net Asset Value': { type: 'decimal2' },
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
  onNavigateToProspect?: (targetProspect: Proposal) => void;
  onDelete?: (proposalId: string) => void;
  currentRole?: 'Sales Rep' | 'Admin';
  // Fired whenever the unsaved-edit state changes, so a parent-level navigation
  // action (e.g. switching Sidebar modules) can also guard against discarding
  // an in-progress Opportunity edit.
  onDirtyStateChange?: (isDirty: boolean) => void;
  // True when this page was opened via "+ New Prospect" — same layout as
  // preview/edit, just starting blank and already in Edit mode.
  isNew?: boolean;
  // Fired from the tag Manage popup so a rename/delete of the tag DEFINITION
  // also updates every other Proposal already tagged with it — mirrors how
  // renaming/deleting a Product Category cascades to every Product in
  // ProductsConfiguration.tsx, rather than only fixing up the record open here.
  onTagRenamed?: (oldName: string, newName: string) => void;
  onTagDeleted?: (name: string) => void;
  // Fired once the user confirms leaving this page (see guardedNavigate) —
  // App.tsx swaps this page out for the simulated Customer Creation page,
  // prefilled from this Proposal.
  onConvertToCustomer?: (proposal: Proposal) => void;
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

// Same rules as the Pipeline board's column derivation (getOpptyStageColumn /
// isPastEffectiveDate in ProposalPipeline.tsx) — reused here so the read-only
// Opportunity Status shown on this page never disagrees with the board.
// `stage`/`probability` are independent fields: 0% probability alone does not
// mean Lost — only an explicit stage of 'Lost' does.
const isPastEffectiveDate = (p: Proposal) => !!p.effectiveDate && new Date(p.effectiveDate) < new Date();
const getOpptyStatusLabel = (p: Proposal): string => {
  if (p.stage === 'Lost') return 'Lost';
  if (p.probability !== 100 && isPastEffectiveDate(p)) return 'Expired';
  if (p.probability === 100) return 'Won';
  return `${p.probability}%`;
};

export const ProposalDetail: React.FC<ProposalDetailProps> = ({ proposal, allProposals, onBack, onSave, onNavigateToProspect, onDelete, currentRole = 'Sales Rep', onDirtyStateChange, isNew = false, onTagRenamed, onTagDeleted, onConvertToCustomer }) => {

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

  const initialProductItem = isNew ? proposal.productItem : (proposal.productItem || 'Sample Care Gold');
  const initialProductTeam = resolveProductTeam(initialProductItem);
  const initialProductCategory = resolveProductCategory(initialProductItem);

  // State for Opportunity Page (Commercial)
  const buildInitialOpportunity = () => ({
    name: proposal.name,
    stage: proposal.stage || 'Draft',
    // A blank/new Opportunity already starts at its business type's entry-level
    // probability (10% NB / 75% RB — see App.tsx's buildBlankProposal), so this
    // is always a real, valid value — no `|| 30` fallback needed (that would
    // incorrectly reset an existing 0% Lost record back to 30 on every edit).
    // Typed to allow '' — switching Product Item mid-edit can invalidate the
    // current value, which is then cleared to '' rather than left stale.
    probability: proposal.probability as number | '',
    effectiveDate1: isNew ? '' : (proposal.effectiveDate || '2026-05-01'),
    // Customer Info
    company: isNew ? '' : (proposal.client || 'DEMO COMPANY CO. LTD.'),
    masterType: proposal.masterType || resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.').masterType,
    // Product Info
    productTeam: initialProductTeam,
    productCategory: initialProductCategory,
    productItem: initialProductItem,
    detailedProductItem: proposal.detailedProductItem || '',
    businessType: proposal.businessType === 'Renewal' ? 'Renewal' : 'NB',
    campaign: isNew ? '' : (proposal.campaign || CAMPAIGN_OPTIONS[0]),
    // Sales Assignment — a single rep always holds the full 100% split
    salesRep1: isNew ? '' : (proposal.salesRep || 'Sales Rep A'),
    split1: proposal.split1 ?? 100,
    salesRep2: proposal.salesRep2 || '',
    split2: proposal.split2 ?? 0,
    salesRep3: proposal.salesRep3 || '',
    split3: proposal.split3 ?? 0,
    // Evaluation & Lifecycle
    lossReason: proposal.lostReason || '',
    tags: isNew ? [] : (proposal.tags ?? ['Corporate', 'Q2 Outreach']),
    opportunityNotes: isNew ? '' : (proposal.remarks || 'Sample company requested comparison for Ward vs Semi-Private coverage for demo members.'),
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
    // Product File Requirements — a brand-new Opportunity starts with none uploaded
    // (the demo seed row below is a stand-in for an existing record only, and names a
    // specific unrelated product, which would be nonsensical on a blank new record).
    productFileRequirements: isNew ? [] : (proposal.productFileRequirements ?? [
      { id: 'DOC-SEED-1', name: 'Appointment Letter', type: 'Compulsory' as const, relatedProductItem: 'Pension - MPF/ORSO Appointed Case Only', checkStage: 'Won 100%' }
    ]),
  });
  const [editedOpportunity, setEditedOpportunity] = useState(buildInitialOpportunity);

  // Hard safety net, independent of buildInitialOpportunity's own logic above: a
  // brand-new Opportunity must never sit at 0% (Case Lost) — force it to the
  // business type's entry-level stage the moment this record mounts, whatever
  // the initial value turned out to be. Runs once on mount only.
  useEffect(() => {
    if (!isNew) return;
    if (editedOpportunity.probability !== 0) return;
    const entryLevel = (editedOpportunity.businessType === 'Renewal' ? RB_PROBABILITY_OPTIONS : NB_PROBABILITY_OPTIONS).find(p => p > 0)!;
    setEditedOpportunity(prev => ({ ...prev, probability: entryLevel }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Records open in read-only View mode by default; Edit must be explicitly entered.
  // A brand-new (isNew) Opportunity has nothing to view yet, so it opens directly in Edit mode.
  const [isEditMode, setIsEditMode] = useState(isNew);

  // Add Sales Rep: Rep 1 is always shown; up to 2 more can be added (max 3 total).
  // Initialized from whichever reps are already saved, so reopening a multi-rep
  // Opportunity doesn't silently collapse back down to a single rep.
  const [numSalesReps, setNumSalesReps] = useState(() => proposal.salesRep3 ? 3 : proposal.salesRep2 ? 2 : 1);

  // Tags: a searchable dropdown (like SearchableDropdown above) rather than a
  // plain text input — existing tags are suggested as you type, and a "Create"
  // row only appears at the bottom when nothing matches exactly, encouraging
  // reuse over free-typing near-duplicate tags.
  const [tagInput, setTagInput] = useState('');
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const tagPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tagPanelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tagPanelRef.current && !tagPanelRef.current.contains(e.target as Node)) {
        setTagPanelOpen(false);
        setTagInput('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tagPanelOpen]);

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

  // Removing Rep 2 shifts Rep 3 up into its slot (if present) rather than just
  // clearing Rep 2 and leaving a gap; decrementing numSalesReps then lets the
  // existing rep-count effect re-balance the splits (100 / 75-25 / 50-25-25).
  const removeSalesRep2 = () => {
    setEditedOpportunity(prev => ({
      ...prev,
      salesRep2: prev.salesRep3 || '',
      salesRep3: '',
    }));
    setNumSalesReps(n => Math.max(1, n - 1));
  };
  const removeSalesRep3 = () => {
    setEditedOpportunity(prev => ({ ...prev, salesRep3: '' }));
    setNumSalesReps(n => Math.max(1, n - 1));
  };

  // Company / Individual selector: two-step (entityType then source); name search is
  // handled inline by the SearchableDropdown itself.
  const initialCompanyMeta = resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.');
  const [companyEntityType, setCompanyEntityType] = useState<'Company' | 'Individual'>(initialCompanyMeta.entityType);
  const [companySource, setCompanySource] = useState<'Customer' | 'Lead'>(initialCompanyMeta.source);
  const filteredCompanyOptions = COMPANY_INDIVIDUAL_OPTIONS.filter(o =>
    o.entityType === companyEntityType && o.source === companySource
  );

  // Switching either toggle clears the current pick rather than auto-selecting
  // the first matching option — the user must explicitly re-choose from the
  // SearchableDropdown, which then shows its "Please Select" placeholder.
  const handleToggleCompanyEntityType = (t: 'Company' | 'Individual') => {
    setCompanyEntityType(t);
    setEditedOpportunity(prev => ({ ...prev, company: '', masterType: companySource === 'Lead' ? 'Lead' : 'Customer' }));
  };
  const handleToggleCompanySource = (t: 'Customer' | 'Lead') => {
    setCompanySource(t);
    setEditedOpportunity(prev => ({ ...prev, company: '', masterType: t === 'Lead' ? 'Lead' : 'Customer' }));
  };

  const handleCancelEdit = () => {
    // A brand-new Opportunity was never saved, so there's no "View" state to fall
    // back into — Cancel just discards the blank draft and returns to the Pipeline.
    if (isNew) {
      onBack();
      return;
    }
    setEditedOpportunity(buildInitialOpportunity());
    setNumSalesReps(1);
    const meta = resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.');
    setCompanyEntityType(meta.entityType);
    setCompanySource(meta.source);
    setIsEditMode(false);
    setValidationError(null);
  };

  // Whether the Opportunity draft has been touched since entering Edit mode —
  // compares against a freshly-built baseline from the saved `proposal`, the
  // same "recompute and diff" approach used for unsaved-changes checks in the
  // Product Configuration module.
  const isOpportunityDirty = () => isEditMode && JSON.stringify(editedOpportunity) !== JSON.stringify(buildInitialOpportunity());

  // Guards any navigation away from this Opportunity (back to Pipeline, jumping
  // to a Linked Prospect) so an in-progress, unsaved edit isn't silently
  // discarded by a stray click elsewhere. The action itself is queued and only
  // runs once the discard is confirmed in the dialog below.
  const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);
  const guardedNavigate = (action: () => void) => {
    if (isOpportunityDirty()) {
      setPendingLeaveAction(() => action);
    } else {
      action();
    }
  };

  // Also guards an actual browser-level navigation away (tab close, refresh,
  // typing a new URL) — the in-app guard above only covers clicks inside this
  // page.
  const isOpportunityDirtyRef = useRef(false);
  isOpportunityDirtyRef.current = isOpportunityDirty();
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOpportunityDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Error/confirmation UI state — see ConfirmDialog/ErrorDialog/Toast usage below.
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSaveIncompleteError, setShowSaveIncompleteError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingArchive, setPendingArchive] = useState(false);
  const { toast, showToast } = useToast();

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
          { name: 'No. of Employee / Insured', visible: true, required: true },
          { name: 'Current Annual Contribution', visible: true, required: false },
          { name: 'Current Net Asset Value', visible: true, required: false },
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
          { name: 'No. of Employee / Insured', visible: true, required: false },
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
          { name: 'No. of Employee / Insured', visible: true, required: false },
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
          { name: 'No. of Employee / Insured', visible: true, required: false },
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
      'No. of Employee / Insured': '45',
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

  // Tag master list — managed inline from this page (see the "Manage" link next to
  // the Tags label below), the same pattern Product Category/Product Team use in
  // Product Configuration, rather than a separate Opportunity Configuration tab.
  // Suggestions filter as the user types, to raise awareness of an existing tag
  // before they type out a near-duplicate of their own.
  const [tagOptions, setTagOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem('pr2_tags');
    if (!saved) return INITIAL_TAGS;
    try { return JSON.parse(saved); } catch (e) { return INITIAL_TAGS; }
  });
  useEffect(() => { localStorage.setItem('pr2_tags', JSON.stringify(tagOptions)); }, [tagOptions]);

  const [showTagManagePopup, setShowTagManagePopup] = useState(false);
  const [tagManageMode, setTagManageMode] = useState<'create' | 'rename'>('create');
  const [tagManageOriginalValue, setTagManageOriginalValue] = useState('');
  const [tagManageInput, setTagManageInput] = useState('');

  // Same "warn before discarding an unsaved add/rename" guard as
  // isTeamPopupDirty/isCategoryPopupDirty in ProductsConfiguration.tsx.
  const isTagManagePopupDirty = () => tagManageMode === 'create' ? tagManageInput.trim() !== '' : tagManageInput !== tagManageOriginalValue;
  const closeTagManagePopup = () => {
    if (isTagManagePopupDirty() && !confirm('You have unsaved changes. Discard them and close?')) return;
    setShowTagManagePopup(false);
    setTagManageMode('create');
    setTagManageOriginalValue('');
    setTagManageInput('');
  };
  const handleTagManageSave = () => {
    const trimmed = tagManageInput.trim();
    if (!trimmed) { alert('Tag name is required.'); return; }
    if (tagManageMode === 'create') {
      if (tagOptions.some(t => t.toLowerCase() === trimmed.toLowerCase())) { alert('A tag with this name already exists.'); return; }
      setTagOptions([...tagOptions, trimmed]);
    } else {
      if (tagOptions.some(t => t.toLowerCase() === trimmed.toLowerCase() && t !== tagManageOriginalValue)) { alert('A tag with this name already exists.'); return; }
      setTagOptions(tagOptions.map(t => t === tagManageOriginalValue ? trimmed : t));
      // Cascade the rename to every Proposal already carrying the old tag name
      // (this record's own draft plus every other saved Proposal) — otherwise
      // those records keep the stale name and it silently falls out of sync
      // with the master list, the same fix applied to Product Category rename.
      if (trimmed !== tagManageOriginalValue) {
        setEditedOpportunity(prev => ({
          ...prev,
          tags: prev.tags.map(t => t === tagManageOriginalValue ? trimmed : t),
        }));
        onTagRenamed?.(tagManageOriginalValue, trimmed);
      }
    }
    setTagManageInput('');
    setTagManageMode('create');
    setTagManageOriginalValue('');
  };
  const handleTagManageDelete = (value: string) => {
    // Same block-while-in-use guard as Product Category/Product Team's delete
    // (only counting Active records — an Archived Proposal can't block it).
    const usedHere = editedOpportunity.tags.includes(value);
    const otherActiveUsers = (allProposals || [])
      .filter(p => p.id !== proposal.id && p.status !== 'Archived')
      .filter(p => (p.tags || []).includes(value));
    const totalCount = otherActiveUsers.length + (usedHere ? 1 : 0);
    if (totalCount > 0) {
      const exampleName = usedHere ? (editedOpportunity.name || proposal.name) : otherActiveUsers[0].name;
      alert(`Cannot delete tag because it is currently linked to ${totalCount} active record(s) (e.g. "${exampleName}").`);
      return;
    }
    if (confirm(`Are you sure you want to delete "${value}"?`)) {
      setTagOptions(tagOptions.filter(t => t !== value));
      onTagDeleted?.(value);
    }
  };

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
            buttonPlaceholder={`Please Select ${manageLabel}`}
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
            buttonPlaceholder="Please Select Employer Option"
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
            buttonPlaceholder="Please Select Employee"
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

  // Gross Amount is read-only, sourced from Product Opportunity Evaluation.
  // No formula engine exists yet for the per-product "Formula 1/2/3/4" rules, so this
  // mirrors the proposal's base revenue figure rather than fabricating a calculation.
  const grossAmount = proposal.expectedRevenueGross || 0;
  // Probability is briefly '' while awaiting reselection after a Product Item
  // switch invalidated it (see the Probability dropdown below) — treat that
  // as 0 here rather than letting it flow into arithmetic as a string.
  const netAmount = Math.round(grossAmount * ((typeof editedOpportunity.probability === 'number' ? editedOpportunity.probability : 0) / 100));

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

  // Activities Log State
  const [activities, setActivities] = useState([
    { id: 1, type: 'Call', subject: 'Initial Discovery', date: '2026-03-22', notes: 'Discussed employee budget and basic inpatient needs with HR contact.', user: 'Sales Rep A' },
    { id: 2, type: 'Meeting', subject: 'Plan Presentation', date: '2026-03-28', notes: 'Presented Option A and gathered feedback on plan structures.', user: 'Sales Rep A' }
  ]);
  const [newActivity, setNewActivity] = useState({ type: 'Call', subject: '', notes: '' });


  // Save changes to opportunity
  const handleSaveOpportunity = () => {
    const missingFields: string[] = [];
    if (!editedOpportunity.name.trim()) missingFields.push('Oppty Name');
    if (typeof editedOpportunity.probability !== 'number' || Number.isNaN(editedOpportunity.probability)) missingFields.push('Probability');
    else if (isNew && editedOpportunity.probability === 0) missingFields.push('Probability');
    if (!editedOpportunity.company.trim()) missingFields.push('Company / Individual');
    if (!editedOpportunity.campaign.trim()) missingFields.push('Campaign');
    if (!editedOpportunity.salesRep1.trim()) missingFields.push('Primary Owner');
    if (!editedOpportunity.productItem.trim()) missingFields.push('Product Item');
    if (missingFields.length > 0) {
      setValidationError(`Please fill in the following required field(s): ${missingFields.join(', ')}.`);
      return;
    }
    // The missingFields check above already guarantees a real number by this
    // point — this local gives the rest of save a plain `number` to work with
    // instead of the draft's `number | ''` (blank while awaiting reselection).
    const currentProbability = editedOpportunity.probability as number;

    const invalidDateFields: string[] = [];
    if (!isValidEffectiveDateYear(editedOpportunity.effectiveDate1)) invalidDateFields.push('Effective Date');
    if (invalidDateFields.length > 0) {
      setValidationError(`Please enter a valid year (1900–2100) for: ${invalidDateFields.join(', ')}.`);
      return;
    }

    const isRep2Active = numSalesReps >= 2;
    const isRep3Active = numSalesReps >= 3;
    const totalSplitPercent = editedOpportunity.split1 + (isRep2Active ? editedOpportunity.split2 : 0) + (isRep3Active ? editedOpportunity.split3 : 0);
    if (totalSplitPercent !== 100) {
      setValidationError(`Sales Rep Split % must total 100% (currently ${totalSplitPercent}%). Please adjust the Multi-Sales Split % Allocation before saving.`);
      return;
    }

    // Re-check Probability against the *currently selected* Product Item's rules at
    // save time — the dropdown only filters options at the moment you open it, so
    // picking Probability before Product Item (or changing Product Item afterward)
    // could otherwise leave a stale, now-invalid Probability value unblocked.
    const isRenewalForSave = editedOpportunity.businessType === 'Renewal';
    const restrictedForSave = getRestrictedStages(editedOpportunity.productItem, isRenewalForSave);
    const uploadBlockedForSave = getUploadBlockedStages(editedOpportunity.productItem, isRenewalForSave, editedOpportunity.productFileRequirements);
    if (restrictedForSave.includes(currentProbability)) {
      setValidationError(`${currentProbability}% is a restricted stage for "${editedOpportunity.productItem}" (see Product Configuration). Please choose a different Probability.`);
      return;
    }
    if (uploadBlockedForSave.includes(currentProbability)) {
      setValidationError(`"${editedOpportunity.productItem}" has a required document upload outstanding at an earlier stage. Please upload it (see Product File Requirements below) before saving at ${currentProbability}%.`);
      return;
    }
    setValidationError(null);

    // Master Type conversion is only committed once a 100% probability is actually
    // saved — not while the value is still being edited in the draft.
    let savedMasterType = editedOpportunity.masterType;
    if (currentProbability === 100) {
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
      probability: currentProbability,
      lastUpdated: new Date().toISOString().slice(0, 10),
      effectiveDate: editedOpportunity.effectiveDate1,
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
      ['Probability', currentProbability, updatedProposal.probability],
      ['Effective Date', editedOpportunity.effectiveDate1, updatedProposal.effectiveDate],
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
    onSave?.(updatedProposal);
    setEditedOpportunity(prev => ({ ...prev, masterType: savedMasterType }));
    setIsEditMode(false);

    if (unsavedFields.length > 0) {
      console.warn(
        `[ProposalDetail] handleSaveOpportunity: these edited field(s) did not make it into the save payload — check the field mapping: ${unsavedFields.join(', ')}`,
        { editedOpportunity, updatedProposal }
      );
      setShowSaveIncompleteError(true);
    } else {
      showToast(isNew ? 'Opportunity created.' : 'Opportunity saved.');
    }
  };

  const handleDeleteOpportunity = () => {
    if (editedOpportunity.probability === 100 && currentRole !== 'Admin') {
      setValidationError('Only Admin can delete an Opportunity that has reached 100% probability.');
      return;
    }
    setPendingDelete(true);
  };

  const confirmDeleteOpportunity = () => {
    setPendingDelete(false);
    onDelete?.(proposal.id);
    onBack();
  };

  const handleToggleArchiveOpportunity = () => {
    if (proposal.status !== 'Archived') {
      setPendingArchive(true);
      return;
    }
    onSave?.({ ...proposal, status: 'Active' });
    showToast('Opportunity activated.');
  };

  const confirmArchiveOpportunity = () => {
    setPendingArchive(false);
    onSave?.({ ...proposal, status: 'Archived' });
    showToast('Opportunity archived.');
  };

  // Manual conversion for a Lead that reached 100% probability (already saved) on a
  // product NOT covered by the auto-convert rule (Applied to Individual + non-insurance).
  // Routed through guardedNavigate so an in-progress unsaved edit isn't silently
  // discarded — same "Leave without saving?" guard as onBack/onNavigateToProspect.
  const handleConvertToCustomerClick = () => {
    guardedNavigate(() => onConvertToCustomer?.(proposal));
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

  // Linked Prospect — smart-button style, shared by the Opportunity and Proposal
  // workspace headers (Odoo/Salesforce pattern: top of page, icon + label).
  const linkedProspectBadges = (proposal.linkedPreviousProspectId || proposal.linkedNextProspectId) && (
    <div className="flex items-center gap-2 flex-wrap">
      {proposal.linkedPreviousProspectId && (() => {
        const prevProspect = allProposals?.find(p => p.id === proposal.linkedPreviousProspectId);
        return (
          <button
            onClick={() => prevProspect && guardedNavigate(() => onNavigateToProspect?.(prevProspect))}
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
            onClick={() => nextProspect && guardedNavigate(() => onNavigateToProspect?.(nextProspect))}
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
      {/* Shared Header */}
      <div className="px-6 pt-6 mx-auto w-full max-w-7xl">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => guardedNavigate(onBack)}
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
      </div>
      {/* OPPORTUNITY (COMMERCIAL) WORKSPACE */}
        <div className="px-6 pb-6 max-w-7xl mx-auto w-full flex-1">
          <div className="flex flex-col gap-6">

              {validationError && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{validationError}</span>
                </div>
              )}

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
                  <p className="text-xs text-gray-500 mt-1">Customer: {editedOpportunity.company} · Primary Owner: {editedOpportunity.salesRep1}</p>
                </div>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <button onClick={handleCancelEdit} className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                        <span>Cancel</span>
                      </button>
                      <button onClick={handleSaveOpportunity} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                        <Save size={14} />
                        <span>{isNew ? 'Create Opportunity' : 'Save Opportunity'}</span>
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
                      <select
                        value={editedOpportunity.probability}
                        onChange={e => setEditedOpportunity({...editedOpportunity, probability: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="text-2xl font-black text-gray-900 bg-transparent border-b-2 border-orange-300 focus:border-orange-500 outline-none"
                      >
                        {(() => {
                          const isRenewal = editedOpportunity.businessType === 'Renewal';
                          const restricted = getRestrictedStages(editedOpportunity.productItem, isRenewal);
                          const uploadBlocked = getUploadBlockedStages(editedOpportunity.productItem, isRenewal, editedOpportunity.productFileRequirements);
                          const options = (isRenewal ? RB_PROBABILITY_OPTIONS : NB_PROBABILITY_OPTIONS)
                            // A brand-new Opportunity always starts at a real entry-level
                            // probability (see buildInitialOpportunity) — it can't be
                            // created directly as Case Lost, so 0% is never offered here.
                            .filter(p => !(isNew && p === 0))
                            .filter(p => !restricted.includes(p) && !uploadBlocked.includes(p));
                          return (
                            <>
                              {/* Blank while awaiting reselection after a Product Item switch
                                  invalidated the prior value — see the onSelect handler above.
                                  The list below only ever contains valid stages, so there is
                                  nothing else to flag as invalid here. */}
                              {editedOpportunity.probability === '' && (
                                <option value="">Please select</option>
                              )}
                              {options.map(p => (
                                <option key={p} value={p}>{p}%</option>
                              ))}
                            </>
                          );
                        })()}
                      </select>
                    ) : (
                      <span className="text-3xl font-black text-gray-900">{editedOpportunity.probability === '' ? '—' : `${editedOpportunity.probability}%`}</span>
                    )}
                  </div>
                </div>
                {!isNew && editedOpportunity.probability === 0 && (
                  <div className="mt-4 max-w-xs">
                    <FieldView label="Loss Reason" required editing={isEditMode} viewValue={editedOpportunity.lossReason || '—'}>
                      <select value={editedOpportunity.lossReason} onChange={e => setEditedOpportunity({...editedOpportunity, lossReason: e.target.value})} className="w-full px-2.5 py-1.5 border border-red-200 bg-red-50/20 rounded text-xs text-red-900 font-semibold">
                        <option value="">Please Select Loss Reason</option>
                        {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </FieldView>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 -mt-2">Net Amount: <span className="font-bold text-gray-700">HK${netAmount.toLocaleString()}</span></p>

              {/* System-generated metadata — view/preview only, hidden while creating or editing */}
              {!isEditMode && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Opportunity Status</label>
                    <span className="text-xs font-semibold text-gray-700">{getOpptyStatusLabel(proposal)}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Opportunity Code</label>
                    <span className="text-xs font-mono text-gray-700">{editedOpportunity.opptyOdooId}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Oppty Stage Change Date</label>
                    <span className="text-xs font-mono text-gray-700">{editedOpportunity.opptyStageChangeDate}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Created On</label>
                    <span className="text-xs font-mono text-gray-700">{editedOpportunity.createdOn}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Updated On</label>
                    <span className="text-xs font-mono text-gray-700">{proposal.lastUpdated}</span>
                  </div>
                </div>
              )}

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
                          buttonPlaceholder={`Please Select ${companyEntityType} ${companySource}`}
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
                          onClick={handleConvertToCustomerClick}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          <span>Convert to Customer</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Oppty Stage</label>
                    <input type="text" value={editedOpportunity.stage} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                  </div>
                  <FieldView label="Campaign" required editing={isEditMode} viewValue={editedOpportunity.campaign}>
                    <SearchableDropdown
                      value={editedOpportunity.campaign}
                      options={CAMPAIGN_OPTIONS.map(name => ({ id: name, label: name, value: name }))}
                      onSelect={c => setEditedOpportunity({...editedOpportunity, campaign: c})}
                      placeholder="Search campaign..."
                      buttonPlaceholder="Please Select Campaign"
                    />
                  </FieldView>
                  {['Draft', 'Finalize', 'Policy'].includes(editedOpportunity.stage) && (
                    <FieldView label="Effective Date" editing={isEditMode} viewValue={editedOpportunity.effectiveDate1 || '—'}>
                      <input type="date" min="1900-01-01" max="2100-12-31" value={editedOpportunity.effectiveDate1} onChange={e => setEditedOpportunity({...editedOpportunity, effectiveDate1: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                    </FieldView>
                  )}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 block">Tags</label>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => { setTagManageInput(''); setTagManageMode('create'); setShowTagManagePopup(true); }}
                          className="text-[9px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Settings size={10} /> Manage
                        </button>
                      )}
                    </div>
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
                    {isEditMode && (() => {
                      // Pure select-from-existing-options picker — same division of
                      // responsibility as Product Category in Product Configuration:
                      // this only attaches/removes tags on THIS record. Creating,
                      // renaming, or deleting a tag DEFINITION is exclusively the
                      // "Manage" popup's job (see below), never done inline here.
                      const selectTag = (tag: string) => {
                        if (editedOpportunity.tags.some(t => t.toLowerCase() === tag.toLowerCase())) return;
                        setEditedOpportunity({...editedOpportunity, tags: [...editedOpportunity.tags, tag]});
                        setTagInput('');
                        setTagPanelOpen(false);
                      };
                      const query = tagInput.trim().toLowerCase();
                      const matches = tagOptions.filter(t =>
                        t.toLowerCase().includes(query) &&
                        !editedOpportunity.tags.some(existing => existing.toLowerCase() === t.toLowerCase())
                      );
                      return (
                        <div className="relative max-w-sm" ref={tagPanelRef}>
                          <input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onFocus={() => setTagPanelOpen(true)}
                            onKeyDown={e => { if (e.key === 'Enter' && matches.length === 1) selectTag(matches[0]); }}
                            placeholder="Search existing tags..."
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                          {tagPanelOpen && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {matches.length === 0 && (
                                <div className="px-2.5 py-2 text-xs text-gray-400 italic">
                                  {query ? 'No matching tags — use Manage to add a new one.' : 'No more tags to reuse — use Manage to add a new one.'}
                                </div>
                              )}
                              {matches.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => selectTag(s)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <FieldView label="Remark" editing={isEditMode} viewValue={editedOpportunity.opportunityNotes || '—'} className="md:col-span-3">
                    <textarea value={editedOpportunity.opportunityNotes} onChange={e => setEditedOpportunity({...editedOpportunity, opportunityNotes: e.target.value})} className="w-full h-20 px-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 resize-none" placeholder="Provide any comments or deal constraints..." />
                  </FieldView>
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
                    onSelect={selectedItem => {
                      // Switching Product Item can invalidate the draft's current
                      // Probability (Restriction Parameters / Document Requirements
                      // differ per product) — clear it rather than leave a stale
                      // value sitting there; the Rep must actively reselect (see
                      // the Probability dropdown below, which only ever lists valid
                      // stages once this fires).
                      const isRenewal = editedOpportunity.businessType === 'Renewal';
                      const restricted = getRestrictedStages(selectedItem, isRenewal);
                      const uploadBlocked = getUploadBlockedStages(selectedItem, isRenewal, editedOpportunity.productFileRequirements);
                      const stillValid = typeof editedOpportunity.probability === 'number'
                        && !restricted.includes(editedOpportunity.probability)
                        && !uploadBlocked.includes(editedOpportunity.probability);
                      setEditedOpportunity({
                        ...editedOpportunity,
                        productItem: selectedItem,
                        productTeam: resolveProductTeam(selectedItem),
                        productCategory: resolveProductCategory(selectedItem),
                        probability: stillValid ? editedOpportunity.probability : '',
                      });
                    }}
                    placeholder="Search product item..."
                    buttonPlaceholder="Please Select Product Item"
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Sales Team (Primary Owner)</label>
                  <input type="text" value={SALES_REP_TEAM_MAP[editedOpportunity.salesRep1] || 'Unassigned'} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Multi-Sales Split % Allocation</label>
                  <table className="w-full border text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b">
                        <th className="p-2 text-left w-28">Role</th>
                        <th className="p-2 text-left">Sales Representative <span className="text-red-500">*</span></th>
                        <th className="p-2 text-right w-24">Split %</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      <tr>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-orange-50 text-orange-700 border border-orange-200">Primary Owner</span>
                        </td>
                        <td className="p-2">
                          {isEditMode ? (
                            <select value={editedOpportunity.salesRep1} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep1: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs">
                              <option value="">Please Select</option>
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
                        <td className="p-2"></td>
                      </tr>
                      {(isEditMode ? numSalesReps >= 2 : !!editedOpportunity.salesRep2) && (
                        <tr>
                          <td className="p-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">Secondary</span>
                          </td>
                          <td className="p-2">
                            {isEditMode ? (
                              <select value={editedOpportunity.salesRep2} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep2: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs">
                                <option value="">Please Select</option>
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
                          <td className="p-2">
                            {isEditMode && (
                              <button type="button" onClick={removeSalesRep2} title="Remove this Sales Rep" className="text-gray-400 hover:text-red-600">
                                <XCircle size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                      {(isEditMode ? numSalesReps >= 3 : !!editedOpportunity.salesRep3) && (
                        <tr>
                          <td className="p-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">Secondary</span>
                          </td>
                          <td className="p-2">
                            {isEditMode ? (
                              <select value={editedOpportunity.salesRep3} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep3: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs">
                                <option value="">Please Select</option>
                                {SALES_REPS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : <span>{editedOpportunity.salesRep3}</span>}
                          </td>
                          <td className="p-2">{isEditMode ? (
                            <input type="text" value={editedOpportunity.split3} readOnly title="Auto-calculated to complete 100%" className="w-full p-1 border border-gray-100 bg-gray-100 rounded text-xs text-right font-mono text-gray-500 cursor-not-allowed" />
                          ) : <span className="block text-right font-mono">{editedOpportunity.split3}</span>}</td>
                          <td className="p-2">
                            {isEditMode && (
                              <button type="button" onClick={removeSalesRep3} title="Remove this Sales Rep" className="text-gray-400 hover:text-red-600">
                                <XCircle size={13} />
                              </button>
                            )}
                          </td>
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

            {/* 4. Report & Dashboard — view/preview only, hidden while creating or editing */}
            {!isEditMode && (
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
            )}

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
                    {selectedProduct?.vendorFields?.filter((f: any) => f.visible).map((f: any) => renderEvalField(f))}
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

      <ConfirmDialog
        open={pendingLeaveAction != null}
        title="Leave without saving?"
        message="This Opportunity has unsaved changes. Leaving this page will discard them."
        confirmLabel="Discard Changes"
        confirmVariant="danger"
        onConfirm={() => { pendingLeaveAction?.(); setPendingLeaveAction(null); }}
        onClose={() => setPendingLeaveAction(null)}
      />
      <ConfirmDialog
        open={pendingDelete}
        title="Delete this Opportunity?"
        message={`This permanently deletes "${editedOpportunity.name}" (${proposal.id}). This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDeleteOpportunity}
        onClose={() => setPendingDelete(false)}
      />
      <ConfirmDialog
        open={pendingArchive}
        title="Archive this Opportunity?"
        message="It will be hidden from the default Pipeline view. You can activate it again later."
        confirmLabel="Archive"
        onConfirm={confirmArchiveOpportunity}
        onClose={() => setPendingArchive(false)}
      />
      <ErrorDialog
        open={showSaveIncompleteError}
        title="Some changes may not have saved"
        message="This Opportunity was saved, but part of the update may not have gone through correctly. Please check the record with engineering before relying on it."
        onClose={() => setShowSaveIncompleteError(false)}
      />
      {/* Manage Tags popup — same inline pattern as Product Category/Product Team
          in Product Configuration, rather than a separate Opportunity Configuration tab. */}
      {showTagManagePopup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 px-5 py-3.5 bg-gray-50">
              <span className="text-xs font-black uppercase text-gray-900 tracking-wider">Manage Tags</span>
              <button onClick={closeTagManagePopup} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">
                  {tagManageMode === 'create' ? 'Add New Tag' : 'Rename Selected Tag'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagManageInput}
                    onChange={e => setTagManageInput(e.target.value)}
                    placeholder="e.g. Corporate"
                    autoFocus
                    className="flex-1 px-3 py-1.5 border rounded-lg border-gray-300 focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-white h-9"
                  />
                  <button
                    type="button"
                    onClick={handleTagManageSave}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm flex items-center justify-center gap-1 cursor-pointer h-9"
                  >
                    {tagManageMode === 'create' ? 'Add' : 'Save'}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto border rounded-xl divide-y p-2 bg-gray-50/50">
                {tagOptions.map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 px-2 hover:bg-white rounded transition-colors text-xs font-semibold text-gray-700">
                    <span>{tag}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setTagManageInput(tag); setTagManageMode('rename'); setTagManageOriginalValue(tag); }}
                        className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                        title="Rename Tag"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTagManageDelete(tag)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Tag"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
                {tagOptions.length === 0 && <p className="text-xs text-gray-400 italic px-2 py-1.5">No tags defined yet.</p>}
              </div>
            </div>
            <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={closeTagManagePopup}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
};

export default ProposalDetail;
