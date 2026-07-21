import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Save, MoreVertical, CheckCircle2, AlertCircle, FileText,
  PieChart, Settings, TrendingUp, BarChart2, Users, Building2, DollarSign,
  Calendar, Thermometer, ShieldCheck, Plus, Trash2, Download, Share2, 
  XCircle, History, FileCode, Check, Send, Upload, FileUp,
  Info, Activity as ActivityIcon, Edit, User, HelpCircle, Briefcase,
  ChevronRight, Layers, FileSpreadsheet, Star, Play, Award, ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import type { Proposal, BenefitRow } from '../../types';
import { MOCK_COMPANIES, MOCK_INDIVIDUALS, MOCK_LEADS, MOCK_CAMPAIGNS } from '../../constants';

const SALES_REPS = ['Sales Rep A', 'Sales Rep B', 'Sales Rep C', 'Sales Rep D'];
const SALES_REP_TEAM_MAP: Record<string, string> = {
  'Sales Rep A': 'Sales Team A',
  'Sales Rep B': 'Sales Team B',
  'Sales Rep C': 'Sales Team C',
  'Sales Rep D': 'Sales Team A',
};
const LOSS_REASONS = [
  'Admin Concern from HR',
  'Business Closed',
  'Client Relationship',
  'Difficult to Arrange Seminar',
  'Existing Provider Relationship',
  'Global Appointment',
  'HR / Contact Person Leave the Company',
  'Lack of Management Support',
];
const NB_PROBABILITY_OPTIONS = [0, 10, 30, 70, 90, 100];
const RB_PROBABILITY_OPTIONS = [0, 65, 75, 85, 95, 100];

// Company/Individual Master lookup: Lead + Customer (Company/Individual), excluding Archived.
// Selection is two-step: entityType (Company/Individual) then source (Customer/Lead).
const COMPANY_INDIVIDUAL_OPTIONS: { id: string; label: string; entityType: 'Company' | 'Individual'; source: 'Customer' | 'Lead' }[] = [
  ...MOCK_COMPANIES.filter(c => c.status !== 'Archived').map(c => ({ id: c.id, label: c.name, entityType: 'Company' as const, source: 'Customer' as const })),
  ...MOCK_INDIVIDUALS.filter(i => i.status !== 'Archived').map(i => ({ id: i.id, label: i.fullName, entityType: 'Individual' as const, source: 'Customer' as const })),
  ...MOCK_LEADS.filter(l => (l.leadStatus as string) !== 'Archived').map(l => ({ id: l.id, label: l.leadName, entityType: l.type, source: 'Lead' as const })),
];
const resolveCompanyMeta = (label: string) => {
  const match = COMPANY_INDIVIDUAL_OPTIONS.find(o => o.label === label);
  return match ? { entityType: match.entityType, source: match.source } : { entityType: 'Company' as const, source: 'Customer' as const };
};
const CAMPAIGN_OPTIONS = MOCK_CAMPAIGNS.filter(c => c.active).map(c => c.name);

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

interface ProposalDetailProps {
  proposal: Proposal;
  onBack: () => void;
  onSave?: (updatedProposal: Proposal) => void;
}

