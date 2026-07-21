import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Folder, 
  Users2, 
  Save, 
  MoreVertical, 
  Clock, 
  Archive, 
  Copy, 
  ChevronLeft, 
  Layers, 
  Globe, 
  Tag, 
  Heart,
  Pencil,
  Settings,
  AlertTriangle
} from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================
export interface FieldConfig {
  name: string;
  visible: boolean;
  required: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  team: string; // references Product Team (CRUD-able list)
  group: string; // references Product Category (CRUD-able list)
  gmiProductGroup: string; // references GMI Product Group (Lookup)
  appliedCompanyType: 'Company' | 'Individual'; // Radio Button (single-select, required)
  isInsuranceProduct?: 'Yes' | 'No'; // Conditional: shown/required only when appliedCompanyType === 'Individual'
  salesCreditRule: string; // Formula dropdown
  vendorFields: FieldConfig[];
  premiumFields: FieldConfig[];
  dateTransferFields: FieldConfig[];
  status?: 'Active' | 'Archived';
}

export interface ProductAuditRecord {
  id: string;
  eventType: string;
  changedField: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedOn: string;
  productName: string;
}

export interface GmiProductGroup {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  detailedProducts: DetailedProduct[];
  createdOn: string;
}

export interface BenefitItem {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  createdOn: string;
}

export interface CoverageItem {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  createdOn: string;
}

export interface DetailedProduct {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  benefits: string[]; // Benefit IDs
  coverages: string[]; // Coverage IDs
  createdOn: string;
}

// ==========================================
// INITIAL SEED DATA
// ==========================================
const INITIAL_TEAMS = [
  'EB (GMED / GL / Tender)',
  'GI (GPA / GBT)',
  'PIES',
  'LSP Projects',
  'Wellness',
  'Others'
];

const INITIAL_GROUPS = [
  'Pension',
  'Employee Benefit & General Insurance',
  'Project',
  'Wellness',
  'MPF',
  'Tax Deductible',
  'iFast',
  'HKMC',
  'Individual - PA',
  'Individual - TVC',
  'Individual - QDAP',
  'Individual - Individual Medical / VHIS',
  'Individual - Mutual Fund',
  'Individual - Others',
  'Individual - Annuity',
  'Individual - Asset Management Documentation'
];

const INITIAL_VENDOR_FIELDS = [
  'Existing Scheme 1',
  'Existing Scheme 2',
  'Existing Scheme 3',
  'Existing Scheme 4',
  'Existing Scheme 5',
  'Proposed Service Provider',
  'New Scheme',
  'Member First Name',
  'Member Last Name',
  'Existing Insurer',
  'Proposed Insurer'
];

const INITIAL_PREMIUM_FIELDS = [
  'No. of Employee / Insured',
  'Current Annual Contribution',
  'Current Net Asset Value',
  'Employer Option',
  'Est Conversion Rate - Contribution (%)',
  'Est Conversion Rate - Asset Transfer (%)',
  'Est Annual Contribution',
  'Est ATO',
  'Project Fee',
  'Lump Sum Amount',
  'Transfer Amount',
  'RSP Annualised Amount',
  'Transaction Amount',
  'Commission Amount',
  'Est Premium',
  'Est Commission Rate',
  'Est Commission Amount'
];

const INITIAL_DATE_TRANSFER_FIELDS = [
  'No. of Briefing Sessions',
  'Member Briefing Speaker',
  'Total Briefing Attendees',
  'No. of Employee Transfer Est by ES',
  'Actual No. of Employee Transfer',
  'Form Received Date',
  'Application Date',
  'Date to Provider / Insurer',
  'Date to Client',
  'eMPF Submission Ref. No.'
];

