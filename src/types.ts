export type UserRole = 'Requester' | 'Department HOD' | 'IT Admin' | 'Software Developer' | 'System Admin';

export type TicketCategory =
  | 'Hardware'
  | 'Software'
  | 'Network'
  | 'Email & Microsoft 365'
  | 'User Account & Access'
  | 'Printer & Scanning'
  | 'Security'
  | 'Server & Infrastructure'
  | 'Business Applications'
  | 'IT Request'
  | 'Other';

export type TicketIssueType =
  | 'Incident'
  | 'Service Request'
  | 'Access Request'
  | 'Information / How-To'
  | 'Password / Account'
  | 'Change Request';

export type RequestType =
  | TicketIssueType
  | 'Bug Fix'
  | 'Enhancement'
  | 'New Feature'
  | 'Data Amendment';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// ==========================================
// UNIFIED IT SERVICE CATALOG RELATIONAL SCHEMA
// ==========================================

export interface CategoryMaster {
  id: string;
  name: TicketCategory;
  code: string;
  description: string;
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ServiceMaster {
  id: string;
  categoryId: string;
  categoryName: TicketCategory;
  name: string;
  code: string;
  description?: string;
  isAssetBased: boolean; // True for Hardware, Printers, Scanners etc.
  displayOrder: number;
  isActive: boolean;
}

export interface ApplicationAssetMaster {
  id: string;
  serviceId: string;
  serviceName: string;
  categoryId: string;
  name: string;
  code: string;
  type: 'Application' | 'Asset';
  assetTag?: string; // e.g. LAPTOP-TEM-0234, DESKTOP-HQ-0199
  serialNumber?: string;
  location?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  hasApplicationArea: boolean; // True if configurable with Module -> SubFunction -> Process (e.g. PCS.NET, APMS.NET, SOMS)
  description?: string;
  isActive: boolean;
}

export interface IssueTypeMaster {
  id: string;
  name: TicketIssueType | string;
  code: string;
  description: string;
  badgeColor: string;
  defaultPriority: PriorityLevel;
  isActive: boolean;
  displayOrder: number;
}

export interface ApplicationModuleMaster {
  id: string;
  applicationId: string; // References ApplicationAssetMaster (e.g. app-pcs-net)
  applicationName: string;
  code: string; // e.g. 107_PCS.NET, 101_APMS.NET, 104_E-INVOICE.NET
  name: string;
  description?: string;
  leadDeveloper?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ApplicationSubFunctionMaster {
  id: string;
  moduleId: string; // References ApplicationModuleMaster
  moduleCode: string;
  code: string;
  name: string; // e.g. CD2 Wire Operations, Spool Management
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ApplicationProcessMaster {
  id: string;
  subFunctionId: string; // References ApplicationSubFunctionMaster
  subFunctionName: string;
  code: string;
  name: string; // e.g. CD2 Issue Case ID, Spool Trace Label Issue
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ApplicationAreaSelection {
  id: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  subFunctionId?: string;
  subFunctionName?: string;
  processId?: string;
  processName?: string;
}

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending HOD Approval'
  | 'Returned to Requester'
  | 'Pending IT Admin Review'
  | 'In Progress'
  | 'Pending IT Verification'
  | 'Closed (Completed)'
  | 'Closed (Rejected)';

export interface Department {
  id: number;
  name: string;
  code: string;
  hodUserId: string;
  hodName: string;
  hodEmail: string;
}

export type DelegationReason =
  | 'Annual Leave'
  | 'Medical Leave / Emergency'
  | 'Business Travel / Duty Outstation'
  | 'Resignation / Transition Handover'
  | 'Special Assignment'
  | 'Other';

export interface TemporaryApproverDelegation {
  id: string; // e.g. DEL-2026-0001
  departmentId: number;
  departmentName: string;
  hodUserId: string;
  hodName: string;
  hodEmail: string;
  delegateUserId: string;
  delegateName: string;
  delegateEmail: string;
  delegateRole?: UserRole;
  startDate: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  endDate: string;   // YYYY-MM-DD or YYYY-MM-DD HH:mm
  reason: DelegationReason;
  notes?: string;
  status: 'Active' | 'Expired' | 'Revoked';
  createdAt: string;
  createdBy: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  password?: string;
  departmentId: number;
  departmentName: string;
  role: UserRole;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  status?: 'Active' | 'Pending IT Approval' | 'Suspended';
  registeredAt?: string;
}

export interface SmtpConfig {
  smtpServer: string;
  smtpPort: number;
  fromAddress: string;
  fromName: string;
}

export interface EmailNotificationLog {
  id: string;
  changeRequestId?: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  sentAt: string;
  smtpServer: string;
  smtpPort: number;
  status: 'DELIVERED (250 OK)' | 'PENDING' | 'FAILED';
  triggerEvent: string;
}

export interface StorageConfig {
  id: string;
  storageType: 'UNC_NETWORK_SHARE' | 'LOCAL_DIRECTORY' | 'ENTERPRISE_SAN_NAS' | 'ENCRYPTED_CLOUD_VAULT';
  storageLocationPath: string; // e.g. \\tanaka-nas01.corp.internal\PCS_Attachments\prod_vault\
  backupLocationPath?: string;
  subfolderPattern: 'YEAR_MONTH' | 'YEAR_MONTH_CRID' | 'DEPARTMENT_CRID' | 'FLAT';
  encryptionAtRest: boolean;
  maxFileSizeMb: number;
  allowedExtensions: string[];
  lastTestedStatus: 'HEALTHY' | 'WARNING' | 'UNREACHABLE' | 'CONFIGURING';
  lastTestedAt: string;
  updatedBy: string;
  updatedAt: string;
  totalFilesStored?: number;
  totalBytesConsumedMb?: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  storedPath?: string; // Secure physical path on server/NAS (Visible ONLY to Admin & IT)
  storageVaultId?: string;
  fileChecksum?: string;
  encryptionAlgorithm?: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  changeRequestId: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole | 'Acting Department HOD' | string;
  actionDate: string;
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  decision:
    | 'Submitted'
    | 'Approved'
    | 'Rejected'
    | 'Sent Back'
    | 'Returned for Clarification'
    | 'Assigned'
    | 'Status Update'
    | 'Verified'
    | 'Closed'
    | 'Resubmitted to IT'
    | 'HOD Bypassed (Critical)'
    | 'Priority Changed by IT'
    | 'Category Changed by IT'
    | 'Reassigned by IT'
    | 'IT Direct Modification'
    | 'Reopened';
  comments: string;
}

export interface ChangeRequest {
  id: string; // e.g. PCS-CR-2026-00001 or IT-REQ-2026-00001
  title: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  departmentId: number;
  departmentName: string;
  // Unified Relational Classification
  categoryId?: string;
  categoryName?: TicketCategory;
  category?: TicketCategory;
  serviceId?: string;
  serviceName?: string;
  subcategory?: string;
  applicationAssetId?: string;
  applicationAssetName?: string;
  applicationName?: string;
  assetTag?: string;
  issueTypeId?: string;
  issueTypeName?: TicketIssueType;
  issueType?: TicketIssueType;
  requestType: RequestType;
  priority: PriorityLevel;
  priorityChangeReason?: string;
  priorityChangedBy?: string;
  priorityChangedAt?: string;
  categoryChangedBy?: string;
  categoryChangedAt?: string;
  reassignedBy?: string;
  reassignedAt?: string;
  hodApprovalSkipped?: boolean;
  hodSkipReason?: string;
  applicationAreas?: ApplicationAreaSelection[];
  affectedModules: string[];
  currentBehaviorDescription: string;
  requestedChangeDescription: string;
  businessJustification: string;
  attachments: Attachment[];
  requestedCompletionDate: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  hodApprovedAt?: string;
  hodApprovedBy?: string;
  returnedByRole?: 'Department HOD' | 'IT Admin' | 'Software Developer' | 'System Admin';
  itClarificationRequested?: boolean;
  assignedDeveloperId?: string;
  assignedDeveloperName?: string;
  implementationNotes?: string;
  hasCodeOrDatabaseChanges?: boolean;
  beforeChangeDetails?: string;
  afterChangeDetails?: string;
  actualCompletionDate?: string;
  // Rejection & Reopen Tracking
  rejectedByUserId?: string;
  rejectedByName?: string;
  rejectedByRole?: 'IT Admin' | 'System Admin' | 'Software Developer' | 'Department HOD' | 'Acting Department HOD' | string;
  rejectedAt?: string;
  rejectionReason?: string;
  reopenedByUserId?: string;
  reopenedByName?: string;
  reopenedAt?: string;
  reopenComments?: string;
  approvalHistory: ApprovalHistoryEntry[];
  targetCompletionDate?: string;
  slaTargetHours?: number;
  riskAssessment?: {
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Severe';
    downtimeRequired: boolean;
    schemaChangeRequired: boolean;
  };
  revisionHistory?: {
    revisionNumber: number;
    title: string;
    requestedChangeDescription: string;
    currentBehaviorDescription: string;
    updatedAt: string;
    comments?: string;
  }[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  changeRequestId?: string;
}

export interface PcsModule {
  id: string;
  name: string;
  description: string;
  leadDeveloper: string;
  active: boolean;
}

export interface ItDirectModifyPayload {
  crId: string;
  categoryId?: string;
  categoryName?: TicketCategory;
  category?: TicketCategory;
  serviceId?: string;
  serviceName?: string;
  subcategory?: string;
  applicationAssetId?: string;
  applicationAssetName?: string;
  applicationName?: string;
  issueTypeId?: string;
  issueTypeName?: TicketIssueType;
  issueType?: TicketIssueType;
  priority: PriorityLevel;
  priorityChangeReason?: string;
  assignedDeveloperId?: string;
  assignedDeveloperName?: string;
  targetCompletionDate?: string;
  comments?: string;
}

export interface CodeFile {
  path: string;
  category: 'Program & Config' | 'Database SQL (RLS)' | 'EF Core Models' | 'Controllers' | 'Razor Views' | 'Documentation';
  language: 'csharp' | 'sql' | 'json' | 'razor' | 'markdown';
  content: string;
}
