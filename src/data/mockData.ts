import { Department, UserProfile, ChangeRequest, PcsModule, NotificationItem, SmtpConfig, EmailNotificationLog, StorageConfig, TemporaryApproverDelegation } from '../types';

export const defaultStorageConfig: StorageConfig = {
  id: 'vault-tanaka-prod-01',
  storageType: 'UNC_NETWORK_SHARE',
  storageLocationPath: '\\\\tanaka-nas01.corp.internal\\PCS_Attachments\\prod_vault\\',
  backupLocationPath: '\\\\tanaka-nas-dr02.corp.internal\\PCS_Attachments_Backup\\',
  subfolderPattern: 'YEAR_MONTH_CRID',
  encryptionAtRest: true,
  maxFileSizeMb: 25,
  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.xlsx', '.docx', '.txt', '.zip', '.log'],
  lastTestedStatus: 'HEALTHY',
  lastTestedAt: '2026-08-20 19:30',
  updatedBy: 'David Ng (IT Admin)',
  updatedAt: '2026-08-20 19:30',
  totalFilesStored: 0,
  totalBytesConsumedMb: 0,
};

export const defaultSmtpConfig: SmtpConfig = {
  smtpServer: '157.9.183.242',
  smtpPort: 25,
  fromAddress: 'Administrator@tanaka.com.my',
  fromName: 'IT OPS',
};

export const mockDepartments: Department[] = [
  { id: 1, name: 'General Manager', code: 'GM', hodUserId: 'user-hod-gm', hodName: 'Mr. Fukui', hodEmail: 'fukui@ml.tanaka.co.jp' },
  { id: 2, name: 'Human Resources', code: 'HR', hodUserId: 'user-hod-hr', hodName: 'Chong Jun Leong (Mr. Chong)', hodEmail: 'chong@tanaka.com.my' },
  { id: 3, name: 'TKK Marketing', code: 'MKT', hodUserId: 'user-hod-mkt', hodName: 'CS Tan (Mr. CS Tan)', hodEmail: 'cstan@ml.tanaka.co.jp' },
  { id: 4, name: 'Engineering & Quality', code: 'EQ', hodUserId: 'user-hod-eq', hodName: 'Tye Ching Foa (Mr. CF Tye)', hodEmail: 'CFTYE@tanaka.com.my' },
  { id: 5, name: 'Security', code: 'SEC', hodUserId: 'user-hod-sec', hodName: 'Yusriman Ismail (Mr. Yusriman)', hodEmail: 'YUS@tanaka.com.my' },
  { id: 6, name: 'Production Engineering', code: 'PE', hodUserId: 'user-hod-pe', hodName: 'Hafidhzul (Mr. Hafidhzul)', hodEmail: 'HAFIDHZUL@tanaka.com.my' },
  { id: 7, name: 'Production', code: 'PROD', hodUserId: 'user-hod-prod', hodName: 'Loh Pui Ling (Ms. Astrid)', hodEmail: 'ASTRID@tanaka.com.my' },
  { id: 8, name: 'IT', code: 'IT', hodUserId: 'user-hod-it', hodName: 'Nakamura Takahiro (Mr. Nakamura)', hodEmail: 'nakamu@ml.tanaka.co.jp' },
  { id: 9, name: 'Facility & Safety', code: 'EHS', hodUserId: 'user-hod-ehs', hodName: 'Mohd Azley Mohd Sharif (Mr. Azley)', hodEmail: 'AZLEY@tanaka.com.my' },
  { id: 10, name: 'BWM', code: 'BWM', hodUserId: 'user-hod-bwm', hodName: "Ch'ng Chin Chee (Mr. Gabriel)", hodEmail: 'GABRIEL@tanaka.com.my' },
  { id: 11, name: 'Administration', code: 'ADM', hodUserId: 'user-hod-adm', hodName: 'Khoo Lay Ean (Ms. LE Khoo)', hodEmail: 'LEKHOO@tanaka.com.my' },
];

