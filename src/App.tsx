/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import {
  UserProfile,
  Department,
  ChangeRequest,
  RequestStatus,
  ApprovalHistoryEntry,
  NotificationItem,
  SmtpConfig,
  EmailNotificationLog,
  StorageConfig,
  CategoryMaster,
  ServiceMaster,
  ApplicationAssetMaster,
  IssueTypeMaster,
  ApplicationModuleMaster,
  ApplicationSubFunctionMaster,
  ApplicationProcessMaster,
  TemporaryApproverDelegation,
  DelegationReason,
} from './types';
import {
  MASTER_CATEGORIES,
  MASTER_SERVICES,
  MASTER_APPLICATIONS_ASSETS,
  MASTER_ISSUE_TYPES,
  MASTER_APPLICATION_MODULES,
  MASTER_APPLICATION_SUBFUNCTIONS,
  MASTER_APPLICATION_PROCESSES,
} from './data/serviceCatalog';
import {
  mockDepartments,
  mockUsers,
  defaultModuleHierarchy,
  ModuleHierarchyMap,
  defaultSmtpConfig,
  defaultStorageConfig,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ChangeRequestForm } from './components/ChangeRequestForm';
import { MyRequestsView } from './components/MyRequestsView';
import { HodQueueView } from './components/HodQueueView';
import { ItAdminQueueView } from './components/ItAdminQueueView';
import { DeveloperKanbanView } from './components/DeveloperKanbanView';
import { ClosedCasesView } from './components/ClosedCasesView';
import { RequestDetailModal } from './components/RequestDetailModal';
import { AdminUserMgmtView } from './components/AdminUserMgmtView';
import { ReportsView } from './components/ReportsView';
import { HowToUseView } from './components/HowToUseView';
import { LoginModal } from './components/LoginModal';
import { SmtpConsoleModal } from './components/SmtpConsoleModal';
import { ItDirectModifyPayload } from './components/ItDirectModifyModal';
import {
  createWelcomeAccountEmail,
  createStateTransitionEmail,
  createUserApprovedEmail,
  createUserDepartmentReassignedEmail,
  createAdminEmergencyPasswordResetEmail,
  createTemporaryApproverAssignedEmail,
  createDelegationRevokedEmail,
  createItDirectModificationEmail,
} from './utils/emailNotifier';
import { getUserDelegationContext } from './utils/delegationUtils';
import { getPrioritySlaHours } from './utils/slaAndRisk';
import { generateVerificationOtp } from './utils/passwordPolicy';
import { Mail, LogOut } from 'lucide-react';

