export type DataSource = 'CRM' | 'CONFIG' | 'MANUAL' | 'CALC' | 'MCR' | 'MPF-UPLOAD';

export type ProductType = 'Insurance-Individual' | 'Insurance-Group-EBP' | 'MPF';
export type PolicyStatus = 'Draft' | 'Active' | 'Renewal Due' | 'Renewed' | 'Lapsed';
export type MPFStatus = 'Active' | 'Draft' | 'Inactive';

export type ProposalStage = 'Draft' | 'SOB' | 'Finalize' | 'Policy' | 'Lost';
export type ActivityType = 'Call' | 'Meeting' | 'Email';
export type ComplianceStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export type CustomerType = 'Company' | 'Individual';
export type PaymentType = 'Commission' | 'Fee' | 'Bonus' | 'Upfront' | 'Recurring';
export type PaymentFrequency = 'Monthly' | 'Quarterly' | 'Yearly' | 'One-off';
export type CommissionStatus = 'Pending' | 'Received' | 'Paid';
export type RevenueType = 'Commission' | 'Service Fee' | 'Advisory' | 'Premium Revenue' | 'Commission Revenue';
export type RecognitionMethod = 'Straight Line' | 'Front Loaded' | 'Cash Basis' | 'Monthly' | 'Upfront';
export type RevenueStatus = 'Planned' | 'Recognized' | 'Deferred' | 'Partially Recognized';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Issued';

export interface Company {
  id: string;
  name: string;
  chineseName?: string;
  type: string;
  registrationNo: string;
  industry: string;
  region: string;
  country: string;
  parentCompany?: string;
  assignedSales: string;
  team: string;
  status: string;
  createdDate: string;
  lastUpdated: string;
}

export interface Individual {
  id: string;
  fullName: string;
  chineseName?: string;
  gender: string;
  dateOfBirth: string;
  hkidPassport: string;
  jobTitle: string;
  department: string;
  email: string;
  directLine: string;
  mobile: string;
  address: string;
  region: string;
  country: string;
  linkedCompanyId?: string;
  roleType: string;
  status: string;
  createdDate: string;
  lastUpdated: string;
}

export interface ComplianceRecord {
  id: string;
  individualId: string;
  status: ComplianceStatus;
  kycStatus: string;
  amlStatus: string;
  riskLevel: RiskLevel;
  lastCheckedDate: string;
  expiryDate: string;
  checkedBy: string;
  reviewNotes: string;
  rejectionReason?: string;
  linkedDocumentsCount: number;
}

export interface Lead {
  id: string;
  type: CustomerType;
  leadName: string;
  companyName: string; // Used if type is Company
  contactPerson: string; // Used as display name or main contact
  contactTitle: string;
  email: string;
  phone: string;
  source: string;
  campaign: string;
  region: string;
  country?: string;
  assignedSales: string;
  leadStatus: 'New' | 'In Progress' | 'Converted' | 'Lost' | 'Nurturing' | 'Qualified';
  temperature: 'Cold' | 'Warm' | 'Hot';
  temperature_score: number;
  temperature_source: 'auto' | 'manual';
  lastContactDate?: string;
  followUpPriority?: 'High' | 'Medium' | 'Low';
  notesSummary: string;
  createdDate: string;
  lastUpdated: string;
  linkedProposalId?: string;
  // New domain fields
  hkidPassport?: string; // For Individual type
  gender?: string; // For Individual type
  industry?: string; // For Company type
  parentCompany?: string; // For Company type
}

export interface Proposal {
  id: string;
  name: string;
  stage: ProposalStage;
  probability: number;
  expectedRevenueGross: number;
  expectedRevenueNet: number;
  salesRep: string;
  splitRatio: string;
  campaign: string;
  source: string;
  businessType: 'NB' | 'Renewal';
  productCategory: string;
  productItem: string;
  effectiveDate: string;
  remarks: string;
  
  // Contacts
  contactPerson?: string; // Links to an Individual
  decisionMaker?: string; // Links to an Individual
  
  // Compliance Reference (Consumes, not owns)
  complianceStatus?: ComplianceStatus;
  complianceLastCheckedDate?: string;

  initialNotes?: string;
  opportunitySummary?: string;