interface ChildProposal {
  id: string;
  name: string;
  version: string;
  status: 'Draft' | 'In Progress' | 'Pending Internal Approval' | 'Pending Insurer' | 'Approved' | 'Accepted' | 'Declined' | 'Converted to Policy' | 'Finalized';
  vendor: string;
  premium: number;
  commissionRate: number;
  effectiveDate: string;
  createdDate: string;
  lastUpdated: string;
  createdBy: string;
  updatedBy: string;
  summary: string;
  policyId?: string;
  isCurrent?: boolean;
  locationType?: string;
  productTeam?: string;
  productCategory?: string;
  productItem?: string;
  gmiProductGroup?: string;
  selectedProducts?: string[];
  standardPremium?: number;
  premiumFrequency?: string;
  currency?: string;
  renewRequired?: string;
  benefitType?: string;
  finalizedDate?: string;
  debitNoteNo?: string;
  policyStatus?: string;
  renewedFrom?: string;
  renewDate?: string;
  loadedBenefits?: string[];
  loadedCoverages?: string[];
  // Basic Information (Summary) fields
  industry?: string;
  classOfProtection?: string;
  internalReference?: string;
  clientDiscountAmount?: number;
  endDate?: string;
  salesCode?: string;
  salesPercentage?: number;
  // Top KPI header fields
  presentIncurredAmount?: number;
  presentPaidAmount?: number;
  previousIncurredAmount?: number;
  previousPaidAmount?: number;
  // Premium tab fields
  premiumType?: string;
  premiumAdjustment?: number;
  proposalPremium?: number;
  premiumBreakdown?: { employeeClass: string; gmCategory: string; premium: number; employee: number; spouse: number; children: number; other: number }[];
  benefitPremiums?: { benefit: string; customerCategory: string; perPlanPremium: number }[];
  // Renewal History (Expired Policy) fields
  expiryDate?: string;
  billingMethod?: string;
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

export const ProposalDetail: React.FC<ProposalDetailProps> = ({ proposal, onBack, onSave }) => {

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
    effectiveDate2: '',
    effectiveDate3: '',
    // Customer Info
    company: proposal.client || 'DEMO COMPANY CO. LTD.',
    // Product Info
    productTeam: initialProductTeam,
    productCategory: initialProductCategory,
    productItem: initialProductItem,
    businessType: proposal.businessType === 'Renewal' ? 'Renewal' : 'NB',
    campaign: proposal.campaign || CAMPAIGN_OPTIONS[0],
    // Sales Assignment
    salesRep1: proposal.salesRep || 'Sales Rep A',
    split1: 70,
    salesRep2: '',
    split2: 0,
    salesRep3: '',
    split3: 0,
    // Evaluation & Lifecycle
    lossReason: '',
    relationOpptyId: 'OPP-DEMO-0001',
    tags: ['Corporate', 'Q2 Outreach'],
    opportunityNotes: proposal.remarks || 'Sample company requested comparison for Ward vs Semi-Private coverage for demo members.',
    // System fields
    opptyOdooId: 'odoo_opp_0001',
    createdOn: '2026-03-20 10:15:30',
    opptyStageChangeDate: '2026-04-10 14:22:05',
  });
  const [editedOpportunity, setEditedOpportunity] = useState(buildInitialOpportunity);

  // Records open in read-only View mode by default; Edit must be explicitly entered
  const [isEditMode, setIsEditMode] = useState(false);

  // Add Sales Rep: Rep 1 is always shown; up to 2 more can be added (max 3 total)
  const [numSalesReps, setNumSalesReps] = useState(1);
  const [tagInput, setTagInput] = useState('');

  // Company / Individual selector: two-step (entityType then source) plus a name search
  const initialCompanyMeta = resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.');
  const [companyEntityType, setCompanyEntityType] = useState<'Company' | 'Individual'>(initialCompanyMeta.entityType);
  const [companySource, setCompanySource] = useState<'Customer' | 'Lead'>(initialCompanyMeta.source);
  const [companySearch, setCompanySearch] = useState('');
  const filteredCompanyOptions = COMPANY_INDIVIDUAL_OPTIONS.filter(o =>
    o.entityType === companyEntityType && o.source === companySource && o.label.toLowerCase().includes(companySearch.toLowerCase())
  );
  const handleToggleCompanyEntityType = (t: 'Company' | 'Individual') => {
    setCompanyEntityType(t);
    setCompanySearch('');
    const opts = COMPANY_INDIVIDUAL_OPTIONS.filter(o => o.entityType === t && o.source === companySource);
    setEditedOpportunity(prev => ({ ...prev, company: opts[0]?.label || '' }));
  };
  const handleToggleCompanySource = (t: 'Customer' | 'Lead') => {
    setCompanySource(t);
    setCompanySearch('');
    const opts = COMPANY_INDIVIDUAL_OPTIONS.filter(o => o.entityType === companyEntityType && o.source === t);
    setEditedOpportunity(prev => ({ ...prev, company: opts[0]?.label || '' }));
  };

  const handleCancelEdit = () => {
    setEditedOpportunity(buildInitialOpportunity());
    setNumSalesReps(1);
    const meta = resolveCompanyMeta(proposal.client || 'DEMO COMPANY CO. LTD.');
    setCompanyEntityType(meta.entityType);
    setCompanySource(meta.source);
    setCompanySearch('');
    setIsEditMode(false);
  };

  // State for Child Proposals Map
  const [childProposals, setChildProposals] = useState<ChildProposal[]>([
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
      renewRequired: 'No',
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
  ]);

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

  // Market Comparison Benchmark Spreadsheet State
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
    if (saved) return JSON.parse(saved);
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
        vendorFields: [
          { name: 'Member First Name', visible: true, required: true },
          { name: 'Member Last Name', visible: true, required: false }
        ],
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
    return saved ? JSON.parse(saved) : {
      'Proposed Service Provider': 'Sample Insurer',
      'Existing Insurer': 'Demo Insurer',
      'No. of Employee / Insured': '45',
      'Est Premium': '150000',
      'Application Date': '2026-03-25',
      'Form Received Date': '2026-03-24',
      'No. of Briefing Sessions': '2',
      'Member Briefing Speaker': 'Sales Rep A',
      'Total Briefing Attendees': '38',
      'No. of Employee Transfer Est by ES': '40'
    };
  });

  const handleSaveEvaluation = (values: Record<string, string>) => {
    setEvaluationValues(values);
    localStorage.setItem(`pr2_opp_eval_${proposal.id}`, JSON.stringify(values));
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
        setProductList(JSON.parse(saved));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Navigations state
  const [activeProspectTab, setActiveProspectTab] = useState<'Opportunity' | 'Proposal'>('Opportunity');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'proposal' | 'premium' | 'documents' | 'benefits' | 'benchmark' | 'renewal-history'>('proposal');
  const [previewingDoc, setPreviewingDoc] = useState<any | null>(null);
  const [benchmarkFilter, setBenchmarkFilter] = useState<'Provider' | 'Premium' | 'Benefit' | 'Coverage'>('Provider');

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

  // Audit Trails
  const [auditLogs, setAuditLogs] = useState([
    { id: 'A1', action: 'Proposal v1.0 Created', user: 'Sales Rep A', date: '2026-03-25 10:00', details: 'Initialized from standard group medical template.' },
    { id: 'A2', action: 'MCR Validation Approved', user: 'System', date: '2026-04-01 11:15', details: 'Validated against HK MCR regulations successfully.' }
  ]);

  // Proposal Workspace: view/edit toggle + audit history modal
  const [isProposalEditMode, setIsProposalEditMode] = useState(false);
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
    if (onSave) {
      onSave({
        ...proposal,
        name: editedOpportunity.name,
        stage: editedOpportunity.stage as any,
        probability: editedOpportunity.probability,
        expectedRevenueGross: grossAmount,
        salesRep: editedOpportunity.salesRep1,
        client: editedOpportunity.company,
        remarks: editedOpportunity.opportunityNotes,
      });
    }
    setIsEditMode(false);
    alert("Opportunity changes saved successfully!");
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
    setChildProposals(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Converted to Policy', policyId: `POL-MEDIA-${Date.now().toString().slice(-5)}` } : item));
    alert(`Proposal converted to policy successfully! Policy Number Generated: POL-MEDIA-${Date.now().toString().slice(-5)}`);
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
            category: 'Quotation',
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

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      {!selectedChild ? (
        // ==========================================
        // OPPORTUNITY (COMMERCIAL) WORKSPACE
        // ==========================================
        <div className="p-6 max-w-7xl mx-auto w-full flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 bg-white shadow-sm text-gray-500">
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs text-gray-400 font-mono">{proposal.id}</span>
          </div>
          {/* Top Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {([
              { id: 'Opportunity', label: 'Opportunity', icon: TrendingUp },
              { id: 'Proposal', label: 'Proposal', icon: FileText }
            ] as const).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'Proposal') {
                      setSelectedChild(childProposals.find(p => p.isCurrent) || childProposals[0] || null);
                      setActiveWorkspaceTab('proposal');
                    }
                    setActiveProspectTab(tab.id);
                  }}
                  id={`tab-${tab.id.toLowerCase()}`}
                  className={`px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
                    activeProspectTab === tab.id 
                      ? 'text-orange-500 font-black border-b-2 border-orange-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={14} className={activeProspectTab === tab.id ? 'text-orange-500' : 'text-gray-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-6">

              {/* Title + Edit controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedOpportunity.name}
                      onChange={e => setEditedOpportunity({...editedOpportunity, name: e.target.value})}
                      className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-orange-300 focus:border-orange-500 outline-none px-0.5 -ml-0.5"
                    />
                  ) : (
                    <h1 className="text-xl font-bold text-gray-900">{editedOpportunity.name}</h1>
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
                    <button onClick={() => setIsEditMode(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
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
                          const options = editedOpportunity.businessType === 'Renewal' ? RB_PROBABILITY_OPTIONS : NB_PROBABILITY_OPTIONS;
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
                        <input type="text" value={companySearch} onChange={e => setCompanySearch(e.target.value)} placeholder="Search by name..." className="w-full max-w-sm px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50" />
                        <select value={editedOpportunity.company} onChange={e => setEditedOpportunity({...editedOpportunity, company: e.target.value})} className="w-full max-w-sm px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50">
                          {!filteredCompanyOptions.some(o => o.label === editedOpportunity.company) && editedOpportunity.company && (
                            <option value={editedOpportunity.company}>{editedOpportunity.company} (not in {companyEntityType}/{companySource} list)</option>
                          )}
                          {filteredCompanyOptions.length === 0 && !editedOpportunity.company && <option value="">No matches</option>}
                          {filteredCompanyOptions.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-2.5 py-1.5">
                        <span className="text-xs font-semibold text-gray-800">{editedOpportunity.company}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{companyEntityType}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{companySource}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Oppty Status</label>
                    <input type="text" value={editedOpportunity.stage} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                  </div>
                  <FieldView label="Campaign" required editing={isEditMode} viewValue={editedOpportunity.campaign}>
                    <select value={editedOpportunity.campaign} onChange={e => setEditedOpportunity({...editedOpportunity, campaign: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50">
                      {CAMPAIGN_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FieldView>
                  <FieldView label="Relation Oppty ID" editing={isEditMode} viewValue={editedOpportunity.relationOpptyId || '—'}>
                    <input type="text" value={editedOpportunity.relationOpptyId} onChange={e => setEditedOpportunity({...editedOpportunity, relationOpptyId: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-mono bg-gray-50" placeholder="Purpose TBD" />
                  </FieldView>
                  {['Draft', 'Finalize', 'Policy'].includes(editedOpportunity.stage) && (
                    <FieldView label="Effective Date 1 (Draft)" editing={isEditMode} viewValue={editedOpportunity.effectiveDate1 || '—'}>
                      <input type="date" value={editedOpportunity.effectiveDate1} onChange={e => setEditedOpportunity({...editedOpportunity, effectiveDate1: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                    </FieldView>
                  )}
                  {['Finalize', 'Policy'].includes(editedOpportunity.stage) && (
                    <FieldView label="Effective Date 2 (Finalize)" editing={isEditMode} viewValue={editedOpportunity.effectiveDate2 || '—'}>
                      <input type="date" value={editedOpportunity.effectiveDate2} onChange={e => setEditedOpportunity({...editedOpportunity, effectiveDate2: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                    </FieldView>
                  )}
                  {editedOpportunity.stage === 'Policy' && (
                    <FieldView label="Effective Date 3 (Policy)" editing={isEditMode} viewValue={editedOpportunity.effectiveDate3 || '—'}>
                      <input type="date" value={editedOpportunity.effectiveDate3} onChange={e => setEditedOpportunity({...editedOpportunity, effectiveDate3: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
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
                  <select
                    value={editedOpportunity.productItem}
                    onChange={e => {
                      const selectedItem = e.target.value;
                      setEditedOpportunity({
                        ...editedOpportunity,
                        productItem: selectedItem,
                        productTeam: resolveProductTeam(selectedItem),
                        productCategory: resolveProductCategory(selectedItem)
                      });
                    }}
                    className="w-full max-w-sm px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-800"
                  >
                    {CONFIG_PRODUCT_NAMES.map(pName => (
                      <option key={pName} value={pName}>{pName}</option>
                    ))}
                  </select>
                </FieldView>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Team</label>
                  <input type="text" value={editedOpportunity.productTeam} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Category</label>
                  <input type="text" value={editedOpportunity.productCategory} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-semibold outline-none cursor-not-allowed" />
                </div>
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
                        <th className="p-2 text-left">Sales Representative</th>
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
                          <input type="number" value={editedOpportunity.split1} onChange={e => setEditedOpportunity({...editedOpportunity, split1: Number(e.target.value)})} className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono" />
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
                            <input type="number" value={editedOpportunity.split2} onChange={e => setEditedOpportunity({...editedOpportunity, split2: Number(e.target.value)})} className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono" />
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
                            <input type="number" value={editedOpportunity.split3} onChange={e => setEditedOpportunity({...editedOpportunity, split3: Number(e.target.value)})} className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono" />
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vendor Column */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <Building2 size={13} className="text-gray-500" />
                    Vendor Fields
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct?.vendorFields?.filter((f: any) => f.visible).map((f: any) => (
                      <FieldView key={f.name} label={f.name} required={f.required} editing={isEditMode} viewValue={evaluationValues[f.name] || '—'}>
                        <input
                          type="text"
                          value={evaluationValues[f.name] || ''}
                          onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
                          placeholder={`Enter ${f.name}`}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                        />
                      </FieldView>
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
                    {selectedProduct?.premiumFields?.filter((f: any) => f.visible).map((f: any) => (
                      <FieldView key={f.name} label={f.name} required={f.required} editing={isEditMode} viewValue={evaluationValues[f.name] || '—'}>
                        <input
                          type="text"
                          value={evaluationValues[f.name] || ''}
                          onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
                          placeholder={`Enter ${f.name}`}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium font-mono"
                        />
                      </FieldView>
                    ))}
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
                    {selectedProduct?.dateTransferFields?.filter((f: any) => f.visible).map((f: any) => {
                      const isDateField = f.name.toLowerCase().includes('date');
                      return (
                        <FieldView key={f.name} label={f.name} required={f.required} editing={isEditMode} viewValue={evaluationValues[f.name] || '—'}>
                          <input
                            type={isDateField ? "date" : "text"}
                            value={evaluationValues[f.name] || ''}
                            onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
                            placeholder={`Enter ${f.name}`}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium font-mono"
                          />
                        </FieldView>
                      );
                    })}
                    {(!selectedProduct?.dateTransferFields || selectedProduct.dateTransferFields.filter((f: any) => f.visible).length === 0) && (
                      <p className="text-gray-400 text-xs italic">No visible date & transfer fields are configured for this product.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            </div>
        </div>
      ) : (
        // ==========================================
        // PROPOSAL WORKSPACE (STANDALONE WORKSPACE)
        // ==========================================
        <div className="p-4 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-4 text-xs">
          {/* Top Status Chevron Progress Bar (Odoo 19 Style) */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between p-3 gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedChild(null); setActiveProspectTab('Opportunity'); }}
                className="p-1.5 hover:bg-gray-100 rounded border border-gray-200 bg-white text-gray-500 flex items-center justify-center transition-colors"
                title="Back to Opportunity"
              >
                <ArrowLeft size={14} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-mono font-black text-[10px] rounded">{selectedChild.id}</span>
                  <h2 className="text-sm font-bold text-gray-900">{selectedChild.name}</h2>
                </div>
                <p className="text-[10px] text-gray-500">Opportunity: <span className="font-semibold text-gray-700">{editedOpportunity.name}</span> · Customer: {editedOpportunity.company}</p>
              </div>
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
              {selectedChild.status === 'Approved' && (
                <button 
                  onClick={() => handleConvertToPolicy(selectedChild)} 
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>Convert to Policy</span>
                </button>
              )}
              {selectedChild.policyId && (
                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold font-mono">
                  Linked Policy: {selectedChild.policyId}
                </div>
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
                  { id: 'benchmark', label: 'Benchmarking', icon: BarChart2 },
                  { id: 'renewal-history', label: 'Renewal History', icon: History }
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
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><DollarSign size={11} /> Commission Rate</span>
                          {isProposalEditMode ? (
                            <input type="number" value={selectedChild.commissionRate} onChange={e => setSelectedChild({...selectedChild, commissionRate: Number(e.target.value)})} className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm font-bold text-emerald-700 bg-white focus:border-blue-500 outline-none" />
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
                        <span className={`inline-flex items-center px-2.5 py-1 border text-[10px] font-black rounded uppercase tracking-wider ${
                          selectedChild.status === 'Converted to Policy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          selectedChild.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>{selectedChild.status}</span>
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
                          <input type="number" value={selectedChild.salesPercentage ?? 100} onChange={e => setSelectedChild({...selectedChild, salesPercentage: Number(e.target.value)})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                        ) : (
                          <input type="text" value={`${selectedChild.salesPercentage ?? 100}%`} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 rounded text-xs bg-gray-50 text-gray-600 font-mono cursor-not-allowed outline-none" />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Renew Required</label>
                        {isProposalEditMode ? (
                          <select
                            value={selectedChild.renewRequired || 'No'}
                            onChange={e => setSelectedChild({...selectedChild, renewRequired: e.target.value})}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                            <option value="Optional">Optional</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 border text-[10px] font-black rounded uppercase tracking-wider ${selectedChild.renewRequired === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{selectedChild.renewRequired || 'No'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Premium */}
              {activeWorkspaceTab === 'premium' && (
                <div className="space-y-4">
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

              {/* Tab 4: Benchmark */}
              {activeWorkspaceTab === 'benchmark' && (
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
              )}

              {/* Tab 4: Renewal History */}
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