export default function App() {
  // Active User State (Stored in localStorage, defaults to IT Admin)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pcs_current_user_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse current user from storage:', err);
    }
    return mockUsers[0]; // Baseline IT Admin (David Ng)
  });

  // Master State Collections (Production - empty default, hydrated from PostgreSQL)
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_change_requests_prod');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  // Hydrate change requests, users, departments, delegations, and email logs from backend PostgreSQL
  useEffect(() => {
    let isMounted = true;

    // Check DB status & heartbeat
    api.getDbStatus().then((status) => {
      if (isMounted) {
        setBackendConnected(status.connected);
      }
    }).catch(() => {
      if (isMounted) setBackendConnected(false);
    });

    // 1. Change Requests
    api.getChangeRequests().then((res) => {
      if (isMounted && res.success && Array.isArray(res.data)) {
        setChangeRequests(res.data);
        try {
          localStorage.setItem('pcs_change_requests_prod', JSON.stringify(res.data));
        } catch { /* ignore */ }
      }
    }).catch(() => {});

    // 2. Users
    api.getUsers().then((res) => {
      if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data);
      }
    }).catch(() => {});

    // 3. Departments
    api.getDepartments().then((res) => {
      if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDepartments(res.data);
      }
    }).catch(() => {});

    // 4. Delegations
    api.getDelegations().then((res) => {
      if (isMounted && res.success && Array.isArray(res.data)) {
        setDelegations(res.data);
      }
    }).catch(() => {});

    // 5. Email Logs
    api.getEmailLogs().then((res) => {
      if (isMounted && res.success && Array.isArray(res.data)) {
        setEmailLogs(res.data);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Temporary Approver Delegations Database State (localStorage backed + PostgreSQL synced)
  const [delegations, setDelegations] = useState<TemporaryApproverDelegation[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_delegations_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse delegations from storage:', err);
    }
    return [];
  });

  const handleSaveDelegation = (data: {
    departmentId: number;
    departmentName: string;
    hodUserId: string;
    hodName: string;
    hodEmail: string;
    delegateUserId: string;
    delegateName: string;
    delegateEmail: string;
    delegateRole: string;
    startDate: string;
    endDate: string;
    reason: DelegationReason;
    notes?: string;
  }) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newId = `DEL-2026-${String(delegations.length + 1).padStart(4, '0')}`;
    const newDelegation: TemporaryApproverDelegation = {
      id: newId,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      hodUserId: data.hodUserId,
      hodName: data.hodName,
      hodEmail: data.hodEmail,
      delegateUserId: data.delegateUserId,
      delegateName: data.delegateName,
      delegateEmail: data.delegateEmail,
      delegateRole: data.delegateRole as any,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      notes: data.notes,
      status: 'Active',
      createdAt: now,
      createdBy: data.hodName,
    };

    const updated = [newDelegation, ...delegations];
    setDelegations(updated);
    try {
      localStorage.setItem('pcs_delegations_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save delegations:', e);
    }

    // Persist to PostgreSQL database
    api.saveDelegation(newDelegation).catch((err) => console.warn('[DB Save Delegation Notice]', err));

    // Dispatch automated SMTP notification to delegate & HOD
    const emailLog = createTemporaryApproverAssignedEmail(
      {
        departmentName: data.departmentName,
        hodName: data.hodName,
        hodEmail: data.hodEmail,
        delegateName: data.delegateName,
        delegateEmail: data.delegateEmail,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        notes: data.notes,
      },
      smtpConfig
    );
    dispatchEmailLog(emailLog);

    // Dispatch UI notification to delegate
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: data.delegateUserId,
      title: '⚡ Temporary Approver Authority Assigned',
      message: `${data.hodName} assigned you as Acting Approver for ${data.departmentName} (${data.startDate.split(' ')[0]} to ${data.endDate.split(' ')[0]}).`,
      createdAt: now,
      read: false,
    };
    setNotifications([notif, ...notifications]);
  };

  const handleRevokeDelegation = (delegationId: string, revocationReason: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let targetDel: TemporaryApproverDelegation | undefined;

    const updated = delegations.map((d) => {
      if (d.id === delegationId) {
        targetDel = d;
        return {
          ...d,
          status: 'Revoked' as const,
          revokedAt: now,
          revokedBy: currentUser?.fullName || 'System',
          revocationReason,
        };
      }
      return d;
    });

    setDelegations(updated);
    try {
      localStorage.setItem('pcs_delegations_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save delegations:', e);
    }

    // Persist revocation to PostgreSQL database
    api.revokeDelegation(delegationId, currentUser?.fullName || 'System', revocationReason).catch((err) => console.warn('[DB Revoke Delegation Notice]', err));

    if (targetDel) {
      // Dispatch automated SMTP email for revocation
      const emailLog = createDelegationRevokedEmail(
        {
          departmentName: targetDel.departmentName,
          hodName: targetDel.hodName,
          delegateName: targetDel.delegateName,
          delegateEmail: targetDel.delegateEmail,
          hodEmail: targetDel.hodEmail,
          revocationReason,
        },
        smtpConfig
      );
      dispatchEmailLog(emailLog);

      // Dispatch UI notification
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: targetDel.delegateUserId,
        title: 'Delegation Authority Concluded / Revoked',
        message: `Your temporary approver authority for ${targetDel.departmentName} was concluded by ${currentUser.fullName}. Reason: ${revocationReason}`,
        createdAt: now,
        read: false,
      };
      setNotifications([notif, ...notifications]);
    }
  };

  // Departments Database State (localStorage backed)
  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_departments_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse departments from storage:', err);
    }
    return mockDepartments;
  });

  const handleUpdateDepartments = (updatedDepts: Department[]) => {
    setDepartments(updatedDepts);
    try {
      localStorage.setItem('pcs_departments_v2', JSON.stringify(updatedDepts));
    } catch (err) {
      console.error('Failed to save departments to storage:', err);
    }
  };

  // Registered System Users State (localStorage backed)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_users_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse users from storage:', err);
    }
    return mockUsers;
  });

  const handleUpdateUsers = (updatedUsers: UserProfile[]) => {
    setUsers(updatedUsers);
    try {
      localStorage.setItem('pcs_users_v2', JSON.stringify(updatedUsers));
    } catch (err) {
      console.error('Failed to save users to storage:', err);
    }
  };

  // Dynamic 3-Tier Module Hierarchy State (Database backed via localStorage)
  const [moduleHierarchyMap, setModuleHierarchyMap] = useState<ModuleHierarchyMap>(() => {
    try {
      const saved = localStorage.getItem('pcs_module_hierarchy_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse module hierarchy from localStorage:', err);
    }
    return defaultModuleHierarchy;
  });

  const handleUpdateModuleHierarchy = (updatedMap: ModuleHierarchyMap) => {
    setModuleHierarchyMap(updatedMap);
    try {
      localStorage.setItem('pcs_module_hierarchy_v2', JSON.stringify(updatedMap));
    } catch (err) {
      console.error('Failed to save module hierarchy to storage:', err);
    }
  };

  // SMTP Relay Configuration State (localStorage backed)
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => {
    try {
      const saved = localStorage.getItem('pcs_smtp_config_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse SMTP config from storage:', err);
    }
    return defaultSmtpConfig;
  });

  const handleUpdateSmtpConfig = (newConfig: SmtpConfig) => {
    setSmtpConfig(newConfig);
    try {
      localStorage.setItem('pcs_smtp_config_v2', JSON.stringify(newConfig));
    } catch (err) {
      console.error('Failed to save SMTP config to storage:', err);
    }
  };

  // Enterprise Storage Vault & Location Configuration State (localStorage backed)
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(() => {
    try {
      const saved = localStorage.getItem('pcs_storage_config_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse storage config from storage:', err);
    }
    return defaultStorageConfig;
  });

  const handleUpdateStorageConfig = (newConfig: StorageConfig) => {
    setStorageConfig(newConfig);
    try {
      localStorage.setItem('pcs_storage_config_v2', JSON.stringify(newConfig));
    } catch (err) {
      console.error('Failed to save storage config to storage:', err);
    }
  };

  // Automated Email Notification Outbox Logs State (localStorage backed)
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_email_logs_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse email logs from storage:', err);
    }
    return [];
  });

  const dispatchEmailLog = (log: EmailNotificationLog) => {
    setEmailLogs((prev) => {
      const updated = [log, ...prev];
      try {
        localStorage.setItem('pcs_email_logs_v2', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save email logs to storage:', err);
      }
      return updated;
    });

    // Persist email notification to PostgreSQL database table email_notification_logs
    api.logEmail(log).catch((err) => console.warn('[DB Email Log Notice]', err));
  };

  // Service Catalog Collections State (localStorage backed)
  const [categories, setCategories] = useState<CategoryMaster[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_catalog_categories_v1');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse categories from storage:', err);
    }
    return MASTER_CATEGORIES;
  });

  const handleUpdateCategories = (updated: CategoryMaster[]) => {
    setCategories(updated);
    try {
      localStorage.setItem('pcs_catalog_categories_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save categories to storage:', err);
    }
  };

  const [services, setServices] = useState<ServiceMaster[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_catalog_services_v1');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse services from storage:', err);
    }
    return MASTER_SERVICES;
  });

  const handleUpdateServices = (updated: ServiceMaster[]) => {
    setServices(updated);
    try {
      localStorage.setItem('pcs_catalog_services_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save services to storage:', err);
    }
  };

  const [applications, setApplications] = useState<ApplicationAssetMaster[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_catalog_apps_v1');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse applications from storage:', err);
    }
    return MASTER_APPLICATIONS_ASSETS;
  });

  const handleUpdateApplications = (updated: ApplicationAssetMaster[]) => {
    setApplications(updated);
    try {
      localStorage.setItem('pcs_catalog_apps_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save applications to storage:', err);
    }
  };

  const [issueTypes, setIssueTypes] = useState<IssueTypeMaster[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_catalog_issuetypes_v1');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse issue types from storage:', err);
    }
    return MASTER_ISSUE_TYPES;
  });

  const handleUpdateIssueTypes = (updated: IssueTypeMaster[]) => {
    setIssueTypes(updated);
    try {
      localStorage.setItem('pcs_catalog_issuetypes_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save issue types to storage:', err);
    }
  };

  const [modules, setModules] = useState<ApplicationModuleMaster[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_catalog_modules_v1');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse modules from storage:', err);
    }
    return MASTER_APPLICATION_MODULES;
  });

  const handleUpdateModules = (updated: ApplicationModuleMaster[]) => {
    setModules(updated);
    try {
      localStorage.setItem('pcs_catalog_modules_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save modules to storage:', err);
    }
  };

  const [subFunctions, setSubFunctions] = useState<ApplicationSubFunctionMaster[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_catalog_subfunctions_v1');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse subfunctions from storage:', err);
    }
    return MASTER_APPLICATION_SUBFUNCTIONS;
  });

  const handleUpdateSubFunctions = (updated: ApplicationSubFunctionMaster[]) => {
    setSubFunctions(updated);
    try {
      localStorage.setItem('pcs_catalog_subfunctions_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save subfunctions to storage:', err);
    }
  };

  const [processes, setProcesses] = useState<ApplicationProcessMaster[]>(() => {
    try {
      const saved = localStorage.getItem('pcs_catalog_processes_v1');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse processes from storage:', err);
    }
    return MASTER_APPLICATION_PROCESSES;
  });

  const handleUpdateProcesses = (updated: ApplicationProcessMaster[]) => {
    setProcesses(updated);
    try {
      localStorage.setItem('pcs_catalog_processes_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save processes to storage:', err);
    }
  };

  // Modal Dialog States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSmtpConsoleModal, setShowSmtpConsoleModal] = useState(false);

  // Detail Modal & Form State
  const [selectedCrForModal, setSelectedCrForModal] = useState<ChangeRequest | null>(null);
  const [editingCr, setEditingCr] = useState<ChangeRequest | null>(null);
  const [appNavTab, setAppNavTab] = useState<string>('dashboard');

  // Compute pending counts for badge numbers
  const pendingHodCount = currentUser
    ? changeRequests.filter(
        (cr) => cr.departmentId === currentUser.departmentId && cr.status === 'Pending HOD Approval'
      ).length
    : 0;

  const pendingItCount = changeRequests.filter(
    (cr) => cr.status === 'Pending IT Admin Review' || cr.status === 'Pending IT Verification'
  ).length;

  const assignedDevCount = currentUser
    ? changeRequests.filter(
        (cr) => cr.assignedDeveloperId === currentUser.id && cr.status === 'In Progress'
      ).length
    : 0;

  // Handlers for authentication and user sessions
  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('pcs_current_user_v2', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save current user:', e);
    }
    if (user.role === 'Department HOD') setAppNavTab('hod');
    else if (user.role === 'IT Admin') setAppNavTab('itadmin');
    else if (user.role === 'Software Developer') setAppNavTab('dev');
    else if (user.role === 'System Admin') setAppNavTab('admin');
    else setAppNavTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('pcs_current_user_v2');
    } catch (e) {
      console.error('Failed to remove current user:', e);
    }
    setShowLoginModal(true);
  };

  const handleRegisterUser = async (newUser: UserProfile): Promise<{ success: boolean; message?: string; user?: UserProfile }> => {
    let savedUser = newUser;
    let apiSuccess = false;
    let apiMessage = '';

    try {
      const res = await api.registerUser(newUser);
      if (res.success && res.user) {
        savedUser = res.user;
        apiSuccess = true;
        apiMessage = res.message || 'Account successfully registered and saved in PostgreSQL database.';
      } else {
        apiSuccess = false;
        apiMessage = res.message || 'Database write failed. Check PostgreSQL connection.';
        console.error('[DB Register User Error]', apiMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      apiSuccess = false;
      apiMessage = `Database connection failed: ${msg}`;
      console.warn('[DB Register User Notice]', msg);
    }

    const updatedUsers = [savedUser, ...users.filter((u) => u.id !== savedUser.id && u.email.toLowerCase() !== savedUser.email.toLowerCase())];
    handleUpdateUsers(updatedUsers);

    // IT notification & Email
    const itNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: 'user-it-admin',
      title: 'New Account Registration Pending Approval',
      message: `New user registration submitted by ${savedUser.fullName} (${savedUser.email}, ${savedUser.departmentName}). Please review in Admin Console.`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      read: false,
    };
    setNotifications((prev) => [itNotif, ...prev]);

    const welcomeEmail = createWelcomeAccountEmail(
      savedUser,
      savedUser.password || 'TanakaPass2026!',
      smtpConfig
    );
    dispatchEmailLog(welcomeEmail);

    return { success: apiSuccess, message: apiMessage, user: savedUser };
  };

  const handleRequestPasswordResetOtp = (email: string) => {
    const targetUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!targetUser) {
      return { success: false, message: `No account found with email "${email}".` };
    }
    const code = generateVerificationOtp();
    api.requestPasswordResetOtp(email).catch(() => {});
    return { success: true, message: `OTP code sent to ${email}`, otpCode: code, targetUser };
  };

  const handleCompletePasswordReset = (userId: string, newPassword: string) => {
    api.completePasswordReset(userId, newPassword).catch(() => {});
    const updated = users.map((u) => (u.id === userId ? { ...u, password: newPassword, mustChangePassword: false } : u));
    handleUpdateUsers(updated);
  };

  const handleCreateOrUpdateRequest = (requestData: Partial<ChangeRequest>, isDraft: boolean) => {
    const isEdit = !!requestData.id;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let updatedRequests: ChangeRequest[];
    let targetCrId = requestData.id;

    if (isEdit && targetCrId) {
      const existingCr = changeRequests.find((cr) => cr.id === targetCrId);
      const isCritical = (requestData.priority === 'Critical') || (!requestData.priority && existingCr?.priority === 'Critical');
      const isAlreadyHodApproved = !!(
        existingCr?.hodApprovedAt ||
        existingCr?.hodApprovedBy ||
        existingCr?.returnedByRole === 'IT Admin' ||
        existingCr?.returnedByRole === 'Software Developer' ||
        existingCr?.itClarificationRequested
      );
      const isAssignedToDev = !!(existingCr?.assignedDeveloperId);

      // Workflow Rules:
      // 1. If Critical priority: Skip HOD approval. If already assigned to dev -> 'In Progress'; otherwise -> 'Pending IT Admin Review'.
      // 2. If already approved by HOD (or returned by IT Admin / Dev): NO HOD approval required again!
      //    - If assigned to developer -> routes directly back to 'In Progress' for that developer!
      //    - If not yet assigned -> routes directly back to 'Pending IT Admin Review'!
      // 3. Only if returned by Department HOD before HOD approval does it go back to 'Pending HOD Approval'.
      const newStatus: RequestStatus = isDraft
        ? 'Draft'
        : isCritical || isAlreadyHodApproved
        ? (isAssignedToDev ? 'In Progress' : 'Pending IT Admin Review')
        : 'Pending HOD Approval';

      const decisionLabel = isDraft
        ? 'Submitted'
        : isCritical
        ? 'HOD Bypassed (Critical)'
        : isAlreadyHodApproved
        ? isAssignedToDev
          ? 'Clarification Provided to Developer'
          : 'Clarification Provided to IT Admin'
        : 'Submitted';

      const auditComment = isDraft
        ? 'Saved changes as draft.'
        : isCritical
        ? isAssignedToDev
          ? `Critical Priority Request: Bypassed HOD approval and returned directly to assigned developer ${existingCr?.assignedDeveloperName} for urgent resolution.`
          : 'Critical Priority Request: Automatically bypassed Department HOD approval and routed directly to IT Admin for urgent triage (monitored in HOD dashboard).'
        : isAlreadyHodApproved
        ? isAssignedToDev
          ? `Technical clarification and specifications provided by Requester (${currentUser.fullName}). HOD approval is already on file; returned directly to assigned developer ${existingCr?.assignedDeveloperName} for active implementation.`
          : `Clarification provided by Requester (${currentUser.fullName}). HOD approval is already on file; returned directly to IT Admin triage queue.`
        : 'Resubmitted for Department HOD Approval.';

      const newHistory: ApprovalHistoryEntry = {
        id: `hist-${Date.now()}`,
        changeRequestId: targetCrId,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        actionDate: now,
        fromStatus: existingCr?.status || 'Draft',
        toStatus: newStatus,
        decision: decisionLabel as any,
        comments: auditComment,
      };

      updatedRequests = changeRequests.map((cr) => {
        if (cr.id === targetCrId) {
          return {
            ...cr,
            ...requestData,
            status: newStatus,
            slaTargetHours: getPrioritySlaHours(requestData.priority || cr.priority),
            hodApprovalSkipped: !isDraft && isCritical ? true : cr.hodApprovalSkipped,
            hodSkipReason: !isDraft && isCritical ? 'Critical Priority Direct-Route to IT (Emergency)' : cr.hodSkipReason,
            returnedByRole: undefined,
            itClarificationRequested: false,
            updatedAt: now,
            approvalHistory: [newHistory, ...cr.approvalHistory],
          } as ChangeRequest;
        }
        return cr;
      });

      setChangeRequests(updatedRequests);

      // Persist update to PostgreSQL database
      api.updateChangeRequest(targetCrId, {
        ...requestData,
        status: newStatus,
        slaTargetHours: getPrioritySlaHours(requestData.priority || existingCr?.priority || 'Medium'),
        hodApprovalSkipped: !isDraft && isCritical ? true : existingCr?.hodApprovalSkipped,
        hodSkipReason: !isDraft && isCritical ? 'Critical Priority Direct-Route to IT (Emergency)' : existingCr?.hodSkipReason,
        returnedByRole: null,
        itClarificationRequested: false,
        newApprovalHistoryEntry: newHistory,
      }).catch((err) => console.warn('[DB Update CR Notice]', err));

      if (!isDraft) {
        const targetDept = departments.find((d) => d.id === currentUser.departmentId) || departments[0];
        const targetHodEmail = targetDept?.hodEmail || 'ASTRID@tanaka.com.my';
        const targetHodName = targetDept?.hodName || 'Loh Pui Ling (Ms. Astrid)';

        if (isCritical || isAlreadyHodApproved) {
          // Direct Route to Assigned Developer or IT Admin (Bypassing HOD re-approval)
          const devUser = existingCr?.assignedDeveloperId ? users.find((u) => u.id === existingCr.assignedDeveloperId) : undefined;
          const devEmail = devUser?.email || 'alex.chen@company.com';

          const recipientEmails = isAssignedToDev
            ? `${devEmail}; david.it@company.com; ${currentUser.email}; ${targetHodEmail}`
            : `david.it@company.com; ${currentUser.email}; ${targetHodEmail}`;

          const emailLog = createStateTransitionEmail({
            changeRequestId: targetCrId,
            requestTitle: requestData.title || existingCr?.title || 'Untitled Request',
            recipientEmail: recipientEmails,
            recipientName: isAssignedToDev
              ? `${existingCr?.assignedDeveloperName || 'Developer'} (Dev), IT Admin & ${currentUser.fullName} (CC: HOD ${targetHodName})`
              : `IT Admin Team & ${currentUser.fullName} (CC: HOD ${targetHodName})`,
            previousStatus: existingCr?.status || 'Returned to Requester',
            newStatus: newStatus,
            actionTaken: isCritical
              ? (isAssignedToDev ? `CRITICAL EMERGENCY: Returned Directly to Dev (${existingCr?.assignedDeveloperName})` : 'CRITICAL EMERGENCY: HOD Approval Bypassed')
              : (isAssignedToDev ? `Clarification Provided — Returned to Developer (${existingCr?.assignedDeveloperName})` : 'Clarification Provided — Returned to IT Admin'),
            actorName: currentUser.fullName,
            comments: isAssignedToDev
              ? `Clarification provided by Requester. HOD approval is already on file; routed directly to assigned developer ${existingCr?.assignedDeveloperName} as In Progress.`
              : 'Clarification provided by Requester. HOD approval is already on file; routed directly to IT Admin for developer assignment.',
            smtpConfig,
          });
          dispatchEmailLog(emailLog);

          if (isAssignedToDev && existingCr?.assignedDeveloperId) {
            const devNotif: NotificationItem = {
              id: `notif-${Date.now()}`,
              userId: existingCr.assignedDeveloperId,
              title: 'Clarification Provided (In Progress)',
              message: `CR ${targetCrId} (${requestData.title || existingCr.title}): ${currentUser.fullName} has provided the requested technical details. Ticket is active in your In Progress workbench.`,
              createdAt: now,
              read: false,
              changeRequestId: targetCrId,
            };
            setNotifications([devNotif, ...notifications]);
          } else {
            const itNotif: NotificationItem = {
              id: `notif-${Date.now()}`,
              userId: 'user-it-admin',
              title: 'Clarified Request Returned to IT',
              message: `CR ${targetCrId} (${requestData.title || existingCr?.title}): ${currentUser.fullName} provided clarification. HOD approval on file; ready for developer assignment.`,
              createdAt: now,
              read: false,
              changeRequestId: targetCrId,
            };
            setNotifications([itNotif, ...notifications]);
          }
        } else {
          // Standard resubmission to HOD (when returned by HOD before approval)
          const recipientEmails = `${targetHodEmail}; ${currentUser.email}`;

          const emailLog = createStateTransitionEmail({
            changeRequestId: targetCrId,
            requestTitle: requestData.title || existingCr?.title || 'Untitled Request',
            recipientEmail: recipientEmails,
            recipientName: `${targetHodName} (HOD) / ${currentUser.fullName}`,
            previousStatus: existingCr?.status || 'Returned to Requester',
            newStatus: 'Pending HOD Approval',
            actionTaken: 'Submitted for HOD Approval',
            actorName: currentUser.fullName,
            comments: 'Change Request revised and submitted for Department HOD authorization.',
            smtpConfig,
          });
          dispatchEmailLog(emailLog);

          const targetHodUserId = targetDept?.hodUserId || 'user-hod-prod';
          const newNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            userId: targetHodUserId,
            title: 'HOD Approval Required',
            message: `CR ${targetCrId} (${requestData.title || existingCr?.title}) submitted by ${currentUser.fullName}. Automated SMTP Email dispatched to HOD: ${targetHodName} <${targetHodEmail}>.`,
            createdAt: now,
            read: false,
            changeRequestId: targetCrId,
          };

          setNotifications([newNotif, ...notifications]);
        }
      }
    } else {
      const seqVal = changeRequests.length + 1;
      targetCrId = `PCS-CR-2026-${String(seqVal).padStart(5, '0')}`;

      const isCritical = requestData.priority === 'Critical';

      const newStatus: RequestStatus = isDraft
        ? 'Draft'
        : isCritical
        ? 'Pending IT Admin Review'
        : 'Pending HOD Approval';

      const decisionLabel = isDraft
        ? 'Submitted'
        : isCritical
        ? 'HOD Bypassed (Critical)'
        : 'Submitted';

      const auditComment = isDraft
        ? 'Initial draft saved.'
        : isCritical
        ? 'Critical Priority Request: Automatically bypassed Department HOD approval and routed directly to IT Admin for urgent triage (monitored in HOD dashboard).'
        : 'Submitted for HOD Approval.';

      const initialHistory: ApprovalHistoryEntry = {
        id: `hist-${Date.now()}`,
        changeRequestId: targetCrId,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        actionDate: now,
        fromStatus: 'Draft',
        toStatus: newStatus,
        decision: decisionLabel as any,
        comments: auditComment,
      };

      const newCr: ChangeRequest = {
        id: targetCrId,
        title: requestData.title || 'Untitled Request',
        requesterId: currentUser.id,
        requesterName: currentUser.fullName,
        requesterEmail: currentUser.email,
        departmentId: currentUser.departmentId,
        departmentName: currentUser.departmentName,
        requestType: requestData.requestType || 'Enhancement',
        priority: requestData.priority || 'Medium',
        slaTargetHours: getPrioritySlaHours(requestData.priority || 'Medium'),
        hodApprovalSkipped: !isDraft && isCritical,
        hodSkipReason: !isDraft && isCritical ? 'Critical Priority Direct-Route to IT Admin (Emergency)' : undefined,
        categoryId: requestData.categoryId || 'cat-biz-apps',
        categoryName: requestData.categoryName || requestData.category || 'Business Applications',
        category: requestData.category || 'Business Applications',
        serviceId: requestData.serviceId || 'srv-biz-prod',
        serviceName: requestData.serviceName || requestData.subcategory || 'Production System',
        subcategory: requestData.subcategory || 'Production System',
        applicationAssetId: requestData.applicationAssetId || 'app-pcs-net',
        applicationAssetName: requestData.applicationAssetName || requestData.applicationName || 'PCS.NET',
        applicationName: requestData.applicationName || 'PCS.NET',
        assetTag: requestData.assetTag,
        issueTypeId: requestData.issueTypeId || 'issue-incident',
        issueTypeName: requestData.issueTypeName || requestData.issueType || 'Incident',
        issueType: requestData.issueType || 'Incident',
        applicationAreas: requestData.applicationAreas || [],
        affectedModules: requestData.affectedModules || [],
        currentBehaviorDescription: requestData.currentBehaviorDescription || '',
        requestedChangeDescription: requestData.requestedChangeDescription || '',
        businessJustification: requestData.businessJustification || '',
        attachments: requestData.attachments || [],
        requestedCompletionDate: requestData.requestedCompletionDate || now,
        createdAt: now,
        updatedAt: now,
        status: newStatus,
        approvalHistory: [initialHistory],
      };

      updatedRequests = [newCr, ...changeRequests];
      setChangeRequests(updatedRequests);

      // Persist new change request and initial audit history to PostgreSQL database
      api.createChangeRequest(newCr).catch((err) => console.warn('[DB Create CR Notice]', err));

      if (!isDraft && targetCrId) {
        const targetDept = departments.find((d) => d.id === currentUser.departmentId) || departments[0];
        const targetHodEmail = targetDept?.hodEmail || 'ASTRID@tanaka.com.my';
        const targetHodName = targetDept?.hodName || 'Loh Pui Ling (Ms. Astrid)';

        if (isCritical) {
          // Critical Priority HOD Bypass Email & Notifications
          const emailLog = createStateTransitionEmail({
            changeRequestId: targetCrId,
            requestTitle: requestData.title || 'Untitled Request',
            recipientEmail: `david.it@company.com; ${currentUser.email}; ${targetHodEmail}`,
            recipientName: `IT Admin Team & ${currentUser.fullName} (CC: HOD ${targetHodName})`,
            previousStatus: 'New Request',
            newStatus: 'Pending IT Admin Review',
            actionTaken: 'CRITICAL EMERGENCY: HOD Approval Bypassed',
            actorName: currentUser.fullName,
            comments: 'Critical Priority Change Request submitted. Department HOD approval bypassed for immediate IT emergency triage. Monitored in HOD dashboard.',
            smtpConfig,
          });
          dispatchEmailLog(emailLog);

          const itNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            userId: 'user-it-admin',
            title: '⚡ URGENT: Critical Request Bypassed HOD',
            message: `CR ${targetCrId} (${requestData.title || 'Untitled'}) submitted with Critical Priority by ${currentUser.fullName}. HOD approval bypassed; immediate IT triage required.`,
            createdAt: now,
            read: false,
            changeRequestId: targetCrId,
          };

          const hodNotif: NotificationItem = {
            id: `notif-${Date.now() + 1}`,
            userId: targetDept?.hodUserId || 'user-hod-prod',
            title: '⚡ Critical Request Alert (HOD Monitored)',
            message: `CR ${targetCrId} (${requestData.title || 'Untitled'}) by ${currentUser.fullName} bypassed HOD approval due to Critical Priority. Visible in HOD dashboard for real-time monitoring.`,
            createdAt: now,
            read: false,
            changeRequestId: targetCrId,
          };

          setNotifications([itNotif, hodNotif, ...notifications]);
        } else {
          // Standard first-time submission to HOD
          const emailLog = createStateTransitionEmail({
            changeRequestId: targetCrId,
            requestTitle: requestData.title || 'Untitled Request',
            recipientEmail: `${targetHodEmail}; ${currentUser.email}`,
            recipientName: `${targetHodName} / ${currentUser.fullName}`,
            previousStatus: 'New Request',
            newStatus: 'Pending HOD Approval',
            actionTaken: 'Submitted for HOD Approval',
            actorName: currentUser.fullName,
            comments: 'Change Request submitted for Department HOD authorization.',
            smtpConfig,
          });
          dispatchEmailLog(emailLog);

          const targetHodUserId = targetDept?.hodUserId || 'user-hod-prod';
          const newNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            userId: targetHodUserId,
            title: 'HOD Approval Notification Sent',
            message: `CR ${targetCrId} submitted by ${currentUser.fullName}. Automated SMTP Email dispatched to HOD: ${targetHodName} <${targetHodEmail}>.`,
            createdAt: now,
            read: false,
            changeRequestId: targetCrId,
          };
          setNotifications([newNotif, ...notifications]);
        }
      }
    }

    setEditingCr(null);
    setAppNavTab('myrequests');
  };

  const handleProcessHodApproval = (
    crId: string,
    decision: 'Approve' | 'Reject' | 'SendBack',
    comments: string
  ) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const delegationCtx = getUserDelegationContext(currentUser, delegations);

    const targetCr = changeRequests.find((c) => c.id === crId);
    const hasAssignedDev = !!(targetCr?.assignedDeveloperId);

    const updated = changeRequests.map((cr) => {
      if (cr.id === crId) {
        let newStatus: RequestStatus;
        if (decision === 'Approve') {
          // If developer was already assigned to this case, route straight to In Progress for that developer!
          // Should NOT go to IT Admin review queue.
          newStatus = hasAssignedDev ? 'In Progress' : 'Pending IT Admin Review';
        } else if (decision === 'Reject') {
          newStatus = 'Closed (Rejected)';
        } else {
          newStatus = 'Returned to Requester';
        }

        const actorRole = delegationCtx.hasActiveDelegation ? 'Acting Department HOD' : 'Department HOD';
        const actorName = delegationCtx.hasActiveDelegation
          ? `${currentUser.fullName} (Acting HOD for ${delegationCtx.delegatedByHodName})`
          : currentUser.fullName;

        const auditDecisionComment = decision === 'Approve' && hasAssignedDev
          ? `[HOD Re-Approval] Approved by ${actorName}. Pre-assigned to developer ${cr.assignedDeveloperName}; dispatched straight to developer active task board.`
          : comments;

        const history: ApprovalHistoryEntry = {
          id: `hist-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: actorName,
          actorRole: actorRole,
          actionDate: now,
          fromStatus: cr.status,
          toStatus: newStatus,
          decision: decision === 'Approve' ? 'Approved' : decision === 'Reject' ? 'Rejected' : 'Sent Back',
          comments: auditDecisionComment,
        };

        // Dispatch Automated SMTP Email Notification
        if (decision === 'Approve') {
          if (hasAssignedDev && cr.assignedDeveloperId) {
            const devUser = users.find((u) => u.id === cr.assignedDeveloperId);
            const devEmail = devUser?.email || 'alex.chen@company.com';

            const emailLog = createStateTransitionEmail({
              changeRequestId: cr.id,
              requestTitle: cr.title,
              recipientEmail: `${devEmail}; ${cr.requesterEmail}; david.it@company.com`,
              recipientName: `${cr.assignedDeveloperName} (Assigned Dev), ${cr.requesterName} (Requester) & IT Admin`,
              previousStatus: cr.status,
              newStatus: 'In Progress',
              actionTaken: `HOD Approved — Routed Straight to Assigned Developer (${cr.assignedDeveloperName})`,
              actorName: currentUser.fullName,
              comments: `HOD / Acting HOD ${actorName} authorized the revised change request. As a software developer was already assigned, this case is dispatched straight to ${cr.assignedDeveloperName}'s workbench for development.`,
              smtpConfig,
            });
            dispatchEmailLog(emailLog);

            // Direct Notification to Assigned Developer
            const devNotif: NotificationItem = {
              id: `notif-${Date.now()}`,
              userId: cr.assignedDeveloperId,
              title: '⚡ Clarified CR Approved by HOD (Active in your board)',
              message: `CR ${cr.id} (${cr.title}) has been re-approved by ${actorName}. It is now In Progress on your developer task board.`,
              createdAt: now,
              read: false,
              changeRequestId: cr.id,
            };

            // Notification to Requester
            const reqNotif: NotificationItem = {
              id: `notif-${Date.now() + 1}`,
              userId: cr.requesterId,
              title: 'CR Re-Approved by HOD',
              message: `Your CR ${cr.id} was approved by ${actorName} and dispatched straight to assigned developer ${cr.assignedDeveloperName} for implementation.`,
              createdAt: now,
              read: false,
              changeRequestId: cr.id,
            };

            // Notification to IT Admin
            const itAdminNotif: NotificationItem = {
              id: `notif-${Date.now() + 2}`,
              userId: 'user-it-admin',
              title: `CR Re-Approved by HOD (Direct to ${cr.assignedDeveloperName})`,
              message: `CR ${cr.id} re-approved by ${actorName} and returned straight to assigned developer ${cr.assignedDeveloperName}.`,
              createdAt: now,
              read: false,
              changeRequestId: cr.id,
            };

            setNotifications([devNotif, reqNotif, itAdminNotif, ...notifications]);
          } else {
            // No developer assigned yet -> IT Admin Review queue
            const emailLog = createStateTransitionEmail({
              changeRequestId: cr.id,
              requestTitle: cr.title,
              recipientEmail: `david.it@company.com; ${cr.requesterEmail}`,
              recipientName: `${cr.requesterName} & IT Admin Team`,
              previousStatus: cr.status,
              newStatus: 'Pending IT Admin Review',
              actionTaken: 'HOD Approved — Sent to IT Admin for Assignment',
              actorName: currentUser.fullName,
              comments,
              smtpConfig,
            });
            dispatchEmailLog(emailLog);

            const itNotif: NotificationItem = {
              id: `notif-${Date.now()}`,
              userId: 'user-it-admin',
              title: 'HOD Approved Change Request',
              message: `CR ${cr.id} (${cr.title}) approved by ${actorName}. Awaiting developer assignment.`,
              createdAt: now,
              read: false,
              changeRequestId: cr.id,
            };

            const reqNotif: NotificationItem = {
              id: `notif-${Date.now() + 1}`,
              userId: cr.requesterId,
              title: 'HOD Approved Request',
              message: `Your CR ${cr.id} was approved by ${actorName} and sent to IT Admin for developer assignment.`,
              createdAt: now,
              read: false,
              changeRequestId: cr.id,
            };

            setNotifications([itNotif, reqNotif, ...notifications]);
          }
        } else {
          // Reject or Send Back
          const emailLog = createStateTransitionEmail({
            changeRequestId: cr.id,
            requestTitle: cr.title,
            recipientEmail: cr.requesterEmail,
            recipientName: cr.requesterName,
            previousStatus: cr.status,
            newStatus,
            actionTaken: `HOD Decision: ${decision}`,
            actorName: currentUser.fullName,
            comments,
            smtpConfig,
          });
          dispatchEmailLog(emailLog);

          const reqNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            userId: cr.requesterId,
            title: decision === 'Reject' ? 'Change Request Rejected by HOD' : 'Change Request Returned by HOD',
            message: `CR ${cr.id} was ${decision === 'Reject' ? 'rejected' : 'returned for clarification'} by ${actorName}: "${comments}".`,
            createdAt: now,
            read: false,
            changeRequestId: cr.id,
          };
          setNotifications([reqNotif, ...notifications]);
        }

        return {
          ...cr,
          status: newStatus,
          hodApprovedAt: decision === 'Approve' ? (cr.hodApprovedAt || now) : cr.hodApprovedAt,
          hodApprovedBy: decision === 'Approve' ? currentUser.fullName : cr.hodApprovedBy,
          returnedByRole: decision === 'SendBack' ? 'Department HOD' : undefined,
          itClarificationRequested: decision === 'Approve' ? false : cr.itClarificationRequested,
          updatedAt: now,
          approvalHistory: [history, ...cr.approvalHistory],
        };
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist HOD approval decision to PostgreSQL database
    const targetUpdated = updated.find((c) => c.id === crId);
    if (targetUpdated) {
      api.updateChangeRequest(crId, {
        status: targetUpdated.status,
        hodApprovedAt: targetUpdated.hodApprovedAt,
        hodApprovedBy: targetUpdated.hodApprovedBy,
        returnedByRole: targetUpdated.returnedByRole || null,
        itClarificationRequested: targetUpdated.itClarificationRequested,
        newApprovalHistoryEntry: targetUpdated.approvalHistory[0],
      }).catch((err) => console.warn('[DB Process HOD Notice]', err));
    }
  };

  // IT Staff (IT Admin, Developer, System Admin) Return to Requester for Clarification
  const handleItSendBackToRequester = (crId: string, comments: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const actorRoleTitle = currentUser.role === 'Software Developer' ? 'Software Developer' : currentUser.role === 'System Admin' ? 'System Admin' : 'IT Admin';

    const updated = changeRequests.map((cr) => {
      if (cr.id === crId) {
        const history: ApprovalHistoryEntry = {
          id: `hist-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: currentUser.role,
          actionDate: now,
          fromStatus: cr.status,
          toStatus: 'Returned to Requester',
          decision: 'Returned for Clarification',
          comments: comments || `${actorRoleTitle} (${currentUser.fullName}) requested additional technical details/clarification from requester.`,
        };

        // Find HOD for Department
        const targetDept = departments.find((d) => d.id === cr.departmentId);
        const hodEmail = targetDept?.hodEmail || 'ASTRID@tanaka.com.my';
        const hodName = targetDept?.hodName || 'Department HOD';

        // Dispatch Email to Requester with HOD CC'd so HOD retains full audit visibility
        const emailLog = createStateTransitionEmail({
          changeRequestId: cr.id,
          requestTitle: cr.title,
          recipientEmail: `${cr.requesterEmail}; ${hodEmail}`,
          recipientName: `${cr.requesterName} (CC: HOD ${hodName})`,
          previousStatus: cr.status,
          newStatus: 'Returned to Requester',
          actionTaken: `IT Clarification Requested by ${currentUser.fullName} (${actorRoleTitle})`,
          actorName: currentUser.fullName,
          comments: `${actorRoleTitle} notes: ${comments}. Resubmission from requester will go to Department HOD for approval, and upon HOD approval will route straight to the assigned IT developer.`,
          smtpConfig,
        });
        dispatchEmailLog(emailLog);

        // Notifications
        const reqNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          userId: cr.requesterId,
          title: `IT Staff Requested More Details (${actorRoleTitle})`,
          message: `${currentUser.fullName} (${actorRoleTitle}) requested clarification on ${cr.id}: "${comments}". When you submit updates, it will go to your Department HOD for approval, and upon approval will route straight back to the assigned IT developer.`,
          createdAt: now,
          read: false,
          changeRequestId: cr.id,
        };

        const hodNotif: NotificationItem = {
          id: `notif-${Date.now() + 1}`,
          userId: targetDept?.hodUserId || 'user-hod-prod',
          title: 'Audit Notice: IT Sent Back to Requester',
          message: `IT staff ${currentUser.fullName} (${actorRoleTitle}) returned ${cr.id} (${cr.title}) to requester for technical clarification. When resubmitted, it will return to your HOD queue for approval.`,
          createdAt: now,
          read: false,
          changeRequestId: cr.id,
        };

        setNotifications([reqNotif, hodNotif, ...notifications]);

        return {
          ...cr,
          status: 'Returned to Requester' as RequestStatus,
          returnedByRole: actorRoleTitle as any,
          itClarificationRequested: true,
          updatedAt: now,
          approvalHistory: [history, ...cr.approvalHistory],
        };
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist IT Return to Requester in PostgreSQL database
    const targetUpdated = updated.find((c) => c.id === crId);
    if (targetUpdated) {
      api.updateChangeRequest(crId, {
        status: 'Returned to Requester',
        returnedByRole: actorRoleTitle,
        itClarificationRequested: true,
        newApprovalHistoryEntry: targetUpdated.approvalHistory[0],
      }).catch((err) => console.warn('[DB Send Back Notice]', err));
    }
  };

  const handleAssignDeveloper = (
    crId: string,
    developerId: string,
    developerName: string,
    targetDate: string,
    comments: string
  ) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated = changeRequests.map((cr) => {
      if (cr.id === crId) {
        const history: ApprovalHistoryEntry = {
          id: `hist-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: 'IT Admin',
          actionDate: now,
          fromStatus: cr.status,
          toStatus: 'In Progress',
          decision: 'Assigned',
          comments,
        };

        const devUser = users.find((u) => u.id === developerId);
        const devEmail = devUser?.email || 'sarah.dev@company.com';

        // Dispatch Automated SMTP Email
        const emailLog = createStateTransitionEmail({
          changeRequestId: cr.id,
          requestTitle: cr.title,
          recipientEmail: `${devEmail}; ${cr.requesterEmail}`,
          recipientName: `${developerName} (Developer) & ${cr.requesterName}`,
          previousStatus: cr.status,
          newStatus: 'In Progress',
          actionTaken: `Assigned to ${developerName}`,
          actorName: currentUser.fullName,
          comments: `Assigned for development with target completion by ${targetDate}. Note: ${comments}`,
          smtpConfig,
        });
        dispatchEmailLog(emailLog);

        return {
          ...cr,
          status: 'In Progress' as RequestStatus,
          assignedDeveloperId: developerId,
          assignedDeveloperName: developerName,
          targetCompletionDate: targetDate,
          updatedAt: now,
          approvalHistory: [history, ...cr.approvalHistory],
        };
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist developer assignment to PostgreSQL database
    const targetUpdated = updated.find((c) => c.id === crId);
    if (targetUpdated) {
      api.updateChangeRequest(crId, {
        status: 'In Progress',
        assignedDeveloperId: developerId,
        assignedDeveloperName: developerName,
        targetCompletionDate: targetDate,
        newApprovalHistoryEntry: targetUpdated.approvalHistory[0],
      }).catch((err) => console.warn('[DB Assign Dev Notice]', err));
    }
  };

  const handleUpdateDevStatus = (
    crId: string,
    newStatus: RequestStatus,
    techNotes: string,
    updatedRisk?: any,
    beforeChangeDetails?: string,
    afterChangeDetails?: string,
    hasCodeOrDatabaseChanges?: boolean
  ) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated = changeRequests.map((cr) => {
      if (cr.id === crId) {
        const auditComment = [
          techNotes,
          beforeChangeDetails ? `[Before Changes]: ${beforeChangeDetails.substring(0, 100)}...` : '',
          afterChangeDetails ? `[After Changes]: ${afterChangeDetails.substring(0, 100)}...` : '',
        ].filter(Boolean).join(' | ') || `Status updated to ${newStatus}`;

        const history: ApprovalHistoryEntry = {
          id: `hist-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: 'Software Developer',
          actionDate: now,
          fromStatus: cr.status,
          toStatus: newStatus,
          decision: 'Status Update',
          comments: auditComment,
        };

        // Dispatch Automated SMTP Email Notification
        const emailLog = createStateTransitionEmail({
          changeRequestId: cr.id,
          requestTitle: cr.title,
          recipientEmail: `david.it@company.com; ${cr.requesterEmail}`,
          recipientName: `IT Admin & ${cr.requesterName}`,
          previousStatus: cr.status,
          newStatus,
          actionTaken: `Development Status Updated to ${newStatus}`,
          actorName: currentUser.fullName,
          comments: techNotes || 'Development work complete, ready for IT Release Verification.',
          smtpConfig,
        });
        dispatchEmailLog(emailLog);

        return {
          ...cr,
          status: newStatus,
          implementationNotes: techNotes,
          hasCodeOrDatabaseChanges: hasCodeOrDatabaseChanges !== undefined ? hasCodeOrDatabaseChanges : cr.hasCodeOrDatabaseChanges,
          beforeChangeDetails: beforeChangeDetails !== undefined ? beforeChangeDetails : cr.beforeChangeDetails,
          afterChangeDetails: afterChangeDetails !== undefined ? afterChangeDetails : cr.afterChangeDetails,
          riskAssessment: updatedRisk || cr.riskAssessment,
          updatedAt: now,
          actualCompletionDate: newStatus === 'Pending IT Verification' ? now.split(' ')[0] : cr.actualCompletionDate,
          approvalHistory: [history, ...cr.approvalHistory],
        };
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist developer status updates and technical notes to PostgreSQL database
    const targetUpdated = updated.find((c) => c.id === crId);
    if (targetUpdated) {
      api.updateChangeRequest(crId, {
        status: newStatus,
        implementationNotes: techNotes,
        hasCodeOrDatabaseChanges: targetUpdated.hasCodeOrDatabaseChanges,
        beforeChangeDetails: targetUpdated.beforeChangeDetails,
        afterChangeDetails: targetUpdated.afterChangeDetails,
        riskAssessment: targetUpdated.riskAssessment,
        actualCompletionDate: targetUpdated.actualCompletionDate,
        newApprovalHistoryEntry: targetUpdated.approvalHistory[0],
      }).catch((err) => console.warn('[DB Dev Status Update Notice]', err));
    }
  };

  const handleVerifyRelease = (crId: string, verified: boolean, comments: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated = changeRequests.map((cr) => {
      if (cr.id === crId) {
        const newStatus: RequestStatus = verified ? 'Closed (Completed)' : 'In Progress';

        const history: ApprovalHistoryEntry = {
          id: `hist-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: 'IT Admin',
          actionDate: now,
          fromStatus: cr.status,
          toStatus: newStatus,
          decision: verified ? 'Verified' : 'Rejected',
          comments,
        };

        // Dispatch Automated SMTP Email Notification
        const emailLog = createStateTransitionEmail({
          changeRequestId: cr.id,
          requestTitle: cr.title,
          recipientEmail: cr.requesterEmail,
          recipientName: cr.requesterName,
          previousStatus: cr.status,
          newStatus,
          actionTaken: verified ? 'Release Verified & Closed' : 'Verification Rejected - Returned to Dev',
          actorName: currentUser.fullName,
          comments,
          smtpConfig,
        });
        dispatchEmailLog(emailLog);

        return {
          ...cr,
          status: newStatus,
          updatedAt: now,
          actualCompletionDate: verified ? now.split(' ')[0] : cr.actualCompletionDate,
          approvalHistory: [history, ...cr.approvalHistory],
        };
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist release verification to PostgreSQL database
    const targetUpdated = updated.find((c) => c.id === crId);
    if (targetUpdated) {
      api.updateChangeRequest(crId, {
        status: targetUpdated.status,
        actualCompletionDate: targetUpdated.actualCompletionDate,
        itVerifiedAt: now,
        itVerifiedBy: currentUser.fullName,
        newApprovalHistoryEntry: targetUpdated.approvalHistory[0],
      }).catch((err) => console.warn('[DB Verify Release Notice]', err));
    }
  };

  const handleItDirectModify = (payload: ItDirectModifyPayload) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetCategory = payload.categoryName || payload.category || '';
    const targetIssueType = payload.issueTypeName || payload.issueType;
    const targetApplication = payload.applicationAssetName || payload.applicationName;
    const targetSubcategory = payload.serviceName || payload.subcategory;

    const updated = changeRequests.map((cr) => {
      if (cr.id === payload.crId) {
        const priorityChanged = cr.priority !== payload.priority;
        const categoryChanged = targetCategory ? cr.category !== targetCategory : false;
        const developerChanged = (payload.assignedDeveloperId || '') !== (cr.assignedDeveloperId || '');

        // Build descriptive audit comment
        const changesList: string[] = [];
        if (priorityChanged) {
          changesList.push(`Priority: ${cr.priority} → ${payload.priority} (Reason: "${payload.priorityChangeReason}")`);
        }
        if (categoryChanged && targetCategory) {
          changesList.push(`Category: ${cr.category || 'N/A'} → ${targetCategory}`);
        }
        if (targetSubcategory && targetSubcategory !== cr.subcategory) {
          changesList.push(`Subcategory: ${targetSubcategory}`);
        }
        if (targetApplication && targetApplication !== cr.applicationName) {
          changesList.push(`Application: ${targetApplication}`);
        }
        if (targetIssueType && targetIssueType !== cr.issueType) {
          changesList.push(`Issue Type: ${targetIssueType}`);
        }
        if (developerChanged) {
          changesList.push(`Developer: ${cr.assignedDeveloperName || 'Unassigned'} → ${payload.assignedDeveloperName || 'Unassigned'}`);
        }
        if (payload.targetCompletionDate && payload.targetCompletionDate !== cr.targetCompletionDate) {
          changesList.push(`Target Date: ${payload.targetCompletionDate}`);
        }
        if (payload.comments) {
          changesList.push(`Comments: "${payload.comments}"`);
        }

        const history: ApprovalHistoryEntry = {
          id: `hist-it-mod-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: currentUser.role as any,
          actionDate: now,
          fromStatus: cr.status,
          toStatus: cr.status === 'Pending IT Admin Review' && payload.assignedDeveloperId ? 'In Progress' : cr.status,
          decision: 'IT Direct Modification',
          comments: `Direct IT Modification (No Approval Required): ${changesList.join(' | ')}`,
        };

        // Dispatch Automated SMTP Notification to Requester and Developer
        const emailLog = createItDirectModificationEmail({
          changeRequest: cr,
          actor: currentUser,
          oldCategory: cr.category,
          newCategory: targetCategory || cr.category,
          oldPriority: cr.priority,
          newPriority: payload.priority,
          priorityReason: payload.priorityChangeReason,
          oldDeveloperName: cr.assignedDeveloperName,
          newDeveloperName: payload.assignedDeveloperName,
          generalComments: payload.comments,
          smtpConfig,
        });
        dispatchEmailLog(emailLog);

        // In-app notification for Requester
        const notif: NotificationItem = {
          id: `notif-itmod-${Date.now()}`,
          userId: cr.requesterId,
          title: `IT Adjusted CR-${cr.id} (${payload.priority} Priority)`,
          message: `IT Staff (${currentUser.fullName}) directly updated CR-${cr.id} category/priority. ${priorityChanged ? `Priority Reason: "${payload.priorityChangeReason}".` : ''} No action required.`,
          createdAt: now,
          read: false,
          changeRequestId: cr.id,
        };
        setNotifications((prev) => [notif, ...prev]);

        const nextStatus: RequestStatus =
          cr.status === 'Pending IT Admin Review' && payload.assignedDeveloperId
            ? 'In Progress'
            : cr.status;

        const updatedCr: ChangeRequest = {
          ...cr,
          status: nextStatus,
          category: targetCategory || cr.category,
          subcategory: targetSubcategory || cr.subcategory,
          applicationName: targetApplication || cr.applicationName,
          issueType: targetIssueType || cr.issueType,
          priority: payload.priority,
          slaTargetHours: getPrioritySlaHours(payload.priority),
          priorityChangeReason: priorityChanged
            ? payload.priorityChangeReason
            : cr.priorityChangeReason,
          priorityChangedBy: priorityChanged ? currentUser.fullName : cr.priorityChangedBy,
          priorityChangedAt: priorityChanged ? now : cr.priorityChangedAt,
          categoryChangedBy: categoryChanged ? currentUser.fullName : cr.categoryChangedBy,
          categoryChangedAt: categoryChanged ? now : cr.categoryChangedAt,
          reassignedBy: developerChanged ? currentUser.fullName : cr.reassignedBy,
          reassignedAt: developerChanged ? now : cr.reassignedAt,
          assignedDeveloperId: payload.assignedDeveloperId !== undefined ? payload.assignedDeveloperId : cr.assignedDeveloperId,
          assignedDeveloperName: payload.assignedDeveloperName !== undefined ? payload.assignedDeveloperName : cr.assignedDeveloperName,
          targetCompletionDate: payload.targetCompletionDate || cr.targetCompletionDate,
          updatedAt: now,
          approvalHistory: [history, ...cr.approvalHistory],
        };

        // Update modal state if open
        if (selectedCrForModal?.id === cr.id) {
          setSelectedCrForModal(updatedCr);
        }

        return updatedCr;
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist IT direct modifications to PostgreSQL database
    api.itDirectModify(payload).catch((err) => console.warn('[DB IT Direct Modify Notice]', err));
  };

  // IT Admin, System IT Admin, IT Staff, Developer, and HOD can reject a case or ticket
  const handleRejectCase = (crId: string, rejectionReason: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated = changeRequests.map((cr) => {
      if (cr.id === crId) {
        const history: ApprovalHistoryEntry = {
          id: `hist-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: currentUser.role,
          actionDate: now,
          fromStatus: cr.status,
          toStatus: 'Closed (Rejected)',
          decision: 'Rejected',
          comments: rejectionReason || `Ticket rejected by ${currentUser.fullName} (${currentUser.role}).`,
        };

        // Find HOD for Department
        const targetDept = departments.find((d) => d.id === cr.departmentId);
        const hodEmail = targetDept?.hodEmail || 'ASTRID@tanaka.com.my';

        // Dispatch Email Notification to Requester, CC HOD and IT Admin
        const emailLog = createStateTransitionEmail({
          changeRequestId: cr.id,
          requestTitle: cr.title,
          recipientEmail: `${cr.requesterEmail}; ${hodEmail}`,
          recipientName: `${cr.requesterName} (Requester) & HOD`,
          previousStatus: cr.status,
          newStatus: 'Closed (Rejected)',
          actionTaken: `Case Rejected by ${currentUser.fullName} (${currentUser.role})`,
          actorName: currentUser.fullName,
          comments: `Rejection Justification: ${rejectionReason}. Note: Case can only be reopened by a System Administrator.`,
          smtpConfig,
        });
        dispatchEmailLog(emailLog);

        // Notifications
        const reqNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          userId: cr.requesterId,
          title: `❌ Change Request Rejected (${cr.id})`,
          message: `CR ${cr.id} (${cr.title}) was rejected by ${currentUser.fullName} (${currentUser.role}): "${rejectionReason}".`,
          createdAt: now,
          read: false,
          changeRequestId: cr.id,
        };

        const hodNotif: NotificationItem = {
          id: `notif-${Date.now() + 1}`,
          userId: targetDept?.hodUserId || 'user-hod-prod',
          title: `Audit Notice: CR ${cr.id} Rejected`,
          message: `${currentUser.fullName} (${currentUser.role}) rejected CR ${cr.id}. Reason: "${rejectionReason}".`,
          createdAt: now,
          read: false,
          changeRequestId: cr.id,
        };

        setNotifications([reqNotif, hodNotif, ...notifications]);

        const updatedCr: ChangeRequest = {
          ...cr,
          status: 'Closed (Rejected)' as RequestStatus,
          rejectedByUserId: currentUser.id,
          rejectedByName: currentUser.fullName,
          rejectedByRole: currentUser.role,
          rejectedAt: now,
          rejectionReason: rejectionReason,
          updatedAt: now,
          approvalHistory: [history, ...cr.approvalHistory],
        };

        if (selectedCrForModal?.id === cr.id) {
          setSelectedCrForModal(updatedCr);
        }

        return updatedCr;
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist ticket rejection to PostgreSQL database
    const targetUpdated = updated.find((c) => c.id === crId);
    if (targetUpdated) {
      api.updateChangeRequest(crId, {
        status: 'Closed (Rejected)',
        rejectedByUserId: currentUser.id,
        rejectedByName: currentUser.fullName,
        rejectedByRole: currentUser.role,
        rejectedAt: now,
        rejectionReason: rejectionReason,
        newApprovalHistoryEntry: targetUpdated.approvalHistory[0],
      }).catch((err) => console.warn('[DB Reject Case Notice]', err));
    }
  };

  // Reopen logic: Case can be reopened ONLY by System Admin and automatically routes to the person who rejected it!
  const handleReopenCase = (crId: string, reopenComments: string) => {
    if (currentUser.role !== 'System Admin') {
      alert('Permission Denied: Only a System Administrator can reopen a rejected case.');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated = changeRequests.map((cr) => {
      if (cr.id === crId) {
        // Find rejecting actor information
        const rejectorUserId = cr.rejectedByUserId || (cr.approvalHistory.find((h) => h.decision === 'Rejected')?.actorUserId) || 'user-dev-1';
        const rejectorName = cr.rejectedByName || (cr.approvalHistory.find((h) => h.decision === 'Rejected')?.actorName) || 'Alex Chen';
        const rejectorRole = cr.rejectedByRole || (cr.approvalHistory.find((h) => h.decision === 'Rejected')?.actorRole) || 'Software Developer';

        // Determine destination status & assignments
        let targetStatus: RequestStatus = 'In Progress';
        let targetDevId = cr.assignedDeveloperId;
        let targetDevName = cr.assignedDeveloperName;

        if (rejectorRole === 'Software Developer') {
          targetStatus = 'In Progress';
          targetDevId = rejectorUserId;
          targetDevName = rejectorName;
        } else if (rejectorRole === 'IT Admin' || rejectorRole === 'System Admin') {
          targetStatus = 'Pending IT Admin Review';
        } else if (rejectorRole === 'Department HOD' || rejectorRole === 'Acting Department HOD') {
          targetStatus = 'Pending HOD Approval';
        } else {
          targetStatus = 'Pending IT Admin Review';
        }

        const history: ApprovalHistoryEntry = {
          id: `hist-${Date.now()}`,
          changeRequestId: cr.id,
          actorUserId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: 'System Admin',
          actionDate: now,
          fromStatus: 'Closed (Rejected)',
          toStatus: targetStatus,
          decision: 'Reopened',
          comments: reopenComments
            ? `[Reopened by System Admin] Case reopened by ${currentUser.fullName} and automatically routed to ${rejectorName} (${rejectorRole}). Instructions: ${reopenComments}`
            : `[Reopened by System Admin] Case reopened by ${currentUser.fullName} and automatically routed to ${rejectorName} (${rejectorRole}).`,
        };

        // Find rejector user profile
        const rejectorUser = users.find((u) => u.id === rejectorUserId || u.fullName === rejectorName);
        const rejectorEmail = rejectorUser?.email || 'sarah.dev@company.com';

        // Dispatch Email Notification to Rejector and Requester
        const emailLog = createStateTransitionEmail({
          changeRequestId: cr.id,
          requestTitle: cr.title,
          recipientEmail: `${rejectorEmail}; ${cr.requesterEmail}`,
          recipientName: `${rejectorName} & ${cr.requesterName}`,
          previousStatus: 'Closed (Rejected)',
          newStatus: targetStatus,
          actionTaken: `Case Reopened by System Admin (${currentUser.fullName})`,
          actorName: currentUser.fullName,
          comments: `Reopened by System Administrator ${currentUser.fullName} and automatically routed back to ${rejectorName} (${rejectorRole}). Instructions: ${reopenComments || 'Please resume investigation and resolution.'}`,
          smtpConfig,
        });
        dispatchEmailLog(emailLog);

        // Notifications
        const rejectorNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          userId: rejectorUserId,
          title: `🔄 Rejected Ticket Reopened by System Admin`,
          message: `System Admin ${currentUser.fullName} reopened CR ${cr.id} (${cr.title}) and automatically routed it back to your queue. Instructions: "${reopenComments || 'Resume development/review.'}"`,
          createdAt: now,
          read: false,
          changeRequestId: cr.id,
        };

        const reqNotif: NotificationItem = {
          id: `notif-${Date.now() + 1}`,
          userId: cr.requesterId,
          title: `🔄 Change Request Reopened (${cr.id})`,
          message: `Your rejected CR ${cr.id} has been reopened by System Admin ${currentUser.fullName} and automatically returned to ${rejectorName} for resolution.`,
          createdAt: now,
          read: false,
          changeRequestId: cr.id,
        };

        setNotifications([rejectorNotif, reqNotif, ...notifications]);

        const updatedCr: ChangeRequest = {
          ...cr,
          status: targetStatus,
          assignedDeveloperId: targetDevId,
          assignedDeveloperName: targetDevName,
          reopenedByUserId: currentUser.id,
          reopenedByName: currentUser.fullName,
          reopenedAt: now,
          reopenComments: reopenComments,
          updatedAt: now,
          approvalHistory: [history, ...cr.approvalHistory],
        };

        if (selectedCrForModal?.id === cr.id) {
          setSelectedCrForModal(updatedCr);
        }

        return updatedCr;
      }
      return cr;
    });

    setChangeRequests(updated);

    // Persist reopened case to PostgreSQL database
    const targetUpdated = updated.find((c) => c.id === crId);
    if (targetUpdated) {
      api.updateChangeRequest(crId, {
        status: targetUpdated.status,
        assignedDeveloperId: targetUpdated.assignedDeveloperId,
        assignedDeveloperName: targetUpdated.assignedDeveloperName,
        reopenedByUserId: currentUser.id,
        reopenedByName: currentUser.fullName,
        reopenedAt: now,
        reopenComments: reopenComments,
        newApprovalHistoryEntry: targetUpdated.approvalHistory[0],
      }).catch((err) => console.warn('[DB Reopen Case Notice]', err));
    }
  };

  const handleSendWelcomeEmail = (newUser: UserProfile, defaultPass: string) => {
    const emailLog = createWelcomeAccountEmail(newUser, defaultPass, smtpConfig);
    dispatchEmailLog(emailLog);
  };

  const handleApproveUser = async (userId: string, assignedDeptId?: number): Promise<{ success: boolean; verified?: boolean; message?: string; data?: UserProfile; database?: string }> => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'User not found in client state.' };

    const targetDept = departments.find((d) => d.id === (assignedDeptId || targetUser.departmentId)) || departments[0];

    try {
      // 1. Execute Real-Time Approval & Verification in PostgreSQL
      const res = await api.approveUser(userId, {
        fullName: targetUser.fullName,
        email: targetUser.email,
        departmentId: targetDept.id,
        departmentName: targetDept.name,
        role: targetUser.role,
        password: targetUser.password,
      });

      if (!res.success) {
        throw new Error(res.message || 'PostgreSQL database rejected user approval.');
      }

      const approvedUser: UserProfile = {
        ...targetUser,
        status: 'Active',
        departmentId: targetDept.id,
        departmentName: targetDept.name,
      };

      const updatedUsers = users.map((u) => (u.id === userId ? approvedUser : u));
      handleUpdateUsers(updatedUsers);

      // Send automated SMTP confirmation email to the user
      const emailLog = createUserApprovedEmail(approvedUser, currentUser.fullName, smtpConfig);
      dispatchEmailLog(emailLog);

      // Notification
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: approvedUser.id,
        title: 'Account Approved & Activated',
        message: `Your Tanaka PCS account has been approved by IT Admin ${currentUser.fullName}. You can now submit change requests.`,
        createdAt: now,
        read: false,
      };
      setNotifications([notif, ...notifications]);

      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[Approval Action Error]', errorMsg);
      return { success: false, verified: false, message: errorMsg };
    }
  };

  const handleReassignDepartment = (userId: string, newDeptId: number) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetUser = users.find((u) => u.id === userId);
    const newDept = departments.find((d) => d.id === newDeptId);
    if (!targetUser || !newDept) return;

    const oldDeptName = targetUser.departmentName;

    const reassignedUser: UserProfile = {
      ...targetUser,
      departmentId: newDept.id,
      departmentName: newDept.name,
    };

    const updatedUsers = users.map((u) => (u.id === userId ? reassignedUser : u));
    handleUpdateUsers(updatedUsers);

    // Persist reassignment to PostgreSQL database
    api.updateUser(userId, {
      departmentId: newDept.id,
      departmentName: newDept.name,
    }).catch((err) => console.warn('[DB Department Reassign Notice]', err));

    // Send automated SMTP notification email to user
    const emailLog = createUserDepartmentReassignedEmail(
      reassignedUser,
      oldDeptName,
      newDept.name,
      newDept.hodName,
      currentUser.fullName,
      smtpConfig
    );
    dispatchEmailLog(emailLog);

    // Notification for user and HOD
    const userNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: reassignedUser.id,
      title: 'Department Reassigned',
      message: `Your department has been updated from ${oldDeptName} to ${newDept.name} (HOD: ${newDept.hodName}).`,
      createdAt: now,
      read: false,
    };

    const hodNotif: NotificationItem = {
      id: `notif-${Date.now() + 1}`,
      userId: newDept.hodUserId,
      title: 'New Department Member Assigned',
      message: `IT Admin ${currentUser.fullName} assigned ${reassignedUser.fullName} (${reassignedUser.email}) to your department (${newDept.name}).`,
      createdAt: now,
      read: false,
    };

    setNotifications([userNotif, hodNotif, ...notifications]);
  };

  const handleAdminResetPassword = (userId: string, newPassword: string, mustChangeOnNextLogin: boolean = true) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const updatedUser: UserProfile = {
      ...targetUser,
      password: newPassword,
      mustChangePassword: mustChangeOnNextLogin,
    };

    const updatedUsers = users.map((u) => (u.id === userId ? updatedUser : u));
    handleUpdateUsers(updatedUsers);

    // Persist password reset to PostgreSQL database
    api.updateUser(userId, {
      password: newPassword,
      mustChangePassword: mustChangeOnNextLogin,
    }).catch((err) => console.warn('[DB Password Reset Notice]', err));

    // Dispatch automated emergency reset email via SMTP
    const emailLog = createAdminEmergencyPasswordResetEmail(
      targetUser,
      newPassword,
      currentUser.fullName,
      mustChangeOnNextLogin,
      smtpConfig
    );
    dispatchEmailLog(emailLog);

    // Notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: targetUser.id,
      title: 'Emergency Password Reset Issued',
      message: `Your account password was reset by IT Administrator ${currentUser.fullName}. Temporary credentials were dispatched to ${targetUser.email}.`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      read: false,
    };
    setNotifications([notif, ...notifications]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleOpenDetailModal = (crId: string) => {
    const target = changeRequests.find((cr) => cr.id === crId);
    if (target) setSelectedCrForModal(target);
  };

  // View title helper for top bar
  const getViewTitle = () => {
    const delegationCtx = getUserDelegationContext(currentUser, delegations);
    switch (appNavTab) {
      case 'dashboard':
        return currentUser.role === 'Software Developer' || currentUser.role === 'IT Admin' || currentUser.role === 'System Admin'
          ? 'IT Dashboard'
          : `${currentUser.role} Dashboard`;
      case 'myrequests':
        return 'My Requests';
      case 'new':
        return editingCr ? `Edit Request: ${editingCr.id}` : 'New Request Page';
      case 'hod':
        return delegationCtx.hasActiveDelegation
          ? `⚡ ${delegationCtx.effectiveDepartmentName || 'Production'} Acting Approver Queue`
          : delegationCtx.hasExpiredDelegation && !delegationCtx.hasActiveDelegation
          ? `HOD Departmental Archive (Read-Only)`
          : 'HOD Departmental Approval Queue';
      case 'itadmin':
        return 'IT Admin Workspace';
      case 'dev':
        return 'Task Board';
      case 'closed':
        return 'Closed Cases Archive & Completion Register';
      case 'admin':
        return 'System Administration';
      case 'reports':
        return 'SLA Performance';
      case 'howtouse':
        return 'How to use';
      default:
        return 'PCS Change Request Management System';
    }
  };

  const closedCasesCount = changeRequests.filter(
    (cr) => cr.status === 'Closed (Completed)' || cr.status === 'Closed (Rejected)'
  ).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          users={users}
          currentUser={null}
          departments={departments}
          smtpConfig={smtpConfig}
          onSelectUser={(user) => {
            handleSwitchUser(user);
            setShowLoginModal(false);
          }}
          onLoginUser={(user) => {
            handleSwitchUser(user);
            setShowLoginModal(false);
          }}
          onRegisterUser={(newUser) => {
            handleUpdateUsers([newUser, ...users]);
          }}
          onClose={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased">
      {/* Sleek Dark Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeAppTab={appNavTab}
        onAppTabChange={(tab) => setAppNavTab(tab)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onRequestClick={handleOpenDetailModal}
        pendingHodCount={pendingHodCount}
        pendingItCount={pendingItCount}
        assignedDevCount={assignedDevCount}
        closedCasesCount={closedCasesCount}
        onCreateNewRequest={() => {
          setEditingCr(null);
          setAppNavTab('new');
        }}
        onOpenSmtpConsole={() => setShowSmtpConsoleModal(true)}
        emailCount={emailLogs.length}
        users={users}
        delegations={delegations}
      />

      {/* Main Right Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sleek Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{getViewTitle()}</h2>
          </div>
        </header>

        {/* Content Workspace Canvas */}
        <main className="flex-1 p-6">
          {appNavTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              changeRequests={changeRequests}
              onNavigateTab={(tab) => setAppNavTab(tab)}
              onRequestClick={handleOpenDetailModal}
              onCreateNewRequest={() => {
                setEditingCr(null);
                setAppNavTab('new');
              }}
              delegations={delegations}
            />
          )}

          {appNavTab === 'myrequests' && (
            <MyRequestsView
              currentUser={currentUser}
              changeRequests={changeRequests}
              onRequestClick={handleOpenDetailModal}
              onEditRequest={(cr) => {
                setEditingCr(cr);
                setAppNavTab('new');
              }}
              onCreateNewRequest={() => {
                setEditingCr(null);
                setAppNavTab('new');
              }}
            />
          )}

          {appNavTab === 'new' && (
            <ChangeRequestForm
              currentUser={currentUser}
              initialData={editingCr}
              onSubmitRequest={handleCreateOrUpdateRequest}
              onCancel={() => setAppNavTab('myrequests')}
              departments={departments}
              storageConfig={storageConfig}
              categories={categories}
              services={services}
              applications={applications}
              issueTypes={issueTypes}
            />
          )}

          {appNavTab === 'hod' && (
            <HodQueueView
              currentUser={currentUser}
              changeRequests={changeRequests}
              onProcessApproval={handleProcessHodApproval}
              onRequestClick={handleOpenDetailModal}
              delegations={delegations}
              onSaveDelegation={handleSaveDelegation}
              onRevokeDelegation={handleRevokeDelegation}
              users={users}
            />
          )}

          {appNavTab === 'itadmin' && (
            <ItAdminQueueView
              currentUser={currentUser}
              changeRequests={changeRequests}
              onAssignDeveloper={handleAssignDeveloper}
              onVerifyRelease={handleVerifyRelease}
              onSendBackToRequester={handleItSendBackToRequester}
              onItDirectModify={handleItDirectModify}
              onRejectCase={handleRejectCase}
              onRequestClick={handleOpenDetailModal}
            />
          )}

          {appNavTab === 'dev' && (
            <DeveloperKanbanView
              currentUser={currentUser}
              changeRequests={changeRequests}
              onUpdateDevStatus={handleUpdateDevStatus}
              onSendBackToRequester={handleItSendBackToRequester}
              onItDirectModify={handleItDirectModify}
              onRejectCase={handleRejectCase}
              onRequestClick={handleOpenDetailModal}
            />
          )}

          {appNavTab === 'closed' && (
            <ClosedCasesView
              currentUser={currentUser}
              changeRequests={changeRequests}
              onReopenCase={handleReopenCase}
              onRequestClick={handleOpenDetailModal}
            />
          )}

          {appNavTab === 'admin' && (
            <AdminUserMgmtView
              currentUser={currentUser}
              moduleHierarchyMap={moduleHierarchyMap}
              onUpdateModuleHierarchy={handleUpdateModuleHierarchy}
              departments={departments}
              onUpdateDepartments={handleUpdateDepartments}
              users={users}
              onUpdateUsers={handleUpdateUsers}
              onSendWelcomeEmail={handleSendWelcomeEmail}
              onApproveUser={handleApproveUser}
              onReassignDepartment={handleReassignDepartment}
              onAdminResetPassword={handleAdminResetPassword}
              storageConfig={storageConfig}
              onUpdateStorageConfig={handleUpdateStorageConfig}
              changeRequests={changeRequests}
              categories={categories}
              onUpdateCategories={handleUpdateCategories}
              services={services}
              onUpdateServices={handleUpdateServices}
              applications={applications}
              onUpdateApplications={handleUpdateApplications}
              issueTypes={issueTypes}
              onUpdateIssueTypes={handleUpdateIssueTypes}
              modules={modules}
              onUpdateModules={handleUpdateModules}
              subFunctions={subFunctions}
              onUpdateSubFunctions={handleUpdateSubFunctions}
              processes={processes}
              onUpdateProcesses={handleUpdateProcesses}
            />
          )}

          {appNavTab === 'reports' && (
            <ReportsView
              changeRequests={changeRequests}
              currentUser={currentUser}
              users={users}
              delegations={delegations}
            />
          )}

          {appNavTab === 'howtouse' && (
            <HowToUseView
              currentUser={currentUser}
              onNavigateTab={(tab) => setAppNavTab(tab)}
              onCreateNewRequest={() => {
                setEditingCr(null);
                setAppNavTab('new');
              }}
            />
          )}
        </main>
      </div>

      {/* Comprehensive Request Detail Modal Drawer */}
      <RequestDetailModal
        changeRequest={selectedCrForModal}
        onClose={() => setSelectedCrForModal(null)}
        currentUser={currentUser}
        changeRequests={changeRequests}
        onSendBackToRequester={handleItSendBackToRequester}
        onItDirectModify={handleItDirectModify}
        onRejectCase={handleRejectCase}
        onReopenCase={handleReopenCase}
      />

      {/* Authentication Login & Account Switcher Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          users={users}
          currentUser={currentUser}
          departments={departments}
          smtpConfig={smtpConfig}
          onSelectUser={(user) => {
            handleSwitchUser(user);
            setShowLoginModal(false);
          }}
          onLoginUser={(user) => {
            handleSwitchUser(user);
            setShowLoginModal(false);
          }}
          onRegisterUser={handleRegisterUser}
          onRequestPasswordResetOtp={handleRequestPasswordResetOtp}
          onCompletePasswordReset={handleCompletePasswordReset}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* SMTP Email Outbox & Relay Console Modal - Only for Admin Accounts */}
      {showSmtpConsoleModal && (currentUser.role === 'System Admin' || currentUser.role === 'IT Admin') && (
        <SmtpConsoleModal
          isOpen={showSmtpConsoleModal}
          smtpConfig={smtpConfig}
          onUpdateSmtpConfig={handleUpdateSmtpConfig}
          emailLogs={emailLogs}
          onClose={() => setShowSmtpConsoleModal(false)}
        />
      )}
    </div>
  );
}