  // Stage 30% Draft
  insurerTentative?: string;
  regionMarket?: string;
  proposalType?: string;
  expectedEffectiveDate?: string;
  existingProvider?: string;
  competitiveSituation?: string;
  complianceCheckStatus?: string;
  qualificationNotes?: string;
  product?: string;

  // Stage 70% SOB
  client?: string;
  insured?: string;
  insurer?: string;
  currency?: string;
  planType?: string;
  memberCountSummary?: string;
  noOfMembers?: number;
  pricingBasis?: string;
  premiumPerHead?: number;
  totalPremium?: number;
  premiumEstimate?: number;
  proposalPreparationStatus?: string;
  requiredDocumentsChecklist?: string[];
  internalReviewStatus?: string;

  // Stage 90% Finalize
  finalQuotedPremium?: number;
  discountCommercialAdjustment?: string;
  commissionPercentage?: number;
  negotiationStatus?: string;
  pendingIssues?: string;
  clientFeedbackSummary?: string;
  internalApprovalStatus?: string;
  finalReviewNote?: string;
  competitorInfo?: string;
  tenderRequirement?: boolean;

  // Stage 100% Won
  finalPremium?: number;
  finalCommission?: number;
  finalProductPlanConfirmation?: string;
  finalClientConfirmation?: string;
  wonDate?: string;
  activationReadyStatus?: string;
  finalRevenue?: number;
  contractDuration?: string;

  // Lost Fields
  lostReason?: 'Price' | 'Coverage' | 'Competitor' | 'Client Decision' | 'No Response' | 'Others';
  lostDate?: string;
  lostNotes?: string;

  // Proposal Core (Operations)
  policyType?: string;
  planStructure?: string;
  populationBreakdown?: string;
  benefitTable?: BenefitRow[];
  coverageTable?: string;
  pricingInputs?: string;
  calculationMethod?: string;

  // Analytics
  mcr: number;
  lossRatio: number;
  conversionRate: number;
  estimatedContribution: number;
  estimatedCommission: number;
  estimatedRevenue: number;
  aum: number;

  // System
  createdDate: string;
  lastUpdated: string;
  stageLastUpdated: string;
  owner: string;
  sourceSystem: string;
  linkedLeadId?: string;
  leadTemperature?: 'Cold' | 'Warm' | 'Hot';
  masterType?: 'Lead' | 'Customer' | 'Lapsed Customer'; // Whether the linked party is a Lead, an existing Customer, or a Lapsed Customer — drives the reach-100% conversion rules
  linkedCustomerId?: string;
  linkedPolicyId?: string;
  linkedInvoiceId?: string;
  linkedPreviousPolicyId?: string;
  linkedPreviousProspectId?: string; // Linked Prospect (backward) — last year's Prospect this renewal was auto-created from
  linkedNextProspectId?: string; // Linked Prospect (forward) — the renewal Prospect auto-created from this one
  detailedProductItem?: string; // Detailed Product Item under the GMI Product Group (7-layer product hierarchy)

  // Report & Dashboard
  salesRep1GrossAmount?: number;
  salesRep1NetAmount?: number;
  salesRep2GrossAmount?: number;
  salesRep2NetAmount?: number;
  salesRep3GrossAmount?: number;
  salesRep3NetAmount?: number;
  opptyRejectDate?: string;
  opptyRejectFrequency?: number;

  // Product File Requirements
  isFilterByProductItem?: boolean;
  productFileRequirements?: ProductFileRequirement[];
}

export interface ProductFileRequirement {
  id: string;
  name: string;
  type: 'Compulsory' | 'Optional';
  relatedProductItem: string;
  checkStage: string;
  fileName?: string;
}