export const mockUsers: UserProfile[] = [
  // IT Admins, Developers & System Admin
  {
    id: 'user-admin-it',
    fullName: 'David Ng',
    email: 'david.it@company.com',
    username: 'david.it',
    password: 'Pass@1234',
    departmentId: 8,
    departmentName: 'IT',
    role: 'IT Admin',
    status: 'Active',
  },
  {
    id: 'user-sys-admin',
    fullName: 'System Administrator',
    email: 'admin@tanaka.com.my',
    username: 'admin',
    password: 'Admin@2026',
    departmentId: 8,
    departmentName: 'IT',
    role: 'System Admin',
    status: 'Active',
  },
  {
    id: 'user-dev-1',
    fullName: 'Alex Chen',
    email: 'alex.chen@company.com',
    username: 'alex.chen',
    password: 'Pass@1234',
    departmentId: 8,
    departmentName: 'IT',
    role: 'Software Developer',
    status: 'Active',
  },
  {
    id: 'user-dev-2',
    fullName: 'Elena Rostova',
    email: 'elena.r@company.com',
    username: 'elena.rostova',
    password: 'Pass@1234',
    departmentId: 8,
    departmentName: 'IT',
    role: 'Software Developer',
    status: 'Active',
  },

  // All 11 Department HODs
  {
    id: 'user-hod-gm',
    fullName: 'Mr. Fukui',
    email: 'fukui@ml.tanaka.co.jp',
    username: 'fukui.gm',
    password: 'Pass@1234',
    departmentId: 1,
    departmentName: 'General Manager',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-hr',
    fullName: 'Chong Jun Leong (Mr. Chong)',
    email: 'chong@tanaka.com.my',
    username: 'chong.jl',
    password: 'Pass@1234',
    departmentId: 2,
    departmentName: 'Human Resources',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-mkt',
    fullName: 'CS Tan (Mr. CS Tan)',
    email: 'cstan@ml.tanaka.co.jp',
    username: 'cstan',
    password: 'Pass@1234',
    departmentId: 3,
    departmentName: 'TKK Marketing',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-eq',
    fullName: 'Tye Ching Foa (Mr. CF Tye)',
    email: 'CFTYE@tanaka.com.my',
    username: 'cftye',
    password: 'Pass@1234',
    departmentId: 4,
    departmentName: 'Engineering & Quality',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-sec',
    fullName: 'Yusriman Ismail (Mr. Yusriman)',
    email: 'YUS@tanaka.com.my',
    username: 'yusriman',
    password: 'Pass@1234',
    departmentId: 5,
    departmentName: 'Security',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-pe',
    fullName: 'Hafidhzul (Mr. Hafidhzul)',
    email: 'HAFIDHZUL@tanaka.com.my',
    username: 'hafidhzul',
    password: 'Pass@1234',
    departmentId: 6,
    departmentName: 'Production Engineering',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-prod',
    fullName: 'Loh Pui Ling (Ms. Astrid)',
    email: 'ASTRID@tanaka.com.my',
    username: 'astrid.loh',
    password: 'Pass@1234',
    departmentId: 7,
    departmentName: 'Production',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-it',
    fullName: 'Nakamura Takahiro (Mr. Nakamura)',
    email: 'nakamu@ml.tanaka.co.jp',
    username: 'nakamura',
    password: 'Pass@1234',
    departmentId: 8,
    departmentName: 'IT',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-ehs',
    fullName: 'Mohd Azley Mohd Sharif (Mr. Azley)',
    email: 'AZLEY@tanaka.com.my',
    username: 'azley',
    password: 'Pass@1234',
    departmentId: 9,
    departmentName: 'Facility & Safety',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-bwm',
    fullName: "Ch'ng Chin Chee (Mr. Gabriel)",
    email: 'GABRIEL@tanaka.com.my',
    username: 'gabriel.chng',
    password: 'Pass@1234',
    departmentId: 10,
    departmentName: 'BWM',
    role: 'Department HOD',
    status: 'Active',
  },
  {
    id: 'user-hod-adm',
    fullName: 'Khoo Lay Ean (Ms. LE Khoo)',
    email: 'LEKHOO@tanaka.com.my',
    username: 'le.khoo',
    password: 'Pass@1234',
    departmentId: 11,
    departmentName: 'Administration',
    role: 'Department HOD',
    status: 'Active',
  },
];