const INITIAL_GMI_GROUPS_MASTER: GmiProductGroup[] = [
  { id: 'GMI-GRP-001', name: 'CONTRACTOR ALL RISK INSURANCE( CAR )', status: 'Active', createdOn: '2026-06-25 10:00', detailedProducts: [
    { id: 'DP-001-01', name: 'CONTRACTOR ALL RISKS', status: 'Active', benefits: ['BEN-014', 'BEN-016'], coverages: ['COV-001', 'COV-003'], createdOn: '2026-06-25 10:00' },
    { id: 'DP-001-02', name: 'SURETY BOND', status: 'Active', benefits: ['BEN-016'], coverages: ['COV-001'], createdOn: '2026-06-25 10:01' },
  ]},
  { id: 'GMI-GRP-002', name: 'EMPLOYEE BENEFIT PROGRAM( EBP )', status: 'Active', createdOn: '2026-06-25 10:05', detailedProducts: [
    { id: 'DP-002-01', name: 'EB - Group Medical', status: 'Active', benefits: ['BEN-001', 'BEN-002', 'BEN-014'], coverages: ['COV-002', 'COV-003'], createdOn: '2026-06-25 10:05' },
    { id: 'DP-002-02', name: 'EB - Group Life', status: 'Active', benefits: ['BEN-001', 'BEN-003', 'BEN-015'], coverages: ['COV-003'], createdOn: '2026-06-25 10:06' },
    { id: 'DP-002-03', name: 'EB - Highend Medical', status: 'Active', benefits: ['BEN-014', 'BEN-017'], coverages: ['COV-002'], createdOn: '2026-06-25 10:07' },
  ]},
  { id: 'GMI-GRP-003', name: 'EMPLOYEE COMPENSATION( EC )', status: 'Active', createdOn: '2026-06-25 10:10', detailedProducts: [
    { id: 'DP-003-01', name: 'GI - Statutory (Employee Compensation)', status: 'Active', benefits: ['BEN-016'], coverages: ['COV-003'], createdOn: '2026-06-25 10:10' },
  ]},
  { id: 'GMI-GRP-004', name: 'HEALTH MAINTENANCE PROGRAM( HMP )', status: 'Active', createdOn: '2026-06-25 10:15', detailedProducts: [
    { id: 'DP-004-01', name: 'Health Maintenance - Dental', status: 'Active', benefits: ['BEN-017'], coverages: ['COV-002'], createdOn: '2026-06-25 10:15' },
    { id: 'DP-004-02', name: 'Health Maintenance - Checkup / Pre-employment Checkup', status: 'Active', benefits: ['BEN-017'], coverages: ['COV-002'], createdOn: '2026-06-25 10:16' },
  ]},
  { id: 'GMI-GRP-005', name: 'LIABILITY INSURANCE( LIA )', status: 'Active', createdOn: '2026-06-25 10:20', detailedProducts: [
    { id: 'DP-005-01', name: 'GI - Liability Insurance', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001', 'COV-003'], createdOn: '2026-06-25 10:20' },
    { id: 'DP-005-02', name: 'GI - Contractor All Risk Insurance', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'], createdOn: '2026-06-25 10:21' },
  ]},
  { id: 'GMI-GRP-006', name: 'MARINE INSURANCE( MAR )', status: 'Active', createdOn: '2026-06-25 10:25', detailedProducts: [
    { id: 'DP-006-01', name: 'GI - Marine Insurance', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'], createdOn: '2026-06-25 10:25' },
  ]},
  { id: 'GMI-GRP-007', name: 'MOTOR INSURANCE( MOTOR )', status: 'Active', createdOn: '2026-06-25 10:30', detailedProducts: [
    { id: 'DP-007-01', name: 'GI - Motor Vehicle Comprehensive', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'], createdOn: '2026-06-25 10:30' },
    { id: 'DP-007-02', name: 'GI - Motor Vehicle Third Party', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'], createdOn: '2026-06-25 10:31' },
  ]},
  { id: 'GMI-GRP-008', name: 'PROPERTY & CASUALTY INSURANCE( P&C )', status: 'Active', createdOn: '2026-06-25 10:35', detailedProducts: [
    { id: 'DP-008-01', name: 'GI - Property and Casualty Insurance', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'], createdOn: '2026-06-25 10:35' },
    { id: 'DP-008-02', name: 'GI - Fire', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-001'], createdOn: '2026-06-25 10:36' },
  ]},
  { id: 'GMI-GRP-009', name: 'PERSONAL LINE INSURANCE( PER )', status: 'Active', createdOn: '2026-06-25 10:40', detailedProducts: [
    { id: 'DP-009-01', name: 'GI - Individual Medical', status: 'Active', benefits: ['BEN-001', 'BEN-002'], coverages: ['COV-002'], createdOn: '2026-06-25 10:40' },
    { id: 'DP-009-02', name: 'GI - Individual Personal Accident', status: 'Active', benefits: ['BEN-002', 'BEN-007'], coverages: ['COV-001'], createdOn: '2026-06-25 10:41' },
    { id: 'DP-009-03', name: 'GI - Critical Illness', status: 'Active', benefits: ['BEN-007'], coverages: ['COV-001'], createdOn: '2026-06-25 10:42' },
  ]},
  { id: 'GMI-GRP-010', name: 'CONSULTANCY FEE( PFP )', status: 'Active', createdOn: '2026-06-25 10:45', detailedProducts: [
    { id: 'DP-010-01', name: 'Project - LSP/SP', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-003'], createdOn: '2026-06-25 10:45' },
    { id: 'DP-010-02', name: 'Project - Pension Tender', status: 'Active', benefits: ['BEN-006'], coverages: ['COV-003'], createdOn: '2026-06-25 10:46' },
  ]},
  { id: 'GMI-GRP-011', name: 'TRAVEL INSURANCE( TRA )', status: 'Active', createdOn: '2026-06-25 10:50', detailedProducts: [
    { id: 'DP-011-01', name: 'GI - Individual Annual Travel', status: 'Active', benefits: ['BEN-005', 'BEN-010', 'BEN-013'], coverages: ['COV-002'], createdOn: '2026-06-25 10:50' },
    { id: 'DP-011-02', name: 'GI - Individual Single Travel', status: 'Active', benefits: ['BEN-005', 'BEN-011'], coverages: ['COV-002'], createdOn: '2026-06-25 10:51' },
  ]},
  { id: 'GMI-GRP-012', name: 'INDIVIDUAL SAVING( IS )', status: 'Active', createdOn: '2026-06-25 10:55', detailedProducts: [
    { id: 'DP-012-01', name: 'MPF - Personal Account (PAC)', status: 'Active', benefits: ['BEN-001', 'BEN-006'], coverages: ['COV-001'], createdOn: '2026-06-25 10:55' },
    { id: 'DP-012-02', name: 'Life - QDAP', status: 'Active', benefits: ['BEN-001'], coverages: ['COV-001'], createdOn: '2026-06-25 10:56' },
    { id: 'DP-012-03', name: 'Life - VHIS', status: 'Active', benefits: ['BEN-001', 'BEN-002'], coverages: ['COV-002'], createdOn: '2026-06-25 10:57' },
  ]},
];

const INITIAL_BENEFITS_MASTER: BenefitItem[] = [
  { id: 'BEN-001', name: 'LIFE INSURANCE', status: 'Active', createdOn: '2026-06-25 10:00' },
  { id: 'BEN-002', name: 'ACCIDENTAL DEATH AND DISMEMBERMENT (AD&D)', status: 'Active', createdOn: '2026-06-25 10:01' },
  { id: 'BEN-003', name: 'TOTAL AND PERMANENT DISABILITY (TPD) INSURANCE', status: 'Active', createdOn: '2026-06-25 10:02' },
  { id: 'BEN-004', name: 'GROUP PERSONAL ACCIDENT', status: 'Active', createdOn: '2026-06-25 10:03' },
  { id: 'BEN-005', name: 'GROUP BUSINESS TRAVEL INSURANCE', status: 'Active', createdOn: '2026-06-25 10:04' },
  { id: 'BEN-006', name: 'Other Special Items', status: 'Active', createdOn: '2026-06-25 10:05' },
  { id: 'BEN-007', name: 'CRITICAL ILLNESS (CI)', status: 'Active', createdOn: '2026-06-25 10:06' },
  { id: 'BEN-008', name: 'LONG TERM DISABILITY INCOME', status: 'Active', createdOn: '2026-06-25 10:07' },
  { id: 'BEN-009', name: 'GROUP DISABILITY INCOME', status: 'Active', createdOn: '2026-06-25 10:08' },
  { id: 'BEN-010', name: 'SOS PROGRAM', status: 'Active', createdOn: '2026-06-25 10:09' },
  { id: 'BEN-011', name: 'ACCIDENTAL EMERGENCY MEDICAL', status: 'Active', createdOn: '2026-06-25 10:10' },
  { id: 'BEN-012', name: 'GROUP PLUS', status: 'Active', createdOn: '2026-06-25 10:11' },
  { id: 'BEN-013', name: 'ACCIDENTAL MEDICAL EXPENSES', status: 'Active', createdOn: '2026-06-25 10:12' },
  { id: 'BEN-014', name: 'Group Medical', status: 'Active', createdOn: '2026-06-25 10:13' },
  { id: 'BEN-015', name: 'Risk Protection', status: 'Active', createdOn: '2026-06-25 10:14' },
  { id: 'BEN-016', name: 'Statutory', status: 'Active', createdOn: '2026-06-25 10:15' },
  { id: 'BEN-017', name: 'Group Health Maintenance', status: 'Active', createdOn: '2026-06-25 10:16' }
];

const INITIAL_COVERAGES_MASTER: CoverageItem[] = [
  { id: 'COV-001', name: 'Amount of Fixed Benefits', status: 'Active', createdOn: '2026-06-25 10:00' },
  { id: 'COV-002', name: 'Medical Expenses', status: 'Active', createdOn: '2026-06-25 10:01' },
  { id: 'COV-003', name: 'Number of Covered Employees', status: 'Active', createdOn: '2026-06-25 10:02' }
];

const INITIAL_PRODUCT_NAMES = [
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

const resolveGmiProductGroup = (name: string): string => {
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

const INITIAL_PRODUCTS: ProductItem[] = INITIAL_PRODUCT_NAMES.map((name, index) => {
  const team = resolveProductTeam(name);
  const category = resolveProductCategory(name);
  const gmiGroup = resolveGmiProductGroup(name);
  return {
    id: `PROD-${String(index + 1).padStart(3, '0')}`,
    name,
    team,
    group: category,
    gmiProductGroup: gmiGroup,
    appliedCompanyType: index % 2 === 0 ? 'Company' : 'Individual',
    salesCreditRule: `Formula ${1 + (index % 6)}`,
    vendorFields: INITIAL_VENDOR_FIELDS.map((f, i) => ({
      name: f,
      visible: i < 3 || f === 'Proposed Service Provider' || f === 'Proposed Insurer',
      required: f === 'Proposed Service Provider' || f === 'Proposed Insurer'
    })),
    premiumFields: INITIAL_PREMIUM_FIELDS.map((f, i) => ({
      name: f,
      visible: i < 5,
      required: i === 0
    })),
    dateTransferFields: INITIAL_DATE_TRANSFER_FIELDS.map((f, i) => ({
      name: f,
      visible: i < 4,
      required: false
    }))
  };
});

export const ProductsConfiguration: React.FC = () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [productTeams, setProductTeams] = useState<string[]>(() => {
    const saved = localStorage.getItem('pr2_product_teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });

  const [productGroups, setProductGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('pr2_product_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  // Master Data States for GMI perspective (Benefit Groups Tab)
  const [gmiGroupsMaster, setGmiGroupsMaster] = useState<GmiProductGroup[]>(() => {
    const saved = localStorage.getItem('pr2_gmi_groups_master');
    return saved ? JSON.parse(saved) : INITIAL_GMI_GROUPS_MASTER;
  });

  const [benefitsMaster, setBenefitsMaster] = useState<BenefitItem[]>(() => {
    const saved = localStorage.getItem('pr2_benefits_master');
    return saved ? JSON.parse(saved) : INITIAL_BENEFITS_MASTER;
  });

  const [coveragesMaster, setCoveragesMaster] = useState<CoverageItem[]>(() => {
    const saved = localStorage.getItem('pr2_coverages_master');
    return saved ? JSON.parse(saved) : INITIAL_COVERAGES_MASTER;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('pr2_products_list');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [productAudits, setProductAudits] = useState<ProductAuditRecord[]>(() => {
    const saved = localStorage.getItem('pr2_product_audits');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'AUD-P001', eventType: 'Configuration Change', changedField: 'Product Item Name', oldValue: 'Demo Pension Choice', newValue: 'Demo Pension Choice Premium', changedBy: 'Admin User', changedOn: '2026-06-25 10:15', productName: 'Demo Pension Choice Premium' },
      { id: 'AUD-P002', eventType: 'Status Update', changedField: 'Applied Customer Type', oldValue: 'Individual', newValue: 'Company', changedBy: 'Admin User', changedOn: '2026-06-25 11:30', productName: 'Demo Pension Choice Premium' },
      { id: 'AUD-P003', eventType: 'Field Visibility Update', changedField: 'Proposed Insurer Required', oldValue: 'False', newValue: 'True', changedBy: 'Admin User', changedOn: '2026-06-25 14:00', productName: 'Demo Pension Choice Premium' }
    ];
  });

  // Sidebar / Navigation and View States (Consolidated to Product Items and Benefit Groups)
  const [activeTab, setActiveTab] = useState<'items' | 'benefitGroups'>('items');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [companyTypeFilter, setCompanyTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [refSearchQuery, setRefSearchQuery] = useState('');

  // Selected Detail States
  const [selectedProductId, setSelectedProductId] = useState<string>('PROD-001');
  
  // Inline Popups for Product Team CRUD inside Product Item Detail
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [teamPopupMode, setTeamPopupMode] = useState<'create' | 'edit'>('create');
  const [teamPopupInput, setTeamPopupInput] = useState('');

  // Inline Popups for Product Category CRUD inside Product Item Detail
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [categoryPopupMode, setCategoryPopupMode] = useState<'create' | 'edit'>('create');
  const [categoryPopupInput, setCategoryPopupInput] = useState('');

  // Master Data States for Benefit Groups tab (GMI Workspace)
  const [selectedGmiGroupId, setSelectedGmiGroupId] = useState<string>('GMI-GRP-001');
  const [selectedDetailedProductId, setSelectedDetailedProductId] = useState<string>('DP-001-01');
  const [editingDetailedProductId, setEditingDetailedProductId] = useState<string | null>(null);
  const [editingDetailedProductName, setEditingDetailedProductName] = useState('');
  const [gmiSearchQuery, setGmiSearchQuery] = useState('');
  
  // Modal / Add states for Benefit Groups
  const [showAddBenefitModal, setShowAddBenefitModal] = useState(false);
  const [addBenefitMode, setAddBenefitMode] = useState<'create' | 'link'>('create');
  const [newBenefitName, setNewBenefitName] = useState('');
  const [selectedExistingBenefitId, setSelectedExistingBenefitId] = useState('');

  const [showAddCoverageModal, setShowAddCoverageModal] = useState(false);
  const [addCoverageMode, setAddCoverageMode] = useState<'create' | 'link'>('create');
  const [newCoverageName, setNewCoverageName] = useState('');
  const [selectedExistingCoverageId, setSelectedExistingCoverageId] = useState('');

  // Editing states for Related Benefits and Coverages
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);
  const [editingBenefitName, setEditingBenefitName] = useState('');
  
  const [editingCoverageId, setEditingCoverageId] = useState<string | null>(null);
  const [editingCoverageName, setEditingCoverageName] = useState('');

  // Sync detail fields when active product changes (GMI Product Group too)
  const [detailGmiProductGroup, setDetailGmiProductGroup] = useState('Pension');

  // Dynamic Product Form Fields State
  const [detailName, setDetailName] = useState('');
  const [detailTeam, setDetailTeam] = useState('');
  const [detailGroup, setDetailGroup] = useState('');
  const [detailCompanyType, setDetailCompanyType] = useState<'Company' | 'Individual'>('Company');
  const [detailIsInsuranceProduct, setDetailIsInsuranceProduct] = useState<'Yes' | 'No' | ''>('');
  const [detailSalesCreditRule, setDetailSalesCreditRule] = useState('');
  const [detailVendorFields, setDetailVendorFields] = useState<FieldConfig[]>([]);
  const [detailPremiumFields, setDetailPremiumFields] = useState<FieldConfig[]>([]);
  const [detailDateTransferFields, setDetailDateTransferFields] = useState<FieldConfig[]>([]);
  const [detailStatus, setDetailStatus] = useState<'Active' | 'Archived'>('Active');

  // Inline save errors
  const [saveErrors, setSaveErrors] = useState<{ name?: string; team?: string; group?: string; gmiProductGroup?: string; salesCreditRule?: string; isInsuranceProduct?: string }>({});

  // Modal / Toast
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTargetProductName, setAuditTargetProductName] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('pr2_product_teams', JSON.stringify(productTeams)); }, [productTeams]);
  useEffect(() => { localStorage.setItem('pr2_product_groups', JSON.stringify(productGroups)); }, [productGroups]);
  useEffect(() => { localStorage.setItem('pr2_products_list', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('pr2_product_audits', JSON.stringify(productAudits)); }, [productAudits]);

  // One-time data migration/reset to ensure we load the real enterprise product configuration immediately on mount.
  useEffect(() => {
    const currentVersion = localStorage.getItem('pr2_data_version_v3');
    if (currentVersion !== 'v3') {
      localStorage.setItem('pr2_product_teams', JSON.stringify(INITIAL_TEAMS));
      localStorage.setItem('pr2_product_groups', JSON.stringify(INITIAL_GROUPS));
      localStorage.setItem('pr2_gmi_groups_master', JSON.stringify(INITIAL_GMI_GROUPS_MASTER));
      localStorage.setItem('pr2_benefits_master', JSON.stringify(INITIAL_BENEFITS_MASTER));
      localStorage.setItem('pr2_coverages_master', JSON.stringify(INITIAL_COVERAGES_MASTER));
      localStorage.setItem('pr2_products_list', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('pr2_data_version_v3', 'v3');

      // Update state
      setProductTeams(INITIAL_TEAMS);
      setProductGroups(INITIAL_GROUPS);
      setGmiGroupsMaster(INITIAL_GMI_GROUPS_MASTER);
      setBenefitsMaster(INITIAL_BENEFITS_MASTER);
      setCoveragesMaster(INITIAL_COVERAGES_MASTER);
      setProducts(INITIAL_PRODUCTS);
    }
  }, []);

  // Toast self-cleanup
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Active selected item
  const selectedProduct = useMemo(() => {
    if (isCreatingNew) return undefined;
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId, isCreatingNew]);

  // Sync detail fields when active product changes
  useEffect(() => {
    if (selectedProduct) {
      setDetailName(selectedProduct.name);
      setDetailTeam(selectedProduct.team);
      setDetailGroup(selectedProduct.group);
      setDetailGmiProductGroup(selectedProduct.gmiProductGroup || 'Pension');
      setDetailCompanyType(selectedProduct.appliedCompanyType || 'Company');
      setDetailIsInsuranceProduct(selectedProduct.isInsuranceProduct || '');
      setDetailSalesCreditRule(selectedProduct.salesCreditRule || 'Formula 1');
      setDetailVendorFields(selectedProduct.vendorFields || []);
      setDetailPremiumFields(selectedProduct.premiumFields || []);
      setDetailDateTransferFields(selectedProduct.dateTransferFields || []);
      setDetailStatus(selectedProduct.status || 'Active');
    }
  }, [selectedProduct]);

  // Save changes to localStorage on master modifications
  useEffect(() => { localStorage.setItem('pr2_gmi_groups_master', JSON.stringify(gmiGroupsMaster)); }, [gmiGroupsMaster]);
  useEffect(() => { localStorage.setItem('pr2_benefits_master', JSON.stringify(benefitsMaster)); }, [benefitsMaster]);
  useEffect(() => { localStorage.setItem('pr2_coverages_master', JSON.stringify(coveragesMaster)); }, [coveragesMaster]);

  // Normalization hook for existing stored products
  useEffect(() => {
    let updated = false;
    const next = products.map(p => {
      if (!p.gmiProductGroup) {
        updated = true;
        let fallback = 'Pension';
        if (p.group === 'Pension') fallback = 'Pension';
        else if (p.group === 'Employee Benefit & General Insurance') fallback = 'General Insurance';
        else if (p.group === 'iFast') fallback = 'Wealth Management';
        else if (p.group === 'Project') fallback = 'Corporate LSP';
        return { ...p, gmiProductGroup: fallback };
      }
      return p;
    });
    if (updated) {
      setProducts(next);
      localStorage.setItem('pr2_products_list', JSON.stringify(next));
    }
  }, [products]);

  // Active Selected GMI Product Group Item
  const selectedGmiGroup = useMemo(() => {
    return gmiGroupsMaster.find(g => g.id === selectedGmiGroupId) || gmiGroupsMaster[0];
  }, [gmiGroupsMaster, selectedGmiGroupId]);

  // Auto-select first detailed product when GMI group changes
  useEffect(() => {
    const grp = gmiGroupsMaster.find(g => g.id === selectedGmiGroupId);
    if (grp && grp.detailedProducts && grp.detailedProducts.length > 0) {
      setSelectedDetailedProductId(grp.detailedProducts[0].id);
    }
  }, [selectedGmiGroupId, gmiGroupsMaster]);

  // Active Selected Detailed Product
  const selectedDetailedProduct = useMemo(() => {
    if (!selectedGmiGroup) return null;
    return selectedGmiGroup.detailedProducts?.find(dp => dp.id === selectedDetailedProductId)
      || selectedGmiGroup.detailedProducts?.[0]
      || null;
  }, [selectedGmiGroup, selectedDetailedProductId]);

  // ==========================================
  // HELPERS
  // ==========================================
  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'benefitGroups': return 'Benefit Groups (GMI)';
      default: return 'Product Items';
    }
  };

  const getSystemDatetimeString = () => {
    const d = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = groupFilter === 'All' || p.group === groupFilter;
      const matchesTeam = teamFilter === 'All' || p.team === teamFilter;
      const matchesCompanyType = companyTypeFilter === 'All' || p.appliedCompanyType === companyTypeFilter;
      const matchesStatus = statusFilter === 'Archived' 
        ? p.status === 'Archived' 
        : (p.status || 'Active') === 'Active';
      return matchesSearch && matchesGroup && matchesTeam && matchesCompanyType && matchesStatus;
    });
  }, [products, searchQuery, groupFilter, teamFilter, companyTypeFilter, statusFilter]);

  const filteredProductAudits = useMemo(() => {
    if (!auditTargetProductName) return productAudits;
    return productAudits.filter(a => a.productName === auditTargetProductName);
  }, [productAudits, auditTargetProductName]);

  // ==========================================
  // ACTIONS
  // ==========================================
  const handleCreateProductItem = () => {
    setIsCreatingNew(true);
    setDetailName('');
    setDetailTeam('');
    setDetailGroup('');
    setDetailGmiProductGroup('');
    setDetailCompanyType('Company');
    setDetailIsInsuranceProduct('');
    setDetailSalesCreditRule('');
    setDetailVendorFields(INITIAL_VENDOR_FIELDS.map(name => ({
      name,
      visible: name === 'Proposed Service Provider' || name === 'Proposed Insurer',
      required: name === 'Proposed Service Provider' || name === 'Proposed Insurer'
    })));
    setDetailPremiumFields(INITIAL_PREMIUM_FIELDS.map(name => ({
      name,
      visible: false,
      required: false
    })));
    setDetailDateTransferFields(INITIAL_DATE_TRANSFER_FIELDS.map(name => ({
      name,
      visible: false,
      required: false
    })));
    setDetailStatus('Active');
    setSaveErrors({});
    setViewMode('detail');
  };

  const handleDuplicateProduct = (p: ProductItem) => {
    const nextNum = products.length > 0 ? Math.max(...products.map(prod => parseInt(prod.id.split('-')[1]) || 0)) + 1 : 1;
    const newId = `PROD-${String(nextNum).padStart(3, '0')}`;
    
    let newName = `${p.name} (Copy)`;
    let counter = 1;
    while (products.some(prod => prod.name.toLowerCase() === newName.toLowerCase())) {
      counter++;
      newName = `${p.name} (Copy ${counter})`;
    }

    const duplicatedProduct: ProductItem = {
      ...JSON.parse(JSON.stringify(p)),
      id: newId,
      name: newName,
      gmiProductGroup: p.gmiProductGroup || gmiGroupsMaster.find(g => g.status === 'Active')?.name || 'Pension'
    };

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-P-${Date.now()}`,
      eventType: 'Product Duplication',
      changedField: 'All Fields',
      oldValue: `${p.name} (${p.id})`,
      newValue: `${newName} (${newId})`,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: newName
    }, ...prev]);

    setProducts(prev => [...prev, duplicatedProduct]);
    setSelectedProductId(newId);
    setViewMode('detail');
    setToast(`Duplicated product "${p.name}" as "${newName}".`);
  };

  const handleDeleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (products.length <= 1) {
      alert("At least one product item must exist.");
      return;
    }
    if (confirm("Are you sure you want to delete this product item configuration?")) {
      const productToDelete = products.find(p => p.id === id);
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);

      const timestamp = getSystemDatetimeString();
      if (productToDelete) {
        setProductAudits(prev => [{
          id: `AUD-P-${Date.now()}`,
          eventType: 'Product Deletion',
          changedField: 'All Fields',
          oldValue: `${productToDelete.name} (${productToDelete.id})`,
          newValue: 'Deleted from Catalog',
          changedBy: 'System Admin',
          changedOn: timestamp,
          productName: productToDelete.name
        }, ...prev]);
      }

      if (selectedProductId === id) {
        setSelectedProductId(updated[0].id);
      }
      setViewMode('list');
      setToast("Product configuration successfully deleted.");
    }
  };

  const handleSaveAllSettings = () => {
    const errors: { name?: string; team?: string; group?: string; gmiProductGroup?: string; salesCreditRule?: string; isInsuranceProduct?: string } = {};
    if (!detailName.trim()) {
      errors.name = 'Product Item is required.';
    } else {
      const nameIsDuplicate = products.some(p => (isCreatingNew || p.id !== selectedProductId) && p.name.trim().toLowerCase() === detailName.trim().toLowerCase());
      if (nameIsDuplicate) errors.name = `"${detailName.trim()}" is already in use. Please specify a unique name.`;
    }
    if (!detailTeam) errors.team = 'Product Team is required.';
    if (!detailGroup) errors.group = 'Product Category is required.';
    if (!detailGmiProductGroup) errors.gmiProductGroup = 'GMI Product Group is required.';
    if (!detailSalesCreditRule) errors.salesCreditRule = 'Sales Credit Calculation Rule is required.';
    if (detailCompanyType === 'Individual' && !detailIsInsuranceProduct) errors.isInsuranceProduct = 'Is Insurance Product is required.';
    if (Object.keys(errors).length > 0) {
      setSaveErrors(errors);
      return;
    }
    setSaveErrors({});

    if (isCreatingNew) {
      const nextNum = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id.split('-')[1]) || 0)) + 1 : 1;
      const newId = `PROD-${String(nextNum).padStart(3, '0')}`;
      const newName = detailName.trim();

      const newProduct: ProductItem = {
        id: newId,
        name: newName,
        team: detailTeam,
        group: detailGroup,
        gmiProductGroup: detailGmiProductGroup,
        appliedCompanyType: detailCompanyType,
        isInsuranceProduct: detailIsInsuranceProduct || undefined,
        salesCreditRule: detailSalesCreditRule,
        vendorFields: detailVendorFields,
        premiumFields: detailPremiumFields,
        dateTransferFields: detailDateTransferFields,
        status: detailStatus
      };

      const timestamp = getSystemDatetimeString();
      setProductAudits(prev => [{
        id: `AUD-P-${Date.now()}`,
        eventType: 'Product Creation',
        changedField: 'All Fields',
        oldValue: 'None',
        newValue: `${newName} (${newId})`,
        changedBy: 'System Admin',
        changedOn: timestamp,
        productName: newName
      }, ...prev]);

      setProducts(prev => [...prev, newProduct]);
      setIsCreatingNew(false);
      setSelectedProductId(newId);
      setViewMode('list');
      setToast(`Product item "${newName}" registered.`);
      return;
    }

    if (!selectedProduct) return;

    const timestamp = getSystemDatetimeString();
    const newAuditsList: ProductAuditRecord[] = [];

    if (selectedProduct.name !== detailName.trim()) {
      newAuditsList.push({
        id: `AUD-P-${Date.now()}-1`,
        eventType: 'Configuration Change',
        changedField: 'Product Item Name',
        oldValue: selectedProduct.name,
        newValue: detailName.trim(),
        changedBy: 'System Admin',
        changedOn: timestamp,
        productName: detailName.trim()
      });
    }

    if (selectedProduct.team !== detailTeam) {
      newAuditsList.push({
        id: `AUD-P-${Date.now()}-2`,
        eventType: 'Configuration Change',
        changedField: 'Product Team',
        oldValue: selectedProduct.team,
        newValue: detailTeam,
        changedBy: 'System Admin',
        changedOn: timestamp,
        productName: detailName.trim()
      });
    }

    if (selectedProduct.group !== detailGroup) {
      newAuditsList.push({
        id: `AUD-P-${Date.now()}-3`,
        eventType: 'Configuration Change',
        changedField: 'Product Category',
        oldValue: selectedProduct.group,
        newValue: detailGroup,
        changedBy: 'System Admin',
        changedOn: timestamp,
        productName: detailName.trim()
      });
    }

    if (selectedProduct.gmiProductGroup !== detailGmiProductGroup) {
      newAuditsList.push({
        id: `AUD-P-${Date.now()}-4`,
        eventType: 'Configuration Change',
        changedField: 'GMI Product Group',
        oldValue: selectedProduct.gmiProductGroup || 'Pension',
        newValue: detailGmiProductGroup,
        changedBy: 'System Admin',
        changedOn: timestamp,
        productName: detailName.trim()
      });
    }

    if ((selectedProduct.isInsuranceProduct || '') !== detailIsInsuranceProduct) {
      newAuditsList.push({
        id: `AUD-P-${Date.now()}-5`,
        eventType: 'Configuration Change',
        changedField: 'Is Insurance Product',
        oldValue: selectedProduct.isInsuranceProduct || '(none)',
        newValue: detailIsInsuranceProduct || '(none)',
        changedBy: 'System Admin',
        changedOn: timestamp,
        productName: detailName.trim()
      });
    }

    if (newAuditsList.length > 0) {
      setProductAudits(prev => [...newAuditsList, ...prev]);
    }

    setProducts(prev => prev.map(p => {
      if (p.id === selectedProductId) {
        return {
          ...p,
          name: detailName.trim(),
          team: detailTeam,
          group: detailGroup,
          gmiProductGroup: detailGmiProductGroup,
          appliedCompanyType: detailCompanyType,
          isInsuranceProduct: detailIsInsuranceProduct || undefined,
          salesCreditRule: detailSalesCreditRule,
          vendorFields: detailVendorFields,
          premiumFields: detailPremiumFields,
          dateTransferFields: detailDateTransferFields,
          status: detailStatus
        };
      }
      return p;
    }));

    setViewMode('list');
    setToast("Product configuration successfully saved.");
  };

  // ==========================================
  // GMI PRODUCT GROUPS & BENEFIT GROUPS ACTIONS
  // ==========================================
  const handleCreateGmiGroup = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (gmiGroupsMaster.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A GMI Product Group with this name already exists.");
      return;
    }
    const timestamp = getSystemDatetimeString();
    const newId = `GMI-GRP-${Date.now()}`;
    const newGrp: GmiProductGroup = {
      id: newId,
      name: trimmed,
      status: 'Active',
      detailedProducts: [],
      createdOn: timestamp
    };
    setGmiGroupsMaster(prev => [...prev, newGrp]);
    setSelectedGmiGroupId(newId);

    setProductAudits(prev => [{
      id: `AUD-GMI-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'GMI Product Group Added',
      oldValue: '(None)',
      newValue: trimmed,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `GMI Group: ${trimmed}`
    }, ...prev]);
    setToast(`GMI Product Group "${trimmed}" created.`);
  };

  const handleRenameGmiGroup = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const trimmed = newName.trim();
    const grp = gmiGroupsMaster.find(g => g.id === id);
    if (!grp) return;
    if (gmiGroupsMaster.some(g => g.id !== id && g.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A GMI Product Group with this name already exists.");
      return;
    }
    const oldName = grp.name;
    setGmiGroupsMaster(prev => prev.map(g => g.id === id ? { ...g, name: trimmed } : g));

    // Update any linked products
    setProducts(prev => prev.map(p => p.gmiProductGroup === oldName ? { ...p, gmiProductGroup: trimmed } : p));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-GMI-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'GMI Product Group Renamed',
      oldValue: oldName,
      newValue: trimmed,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `GMI Group: ${trimmed}`
    }, ...prev]);
    setToast(`GMI Product Group renamed to "${trimmed}".`);
  };

  const handleToggleArchiveGmiGroup = (id: string) => {
    const grp = gmiGroupsMaster.find(g => g.id === id);
    if (!grp) return;
    const nextStatus = grp.status === 'Active' ? 'Archived' : 'Active';
    setGmiGroupsMaster(prev => prev.map(g => g.id === id ? { ...g, status: nextStatus } : g));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-GMI-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'GMI Product Group Status',
      oldValue: grp.status,
      newValue: nextStatus,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `GMI Group: ${grp.name}`
    }, ...prev]);
    setToast(`GMI Product Group status set to ${nextStatus}.`);
  };

  const handleDeleteGmiGroup = (id: string) => {
    const grp = gmiGroupsMaster.find(g => g.id === id);
    if (!grp) return;
    if (gmiGroupsMaster.length <= 1) {
      alert("At least one GMI Product Group must exist.");
      return;
    }
    // Check if in use by active products
    const linkedProducts = products.filter(p => p.gmiProductGroup === grp.name && p.status !== 'Archived');
    if (linkedProducts.length > 0) {
      alert(`Cannot delete this GMI Product Group because it is in use by ${linkedProducts.length} active products (e.g. "${linkedProducts[0].name}").`);
      return;
    }
    if (!confirm(`Are you sure you want to delete the GMI Product Group "${grp.name}"? This cannot be undone.`)) {
      return;
    }

    setGmiGroupsMaster(prev => prev.filter(g => g.id !== id));
    // Set fallback selected
    const remaining = gmiGroupsMaster.filter(g => g.id !== id);
    if (remaining.length > 0) {
      setSelectedGmiGroupId(remaining[0].id);
    }

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-GMI-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'GMI Product Group Deleted',
      oldValue: grp.name,
      newValue: '(Deleted)',
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `GMI Group: ${grp.name}`
    }, ...prev]);
    setToast(`GMI Product Group "${grp.name}" deleted.`);
  };

  // Detailed Products Actions
  const handleCreateDetailedProduct = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    const grp = gmiGroupsMaster.find(g => g.id === selectedGmiGroupId);
    if (!grp) return;
    if (grp.detailedProducts?.some(dp => dp.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A Detailed Product with this name already exists in this group.");
      return;
    }
    const timestamp = getSystemDatetimeString();
    const newId = `DP-${Date.now()}`;
    const newDp: DetailedProduct = { id: newId, name: trimmed, status: 'Active', benefits: [], coverages: [], createdOn: timestamp };
    setGmiGroupsMaster(prev => prev.map(g => g.id === selectedGmiGroupId
      ? { ...g, detailedProducts: [...(g.detailedProducts || []), newDp] }
      : g
    ));
    setSelectedDetailedProductId(newId);
    setToast(`Detailed Product "${trimmed}" created.`);
  };

  const handleRenameDetailedProduct = (dpId: string, newName: string) => {
    if (!newName.trim()) return;
    const trimmed = newName.trim();
    setGmiGroupsMaster(prev => prev.map(g => g.id === selectedGmiGroupId
      ? { ...g, detailedProducts: (g.detailedProducts || []).map(dp => dp.id === dpId ? { ...dp, name: trimmed } : dp) }
      : g
    ));
    setToast(`Renamed to "${trimmed}".`);
  };

  const handleToggleArchiveDetailedProduct = (dpId: string) => {
    setGmiGroupsMaster(prev => prev.map(g => g.id === selectedGmiGroupId
      ? { ...g, detailedProducts: (g.detailedProducts || []).map(dp => dp.id === dpId ? { ...dp, status: dp.status === 'Active' ? 'Archived' : 'Active' } : dp) }
      : g
    ));
  };

  const handleDeleteDetailedProduct = (dpId: string) => {
    const grp = gmiGroupsMaster.find(g => g.id === selectedGmiGroupId);
    if (!grp) return;
    if ((grp.detailedProducts || []).length <= 1) { alert("At least one Detailed Product must exist."); return; }
    if (!confirm("Delete this Detailed Product?")) return;
    setGmiGroupsMaster(prev => prev.map(g => g.id === selectedGmiGroupId
      ? { ...g, detailedProducts: (g.detailedProducts || []).filter(dp => dp.id !== dpId) }
      : g
    ));
    const remaining = (grp.detailedProducts || []).filter(dp => dp.id !== dpId);
    if (remaining.length > 0) setSelectedDetailedProductId(remaining[0].id);
    setToast("Detailed Product deleted.");
  };

  // Benefits Actions
  const handleCreateAndLinkBenefit = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (benefitsMaster.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A Benefit with this name already exists.");
      return;
    }
    const timestamp = getSystemDatetimeString();
    const newId = `BEN-${Date.now()}`;
    const newBen: BenefitItem = {
      id: newId,
      name: trimmed,
      status: 'Active',
      createdOn: timestamp
    };
    setBenefitsMaster(prev => [...prev, newBen]);
    // Link to selected Detailed Product
    setGmiGroupsMaster(prev => prev.map(g => {
      if (g.id !== selectedGmiGroupId) return g;
      return { ...g, detailedProducts: (g.detailedProducts || []).map(dp =>
        dp.id === selectedDetailedProductId ? { ...dp, benefits: [...(dp.benefits || []), newId] } : dp
      )};
    }));

    setProductAudits(prev => [{
      id: `AUD-BEN-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Benefit Created & Linked',
      oldValue: '(None)',
      newValue: trimmed,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Benefit: ${trimmed}`
    }, ...prev]);
    setToast(`Benefit "${trimmed}" created and linked to "${selectedGmiGroup.name}".`);
  };

  const handleLinkExistingBenefit = (benefitId: string) => {
    if (!benefitId) return;
    if (selectedDetailedProduct?.benefits?.includes(benefitId)) {
      alert("Already linked.");
      return;
    }
    setGmiGroupsMaster(prev => prev.map(g => {
      if (g.id !== selectedGmiGroupId) return g;
      return { ...g, detailedProducts: (g.detailedProducts || []).map(dp =>
        dp.id === selectedDetailedProductId ? { ...dp, benefits: [...(dp.benefits || []), benefitId] } : dp
      )};
    }));
    const benName = benefitsMaster.find(b => b.id === benefitId)?.name || '';
    setToast(`Linked benefit "${benName}" to "${selectedGmiGroup.name}".`);
  };

  const handleSaveBenefitName = (benefitId: string, newName: string) => {
    if (!newName.trim()) return;
    const trimmed = newName.trim();
    const ben = benefitsMaster.find(b => b.id === benefitId);
    if (!ben) return;
    if (benefitsMaster.some(b => b.id !== benefitId && b.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A Benefit with this name already exists.");
      return;
    }
    const oldName = ben.name;
    setBenefitsMaster(prev => prev.map(b => b.id === benefitId ? { ...b, name: trimmed } : b));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-BEN-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Benefit Renamed',
      oldValue: oldName,
      newValue: trimmed,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Benefit: ${trimmed}`
    }, ...prev]);
  };

  const handleToggleArchiveBenefit = (benefitId: string) => {
    const ben = benefitsMaster.find(b => b.id === benefitId);
    if (!ben) return;
    const nextStatus = ben.status === 'Active' ? 'Archived' : 'Active';
    setBenefitsMaster(prev => prev.map(b => b.id === benefitId ? { ...b, status: nextStatus } : b));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-BEN-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Benefit Status',
      oldValue: ben.status,
      newValue: nextStatus,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Benefit: ${ben.name}`
    }, ...prev]);
    setToast(`Benefit status set to ${nextStatus}.`);
  };

  const handleUnlinkBenefit = (benefitId: string) => {
    setGmiGroupsMaster(prev => prev.map(g => {
      if (g.id !== selectedGmiGroupId) return g;
      return { ...g, detailedProducts: (g.detailedProducts || []).map(dp =>
        dp.id === selectedDetailedProductId ? { ...dp, benefits: (dp.benefits || []).filter(id => id !== benefitId) } : dp
      )};
    }));
    const benName = benefitsMaster.find(b => b.id === benefitId)?.name || '';
    setToast(`Unlinked benefit "${benName}" from "${selectedGmiGroup.name}".`);
  };

  const handleDeleteBenefit = (benefitId: string) => {
    const ben = benefitsMaster.find(b => b.id === benefitId);
    if (!ben) return;
    if (!confirm(`Are you sure you want to completely delete the Benefit "${ben.name}"? It will be removed from all GMI Groups.`)) {
      return;
    }
    setBenefitsMaster(prev => prev.filter(b => b.id !== benefitId));
    setGmiGroupsMaster(prev => prev.map(g => ({
      ...g,
      detailedProducts: (g.detailedProducts || []).map(dp => ({
        ...dp,
        benefits: (dp.benefits || []).filter(id => id !== benefitId)
      }))
    })));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-BEN-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Benefit Deleted',
      oldValue: ben.name,
      newValue: '(Deleted)',
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Benefit: ${ben.name}`
    }, ...prev]);
    setToast(`Benefit "${ben.name}" fully deleted.`);
  };

  // Coverages Actions
  const handleCreateAndLinkCoverage = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (coveragesMaster.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A Coverage with this name already exists.");
      return;
    }
    const timestamp = getSystemDatetimeString();
    const newId = `COV-${Date.now()}`;
    const newCov: CoverageItem = {
      id: newId,
      name: trimmed,
      status: 'Active',
      createdOn: timestamp
    };
    setCoveragesMaster(prev => [...prev, newCov]);
    setGmiGroupsMaster(prev => prev.map(g => {
      if (g.id !== selectedGmiGroupId) return g;
      return { ...g, detailedProducts: (g.detailedProducts || []).map(dp =>
        dp.id === selectedDetailedProductId ? { ...dp, coverages: [...(dp.coverages || []), newId] } : dp
      )};
    }));

    setProductAudits(prev => [{
      id: `AUD-COV-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Coverage Created & Linked',
      oldValue: '(None)',
      newValue: trimmed,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Coverage: ${trimmed}`
    }, ...prev]);
    setToast(`Coverage "${trimmed}" created and linked.`);
  };

  const handleLinkExistingCoverage = (coverageId: string) => {
    if (!coverageId) return;
    if (selectedDetailedProduct?.coverages?.includes(coverageId)) {
      alert("Already linked.");
      return;
    }
    setGmiGroupsMaster(prev => prev.map(g => {
      if (g.id !== selectedGmiGroupId) return g;
      return { ...g, detailedProducts: (g.detailedProducts || []).map(dp =>
        dp.id === selectedDetailedProductId ? { ...dp, coverages: [...(dp.coverages || []), coverageId] } : dp
      )};
    }));
    const covName = coveragesMaster.find(c => c.id === coverageId)?.name || '';
    setToast(`Linked coverage "${covName}" to GMI Product Group "${selectedGmiGroup.name}".`);
  };

  const handleSaveCoverageName = (coverageId: string, newName: string) => {
    if (!newName.trim()) return;
    const trimmed = newName.trim();
    const cov = coveragesMaster.find(c => c.id === coverageId);
    if (!cov) return;
    if (coveragesMaster.some(c => c.id !== coverageId && c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A Coverage with this name already exists.");
      return;
    }
    const oldName = cov.name;
    setCoveragesMaster(prev => prev.map(c => c.id === coverageId ? { ...c, name: trimmed } : c));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-COV-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Coverage Renamed',
      oldValue: oldName,
      newValue: trimmed,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Coverage: ${trimmed}`
    }, ...prev]);
  };

  const handleToggleArchiveCoverage = (coverageId: string) => {
    const cov = coveragesMaster.find(c => c.id === coverageId);
    if (!cov) return;
    const nextStatus = cov.status === 'Active' ? 'Archived' : 'Active';
    setCoveragesMaster(prev => prev.map(c => c.id === coverageId ? { ...c, status: nextStatus } : c));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-COV-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Coverage Status',
      oldValue: cov.status,
      newValue: nextStatus,
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Coverage: ${cov.name}`
    }, ...prev]);
    setToast(`Coverage status set to ${nextStatus}.`);
  };

  const handleUnlinkCoverage = (coverageId: string) => {
    setGmiGroupsMaster(prev => prev.map(g => {
      if (g.id !== selectedGmiGroupId) return g;
      return { ...g, detailedProducts: (g.detailedProducts || []).map(dp =>
        dp.id === selectedDetailedProductId ? { ...dp, coverages: (dp.coverages || []).filter(id => id !== coverageId) } : dp
      )};
    }));
    const covName = coveragesMaster.find(c => c.id === coverageId)?.name || '';
    setToast(`Unlinked coverage "${covName}".`);
  };

  const handleDeleteCoverage = (coverageId: string) => {
    const cov = coveragesMaster.find(c => c.id === coverageId);
    if (!cov) return;
    if (!confirm(`Are you sure you want to completely delete the Coverage "${cov.name}"? It will be removed from all GMI Groups.`)) {
      return;
    }
    setCoveragesMaster(prev => prev.filter(c => c.id !== coverageId));
    setGmiGroupsMaster(prev => prev.map(g => ({
      ...g,
      detailedProducts: (g.detailedProducts || []).map(dp => ({
        ...dp,
        coverages: (dp.coverages || []).filter(id => id !== coverageId)
      }))
    })));

    const timestamp = getSystemDatetimeString();
    setProductAudits(prev => [{
      id: `AUD-COV-${Date.now()}`,
      eventType: 'Configuration Change',
      changedField: 'Coverage Deleted',
      oldValue: cov.name,
      newValue: '(Deleted)',
      changedBy: 'System Admin',
      changedOn: timestamp,
      productName: `Coverage: ${cov.name}`
    }, ...prev]);
    setToast(`Coverage "${cov.name}" fully deleted.`);
  };

  const handleFieldCheckboxChange = (
    section: 'vendor' | 'premium' | 'dateTransfer',
    index: number,
    field: 'visible' | 'required'
  ) => {
    const updateConfig = (list: FieldConfig[]) => {
      return list.map((item, idx) => {
        if (idx !== index) return item;
        
        let nextVisible = item.visible;
        let nextRequired = item.required;

        if (field === 'required') {
          nextRequired = !item.required;
          if (nextRequired) {
            nextVisible = true; // Rule: Required check guarantees Visible check
          }
        } else {
          nextVisible = !item.visible;
          if (!nextVisible) {
            nextRequired = false; // Rule: Cannot be required if not visible
          }
        }

        return {
          ...item,
          visible: nextVisible,
          required: nextRequired
        };
      });
    };

    if (section === 'vendor') {
      setDetailVendorFields(prev => updateConfig(prev));
    } else if (section === 'premium') {
      setDetailPremiumFields(prev => updateConfig(prev));
    } else {
      setDetailDateTransferFields(prev => updateConfig(prev));
    }
  };

  const handleExportToExcel = () => {
    const exportData = filteredProducts.map(p => {
      const vendorVis = (p.vendorFields || []).filter(f => f.visible).map(f => f.name).join(', ') || 'None';
      const vendorReq = (p.vendorFields || []).filter(f => f.required).map(f => f.name).join(', ') || 'None';
      const premiumVis = (p.premiumFields || []).filter(f => f.visible).map(f => f.name).join(', ') || 'None';
      const premiumReq = (p.premiumFields || []).filter(f => f.required).map(f => f.name).join(', ') || 'None';
      const dateVis = (p.dateTransferFields || []).filter(f => f.visible).map(f => f.name).join(', ') || 'None';
      const dateReq = (p.dateTransferFields || []).filter(f => f.required).map(f => f.name).join(', ') || 'None';

      return {
        'Product ID': p.id,
        'Product Name': p.name,
        'Product Team': p.team,
        'Product Category': p.group,
        'Applied Customer Type': p.appliedCompanyType || 'None',
        'Status': p.status || 'Active',
        'Sales Credit Rule': p.salesCreditRule || 'None',
        'Visible Fields (Vendor)': vendorVis,
        'Required Fields (Vendor)': vendorReq,
        'Visible Fields (Premium)': premiumVis,
        'Required Fields (Premium)': premiumReq,
        'Visible Fields (Date & Transfer)': dateVis,
        'Required Fields (Date & Transfer)': dateReq,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Catalog');
    XLSX.writeFile(workbook, `Product_Catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setToast("Excel file exported successfully.");
  };

  // ==========================================
  // RENDER MAIN JSX
  // ==========================================
  return (
    <div className="flex flex-col gap-5 p-6 min-h-screen bg-gray-50 text-left font-sans text-gray-950">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
          <Check size={14} className="text-orange-500 shrink-0" />
          <span className="font-semibold leading-normal">{toast}</span>
        </div>
      )}

      {/* BREADCRUMB HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
          <span>Configuration</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">Product Configuration</span>
          <span className="text-gray-300">/</span>
          <span className="text-orange-600 font-black">{getBreadcrumbLabel()}</span>
          {viewMode === 'detail' && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 font-black">
                {detailName || 'New Product Item'}
              </span>
            </>
          )}
        </div>
        <div className="text-[10px] text-gray-400 font-mono font-bold uppercase">
          Odoo Configuration Template
        </div>
      </div>

      {/* Sub-navigation tabs (Only visible in list view to keep detail view focused) */}
      {viewMode === 'list' && (
        <div className="flex border-b border-gray-200 bg-white px-4 pt-2 rounded-xl shadow-xs overflow-x-auto gap-2">
          {[
            { id: 'items', label: 'Product Items', icon: Folder },
            { id: 'benefitGroups', label: 'Benefit Groups (GMI)', icon: Layers }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setViewMode('list');
                }}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <TabIcon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* LIST VIEW AREA */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* PRODUCT ITEMS LIST */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Filters Toolbar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                  <div className="lg:col-span-3 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Search Product Items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-300 rounded-lg text-xs font-semibold outline-none h-9"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-700 outline-none h-9 cursor-pointer"
                    >
                      <option value="All">All Teams</option>
                      {productTeams.map((team, idx) => (
                        <option key={idx} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <select
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-700 outline-none h-9 cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {productGroups.map((grp, idx) => (
                        <option key={idx} value={grp}>{grp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <select
                      value={companyTypeFilter}
                      onChange={(e) => setCompanyTypeFilter(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-700 outline-none h-9 cursor-pointer"
                    >
                      <option value="All">All Types</option>
                      <option value="Company">Company</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-700 outline-none h-9 cursor-pointer"
                    >
                      <option value="Active">Active Products</option>
                      <option value="Archived">Archived Products</option>
                    </select>
                  </div>

                  <div className="lg:col-span-1">
                    <button
                      type="button"
                      onClick={handleExportToExcel}
                      className="w-full px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg h-9 shadow-xs cursor-pointer"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h2 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                    <Folder size={13} className="text-orange-600" />
                    Product Items Catalog ({filteredProducts.length})
                  </h2>
                  <button
                    type="button"
                    onClick={handleCreateProductItem}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer h-8"
                  >
                    <Plus size={11} />
                    Create Product Item
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-150 rounded-lg bg-white">
                  <table className="w-full text-xs text-left min-w-[700px]">
                    <thead className="bg-gray-50 text-gray-500 text-[9px] uppercase tracking-wider border-b border-gray-200 font-bold font-mono">
                      <tr>
                        <th className="px-4 py-3 border-r border-gray-200 w-[260px]">Product Item</th>
                        <th className="px-4 py-3 border-r border-gray-200">Product Team</th>
                        <th className="px-4 py-3 border-r border-gray-200">Product Category</th>
                        <th className="px-4 py-3 border-r border-gray-200">Applied Customer Type</th>
                        <th className="px-4 py-3 text-right w-24 border-r border-gray-200">Status</th>
                        <th className="px-4 py-3 text-center w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-600">
                      {filteredProducts.map((p) => {
                        const customerTypeDisplay = p.appliedCompanyType || 'None';

                        return (
                          <tr
                            key={p.id}
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setViewMode('detail');
                            }}
                            className="group cursor-pointer hover:bg-orange-50/30 transition-all border-l-4 border-l-transparent hover:border-l-orange-500"
                          >
                            <td className="px-4 py-3 border-r border-gray-150 font-black text-gray-900 group-hover:text-orange-600">
                              {p.name}
                            </td>
                            <td className="px-4 py-3 text-gray-800 border-r border-gray-100 font-bold">
                              {p.team}
                            </td>
                            <td className="px-4 py-3 text-gray-500 border-r border-gray-100 font-medium">
                              {p.group}
                            </td>
                            <td className="px-4 py-3 border-r border-gray-100">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-gray-50 text-gray-600 border-gray-200 inline-block">
                                {customerTypeDisplay}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold border-r border-gray-100">
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${
                                p.status === 'Archived' 
                                  ? 'bg-red-50 text-red-600 border-red-100' 
                                  : 'bg-green-50 text-green-700 border-green-100'
                              }`}>
                                {p.status || 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === p.id ? null : p.id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 cursor-pointer inline-flex items-center"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {activeMenuId === p.id && (
                                <div className="absolute right-4 top-8 z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 font-sans text-xs text-gray-700 font-semibold text-left">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      setAuditTargetProductName(p.name);
                                      setShowAuditModal(true);
                                    }}
                                    className="w-full px-3 py-2 hover:bg-gray-50 text-left flex items-center gap-2"
                                  >
                                    <Clock size={12} className="text-gray-400" />
                                    View Audit History
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      handleDuplicateProduct(p);
                                    }}
                                    className="w-full px-3 py-2 hover:bg-gray-50 text-left flex items-center gap-2"
                                  >
                                    <Copy size={12} className="text-gray-400" />
                                    Duplicate Product
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      const nextStatus = p.status === 'Archived' ? 'Active' : 'Archived';
                                      setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, status: nextStatus } : prod));
                                      const timestamp = getSystemDatetimeString();
                                      setProductAudits(prev => [{
                                        id: `AUD-P-${Date.now()}`,
                                        eventType: 'Configuration Change',
                                        changedField: 'Status',
                                        oldValue: p.status || 'Active',
                                        newValue: nextStatus,
                                        changedBy: 'System Admin',
                                        changedOn: timestamp,
                                        productName: p.name
                                      }, ...prev]);
                                      setToast(`Product item "${p.name}" status updated to ${nextStatus}.`);
                                    }}
                                    className="w-full px-3 py-2 hover:bg-gray-50 text-left flex items-center gap-2"
                                  >
                                    <Archive size={12} className="text-gray-400" />
                                    {p.status === 'Archived' ? 'Activate Product' : 'Archive Product'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      handleDeleteProduct(p.id, e);
                                    }}
                                    className="w-full px-3 py-2 hover:bg-red-50 text-red-600 text-left flex items-center gap-2"
                                  >
                                    <Trash2 size={12} />
                                    Delete Product
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                            No product matches found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BENEFIT GROUPS MASTER-DETAIL VIEW */}
          {activeTab === 'benefitGroups' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Side: GMI Groups Master List */}
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-250 bg-gray-50 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Layers size={13} className="text-orange-600" />
                    GMI Product Groups
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt("Enter new GMI Product Group Name:");
                      if (name && name.trim()) {
                        handleCreateGmiGroup(name.trim());
                      }
                    }}
                    className="p-1 hover:bg-gray-200 text-orange-600 hover:text-orange-700 rounded-lg cursor-pointer"
                    title="Add GMI Group"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                {/* Search in GMI Groups */}
                <div className="p-3 border-b border-gray-150">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search GMI Product Groups..."
                      value={gmiSearchQuery}
                      onChange={(e) => setGmiSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-300 rounded-lg text-xs font-semibold outline-none h-8"
                    />
                  </div>
                </div>

                {/* Master list */}
                <div className="divide-y max-h-[60vh] overflow-y-auto">
                  {gmiGroupsMaster
                    .filter(g => !gmiSearchQuery.trim() || g.name.toLowerCase().includes(gmiSearchQuery.toLowerCase()))
                    .map((grp) => {
                      const isSelected = grp.id === selectedGmiGroupId;
                      return (
                        <div
                          key={grp.id}
                          onClick={() => setSelectedGmiGroupId(grp.id)}
                          className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-orange-50/40 border-l-4 border-orange-500' 
                              : 'hover:bg-gray-50/50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-black text-gray-900 block">{grp.name}</span>
                            <span className="text-[9px] text-gray-400 font-mono font-semibold block">
                              {(grp.detailedProducts || []).length} Detailed Products
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            {/* Archive Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleArchiveGmiGroup(grp.id)}
                              className={`p-1 rounded text-[10px] font-bold border transition-colors ${
                                grp.status === 'Archived' 
                                  ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                                  : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                              }`}
                              title={grp.status === 'Archived' ? 'Activate GMI Group' : 'Archive GMI Group'}
                            >
                              {grp.status}
                            </button>

                            {/* Rename */}
                            <button
                              type="button"
                              onClick={() => {
                                const newName = prompt("Rename GMI Product Group:", grp.name);
                                if (newName && newName.trim()) handleRenameGmiGroup(grp.id, newName.trim());
                              }}
                              className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                              title="Rename GMI Group"
                            >
                              <Pencil size={11} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteGmiGroup(grp.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete GMI Group"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Side: 2-level panel */}
              <div className="lg:col-span-8 space-y-4">

                {/* Level 1: Detailed Products for selected GMI group */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-gray-900">{selectedGmiGroup.name}</h2>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">{selectedGmiGroup.detailedProducts?.length || 0} Detailed Products</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold border ${selectedGmiGroup.status === 'Archived' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{selectedGmiGroup.status}</span>
                      <button type="button" onClick={() => { const name = prompt("New Detailed Product name:"); if (name?.trim()) handleCreateDetailedProduct(name.trim()); }} className="p-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg" title="Add Detailed Product"><Plus size={12} /></button>
                    </div>
                  </div>

                  <div className="divide-y max-h-44 overflow-y-auto">
                    {(selectedGmiGroup.detailedProducts || []).map(dp => {
                      const isSelected = dp.id === selectedDetailedProductId;
                      const isEditing = editingDetailedProductId === dp.id;
                      return (
                        <div key={dp.id} onClick={() => setSelectedDetailedProductId(dp.id)} className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}>
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <Tag size={11} className={isSelected ? 'text-orange-500' : 'text-gray-400'} />
                            {isEditing ? (
                              <input type="text" value={editingDetailedProductName} onChange={e => setEditingDetailedProductName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleRenameDetailedProduct(dp.id, editingDetailedProductName); setEditingDetailedProductId(null); } if (e.key === 'Escape') setEditingDetailedProductId(null); }} onClick={e => e.stopPropagation()} className="flex-1 px-2 py-0.5 border rounded text-xs font-bold bg-white" autoFocus />
                            ) : (
                              <span className={`text-xs font-bold ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>{dp.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <span className="text-[8px] text-gray-400 font-mono">{(dp.benefits||[]).length}B/{(dp.coverages||[]).length}C</span>
                            {isEditing ? (
                              <button type="button" onClick={() => { handleRenameDetailedProduct(dp.id, editingDetailedProductName); setEditingDetailedProductId(null); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={11} /></button>
                            ) : (
                              <button type="button" onClick={() => { setEditingDetailedProductId(dp.id); setEditingDetailedProductName(dp.name); }} className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"><Pencil size={10} /></button>
                            )}
                            <button type="button" onClick={() => handleToggleArchiveDetailedProduct(dp.id)} className={`text-[7px] font-black px-1 py-0.5 rounded border ${dp.status === 'Archived' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{dp.status}</button>
                            <button type="button" onClick={() => handleDeleteDetailedProduct(dp.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={10} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {(selectedGmiGroup.detailedProducts || []).length === 0 && (
                      <div className="py-8 text-center text-gray-400 text-xs">No detailed products. Click + to add one.</div>
                    )}
                  </div>
                </div>

                {/* Level 2: Benefits + Coverages for selected Detailed Product */}
                {selectedDetailedProduct && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Benefits Panel */}
                    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1">
                          <Heart size={12} className="text-orange-600" />
                          Benefits ({(selectedDetailedProduct.benefits || []).length})
                        </span>
                        <button type="button" onClick={() => { setNewBenefitName(''); setSelectedExistingBenefitId(''); setAddBenefitMode('create'); setShowAddBenefitModal(true); }} className="text-[9px] bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-2 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-0.5 cursor-pointer h-7"><Plus size={10} /> Add</button>
                      </div>
                      <div className="divide-y max-h-64 overflow-y-auto">
                        {(selectedDetailedProduct.benefits || []).map((benId) => {
                          const ben = benefitsMaster.find(b => b.id === benId);
                          if (!ben) return null;
                          const isEditing = editingBenefitId === benId;
                          return (
                            <div key={benId} className="p-3 flex items-center justify-between hover:bg-gray-50/30 text-xs font-semibold">
                              <div className="flex-1 mr-3">
                                {isEditing ? (
                                  <input type="text" value={editingBenefitName} onChange={e => setEditingBenefitName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleSaveBenefitName(benId, editingBenefitName); setEditingBenefitId(null); } }} className="w-full px-2 py-1 border rounded text-xs font-bold bg-white" autoFocus />
                                ) : (
                                  <span className="font-bold text-gray-800">{ben.name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {isEditing ? (
                                  <button type="button" onClick={() => { handleSaveBenefitName(benId, editingBenefitName); setEditingBenefitId(null); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={12} /></button>
                                ) : (
                                  <button type="button" onClick={() => { setEditingBenefitId(benId); setEditingBenefitName(ben.name); }} className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"><Pencil size={11} /></button>
                                )}
                                <button type="button" onClick={() => handleToggleArchiveBenefit(benId)} className={`text-[8px] font-black uppercase px-1 py-0.5 rounded border ${ben.status === 'Archived' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{ben.status}</button>
                                <button type="button" onClick={() => handleUnlinkBenefit(benId)} className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded" title="Unlink"><X size={11} /></button>
                                <button type="button" onClick={() => handleDeleteBenefit(benId)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={11} /></button>
                              </div>
                            </div>
                          );
                        })}
                        {(selectedDetailedProduct.benefits || []).length === 0 && <div className="p-6 text-center text-gray-400 text-xs">No benefits linked yet.</div>}
                      </div>
                    </div>

                    {/* Coverages Panel */}
                    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1">
                          <Globe size={12} className="text-orange-600" />
                          Coverages ({(selectedDetailedProduct.coverages || []).length})
                        </span>
                        <button type="button" onClick={() => { setNewCoverageName(''); setSelectedExistingCoverageId(''); setAddCoverageMode('create'); setShowAddCoverageModal(true); }} className="text-[9px] bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-2 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-0.5 cursor-pointer h-7"><Plus size={10} /> Add</button>
                      </div>
                      <div className="divide-y max-h-64 overflow-y-auto">
                        {(selectedDetailedProduct.coverages || []).map((covId) => {
                          const cov = coveragesMaster.find(c => c.id === covId);
                          if (!cov) return null;
                          const isEditing = editingCoverageId === covId;
                          return (
                            <div key={covId} className="p-3 flex items-center justify-between hover:bg-gray-50/30 text-xs font-semibold">
                              <div className="flex-1 mr-3">
                                {isEditing ? (
                                  <input type="text" value={editingCoverageName} onChange={e => setEditingCoverageName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleSaveCoverageName(covId, editingCoverageName); setEditingCoverageId(null); } }} className="w-full px-2 py-1 border rounded text-xs font-bold bg-white" autoFocus />
                                ) : (
                                  <span className="font-bold text-gray-800">{cov.name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {isEditing ? (
                                  <button type="button" onClick={() => { handleSaveCoverageName(covId, editingCoverageName); setEditingCoverageId(null); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={12} /></button>
                                ) : (
                                  <button type="button" onClick={() => { setEditingCoverageId(covId); setEditingCoverageName(cov.name); }} className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"><Pencil size={11} /></button>
                                )}
                                <button type="button" onClick={() => handleToggleArchiveCoverage(covId)} className={`text-[8px] font-black uppercase px-1 py-0.5 rounded border ${cov.status === 'Archived' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{cov.status}</button>
                                <button type="button" onClick={() => handleUnlinkCoverage(covId)} className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded" title="Unlink"><X size={11} /></button>
                                <button type="button" onClick={() => handleDeleteCoverage(covId)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={11} /></button>
                              </div>
                            </div>
                          );
                        })}
                        {(selectedDetailedProduct.coverages || []).length === 0 && <div className="p-6 text-center text-gray-400 text-xs">No coverages linked yet.</div>}
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* DETAIL VIEW AREA */}
      {viewMode === 'detail' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Action bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setSaveErrors({});
                  setViewMode('list');
                }}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer h-8"
              >
                <ChevronLeft size={12} />
                Back to List
              </button>
              
              <button
                type="button"
                onClick={handleSaveAllSettings}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm flex items-center justify-center gap-1 cursor-pointer h-8"
              >
                <Save size={12} />
                Save Changes
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedProduct && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuditTargetProductName(selectedProduct.name);
                      setShowAuditModal(true);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer h-8"
                  >
                    <Clock size={12} className="text-gray-400" />
                    Audit Logs
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateProduct(selectedProduct)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer h-8"
                  >
                    <Copy size={12} className="text-gray-400" />
                    Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = detailStatus === 'Archived' ? 'Active' : 'Archived';
                      setDetailStatus(next);
                      setToast(`Product status set to ${next}. Please click Save to apply.`);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer h-8"
                  >
                    <Archive size={12} className="text-gray-400" />
                    {detailStatus === 'Archived' ? 'Activate' : 'Archive'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteProduct(selectedProductId, e)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold uppercase text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer h-8"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DETAIL FORM PANEL */}
          <div>
            {activeTab === 'items' && (
              <div className="flex flex-col gap-6 w-full">
                
                {/* General Info & Sales Config (Stacked Top) */}
                <div className="space-y-6">
                  
                  {/* General Info */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                    <div className="border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider">
                        Basic Product Settings
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                          Product Item <span className="text-red-500">* (Required & Unique)</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={detailName}
                          onChange={(e) => { setDetailName(e.target.value); setSaveErrors(prev => ({ ...prev, name: undefined })); }}
                          placeholder="e.g. Employee Benefit Healthcare Scheme"
                          className={`w-full px-3 py-2 border rounded-lg focus:border-orange-500 outline-none font-semibold text-gray-800 bg-white ${saveErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        {saveErrors.name && <p className="mt-1 text-[11px] text-red-500 font-semibold">{saveErrors.name}</p>}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 block">
                            Product Team
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setTeamPopupInput('');
                              setTeamPopupMode('create');
                              setShowTeamPopup(true);
                            }}
                            className="text-[9px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Settings size={10} /> Manage
                          </button>
                        </div>
                        <select
                          value={detailTeam}
                          onChange={(e) => { setDetailTeam(e.target.value); setSaveErrors(prev => ({ ...prev, team: undefined })); }}
                          className={`w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:border-orange-500 outline-none font-semibold ${saveErrors.team ? 'border-red-400' : 'border-gray-300'}`}
                        >
                          <option value="">Please select</option>
                          {productTeams.map((team, idx) => (
                            <option key={idx} value={team}>{team}</option>
                          ))}
                        </select>
                        {saveErrors.team && <p className="mt-1 text-[11px] text-red-500 font-semibold">{saveErrors.team}</p>}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 block">
                            Product Category
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryPopupInput('');
                              setCategoryPopupMode('create');
                              setShowCategoryPopup(true);
                            }}
                            className="text-[9px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Settings size={10} /> Manage
                          </button>
                        </div>
                        <select
                          value={detailGroup}
                          onChange={(e) => { setDetailGroup(e.target.value); setSaveErrors(prev => ({ ...prev, group: undefined })); }}
                          className={`w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:border-orange-500 outline-none font-semibold ${saveErrors.group ? 'border-red-400' : 'border-gray-300'}`}
                        >
                          <option value="">Please select</option>
                          {productGroups.map((group, idx) => (
                            <option key={idx} value={group}>{group}</option>
                          ))}
                        </select>
                        {saveErrors.group && <p className="mt-1 text-[11px] text-red-500 font-semibold">{saveErrors.group}</p>}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 block">
                            GMI Product Group
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('benefitGroups');
                              setViewMode('list');
                            }}
                            className="text-[9px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Settings size={10} /> Manage
                          </button>
                        </div>
                        <select
                          value={detailGmiProductGroup}
                          onChange={(e) => { setDetailGmiProductGroup(e.target.value); setSaveErrors(prev => ({ ...prev, gmiProductGroup: undefined })); }}
                          className={`w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:border-orange-500 outline-none font-semibold cursor-pointer ${saveErrors.gmiProductGroup ? 'border-red-400' : 'border-gray-300'}`}
                        >
                          <option value="">Please select</option>
                          {gmiGroupsMaster.filter(g => g.status === 'Active').map((grp) => (
                            <option key={grp.id} value={grp.name}>{grp.name}</option>
                          ))}
                        </select>
                        {saveErrors.gmiProductGroup && <p className="mt-1 text-[11px] text-red-500 font-semibold">{saveErrors.gmiProductGroup}</p>}
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                          Status
                        </label>
                        <select
                          value={detailStatus}
                          onChange={(e) => setDetailStatus(e.target.value as any)}
                          className="w-full text-xs px-2.5 py-2 border rounded-lg border-gray-300 bg-white focus:border-orange-500 outline-none font-semibold"
                        >
                          <option value="Active">Active</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5">
                          Applied Customer Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="appliedCustomerType"
                              checked={detailCompanyType === 'Company'}
                              onChange={() => setDetailCompanyType('Company')}
                              className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs text-gray-700">Company</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="appliedCustomerType"
                              checked={detailCompanyType === 'Individual'}
                              onChange={() => setDetailCompanyType('Individual')}
                              className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs text-gray-700">Individual</span>
                          </label>
                        </div>
                      </div>

                      {detailCompanyType === 'Individual' && (
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5">
                            Is Insurance Product <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-5 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="isInsuranceProduct"
                                checked={detailIsInsuranceProduct === 'Yes'}
                                onChange={() => { setDetailIsInsuranceProduct('Yes'); setSaveErrors(prev => ({ ...prev, isInsuranceProduct: undefined })); }}
                                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-0 cursor-pointer"
                              />
                              <span className="text-xs text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="isInsuranceProduct"
                                checked={detailIsInsuranceProduct === 'No'}
                                onChange={() => { setDetailIsInsuranceProduct('No'); setSaveErrors(prev => ({ ...prev, isInsuranceProduct: undefined })); }}
                                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-0 cursor-pointer"
                              />
                              <span className="text-xs text-gray-700">No</span>
                            </label>
                          </div>
                          {saveErrors.isInsuranceProduct && <p className="mt-1 text-[11px] text-red-500 font-semibold">{saveErrors.isInsuranceProduct}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sales Config */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                    <div className="border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider">
                        Sales Credit Calculation Rule
                      </h4>
                    </div>

                    <div className="text-xs font-semibold text-gray-700">
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                        Sales Credit Calculation Rule
                      </label>
                      <select
                        value={detailSalesCreditRule}
                        onChange={(e) => { setDetailSalesCreditRule(e.target.value); setSaveErrors(prev => ({ ...prev, salesCreditRule: undefined })); }}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:border-orange-500 outline-none font-semibold ${saveErrors.salesCreditRule ? 'border-red-400' : 'border-gray-300'}`}
                      >
                        <option value="">Please select</option>
                        <option value="Formula 1">Formula 1: Direct Commission split</option>
                        <option value="Formula 2">Formula 2: Team Pool allocation</option>
                        <option value="Formula 3">Formula 3: Individual Sales volume incentive</option>
                        <option value="Formula 4">Formula 4: Dynamic Revenue tier</option>
                        <option value="Formula 6">Formula 6: Custom Project share ratio</option>
                      </select>
                      {saveErrors.salesCreditRule && <p className="mt-1 text-[11px] text-red-500 font-semibold">{saveErrors.salesCreditRule}</p>}
                    </div>
                  </div>

                </div>

                {/* Opportunity Field Config (Stacked Bottom) */}
                <div className="space-y-6">
                  
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                    <div className="border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider">
                        Opportunity Field Configuration
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Vendor Panel */}
                      <div className="border border-gray-200 rounded-xl bg-white p-3">
                        <div className="border-b border-gray-100 pb-1.5 mb-2 bg-gray-50 -m-3 p-3 rounded-t-xl flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-gray-800">Vendor Fields</span>
                          <span className="text-[8px] text-gray-400 font-mono font-bold">
                            ({detailVendorFields.filter(f => f.visible).length} / {detailVendorFields.length})
                          </span>
                        </div>
                        <div className="space-y-1.5 text-[11px] pt-1">
                          <div className="grid grid-cols-12 gap-1 text-[8px] uppercase text-gray-400 font-black px-1.5 pb-1">
                            <span className="col-span-6">Field Name</span>
                            <span className="col-span-3 text-center">Display?</span>
                            <span className="col-span-3 text-center">Required?</span>
                          </div>
                          {detailVendorFields.map((field, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-1 items-center hover:bg-gray-50 p-1 rounded transition-colors font-semibold">
                              <span className="col-span-6 text-gray-700 truncate" title={field.name}>{field.name}</span>
                              <div className="col-span-3 flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  checked={field.visible}
                                  disabled={field.required}
                                  onChange={() => handleFieldCheckboxChange('vendor', idx, 'visible')}
                                  className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-0 cursor-pointer disabled:opacity-50"
                                />
                              </div>
                              <div className="col-span-3 flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={() => handleFieldCheckboxChange('vendor', idx, 'required')}
                                  className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-0 cursor-pointer"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Premium Panel */}
                      <div className="border border-gray-200 rounded-xl bg-white p-3">
                        <div className="border-b border-gray-100 pb-1.5 mb-2 bg-gray-50 -m-3 p-3 rounded-t-xl flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-gray-800">Premium Fields</span>
                          <span className="text-[8px] text-gray-400 font-mono font-bold">
                            ({detailPremiumFields.filter(f => f.visible).length} / {detailPremiumFields.length})
                          </span>
                        </div>
                        <div className="space-y-1.5 text-[11px] pt-1">
                          <div className="grid grid-cols-12 gap-1 text-[8px] uppercase text-gray-400 font-black px-1.5 pb-1">
                            <span className="col-span-6">Field Name</span>
                            <span className="col-span-3 text-center">Display?</span>
                            <span className="col-span-3 text-center">Required?</span>
                          </div>
                          {detailPremiumFields.map((field, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-1 items-center hover:bg-gray-50 p-1 rounded transition-colors font-semibold">
                              <span className="col-span-6 text-gray-700 truncate" title={field.name}>{field.name}</span>
                              <div className="col-span-3 flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  checked={field.visible}
                                  disabled={field.required}
                                  onChange={() => handleFieldCheckboxChange('premium', idx, 'visible')}
                                  className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-0 cursor-pointer disabled:opacity-50"
                                />
                              </div>
                              <div className="col-span-3 flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={() => handleFieldCheckboxChange('premium', idx, 'required')}
                                  className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-0 cursor-pointer"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Date & Transfer Panel */}
                      <div className="border border-gray-200 rounded-xl bg-white p-3">
                        <div className="border-b border-gray-100 pb-1.5 mb-2 bg-gray-50 -m-3 p-3 rounded-t-xl flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-gray-800">Date & Transfer Fields</span>
                          <span className="text-[8px] text-gray-400 font-mono font-bold">
                            ({detailDateTransferFields.filter(f => f.visible).length} / {detailDateTransferFields.length})
                          </span>
                        </div>
                        <div className="space-y-1.5 text-[11px] pt-1">
                          <div className="grid grid-cols-12 gap-1 text-[8px] uppercase text-gray-400 font-black px-1.5 pb-1">
                            <span className="col-span-6">Field Name</span>
                            <span className="col-span-3 text-center">Display?</span>
                            <span className="col-span-3 text-center">Required?</span>
                          </div>
                          {detailDateTransferFields.map((field, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-1 items-center hover:bg-gray-50 p-1 rounded transition-colors font-semibold">
                              <span className="col-span-6 text-gray-700 truncate" title={field.name}>{field.name}</span>
                              <div className="col-span-3 flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  checked={field.visible}
                                  disabled={field.required}
                                  onChange={() => handleFieldCheckboxChange('dateTransfer', idx, 'visible')}
                                  className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-0 cursor-pointer disabled:opacity-50"
                                />
                              </div>
                              <div className="col-span-3 flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={() => handleFieldCheckboxChange('dateTransfer', idx, 'required')}
                                  className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-0 cursor-pointer"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    <div className="text-[10px] text-gray-400 font-bold bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      💡 <strong>Required implies Visible:</strong> When a field is Required, it must also be checked as Visible.
                    </div>
                  </div>

                </div>

              </div>
            )}


          </div>

        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-150 px-6 py-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <Clock className="text-orange-600" size={16} />
                <h3 className="text-sm font-black text-gray-900 uppercase">
                  Configuration Audit Ledger {auditTargetProductName ? `- ${auditTargetProductName}` : ''}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowAuditModal(false);
                  setAuditTargetProductName(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold">
              <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-mono text-[9px] uppercase border-b">
                    <tr>
                      <th className="px-4 py-2.5">Product Name</th>
                      <th className="px-4 py-2.5">Event Type</th>
                      <th className="px-4 py-2.5">Changed Field</th>
                      <th className="px-4 py-2.5">Old Value</th>
                      <th className="px-4 py-2.5">New Value</th>
                      <th className="px-4 py-2.5">Changed By</th>
                      <th className="px-4 py-2.5 text-right">Changed On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-xs">
                    {filteredProductAudits.map((audit) => (
                      <tr key={audit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-sans font-bold text-gray-900">{audit.productName}</td>
                        <td className="px-4 py-3 text-gray-800">{audit.eventType}</td>
                        <td className="px-4 py-3 text-gray-500">{audit.changedField}</td>
                        <td className="px-4 py-3 text-red-600 max-w-[150px] truncate">{audit.oldValue}</td>
                        <td className="px-4 py-3 text-green-600 max-w-[150px] truncate">{audit.newValue}</td>
                        <td className="px-4 py-3 font-sans">{audit.changedBy}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{audit.changedOn}</td>
                      </tr>
                    ))}
                    {filteredProductAudits.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 font-sans">
                          No audit trails found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-150 px-6 py-4 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowAuditModal(false);
                  setAuditTargetProductName(null);
                }}
                className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Teams Popup Dialog */}
      {showTeamPopup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 px-5 py-3.5 bg-gray-50">
              <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                Manage Product Teams
              </span>
              <button 
                onClick={() => setShowTeamPopup(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">
                  {teamPopupMode === 'create' ? 'Add New Team' : 'Rename Selected Team'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={teamPopupInput}
                    onChange={(e) => setTeamPopupInput(e.target.value)}
                    placeholder="e.g. Wellness"
                    className="flex-1 px-3 py-1.5 border rounded-lg border-gray-300 focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-white h-9"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!teamPopupInput.trim()) {
                        alert("Team name is required.");
                        return;
                      }
                      const trimmed = teamPopupInput.trim();
                      if (teamPopupMode === 'create') {
                        if (productTeams.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
                          alert("A team with this name already exists.");
                          return;
                        }
                        const updated = [...productTeams, trimmed];
                        setProductTeams(updated);
                        setDetailTeam(trimmed);
                        setToast(`Product Team "${trimmed}" added.`);
                      } else {
                        // Rename
                        const oldName = teamPopupMode as string;
                        if (productTeams.some(t => t.toLowerCase() === trimmed.toLowerCase() && t !== oldName)) {
                          alert("A team with this name already exists.");
                          return;
                        }
                        const updated = productTeams.map(t => t === oldName ? trimmed : t);
                        setProductTeams(updated);
                        if (detailTeam === oldName) setDetailTeam(trimmed);
                        setProducts(prev => prev.map(p => p.team === oldName ? { ...p, team: trimmed } : p));
                        setToast(`Renamed team "${oldName}" to "${trimmed}".`);
                      }
                      setTeamPopupInput('');
                      setTeamPopupMode('create');
                    }}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm flex items-center justify-center gap-1 cursor-pointer h-9"
                  >
                    {teamPopupMode === 'create' ? 'Add' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto border rounded-xl divide-y p-2 bg-gray-50/50">
                {productTeams.map((team, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 px-2 hover:bg-white rounded transition-colors text-xs font-semibold text-gray-700">
                    <span>{team}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTeamPopupInput(team);
                          setTeamPopupMode(team as any);
                        }}
                        className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                        title="Rename Team"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (productTeams.length <= 1) {
                            alert("At least one Product Team must exist.");
                            return;
                          }
                          const activeProductsUsingTeam = products.filter(p => p.team === team && p.status !== 'Archived');
                          if (activeProductsUsingTeam.length > 0) {
                            alert(`Cannot delete team because it is currently linked to ${activeProductsUsingTeam.length} active products (e.g. "${activeProductsUsingTeam[0].name}").`);
                            return;
                          }
                          if (confirm(`Are you sure you want to delete Product Team "${team}"?`)) {
                            const updated = productTeams.filter(t => t !== team);
                            setProductTeams(updated);
                            if (detailTeam === team) {
                              setDetailTeam(updated[0]);
                            }
                            setProducts(prev => prev.map(p => p.team === team ? { ...p, team: updated[0] } : p));
                            setToast(`Product Team "${team}" removed.`);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Team"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTeamPopup(false)}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Popup Dialog */}
      {showCategoryPopup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 px-5 py-3.5 bg-gray-50">
              <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                Manage Product Categories
              </span>
              <button 
                onClick={() => setShowCategoryPopup(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">
                  {categoryPopupMode === 'create' ? 'Add New Category' : 'Rename Selected Category'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoryPopupInput}
                    onChange={(e) => setCategoryPopupInput(e.target.value)}
                    placeholder="e.g. Medical Care"
                    className="flex-1 px-3 py-1.5 border rounded-lg border-gray-300 focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-white h-9"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!categoryPopupInput.trim()) {
                        alert("Category name is required.");
                        return;
                      }
                      const trimmed = categoryPopupInput.trim();
                      if (categoryPopupMode === 'create') {
                        if (productGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
                          alert("A category with this name already exists.");
                          return;
                        }
                        const updated = [...productGroups, trimmed];
                        setProductGroups(updated);
                        setDetailGroup(trimmed);
                        setToast(`Category "${trimmed}" added.`);
                      } else {
                        // Rename
                        const oldName = categoryPopupMode as string;
                        if (productGroups.some(g => g.toLowerCase() === trimmed.toLowerCase() && g !== oldName)) {
                          alert("A category with this name already exists.");
                          return;
                        }
                        const updated = productGroups.map(g => g === oldName ? trimmed : g);
                        setProductGroups(updated);
                        if (detailGroup === oldName) setDetailGroup(trimmed);
                        setProducts(prev => prev.map(p => p.group === oldName ? { ...p, group: trimmed } : p));
                        setToast(`Renamed category "${oldName}" to "${trimmed}".`);
                      }
                      setCategoryPopupInput('');
                      setCategoryPopupMode('create');
                    }}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm flex items-center justify-center gap-1 cursor-pointer h-9"
                  >
                    {categoryPopupMode === 'create' ? 'Add' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto border rounded-xl divide-y p-2 bg-gray-50/50">
                {productGroups.map((group, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 px-2 hover:bg-white rounded transition-colors text-xs font-semibold text-gray-700">
                    <span>{group}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryPopupInput(group);
                          setCategoryPopupMode(group as any);
                        }}
                        className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                        title="Rename Category"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (productGroups.length <= 1) {
                            alert("At least one Product Category must exist.");
                            return;
                          }
                          const activeProductsUsingGroup = products.filter(p => p.group === group && p.status !== 'Archived');
                          if (activeProductsUsingGroup.length > 0) {
                            alert(`Cannot delete category because it is currently linked to ${activeProductsUsingGroup.length} active products (e.g. "${activeProductsUsingGroup[0].name}").`);
                            return;
                          }
                          if (confirm(`Are you sure you want to delete Product Category "${group}"?`)) {
                            const updated = productGroups.filter(g => g !== group);
                            setProductGroups(updated);
                            if (detailGroup === group) {
                              setDetailGroup(updated[0]);
                            }
                            setProducts(prev => prev.map(p => p.group === group ? { ...p, group: updated[0] } : p));
                            setToast(`Product Category "${group}" removed.`);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Category"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryPopup(false)}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Benefit Modal Dialog */}
      {showAddBenefitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 px-5 py-3.5 bg-gray-50">
              <span className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                <Heart size={13} className="text-orange-600" />
                Add Benefit to "{selectedGmiGroup.name}"
              </span>
              <button 
                onClick={() => setShowAddBenefitModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs font-semibold">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAddBenefitMode('create')}
                  className={`flex-1 py-1.5 text-center rounded-md font-bold uppercase text-[9px] ${
                    addBenefitMode === 'create' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Create New Benefit
                </button>
                <button
                  type="button"
                  onClick={() => setAddBenefitMode('link')}
                  className={`flex-1 py-1.5 text-center rounded-md font-bold uppercase text-[9px] ${
                    addBenefitMode === 'link' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Link Existing Benefit
                </button>
              </div>

              {addBenefitMode === 'create' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Benefit Name *</label>
                  <input
                    type="text"
                    value={newBenefitName}
                    onChange={(e) => setNewBenefitName(e.target.value)}
                    placeholder="e.g. Dental Benefit"
                    className="w-full px-3 py-2 border rounded-lg border-gray-300 focus:border-orange-500 outline-none font-bold text-gray-800 bg-white text-xs h-9"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Select Existing Benefit *</label>
                  <select
                    value={selectedExistingBenefitId}
                    onChange={(e) => setSelectedExistingBenefitId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border rounded-lg border-gray-300 bg-white focus:border-orange-500 outline-none font-semibold cursor-pointer"
                  >
                    <option value="">-- Choose Benefit --</option>
                    {benefitsMaster
                      .filter(b => b.status === 'Active' && !(selectedDetailedProduct?.benefits || []).includes(b.id))
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddBenefitModal(false)}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (addBenefitMode === 'create') {
                    if (!newBenefitName.trim()) {
                      alert("Please specify a benefit name.");
                      return;
                    }
                    handleCreateAndLinkBenefit(newBenefitName.trim());
                  } else {
                    if (!selectedExistingBenefitId) {
                      alert("Please select a benefit to link.");
                      return;
                    }
                    handleLinkExistingBenefit(selectedExistingBenefitId);
                  }
                  setShowAddBenefitModal(false);
                }}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm cursor-pointer"
              >
                Add Benefit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Coverage Modal Dialog */}
      {showAddCoverageModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 px-5 py-3.5 bg-gray-50">
              <span className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                <Globe size={13} className="text-orange-600" />
                Add Coverage to "{selectedGmiGroup.name}"
              </span>
              <button 
                onClick={() => setShowAddCoverageModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs font-semibold">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAddCoverageMode('create')}
                  className={`flex-1 py-1.5 text-center rounded-md font-bold uppercase text-[9px] ${
                    addCoverageMode === 'create' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Create New Coverage
                </button>
                <button
                  type="button"
                  onClick={() => setAddCoverageMode('link')}
                  className={`flex-1 py-1.5 text-center rounded-md font-bold uppercase text-[9px] ${
                    addCoverageMode === 'link' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Link Existing Coverage
                </button>
              </div>

              {addCoverageMode === 'create' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Coverage Name *</label>
                  <input
                    type="text"
                    value={newCoverageName}
                    onChange={(e) => setNewCoverageName(e.target.value)}
                    placeholder="e.g. Europe & North America"
                    className="w-full px-3 py-2 border rounded-lg border-gray-300 focus:border-orange-500 outline-none font-bold text-gray-800 bg-white text-xs h-9"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Select Existing Coverage *</label>
                  <select
                    value={selectedExistingCoverageId}
                    onChange={(e) => setSelectedExistingCoverageId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border rounded-lg border-gray-300 bg-white focus:border-orange-500 outline-none font-semibold cursor-pointer"
                  >
                    <option value="">-- Choose Coverage --</option>
                    {coveragesMaster
                      .filter(c => c.status === 'Active' && !(selectedDetailedProduct?.coverages || []).includes(c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-150 px-5 py-3 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCoverageModal(false)}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold uppercase text-[9px] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (addCoverageMode === 'create') {
                    if (!newCoverageName.trim()) {
                      alert("Please specify a coverage name.");
                      return;
                    }
                    handleCreateAndLinkCoverage(newCoverageName.trim());
                  } else {
                    if (!selectedExistingCoverageId) {
                      alert("Please select a coverage to link.");
                      return;
                    }
                    handleLinkExistingCoverage(selectedExistingCoverageId);
                  }
                  setShowAddCoverageModal(false);
                }}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[9px] rounded-lg shadow-sm cursor-pointer"
              >
                Add Coverage
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductsConfiguration;