export interface CRMRemark {
  id: string;
  leadId: string;
  content: string;
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

export interface BenefitRow {
  id: string;
  class: string;
  benefit: string;
  coverage: string;
  category: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  relatedObject: string; // Proposal ID or Lead ID
  relatedObjectType: 'Proposal' | 'Lead';
  owner: string;
  date: string;
  subject: string;
}

export interface Compliance {
  id: string;
  relatedProposalId: string;
  status: ComplianceStatus;
  reviewer: string;
  checklist: { item: string; completed: boolean }[];
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  parentCompany?: string;
  customerCode: string;
  salesperson: string;
  region: string;
  industry?: string;
  contacts?: Contact[];
  chineseName?: string;
  registrationNo?: string;
  country?: string;
  status?: string;
}

export interface Contact {
  id: string;
  fullName: string;
  company: string;
  jobTitle: string;
  phone: string;
  directLine: string;
  mobile: string;
  email: string;
  validity: 'Valid' | 'Invalid';
  type: 'Primary' | 'Secondary';
}

export interface Campaign {
  id: string;
  name: string;
  eventDate: string;
  mode: string;
  category: string;
  responsible: string;
  contacts: number;
  registered: number;
  attended: number;
  oppty: number;
  activities: number;
  active: boolean;
}

export interface Policy {
  id: string;
  policyNo: string;
  customer: string;
  provider: string;
  effectiveDate: string;
  expiryDate: string;
  premiumTotal: number;
  annualizedPremium: number;
  status: PolicyStatus;
  renewRequired: boolean;
  crmProposalId: string; // [CRM]
  sourceProposalId?: string; // [CRM] - Link back to the proposal that generated this policy
  crmProposalStatus: string; // [CRM]
  // Additional fields for 360 view
  productType: ProductType;
  currency: string;
  billingMethod: string;
  debitNoteNo: string;
  lostLapsedReason?: string;
  remarks: string;
  customerCode: string;
  industry: string;
  parentCompany?: string;
  subsidiaryBranch?: string;
  providerCode: string;
  productPlanRef: string;
  salesOwner: string;
  salesTeam: string;
  referrerProducer: string;
  premiumFrequency: string;
  premiumType: string;
  grossPremium: number;
  netPremium: number;
  commissionRate: number;
  clientDiscountAmount: number;
  lastUpdated: string;
  documentCount: number;
  renewalProposalId?: string;
}

export interface PolicyBenefit {
  id: string;
  planName: string;
  employeeClass: string;
  benefit: string;
  coverage: string;
  coverageCategory: string;
  valueLimit: string;
  headcountEmployee: number;
  headcountSpouse: number;
  headcountChildren: number;
  headcountOther: number;
}

export interface PolicyHistory {
  id: string;
  timestamp: string;
  eventType: string;
  performedBy: string;
  remark: string;
}

export interface MPFAccount {
  id: string;
  accountId: string;
  customer: string;
  provider: string;
  scheme: string;
  clientCode: string;
  latestAUM: number;
  lastStatementTotal: number;
  currency: string;
  status: MPFStatus;
  company: string;
  crmProposalId: string; // [CRM]
}

export interface MPFStatement {
  id: string;
  statementId: string;
  company: string;
  provider: string;
  commissionDate: string;
  statementDate: string;
  totalAmount: number;
  remark: string;
  status: 'Updating' | 'Completed';
}

export interface Document {
  id: string;
  fileName: string;
  category: string;
  linkedObject: string;
  linkedObjectType: 'Policy' | 'MPFAccount' | 'Proposal (CRM)';
  uploadedBy: string;
  uploadDate: string;
  version: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  objectType: 'Proposal' | 'Policy' | 'MPFAccount' | 'Lead' | 'Customer' | 'System';
  action: 'Sync' | 'Create' | 'Update' | 'Auth' | 'Backup';
  status: 'Success' | 'Error' | 'Pending' | 'Warning';
  errorMessage?: string;
  sourceSystem?: string;
  targetSystem?: string;
}

export interface CommissionRecord {
  id: string;
  sourcePolicyId: string;
  sourceProposalId: string;
  client: string;
  insurer: string;
  product: string;
  businessType: 'NB' | 'Renewal';
  premium: number;
  commissionRate: number;
  commissionAmount: number;
  paymentType: PaymentType;
  paymentFrequency: PaymentFrequency;
  status: CommissionStatus;
  currency: string;
  createdDate: string;
}

export interface RevenueRecord {
  id: string;
  sourcePolicyId: string;
  revenueType: RevenueType;
  totalAmount: number;
  recognizedAmount: number;
  remainingAmount: number;
  recognitionMethod: RecognitionMethod;
  recognitionStartDate: string;
  recognitionEndDate: string;
  status: RevenueStatus;
  currency: string;
}

export interface InvoiceRecord {
  id: string;
  sourceProposalId: string;
  sourcePolicyId?: string;
  client: string;
  invoiceAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}