// Production Modules and System Hierarchy
export const mockModules: PcsModule[] = [
  { id: 'MOD-101', name: '101_APMS.NET', description: 'Accounts Payable Management System', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-102', name: '102_DIES.NET', description: 'Dies & Tooling Control Module', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-103', name: '103_ECN.NET', description: 'Engineering Change Notice System', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-104', name: '104_E-INVOICE.NET', description: 'Electronic Tax Invoicing Engine', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-105', name: '105_FA.NET', description: 'Fixed Assets Accounting Module', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-106', name: '106_MCS.NET', description: 'Material Control & Inventory System', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-107', name: '107_PCS.NET', description: 'Production Control Main Core System', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-108', name: '108_POWERBI.NET', description: 'PowerBI Analytics & Reporting Portal', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-109', name: '109_PROGRAMMASTER.NET', description: 'Program Master Configurator', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-110', name: '110_PRONET.NET', description: 'Production Network Dispatch Engine', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-111', name: '111_RESERVATION.NET', description: 'Inventory Reservation System', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-112', name: '112_SHIPPING.NET', description: 'Shipping & Logistics Program', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-113', name: '113_SOMS.NET', description: 'Sales Order Management System', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-114', name: '114_VMS.NET', description: 'Vendor Management System', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-115', name: '115_MPC.NET', description: 'Material Production Control', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-116', name: '116_CERTIFICATE.NET', description: 'Certificate Management System', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-118', name: '118_ASSETEXIT(VB6)', description: 'Asset Exit Legacy Subsystem', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-119', name: '119_SPL1_Prod Support Issue Trace Label', description: 'Spool Trace Label Issue Program', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-120', name: '120_SPL2_PS Issue Request Spool For Wcard', description: 'Spool Request For Wildcard Program', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-121', name: '121_SPL3_Spool Receiving Program', description: 'Spool Receiving Management Program', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-122', name: '122_SPL4_Spool Shipping Program', description: 'Spool Shipping Program', leadDeveloper: 'Alex Chen', active: true },
  { id: 'MOD-123', name: '123_SPL5_Spool Transfer Program', description: 'Spool Transfer Program', leadDeveloper: 'Elena Rostova', active: true },
  { id: 'MOD-124', name: '124_SPL6_Empty Spool Return Program', description: 'Empty Spool Return Program', leadDeveloper: 'Elena Rostova', active: true },
];

export type ModuleHierarchyMap = Record<string, Record<string, string[]>>;

export const defaultModuleHierarchy: ModuleHierarchyMap = {
  '107_PCS.NET': {
    'CD2 Wire Operations': [
      'Wire Receive From MCS',
      'CD2 Issue Case ID',
      'CD2 Comm Update',
      'Register CD2 Scrap',
      'CD2 WorkCard Close',
      'CD2 Diameter Value',
      'CD2 Transfer to MCS',
      'CD2 Transfer to MCS NEW DESIGN',
    ],
    'Spool Management': [
      'Spool Trace Label Issue',
      'Spool Request For WildCard',
      'Spool Receiving Program',
      'Spool Shipping Program',
      'Spool Transfer Program',
      'Empty Spool Return',
    ],
  },
  '101_APMS.NET': {
    'Accounts Payable': [
      'AP Tax Invoice Verification',
      'Batch Voucher Posting',
      'Vendor Payment Reconciliation',
    ],
  },
  '104_E-INVOICE.NET': {
    'Tax Validation': [
      'EU VIES VAT Auto-Validation',
      'Reverse Charge Invoice Generator',
      'E-Invoice Digital Signature',
    ],
  },
};

// ==============================================================================
// PRODUCTION BASELINE COLLECTIONS (Zero Synthetic Fixtures / Mock Records)
// Real transactions and tickets are loaded dynamically from the PostgreSQL database
// ==============================================================================

export const mockChangeRequests: ChangeRequest[] = [];
export const mockDelegations: TemporaryApproverDelegation[] = [];
export const mockNotifications: NotificationItem[] = [];
export const mockEmailLogs: EmailNotificationLog[] = [];

export const productionDepartments = mockDepartments;
export const productionUsers = mockUsers;
