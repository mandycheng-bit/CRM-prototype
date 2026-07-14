import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Save, MoreVertical, CheckCircle2, Clock, AlertCircle, FileText, 
  PieChart, Settings, Zap, TrendingUp, BarChart2, Users, Building2, DollarSign, 
  Calendar, Thermometer, ShieldCheck, Plus, Trash2, Download, Share2, 
  ExternalLink, XCircle, History, FileCode, Check, Send, Upload, FileUp, 
  Info, Activity as ActivityIcon, Edit, Copy, User, HelpCircle, Briefcase,
  ChevronRight, Layers, FileSpreadsheet, Star, Play, Award, ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import type { Proposal, BenefitRow } from '../../types';

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
  // Modal dialog states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newProposalName, setNewProposalName] = useState('');
  const [newProposalLocationType, setNewProposalLocationType] = useState('Hong Kong');

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

  const initialProductItem = proposal.productItem || 'Premium Care Gold';
  const initialProductTeam = resolveProductTeam(initialProductItem);
  const initialProductCategory = resolveProductCategory(initialProductItem);

  // State for Opportunity Page (Commercial)
  const [editedOpportunity, setEditedOpportunity] = useState({
    name: proposal.name,
    stage: proposal.stage || 'Qualification',
    probability: proposal.probability || 30,
    expectedCloseDate: proposal.effectiveDate || '2026-04-01',
    expectedEffectiveDate: '2026-05-01',
    opportunityBusiness: 'New Business',
    grossAmount: proposal.expectedRevenueGross || 150000,
    estimatedSalesCredit: Math.round((proposal.expectedRevenueGross || 150000) * 0.15),
    netAmount: Math.round((proposal.expectedRevenueGross || 150000) * 0.92),
    // Customer Info
    company: proposal.client || 'MODERN MEDIA CO. LTD.',
    primaryContact: proposal.contactPerson || 'Sarah Jenkins',
    phone: '+852 2843 9111',
    email: 'sjenkins@modernmedia.hk',
    industry: 'Entertainment and Media',
    existingCustomer: 'No',
    existingPolicyCount: 0,
    gumCompany: 'GUM Company Limited',
    isMacau: 'No',
    companyOdooId: 'odoo_comp_5541',
    // Product Info
    productTeam: initialProductTeam,
    productCategory: initialProductCategory,
    productItem: initialProductItem,
    businessType: 'NB',
    campaign: proposal.campaign || 'Q2 Corporate Outreach',
    salesTeam: 'Hong Kong Corporate',
    // Sales Assignment
    salesRep1: proposal.salesRep || 'Alice Wong',
    split1: 70,
    salesRep2: 'Bob Chan',
    split2: 30,
    salesRep3: '',
    split3: 0,
    teamLeader: 'Sarah Jenkins',
    // Marketing
    medium: 'Direct Referral',
    source: proposal.source || 'Broker Agent',
    referredBy: 'GUM Executive Referral',
    // Evaluation & Lifecycle
    leadTemperature: 'Hot',
    expectedEmployeeCount: 45,
    lossReason: '',
    relationOpptyId: 'OPP-2026-0038',
    gmiProposalLink: 'https://gmi.gainmiles.com.hk/proposal/P-2309-1229',
    tags: ['Corporate', 'Q2 Outreach'],
    opportunityNotes: proposal.remarks || 'Client requested urgent comparison for Ward vs Semi-Private coverage for 45 members.',
    // System fields
    opptyOdooId: 'odoo_opp_9482',
    createdOn: '2026-03-20 10:15:30',
    opptyStageChangeDate: '2026-04-10 14:22:05',
  });

  // State for Child Proposals Map
  const [childProposals, setChildProposals] = useState<ChildProposal[]>([
    {
      id: 'P-2026-0001',
      name: 'Modern Media Group Healthcare Plan Option A',
      version: 'v1.0',
      status: 'Approved',
      vendor: 'AIA',
      premium: 145000,
      commissionRate: 15,
      effectiveDate: '2026-05-01',
      createdDate: '2026-03-01',
      lastUpdated: '2026-04-10',
      createdBy: 'Alice Wong',
      updatedBy: 'Sarah Jenkins',
      summary: 'Comprehensive scheme offering premium semi-private hospitalization limits with $50 clinical network co-pay.',
      isCurrent: true,
      locationType: 'Hong Kong',
      productTeam: 'EBP Team',
      productCategory: 'Group Medical',
      productItem: 'Premium Care Gold',
      gmiProductGroup: 'General Insurance',
      selectedProducts: ['AIA Group Medical Option A', 'Bupa Premium Plan'],
      standardPremium: 145000,
      premiumFrequency: 'Annual',
      currency: 'HKD',
      renewRequired: 'No',
      benefitType: 'Core Benefit',
      finalizedDate: '',
      debitNoteNo: 'DN-99411',
      policyStatus: 'Active',
      loadedBenefits: ['Critical Illness Benefit', 'Major Medical Coverage'],
      loadedCoverages: ['Worldwide', 'Worldwide (excluding US)']
    },
    {
      id: 'P-2026-0002',
      name: 'Modern Media Alternative Budget Option B',
      version: 'v1.1',
      status: 'In Progress',
      vendor: 'Bupa',
      premium: 128000,
      commissionRate: 12.5,
      effectiveDate: '2026-05-01',
      createdDate: '2026-03-15',
      lastUpdated: '2026-04-02',
      createdBy: 'Alice Wong',
      updatedBy: 'Alice Wong',
      summary: 'Value-focused alternative with ward-level accommodation and 20% clinical cost-sharing co-insurance.',
      isCurrent: false,
      locationType: 'Macau',
      productTeam: 'EBP Team',
      productCategory: 'Group Medical',
      productItem: 'Standard Ward Plan',
      gmiProductGroup: 'Employee Benefit & General Insurance',
      selectedProducts: ['Bupa Premium Plan'],
      standardPremium: 128000,
      premiumFrequency: 'Annual',
      currency: 'HKD',
      renewRequired: 'Yes',
      benefitType: 'Co-Share',
      finalizedDate: '',
      debitNoteNo: '',
      policyStatus: ''
    }
  ]);

  // EB Fact Finding State (Case Setup)
  const [factFinding, setFactFinding] = useState({
    companyName: 'MODERN MEDIA CO. LTD.',
    industry: 'Entertainment and Media',
    employeeCount: 45,
    existingCustomer: 'No',
    currentInsurer: 'AIA INTERNATIONAL LIMITED',
    existingScheme: 'AIA Group Health & Care Plus',
    policyRenewalDate: '2026-05-01',
    policyEffectiveDate: '2026-05-01',
    currentBroker: 'Direct Agent / AIA Broker Desk',
    mpfScheme: 'AIA MPF Simple Retirement Plan',
    annualContribution: 840000,
    assetValue: 4200000,
    employerOption: 'Voluntary Scheme Available',
    insuredEmployeesCount: 45,
    benefitSummary: 'Ward level cover for general staff, GP consultation limit HK$150 network.',
    lossRatio: '68.0%',
    claimHistory: 'Generally low claims. Two outpatient hospitalizations for sports injuries last year.',
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
    const childItemName = selectedChild.productItem || 'Premium Care Gold';
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
        name: 'GUM Pension Choice Premium',
        team: 'EB(GMED/GL/Tender)',
        group: 'Pension',
        appliedCompanyTypes: ['Company'],
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
        name: 'GMED Medical Care Tier A',
        team: 'EB(GMED/GL/Tender)',
        group: 'Employee Benefit & General Insurance',
        appliedCompanyTypes: ['Company'],
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
        name: 'Wealth Growth iFast Account',
        team: 'Others',
        group: 'iFast',
        appliedCompanyTypes: ['Individual'],
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
        name: 'Premium Care Gold',
        team: 'EB(GMED/GL/Tender)',
        group: 'Employee Benefit & General Insurance',
        appliedCompanyTypes: ['Company'],
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
        name: 'Super Shield Bronze',
        team: 'EB(GMED/GL/Tender)',
        group: 'Employee Benefit & General Insurance',
        appliedCompanyTypes: ['Company'],
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
      'Proposed Service Provider': 'AIA',
      'Existing Insurer': 'Bupa',
      'No. of Employee / Insured': '45',
      'Est Premium': '150000',
      'Application Date': '2026-03-25',
      'Form Received Date': '2026-03-24',
      'No. of Briefing Sessions': '2',
      'Member Briefing Speaker': 'Alice Wong',
      'Total Briefing Attendees': '38',
      'No. of Employee Transfer Est by ES': '40'
    };
  });

  const handleSaveEvaluation = (values: Record<string, string>) => {
    setEvaluationValues(values);
    localStorage.setItem(`pr2_opp_eval_${proposal.id}`, JSON.stringify(values));
  };

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
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'proposal' | 'documents' | 'benefits' | 'benchmark' | 'renewal-history'>('proposal');
  const [previewingDoc, setPreviewingDoc] = useState<any | null>(null);
  const [benchmarkFilter, setBenchmarkFilter] = useState<'Provider' | 'Premium' | 'Benefit' | 'Coverage'>('Provider');

  // Activities Log State
  const [activities, setActivities] = useState([
    { id: 1, type: 'Call', subject: 'Initial Discovery', date: '2026-03-22', notes: 'Discussed employee budget and basic inpatient needs with HR Lead.', user: 'Alice Wong' },
    { id: 2, type: 'Meeting', subject: 'Plan Presentation', date: '2026-03-28', notes: 'Presented AIA Option A and gathered feedback on plan structures.', user: 'Alice Wong' }
  ]);
  const [newActivity, setNewActivity] = useState({ type: 'Call', subject: '', notes: '' });

  // Document Upload State
  const [documents, setDocuments] = useState([
    { id: 'D1', name: 'AIA_Quotation_Package_ModernMedia.pdf', category: 'Quotation', date: '2026-03-25', size: '2.4 MB' },
    { id: 'D2', name: 'GUM_Benefit_Comparison_Report_v1.pdf', category: 'Proposal Documents', date: '2026-04-01', size: '1.8 MB' }
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Audit Trails
  const [auditLogs, setAuditLogs] = useState([
    { id: 'A1', action: 'Proposal v1.0 Created', user: 'Alice Wong', date: '2026-03-25 10:00', details: 'Initialized from standard group medical template.' },
    { id: 'A2', action: 'MCR Validation Approved', user: 'System Compliance', date: '2026-04-01 11:15', details: 'Validated against HK MCR regulations successfully.' }
  ]);

  // Save changes to opportunity
  const handleSaveOpportunity = () => {
    if (onSave) {
      onSave({
        ...proposal,
        name: editedOpportunity.name,
        stage: editedOpportunity.stage as any,
        probability: editedOpportunity.probability,
        expectedRevenueGross: editedOpportunity.grossAmount,
        salesRep: editedOpportunity.salesRep1,
        client: editedOpportunity.company,
        remarks: editedOpportunity.opportunityNotes,
      });
    }
    alert("Opportunity changes saved successfully!");
  };

  // Create new child proposal
  const handleCreateProposal = () => {
    const code = `P-2026-000${childProposals.length + 1}`;
    const assignedGmiGroup = getAssignedGmiProductGroup(editedOpportunity.productItem);
    const { benefits, coverages } = resolveBenefitsAndCoverages(assignedGmiGroup);

    const newProp: ChildProposal = {
      id: code,
      name: newProposalName || `${editedOpportunity.name} - Option ${String.fromCharCode(65 + childProposals.length)}`,
      version: 'v1.0',
      status: 'Draft',
      vendor: 'AIA',
      premium: editedOpportunity.grossAmount,
      commissionRate: 15,
      effectiveDate: editedOpportunity.expectedEffectiveDate,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      createdBy: editedOpportunity.salesRep1,
      updatedBy: editedOpportunity.salesRep1,
      summary: `New custom insurance scheme option inheriting ${editedOpportunity.productItem} (${editedOpportunity.productCategory}).`,
      locationType: newProposalLocationType,
      productTeam: editedOpportunity.productTeam,
      productCategory: editedOpportunity.productCategory,
      productItem: editedOpportunity.productItem,
      gmiProductGroup: assignedGmiGroup,
      loadedBenefits: benefits,
      loadedCoverages: coverages,
      selectedProducts: [],
      standardPremium: editedOpportunity.grossAmount,
      premiumFrequency: 'Annual',
      currency: 'HKD'
    };

    setChildProposals([...childProposals, newProp]);
    setShowGenerateModal(false);
    // Open the workspace of the newly created proposal automatically for maximum usability
    setSelectedChild(newProp);
    setActiveWorkspaceTab('proposal');
  };

  // Duplicate / Clone Proposal
  const handleCloneProposal = (propToClone: ChildProposal) => {
    const code = `P-2026-000${childProposals.length + 1}`;
    const cloned: ChildProposal = {
      ...propToClone,
      id: code,
      name: `${propToClone.name} (Cloned Draft)`,
      version: `v${(parseFloat(propToClone.version.substring(1)) + 0.1).toFixed(1)}`,
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setChildProposals([...childProposals, cloned]);
    alert(`Cloned proposal successfully as ${code}!`);
  };

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
      createdBy: editedOpportunity.salesRep1 || 'Alice Wong',
      updatedBy: editedOpportunity.salesRep1 || 'Alice Wong',
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

  // Set selected proposal version as current active version
  const handleSetCurrentVersion = (propId: string) => {
    setChildProposals(prev => prev.map(item => ({
      ...item,
      isCurrent: item.id === propId
    })));
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
            user: 'Alice Wong',
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 bg-white shadow-sm text-gray-500">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{editedOpportunity.name}</h1>
                <p className="text-xs text-gray-500 mt-1">Opportunity Code: <span className="font-mono">{proposal.id}</span> · Customer: {editedOpportunity.company} · Rep: {editedOpportunity.salesRep1}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveOpportunity} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                <Save size={14} />
                <span>Save Opportunity</span>
              </button>
            </div>
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
                  onClick={() => setActiveProspectTab(tab.id)}
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

          {activeProspectTab === 'Opportunity' ? (
            <div className="flex flex-col gap-6">
              
              {/* 1. Customer Information */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-orange-500" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Company Name</label>
                  <input type="text" value={editedOpportunity.company} onChange={e => setEditedOpportunity({...editedOpportunity, company: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Company Odoo ID</label>
                  <input type="text" value={editedOpportunity.companyOdooId} readOnly className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 rounded text-xs text-gray-500 font-mono outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Primary Contact</label>
                  <input type="text" value={editedOpportunity.primaryContact} onChange={e => setEditedOpportunity({...editedOpportunity, primaryContact: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Industry</label>
                  <input type="text" value={editedOpportunity.industry} onChange={e => setEditedOpportunity({...editedOpportunity, industry: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone</label>
                  <input type="text" value={editedOpportunity.phone} onChange={e => setEditedOpportunity({...editedOpportunity, phone: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
                  <input type="email" value={editedOpportunity.email} onChange={e => setEditedOpportunity({...editedOpportunity, email: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Is Macau?</label>
                  <select value={editedOpportunity.isMacau} onChange={e => setEditedOpportunity({...editedOpportunity, isMacau: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Existing Customer</label>
                    <select value={editedOpportunity.existingCustomer} onChange={e => setEditedOpportunity({...editedOpportunity, existingCustomer: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Existing Policies</label>
                    <input type="number" value={editedOpportunity.existingPolicyCount} onChange={e => setEditedOpportunity({...editedOpportunity, existingPolicyCount: Number(e.target.value)})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Product Information */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <Briefcase size={14} className="text-orange-500" />
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Team</label>
                  <select value={editedOpportunity.productTeam} onChange={e => setEditedOpportunity({...editedOpportunity, productTeam: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-800">
                    <option value="EB (GMED / GL / Tender)">EB (GMED / GL / Tender)</option>
                    <option value="GI (GPA / GBT)">GI (GPA / GBT)</option>
                    <option value="PIES">PIES</option>
                    <option value="LSP Projects">LSP Projects</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Category</label>
                  <select value={editedOpportunity.productCategory} onChange={e => setEditedOpportunity({...editedOpportunity, productCategory: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-800">
                    <option value="Pension">Pension</option>
                    <option value="Employee Benefit & General Insurance">Employee Benefit & General Insurance</option>
                    <option value="Project">Project</option>
                    <option value="Wellness">Wellness</option>
                    <option value="MPF">MPF</option>
                    <option value="Tax Deductible">Tax Deductible</option>
                    <option value="iFast">iFast</option>
                    <option value="HKMC">HKMC</option>
                    <option value="Individual - TVC">Individual - TVC</option>
                    <option value="Individual - QDAP">Individual - QDAP</option>
                    <option value="Individual - Individual Medical / VHIS">Individual - Individual Medical / VHIS</option>
                    <option value="Individual - Mutual Fund">Individual - Mutual Fund</option>
                    <option value="Individual - Annuity">Individual - Annuity</option>
                    <option value="Individual - PA">Individual - PA</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Item</label>
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
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-800"
                  >
                    {CONFIG_PRODUCT_NAMES.map(pName => (
                      <option key={pName} value={pName}>{pName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Business Type</label>
                  <select value={editedOpportunity.businessType} onChange={e => setEditedOpportunity({...editedOpportunity, businessType: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-800 font-mono">
                    <option value="NB">New Business (NB)</option>
                    <option value="Renewal">Renewal (RN)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 p-3 bg-orange-50 rounded border border-dashed border-orange-200 text-[11px] text-orange-800">
                💡 <strong>Commercial Context:</strong> Proposals will inherit these selections, keeping the product categorization unified.
              </div>
            </div>

            {/* 3. Sales Assignment */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-orange-500" />
                Sales Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Sales Team</label>
                    <input type="text" value={editedOpportunity.salesTeam} onChange={e => setEditedOpportunity({...editedOpportunity, salesTeam: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Sales Team Leader</label>
                    <input type="text" value={editedOpportunity.teamLeader} onChange={e => setEditedOpportunity({...editedOpportunity, teamLeader: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Estimated Sales Credit</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">HK$</span>
                      <input type="number" value={editedOpportunity.estimatedSalesCredit} onChange={e => setEditedOpportunity({...editedOpportunity, estimatedSalesCredit: Number(e.target.value)})} className="w-full pl-10 pr-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white font-mono font-bold" />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
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
                        <td className="p-2"><input type="text" value={editedOpportunity.salesRep1} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep1: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs" /></td>
                        <td className="p-2"><input type="number" value={editedOpportunity.split1} onChange={e => setEditedOpportunity({...editedOpportunity, split1: Number(e.target.value)})} className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono" /></td>
                      </tr>
                      <tr>
                        <td className="p-2"><input type="text" value={editedOpportunity.salesRep2} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep2: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs" placeholder="Rep 2" /></td>
                        <td className="p-2"><input type="number" value={editedOpportunity.split2} onChange={e => setEditedOpportunity({...editedOpportunity, split2: Number(e.target.value)})} className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono" /></td>
                      </tr>
                      <tr>
                        <td className="p-2"><input type="text" value={editedOpportunity.salesRep3} onChange={e => setEditedOpportunity({...editedOpportunity, salesRep3: e.target.value})} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs" placeholder="Rep 3" /></td>
                        <td className="p-2"><input type="number" value={editedOpportunity.split3} onChange={e => setEditedOpportunity({...editedOpportunity, split3: Number(e.target.value)})} className="w-full p-1 border border-gray-200 rounded text-xs text-right font-mono" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. Opportunity Information */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-orange-500" />
                Opportunity Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Opportunity Name</label>
                    <input type="text" value={editedOpportunity.name} onChange={e => setEditedOpportunity({...editedOpportunity, name: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status / Stage</label>
                    <select value={editedOpportunity.stage} onChange={e => setEditedOpportunity({...editedOpportunity, stage: e.target.value as import("../../types").ProposalStage, opptyStageChangeDate: new Date().toISOString().replace('T', ' ').substring(0, 19)})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold">
                      <option value="Qualification">Qualification</option>
                      <option value="Proposal Preparation">Proposal Preparation</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Lead Temp</label>
                    <select value={editedOpportunity.leadTemperature} onChange={e => setEditedOpportunity({...editedOpportunity, leadTemperature: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-semibold">
                      <option value="Cold">Cold</option>
                      <option value="Warm">Warm</option>
                      <option value="Hot">Hot</option>
                    </select>
                  </div>
                  {editedOpportunity.stage === 'Lost' && (
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-red-500 uppercase block mb-1">Loss Reason *</label>
                      <select value={editedOpportunity.lossReason} onChange={e => setEditedOpportunity({...editedOpportunity, lossReason: e.target.value})} className="w-full px-2.5 py-1.5 border border-red-200 bg-red-50/20 rounded text-xs text-red-900 font-semibold">
                        <option value="">-- Select Loss Reason --</option>
                        <option value="Price too high">Price too high</option>
                        <option value="Competitor won">Competitor won</option>
                        <option value="Coverage gap">Coverage gap</option>
                        <option value="No budget">No budget</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Gross Revenue</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">HK$</span>
                      <input type="number" value={editedOpportunity.grossAmount} onChange={e => {
                        const val = Number(e.target.value);
                        setEditedOpportunity({ ...editedOpportunity, grossAmount: val, netAmount: Math.round(val * 0.92), estimatedSalesCredit: Math.round(val * 0.15) });
                      }} className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white font-bold font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Net Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">HK$</span>
                      <input type="number" value={editedOpportunity.netAmount} onChange={e => setEditedOpportunity({...editedOpportunity, netAmount: Number(e.target.value)})} className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 focus:bg-white font-bold font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Probability %</label>
                    <input type="number" value={editedOpportunity.probability} onChange={e => setEditedOpportunity({...editedOpportunity, probability: Number(e.target.value)})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Expected Staff Count</label>
                    <input type="number" value={editedOpportunity.expectedEmployeeCount} onChange={e => setEditedOpportunity({...editedOpportunity, expectedEmployeeCount: Number(e.target.value)})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Expected Close Date</label>
                    <input type="date" value={editedOpportunity.expectedCloseDate} onChange={e => setEditedOpportunity({...editedOpportunity, expectedCloseDate: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Expected Effective Date</label>
                    <input type="date" value={editedOpportunity.expectedEffectiveDate} onChange={e => setEditedOpportunity({...editedOpportunity, expectedEffectiveDate: e.target.value})} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 font-mono" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">GMI Proposal Link</label>
                    <div className="flex gap-1">
                      <input type="text" value={editedOpportunity.gmiProposalLink} onChange={e => setEditedOpportunity({...editedOpportunity, gmiProposalLink: e.target.value})} className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-blue-600 font-mono underline" />
                      <a href={editedOpportunity.gmiProposalLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-100 hover:bg-gray-200 border rounded flex items-center justify-center"><ExternalLink size={12} /></a>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Campaign</label>
                    <input type="text" value={editedOpportunity.campaign} onChange={e => setEditedOpportunity({...editedOpportunity, campaign: e.target.value})} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Source</label>
                    <input type="text" value={editedOpportunity.source} onChange={e => setEditedOpportunity({...editedOpportunity, source: e.target.value})} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Referred By</label>
                    <input type="text" value={editedOpportunity.referredBy} onChange={e => setEditedOpportunity({...editedOpportunity, referredBy: e.target.value})} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Relation Oppty ID</label>
                    <input type="text" value={editedOpportunity.relationOpptyId} onChange={e => setEditedOpportunity({...editedOpportunity, relationOpptyId: e.target.value})} className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-mono bg-gray-50" />
                  </div>
                  <div className="pt-2 border-t text-[10px] text-gray-400 space-y-1">
                    <p>Oppty Odoo ID: <span className="font-mono text-gray-600">{editedOpportunity.opptyOdooId}</span></p>
                    <p>Created: <span className="font-mono text-gray-600">{editedOpportunity.createdOn}</span></p>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Opportunity Remarks & Notes</label>
                  <textarea value={editedOpportunity.opportunityNotes} onChange={e => setEditedOpportunity({...editedOpportunity, opportunityNotes: e.target.value})} className="w-full h-20 px-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 resize-none" placeholder="Provide any comments or deal constraints..." />
                </div>
              </div>
            </div>

            {/* 5. Product Opportunity Evaluation */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <ClipboardCheck size={14} className="text-orange-500" />
                Product Opportunity Evaluation
              </h3>
              
              <div className="mb-4 p-3 bg-blue-50 rounded border border-dashed border-blue-100 text-[11px] text-blue-800">
                ⚡ <strong>Dynamic Configuration Matrix:</strong> The fields displayed below are customized in real-time, driven directly by your <strong>Product Item configuration</strong> (<em>{editedOpportunity.productItem}</em>).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vendor Column */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <Building2 size={13} className="text-gray-500" />
                    Vendor Fields
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct?.vendorFields?.filter((f: any) => f.visible).map((f: any) => (
                      <div key={f.name}>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                          {f.name} {f.required && <span className="text-red-500 font-bold">*</span>}
                        </label>
                        <input
                          type="text"
                          value={evaluationValues[f.name] || ''}
                          onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
                          placeholder={`Enter ${f.name}`}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                        />
                      </div>
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
                      <div key={f.name}>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                          {f.name} {f.required && <span className="text-red-500 font-bold">*</span>}
                        </label>
                        <input
                          type="text"
                          value={evaluationValues[f.name] || ''}
                          onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
                          placeholder={`Enter ${f.name}`}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium font-mono"
                        />
                      </div>
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
                        <div key={f.name}>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            {f.name} {f.required && <span className="text-red-500 font-bold">*</span>}
                          </label>
                          <input
                            type={isDateField ? "date" : "text"}
                            value={evaluationValues[f.name] || ''}
                            onChange={e => handleSaveEvaluation({ ...evaluationValues, [f.name]: e.target.value })}
                            placeholder={`Enter ${f.name}`}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium font-mono"
                          />
                        </div>
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
          ) : (
            /* Proposal (Proposal List) */
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Proposal List</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Manage quotation options. Clicking a proposal code opens the standalone Proposal Workspace.</p>
                </div>
                <button 
                  onClick={() => {
                    setNewProposalName(`${editedOpportunity.name} - Option ${String.fromCharCode(65 + childProposals.length)}`);
                    setNewProposalLocationType('Hong Kong');
                    setShowGenerateModal(true);
                  }} 
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 text-xs font-bold transition-all shadow-sm"
                >
                  <Plus size={12} />
                  <span>Generate Proposal</span>
                </button>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2.5">Proposal Code</th>
                      <th className="px-4 py-2.5">Option Name</th>
                      <th className="px-4 py-2.5">Version</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Created Date</th>
                      <th className="px-4 py-2.5">Last Updated</th>
                      <th className="px-4 py-2.5">Current Version</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {childProposals.map(p => (
                      <tr key={p.id} onClick={() => { setSelectedChild(p); setActiveWorkspaceTab('proposal'); }} className="hover:bg-orange-50/15 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 hover:underline">{p.id}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 hover:text-orange-600">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono">{p.version}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase tracking-wider ${
                            p.status === 'Converted to Policy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            p.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            p.status === 'Pending Internal Approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono">{p.createdDate || '2026-03-25'}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono">{p.lastUpdated}</td>
                        <td className="px-4 py-3">
                          {p.isCurrent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                              <CheckCircle2 size={10} className="text-emerald-600" />
                              <span>Current Version</span>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCurrentVersion(p.id);
                              }}
                              className="px-2 py-0.5 bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded text-[9px] font-bold transition-all"
                            >
                              Set Current
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setSelectedChild(p); setActiveWorkspaceTab('proposal'); }} className="px-2 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded text-[10px]">Open</button>
                            <button onClick={() => handleCloneProposal(p)} className="px-2 py-0.5 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold rounded text-[10px]">Clone</button>
                            <button onClick={() => handleRenewProposal(p)} className="px-2 py-0.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold rounded text-[10px]">Renew</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                onClick={() => setSelectedChild(null)} 
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

          {/* Action Ribbon & Quick Metadata Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-3 flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handleCloneProposal(selectedChild)} 
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold transition-all flex items-center gap-1.5"
              >
                <Copy size={13} />
                <span>Duplicate Version</span>
              </button>
              {(selectedChild.status === 'Finalized' || selectedChild.status === 'Converted to Policy' || selectedChild.policyId) && (
                <button 
                  onClick={() => handleRenewProposal(selectedChild)} 
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded font-bold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Renew Proposal</span>
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
              {selectedChild.policyId && (
                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold font-mono">
                  Linked Policy: {selectedChild.policyId}
                </div>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4 text-[10px] border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4 font-mono">
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider">Gross Premium</span>
                <span className="font-bold text-gray-900 text-xs">HK${selectedChild.premium.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider">Estimated Revenue</span>
                <span className="font-bold text-blue-600 text-xs">HK$ {Math.round(selectedChild.premium * (selectedChild.commissionRate / 100)).toLocaleString()} ({selectedChild.commissionRate}%)</span>
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
                  { id: 'proposal', label: 'Proposal General', icon: Briefcase },
                  { id: 'documents', label: 'Documents', icon: FileText },
                  { id: 'benefits', label: 'Benefit Design', icon: Layers },
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
              {/* Tab 1: Proposal General */}
              {activeWorkspaceTab === 'proposal' && (
                <div className="space-y-4">
                  {/* Section A – Proposal Information */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                      <div className="p-1 bg-blue-50 rounded text-blue-600"><Briefcase size={14} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Section A – Proposal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Proposal Code</label>
                        <input 
                          type="text" 
                          value={selectedChild.id} 
                          disabled
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-500 font-mono font-bold focus:outline-none cursor-not-allowed" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Proposal Name</label>
                        <input 
                          type="text" 
                          value={selectedChild.name} 
                          onChange={e => setSelectedChild({...selectedChild, name: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white font-semibold text-gray-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Proposal Location Type</label>
                        <select 
                          value={selectedChild.locationType || 'Hong Kong'} 
                          onChange={e => setSelectedChild({...selectedChild, locationType: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Hong Kong">Hong Kong (HQ)</option>
                          <option value="Macau">Macau Branch</option>
                          <option value="Mainland China">Mainland China</option>
                          <option value="Overseas">Overseas Regional</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Opportunity</label>
                        <input 
                          type="text" 
                          value={editedOpportunity.name} 
                          readOnly
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-600 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Customer</label>
                        <input 
                          type="text" 
                          value={editedOpportunity.company} 
                          readOnly
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-600 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Product Team</label>
                        <input 
                          type="text" 
                          value={resolveProductTeam(selectedChild.productItem || '')} 
                          disabled
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-500 font-bold focus:outline-none cursor-not-allowed" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Product Category</label>
                        <input 
                          type="text" 
                          value={resolveProductCategory(selectedChild.productItem || '')} 
                          disabled
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-500 font-bold focus:outline-none cursor-not-allowed" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Product Item</label>
                        <select 
                          value={selectedChild.productItem || 'Premium Care Gold'} 
                          onChange={e => {
                            const selectedItem = e.target.value;
                            const groupName = getAssignedGmiProductGroup(selectedItem);
                            const { benefits, coverages } = resolveBenefitsAndCoverages(groupName);
                            setSelectedChild({
                              ...selectedChild,
                              productItem: selectedItem,
                              productTeam: resolveProductTeam(selectedItem),
                              productCategory: resolveProductCategory(selectedItem),
                              gmiProductGroup: groupName,
                              loadedBenefits: benefits,
                              loadedCoverages: coverages
                            });
                          }} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          {CONFIG_PRODUCT_NAMES.map(pName => (
                            <option key={pName} value={pName}>{pName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">GMI Product Group</label>
                        <input 
                          type="text" 
                          value={getAssignedGmiProductGroup(selectedChild.productItem || '')} 
                          disabled
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-500 font-bold focus:outline-none cursor-not-allowed" 
                        />
                      </div>

                      {/* Imported Benefits & Coverages from GMI Group */}
                      <div className="md:col-span-2 lg:col-span-3 mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                        <div className="bg-blue-50/40 border border-blue-150 rounded-lg p-3">
                          <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-2">Imported Benefits ({activeChildGmiResolution.benefits.length})</span>
                          {activeChildGmiResolution.benefits.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {activeChildGmiResolution.benefits.map((bName: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                                  <Check size={10} className="text-blue-500 shrink-0" />
                                  <span>{bName}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-[10px] italic">No benefits configured for this GMI group.</p>
                          )}
                        </div>
                        <div className="bg-emerald-50/40 border border-emerald-150 rounded-lg p-3">
                          <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-2">Imported Coverages ({activeChildGmiResolution.coverages.length})</span>
                          {activeChildGmiResolution.coverages.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {activeChildGmiResolution.coverages.map((cName: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                                  <Check size={10} className="text-emerald-500 shrink-0" />
                                  <span>{cName}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-[10px] italic">No coverages configured for this GMI group.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B – Premium */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                      <div className="p-1 bg-emerald-50 rounded text-emerald-600"><DollarSign size={14} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Section B – Premium</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Standard Premium</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold">$</span>
                          <input 
                            type="number" 
                            value={selectedChild.premium} 
                            onChange={e => {
                              const val = Number(e.target.value);
                              setSelectedChild({
                                ...selectedChild, 
                                premium: val,
                                standardPremium: val
                              });
                            }}
                            className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded text-xs bg-white font-mono font-bold text-gray-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Premium Frequency</label>
                        <select 
                          value={selectedChild.premiumFrequency || 'Annual'} 
                          onChange={e => setSelectedChild({...selectedChild, premiumFrequency: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Annual">Annual (Factor x1.0)</option>
                          <option value="Semi-Annual">Semi-Annual (Factor x2.0)</option>
                          <option value="Quarterly">Quarterly (Factor x4.0)</option>
                          <option value="Monthly">Monthly (Factor x12.0)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Total Premium (calculated)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold">$</span>
                          <input 
                            type="text" 
                            readOnly
                            value={Math.round(selectedChild.premium * (
                              selectedChild.premiumFrequency === 'Monthly' ? 12 : 
                              selectedChild.premiumFrequency === 'Quarterly' ? 4 : 
                              selectedChild.premiumFrequency === 'Semi-Annual' ? 2 : 1
                            )).toLocaleString()} 
                            className="w-full pl-6 pr-2 py-1.5 border border-gray-200 bg-gray-50 rounded text-xs font-mono font-black text-emerald-700 outline-none" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Currency</label>
                        <select 
                          value={selectedChild.currency || 'HKD'} 
                          onChange={e => setSelectedChild({...selectedChild, currency: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="HKD">HKD - Hong Kong Dollar</option>
                          <option value="USD">USD - United States Dollar</option>
                          <option value="MOP">MOP - Macau Pataca</option>
                          <option value="RMB">RMB - Chinese Renminbi</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section C – Finalization */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-amber-50 rounded text-amber-600"><ClipboardCheck size={14} /></div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Section C – Finalization</h3>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setSelectedChild({
                              ...selectedChild,
                              status: 'Finalized',
                              finalizedDate: today
                            });
                            // Log event
                            setAuditLogs(prev => [
                              {
                                id: `A${prev.length + 1}`,
                                action: 'Proposal Finalized',
                                user: editedOpportunity.salesRep1,
                                date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                                details: `Proposal successfully set to Finalized on ${today}.`
                              },
                              ...prev
                            ]);
                            alert(`Proposal ${selectedChild.id} has been marked as Finalized!`);
                          }}
                          disabled={selectedChild.status === 'Finalized'}
                          className={`px-4 py-1.5 rounded font-black text-xs transition-all flex items-center gap-1.5 shadow-sm border ${
                            selectedChild.status === 'Finalized' 
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                          }`}
                        >
                          <CheckCircle2 size={13} />
                          <span>Go to Finalized</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Proposal Status</label>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[10px] font-black rounded uppercase tracking-wider ${
                          selectedChild.status === 'Converted to Policy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          selectedChild.status === 'Finalized' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          selectedChild.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            selectedChild.status === 'Converted to Policy' ? 'bg-emerald-500' :
                            selectedChild.status === 'Finalized' ? 'bg-amber-500' :
                            selectedChild.status === 'Approved' ? 'bg-blue-500' : 'bg-gray-400'
                          }`} />
                          <span>{selectedChild.status}</span>
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Renew Required</label>
                        <select 
                          value={selectedChild.renewRequired || 'No'} 
                          onChange={e => setSelectedChild({...selectedChild, renewRequired: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="No">No Renewal Needed</option>
                          <option value="Yes">Yes (Standard)</option>
                          <option value="Optional">Optional / Review Later</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Benefit Type</label>
                        <select 
                          value={selectedChild.benefitType || 'Core Benefit'} 
                          onChange={e => setSelectedChild({...selectedChild, benefitType: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Core Benefit">Core Benefit Scheme</option>
                          <option value="Voluntary">Voluntary Cover</option>
                          <option value="Co-Share">Co-Share / Co-Pay Option</option>
                          <option value="Bespoke Rider">Bespoke Wellness Rider</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Finalized Date</label>
                        <input 
                          type="date" 
                          value={selectedChild.finalizedDate || ''} 
                          onChange={e => setSelectedChild({...selectedChild, finalizedDate: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section D – Policy Conversion */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-purple-50 rounded text-purple-600"><ShieldCheck size={14} /></div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Section D – Policy Conversion</h3>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const polNum = `POL-MEDIA-${Date.now().toString().slice(-5)}`;
                            const dnNum = `DN-${Date.now().toString().slice(-5)}`;
                            setSelectedChild({
                              ...selectedChild,
                              status: 'Converted to Policy',
                              policyId: polNum,
                              debitNoteNo: dnNum,
                              policyStatus: 'Active'
                            });
                            // Log event
                            setAuditLogs(prev => [
                              {
                                id: `A${prev.length + 1}`,
                                action: 'Converted to Policy',
                                user: editedOpportunity.salesRep1,
                                date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                                details: `Proposal successfully converted to Policy ${polNum} with Debit Note ${dnNum}.`
                              },
                              ...prev
                            ]);
                            alert(`Successfully converted proposal ${selectedChild.id} to Policy ${polNum}!`);
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded text-xs transition-all flex items-center gap-1.5 shadow-sm border border-blue-700"
                        >
                          <Zap size={13} />
                          <span>Convert to Policy</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Policy Number</label>
                        <input 
                          type="text" 
                          value={selectedChild.policyId || ''} 
                          onChange={e => setSelectedChild({...selectedChild, policyId: e.target.value})} 
                          placeholder="e.g. POL-MEDIA-78321"
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Debit Note No.</label>
                        <input 
                          type="text" 
                          value={selectedChild.debitNoteNo || ''} 
                          onChange={e => setSelectedChild({...selectedChild, debitNoteNo: e.target.value})} 
                          placeholder="e.g. DN-94811"
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Policy Status</label>
                        <select 
                          value={selectedChild.policyStatus || 'Draft'} 
                          onChange={e => setSelectedChild({...selectedChild, policyStatus: e.target.value})} 
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-gray-800 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="Draft">Draft Policy</option>
                          <option value="Active">Active / In-Force</option>
                          <option value="Pending Payment">Pending Payment</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Lapsed">Lapsed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section E – Proposal History */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                      <div className="p-1 bg-gray-50 rounded text-gray-600"><Clock size={14} /></div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Section E – Proposal History</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-[11px] text-gray-700 bg-gray-50/50 p-4 rounded-lg border border-gray-200">
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block font-sans">Version</span>
                        <span className="font-bold text-gray-900">{selectedChild.version}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block font-sans">Created Date</span>
                        <span>{selectedChild.createdDate || '2026-03-25'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block font-sans">Created By</span>
                        <span className="font-bold text-blue-700 font-sans">{selectedChild.createdBy || 'Alice Wong'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block font-sans">Last Updated</span>
                        <span>{selectedChild.lastUpdated}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block font-sans">Current Status</span>
                        <span className="font-bold text-orange-600 font-sans uppercase tracking-widest">{selectedChild.status}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block font-sans">Linked Policy</span>
                        <span className="font-bold text-emerald-700">{selectedChild.policyId || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Documents */}
              {activeWorkspaceTab === 'documents' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2 font-sans">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Underwriting & Proposal Documents</h3>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold uppercase tracking-wider">Document Manager</span>
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
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Active Document Archives</h4>
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
                        <p className="text-gray-400 text-[10px] mt-1.5">Based on Product Item: <span className="font-bold text-gray-700">{selectedChild.productItem || 'Premium Care Gold'}</span></p>
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
                            <th className="px-3 py-2 border-r border-gray-150 w-44">Benefit Class Category</th>
                            <th className="px-3 py-2 border-r border-gray-150 w-52">Specific Benefit Item</th>
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
                      <div className="font-sans">
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Renewal History Timeline</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">Track historical proposal iterations and policy relationships.</p>
                      </div>
                      <div>
                        {/* Renew Proposal Button is visible if already finalized or converted to policy */}
                        {(selectedChild.status === 'Finalized' || selectedChild.status === 'Converted to Policy' || selectedChild.policyId) ? (
                          <button
                            onClick={() => handleRenewProposal(selectedChild)}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded text-xs transition-all flex items-center gap-1.5 shadow-sm border border-purple-700 font-sans"
                          >
                            <RefreshCw size={13} />
                            <span>Renew Proposal</span>
                          </button>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-sans italic p-1 border border-dashed border-gray-200 rounded">
                            Finalize or Convert Proposal first to unlock Renew button.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase border-b border-gray-150 font-sans">
                          <tr>
                            <th className="px-4 py-2.5">Proposal Version</th>
                            <th className="px-4 py-2.5">Renewed From</th>
                            <th className="px-4 py-2.5">Renew Date</th>
                            <th className="px-4 py-2.5">Policy Status</th>
                            <th className="px-4 py-2.5">Created By</th>
                            <th className="px-4 py-2.5 text-right font-sans">Action</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono">
                          {childProposals.map(p => (
                            <tr key={p.id} className={`border-b border-gray-150 hover:bg-gray-50/50 transition-colors ${p.id === selectedChild.id ? 'bg-orange-50/10 font-bold' : ''}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-blue-600 font-bold">{p.id} ({p.version})</span>
                                  {p.id === selectedChild.id && (
                                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 font-sans text-[9px] font-black rounded uppercase">Current Active</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{p.renewedFrom || 'Initial'}</td>
                              <td className="px-4 py-3 text-gray-400">{p.renewDate || p.createdDate || '2026-03-25'}</td>
                              <td className="px-4 py-3 font-sans">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                  p.status === 'Converted to Policy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  p.status === 'Finalized' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  <span>{p.policyStatus || p.status}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 font-sans font-medium">{p.createdBy}</td>
                              <td className="px-4 py-3 text-right font-sans">
                                <button
                                  onClick={() => setSelectedChild(p)}
                                  className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-700 transition-colors"
                                >
                                  Switch Workspace
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
            </div>
          </div>
        </div>
      )}

      {/* Lightweight Generate Proposal Dialog */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-150 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Generate New Proposal</h3>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Content Form */}
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="bg-blue-50 border border-blue-150 rounded-lg p-3 text-blue-700 space-y-1">
                <span className="font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={12} />
                  Automatic Inheritance
                </span>
                <p className="text-[11px] leading-relaxed">
                  This proposal inherits all related product configuration, including the assigned <strong>{getAssignedGmiProductGroup(editedOpportunity.productItem)}</strong> product group hierarchy from the selected Product Item (<strong>{editedOpportunity.productItem}</strong>).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Proposal Name</label>
                <input 
                  type="text"
                  value={newProposalName}
                  onChange={e => setNewProposalName(e.target.value)}
                  placeholder="Enter custom option name..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-semibold text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Proposal Location Type</label>
                <select 
                  value={newProposalLocationType}
                  onChange={e => setNewProposalLocationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-semibold text-gray-800 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="Hong Kong">Hong Kong (HQ)</option>
                  <option value="Macau">Macau Branch</option>
                  <option value="Mainland China">Mainland China</option>
                  <option value="Overseas">Overseas Regional</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-150 px-5 py-3.5 flex justify-end gap-2">
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="px-3.5 py-1.5 border border-gray-200 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProposal}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-black transition-colors shadow-sm"
              >
                Create Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalDetail;
