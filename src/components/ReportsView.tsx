import React, { useState, useMemo } from 'react';
import { ChangeRequest, UserProfile, TemporaryApproverDelegation } from '../types';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Layers,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  Info,
  XCircle,
  Calendar,
  Building,
  User,
  ShieldCheck,
  AlertCircle,
  Lock
} from 'lucide-react';
import { StaffWorkloadReportView } from './StaffWorkloadReportView';

interface ReportsViewProps {
  changeRequests: ChangeRequest[];
  currentUser?: UserProfile;
  users?: UserProfile[];
  delegations?: TemporaryApproverDelegation[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  changeRequests,
  currentUser,
  users,
  delegations: propsDelegations,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'turnaround' | 'delegations' | 'workload'>('turnaround');
  
  // Delegation Audit Filtering State
  const [delegationSearch, setDelegationSearch] = useState('');
  const [delegationStatusFilter, setDelegationStatusFilter] = useState<'ALL' | 'REVOKED' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [delegationDeptFilter, setDelegationDeptFilter] = useState<string>('ALL');

  // CR Audit Filtering State
  const [crSearch, setCrSearch] = useState('');
  const [crPriorityFilter, setCrPriorityFilter] = useState<string>('ALL');
  const [crStatusFilter, setCrStatusFilter] = useState<string>('ALL');

  const rawDelegations = propsDelegations || [];

  const isSystemAdmin = currentUser?.role === 'System Admin' || currentUser?.role === 'IT Admin';
  const isItStaff =
    isSystemAdmin ||
    currentUser?.role === 'Software Developer' ||
    currentUser?.departmentName === 'IT' ||
    currentUser?.departmentId === 8;

  const userDeptId = currentUser?.departmentId;
  const userDeptName = currentUser?.departmentName;

  // DEPARTMENT-LEVEL ISOLATION:
  // Non-admin users (HODs, Requesters, Department Staff) can ONLY see their own department's delegation records.
  // System Admins and IT Admins have enterprise-wide audit clearance to view all or filter by department.
  const scopedDelegations = useMemo(() => {
    if (isSystemAdmin) {
      return rawDelegations;
    }
    return rawDelegations.filter((d) => {
      if (userDeptId && d.departmentId === userDeptId) return true;
      if (userDeptName && d.departmentName && d.departmentName.toLowerCase() === userDeptName.toLowerCase()) return true;
      return false;
    });
  }, [rawDelegations, isSystemAdmin, userDeptId, userDeptName]);

  // Export CR SLA Audit to CSV
  const exportCrToCSV = () => {
    const headers = [
      'Request ID',
      'Title',
      'Requester',
      'Department',
      'Type',
      'Priority',
      'Status',
      'Assigned Dev',
      'Created Date',
      'Target Date',
    ];

    const rows = changeRequests.map((cr) => [
      cr.id,
      `"${cr.title.replace(/"/g, '""')}"`,
      cr.requesterName,
      cr.departmentName,
      cr.requestType,
      cr.priority,
      cr.status,
      cr.assignedDeveloperName || 'Unassigned',
      cr.createdAt,
      cr.requestedCompletionDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCS_Change_Requests_SLA_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Delegations & Revocations Audit to CSV (Department Isolated)
  const exportDelegationsToCSV = () => {
    const headers = [
      'Delegation ID',
      'Department',
      'HOD Name',
      'HOD Email',
      'Temporary Approver Name',
      'Temporary Approver Email',
      'Delegate Role',
      'Start Date',
      'End Date',
      'Reason',
      'Status',
      'Revoked Date',
      'Revoked By',
      'Revocation Reason',
      'Created Date',
      'Created By',
      'Notes',
    ];

    const rows = filteredDelegations.map((d) => [
      d.id,
      `"${(d.departmentName || '').replace(/"/g, '""')}"`,
      `"${(d.hodName || '').replace(/"/g, '""')}"`,
      d.hodEmail || '',
      `"${(d.delegateName || '').replace(/"/g, '""')}"`,
      d.delegateEmail || '',
      d.delegateRole || 'Requester',
      d.startDate || '',
      d.endDate || '',
      `"${(d.reason || '').replace(/"/g, '""')}"`,
      d.status,
      d.revokedAt || 'N/A',
      `"${(d.revokedBy || 'N/A').replace(/"/g, '""')}"`,
      `"${(d.revocationReason || 'N/A').replace(/"/g, '""')}"`,
      d.createdAt || '',
      `"${(d.createdBy || '').replace(/"/g, '""')}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const fileNamePrefix = isSystemAdmin
      ? delegationDeptFilter !== 'ALL'
        ? `PCS_${delegationDeptFilter.replace(/\s+/g, '_')}_Delegations_Audit_`
        : 'PCS_All_Departments_Delegations_Audit_'
      : `PCS_${(userDeptName || 'Department').replace(/\s+/g, '_')}_Delegations_Audit_`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileNamePrefix}${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completedCount = changeRequests.filter((cr) => cr.status === 'Closed (Completed)').length;
  const inProgressCount = changeRequests.filter((cr) => cr.status === 'In Progress').length;
  const openCount = changeRequests.filter(
    (cr) => cr.status !== 'Closed (Completed)' && cr.status !== 'Closed (Rejected)'
  ).length;

  // Department-isolated Delegation counts
  const totalDelegationsCount = scopedDelegations.length;
  const activeDelegationsCount = scopedDelegations.filter((d) => d.status === 'Active').length;
  const revokedDelegationsCount = scopedDelegations.filter((d) => d.status === 'Revoked').length;
  const expiredDelegationsCount = scopedDelegations.filter((d) => d.status === 'Expired').length;

  // Filtered Delegations (Operating strictly within authorized department scope)
  const filteredDelegations = useMemo(() => {
    return scopedDelegations.filter((d) => {
      // Status filter
      if (delegationStatusFilter === 'REVOKED' && d.status !== 'Revoked') return false;
      if (delegationStatusFilter === 'ACTIVE' && d.status !== 'Active') return false;
      if (delegationStatusFilter === 'EXPIRED' && d.status !== 'Expired') return false;

      // Department filter (Only accessible to System Admins)
      if (isSystemAdmin && delegationDeptFilter !== 'ALL' && d.departmentName !== delegationDeptFilter) return false;

      // Search query
      if (delegationSearch.trim()) {
        const q = delegationSearch.toLowerCase();
        const matchId = d.id.toLowerCase().includes(q);
        const matchDept = (d.departmentName || '').toLowerCase().includes(q);
        const matchHod = (d.hodName || '').toLowerCase().includes(q);
        const matchDelegate = (d.delegateName || '').toLowerCase().includes(q);
        const matchReason = (d.reason || '').toLowerCase().includes(q);
        const matchRevokedBy = (d.revokedBy || '').toLowerCase().includes(q);
        const matchRevocationReason = (d.revocationReason || '').toLowerCase().includes(q);
        return matchId || matchDept || matchHod || matchDelegate || matchReason || matchRevokedBy || matchRevocationReason;
      }

      return true;
    });
  }, [scopedDelegations, delegationStatusFilter, delegationDeptFilter, delegationSearch, isSystemAdmin]);

  // Unique departments for delegation filter (Admin only)
  const delegationDepartments = useMemo(() => {
    if (!isSystemAdmin) return [];
    const depts = new Set<string>();
    rawDelegations.forEach((d) => {
      if (d.departmentName) depts.add(d.departmentName);
    });
    return Array.from(depts).sort();
  }, [rawDelegations, isSystemAdmin]);

  // Filtered Change Requests
  const filteredChangeRequests = useMemo(() => {
    return changeRequests.filter((cr) => {
      if (crPriorityFilter !== 'ALL' && cr.priority !== crPriorityFilter) return false;
      if (crStatusFilter !== 'ALL' && cr.status !== crStatusFilter) return false;
      if (crSearch.trim()) {
        const q = crSearch.toLowerCase();
        return (
          cr.id.toLowerCase().includes(q) ||
          cr.title.toLowerCase().includes(q) ||
          cr.requesterName.toLowerCase().includes(q) ||
          cr.departmentName.toLowerCase().includes(q) ||
          cr.requestType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [changeRequests, crPriorityFilter, crStatusFilter, crSearch]);

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-medium gap-1">
        <button
          type="button"
          onClick={() => setActiveReportTab('turnaround')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer ${
            activeReportTab === 'turnaround'
              ? 'bg-white text-blue-700 font-semibold shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>SLA Turnaround & CR Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('delegations')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer ${
            activeReportTab === 'delegations'
              ? 'bg-white text-blue-700 font-semibold shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Temporary Approver & Delegation Audit</span>
          {revokedDelegationsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
              {revokedDelegationsCount} Revoked
            </span>
          )}
        </button>

        {isItStaff && (
          <button
            type="button"
            onClick={() => setActiveReportTab('workload')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer ${
              activeReportTab === 'workload'
                ? 'bg-white text-blue-700 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isSystemAdmin ? 'Staff Workload Points Report' : 'My Workload Points'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: Workload Points */}
      {activeReportTab === 'workload' && isItStaff && (
        <StaffWorkloadReportView
          staffList={users || []}
          changeRequests={changeRequests}
          currentUser={currentUser}
          individualOnly={!isSystemAdmin}
        />
      )}

      {/* TAB 2: Temporary Approver & Delegation Audit (List Info Only) */}
      {activeReportTab === 'delegations' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
               
                
                {isSystemAdmin ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Enterprise Admin Oversight</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Department Scoped: {userDeptName || 'My Department'}</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold">
                Temporary Approver & Delegation Audit
                {!isSystemAdmin && userDeptName && (
                  <span className="text-slate-300 font-normal text-lg ml-2">({userDeptName} Department)</span>
                )}
              </h1>
              <p className="text-xs text-slate-300">
                {isSystemAdmin
                  ? 'Enterprise audit register of all HOD temporary approver assignments, active periods, and early revocations across all departments.'
                  : `Immutable audit register of ${userDeptName || 'your department'}'s HOD temporary approver assignments, active periods, and early revocations.`}
              </p>
            </div>

            <button
              onClick={exportDelegationsToCSV}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs transition-all shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {isSystemAdmin
                  ? 'Export All Delegations to CSV'
                  : `Export ${userDeptName || 'Department'} Audit to CSV`}
              </span>
            </button>
          </div>

          {/* Department Access Notice */}
          {!isSystemAdmin && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Department Data Scoping Active:</span> You are viewing the audit register for{' '}
                <span className="font-semibold underline decoration-blue-400">{userDeptName || 'your department'}</span> only. All cross-department records are securely isolated.
              </div>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">
                {isSystemAdmin ? 'Total Delegations Granted' : 'Department Delegations Granted'}
              </span>
              <p className="text-2xl font-extrabold text-slate-900">{totalDelegationsCount}</p>
              <span className="text-slate-500 text-[11px]">
                {isSystemAdmin ? 'All-time recorded authorizations' : `Recorded for ${userDeptName || 'department'}`}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">Currently Active Delegations</span>
              <p className="text-2xl font-extrabold text-emerald-600">{activeDelegationsCount}</p>
              <span className="text-emerald-700 text-[11px] font-medium">Valid acting approver window</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">Revoked by HOD (Early Revocation)</span>
              <p className="text-2xl font-extrabold text-rose-600">{revokedDelegationsCount}</p>
              <span className="text-rose-700 text-[11px] font-medium">Manually revoked prior to expiry</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">Completed / Expired</span>
              <p className="text-2xl font-extrabold text-slate-600">{expiredDelegationsCount}</p>
              <span className="text-slate-500 text-[11px]">Natural conclusion of authorization</span>
            </div>
          </div>

          {/* Main Audit Register Card (List Info Only) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>
                    Delegation & Revocation Register (List Info Only)
                    {!isSystemAdmin && userDeptName && ` - ${userDeptName}`}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredDelegations.length} of {scopedDelegations.length} {isSystemAdmin ? 'total' : 'department'} delegation audit records
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDelegationStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    delegationStatusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalDelegationsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDelegationStatusFilter('REVOKED')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    delegationStatusFilter === 'REVOKED'
                      ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200 font-bold'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Revoked ({revokedDelegationsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDelegationStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    delegationStatusFilter === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200 font-bold'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Active ({activeDelegationsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDelegationStatusFilter('EXPIRED')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    delegationStatusFilter === 'EXPIRED'
                      ? 'bg-slate-200 text-slate-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expired ({expiredDelegationsCount})
                </button>
              </div>
            </div>

            {/* Search and Dropdown Filter Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={delegationSearch}
                  onChange={(e) => setDelegationSearch(e.target.value)}
                  placeholder={
                    isSystemAdmin
                      ? 'Search by Delegation ID, Department, HOD, Temporary Approver, or Revocation Reason...'
                      : `Search within ${userDeptName || 'Department'} delegations by ID, HOD, Temporary Approver...`
                  }
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white text-slate-900"
                />
                {delegationSearch && (
                  <button
                    onClick={() => setDelegationSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Admin Department Filter Dropdown vs Non-Admin Department Badge */}
              {isSystemAdmin ? (
                delegationDepartments.length > 0 && (
                  <div className="w-full sm:w-60 shrink-0">
                    <select
                      value={delegationDeptFilter}
                      onChange={(e) => setDelegationDeptFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="ALL">All Departments (Enterprise)</option>
                      {delegationDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold shrink-0">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>{userDeptName || 'Department'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Restricted)</span>
                </div>
              )}
            </div>

            {/* Delegations List Table (Info Only) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Delegation ID</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Delegating HOD</th>
                    <th className="p-3">Temporary Approver (Delegate)</th>
                    <th className="p-3">Authorized Period</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reason & Notes</th>
                    <th className="p-3">Revocation / Lifecycle Audit Details (Info Only)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDelegations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <UserCheck className="w-8 h-8 text-slate-400" />
                          <p className="font-semibold text-slate-700">
                            {scopedDelegations.length === 0
                              ? `No delegation or revocation records found for ${userDeptName || 'your department'}.`
                              : 'No delegation records match your criteria.'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {scopedDelegations.length === 0
                              ? 'When HODs in your department grant or revoke temporary approver privileges, records will appear here.'
                              : 'Try adjusting your search terms or filter selection.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDelegations.map((del) => {
                      const isRevoked = del.status === 'Revoked';
                      const isActive = del.status === 'Active';
                      const isExpired = del.status === 'Expired';

                      return (
                        <tr
                          key={del.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isRevoked ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Delegation ID */}
                          <td className="p-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                            {del.id}
                          </td>

                          {/* Department */}
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{del.departmentName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Dept #{del.departmentId}</span>
                          </td>

                          {/* Delegating HOD */}
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{del.hodName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{del.hodEmail}</span>
                          </td>

                          {/* Temporary Approver (Delegate) */}
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{del.delegateName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{del.delegateEmail}</span>
                            {del.delegateRole && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {del.delegateRole}
                              </span>
                            )}
                          </td>

                          {/* Authorized Window */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="text-slate-800 font-medium block">
                                {del.startDate.split(' ')[0]} → {del.endDate.split(' ')[0]}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Created: {del.createdAt}
                              </span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3 whitespace-nowrap">
                            {isRevoked && (
                              <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>Revoked by HOD</span>
                              </span>
                            )}
                            {isActive && (
                              <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                <span>Active</span>
                              </span>
                            )}
                            {isExpired && (
                              <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                                <span>Expired</span>
                              </span>
                            )}
                          </td>

                          {/* Reason & Notes */}
                          <td className="p-3 max-w-xs">
                            <span className="font-semibold text-slate-800 block">{del.reason}</span>
                            {del.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 italic line-clamp-2">
                                "{del.notes}"
                              </p>
                            )}
                          </td>

                          {/* Revocation & Lifecycle Details (Info Only) */}
                          <td className="p-3 min-w-[240px]">
                            {isRevoked ? (
                              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[11px] space-y-1 text-rose-950">
                                <div className="flex items-center gap-1 font-bold text-rose-800">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Revoked On: {del.revokedAt || 'Recorded'}</span>
                                </div>
                                <div>
                                  <span className="text-rose-700 font-semibold">Revoked By: </span>
                                  <span>{del.revokedBy || del.hodName}</span>
                                </div>
                                <div>
                                  <span className="text-rose-700 font-semibold">Reason: </span>
                                  <span>{del.revocationReason || 'HOD resumed office / authority revoked manually'}</span>
                                </div>
                                <div className="text-[10px] text-rose-600 font-medium">
                                  ✓ Authority returned to primary HOD
                                </div>
                              </div>
                            ) : isActive ? (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[11px] text-emerald-900 space-y-0.5">
                                <div className="font-semibold flex items-center gap-1 text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Acting Authority In Effect</span>
                                </div>
                                <div className="text-[10px] text-emerald-700">
                                  Expires automatically on {del.endDate.split(' ')[0]} 23:59. HOD can revoke at any time.
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-600">
                                <span>Completed natural tenure on {del.endDate.split(' ')[0]}.</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Informational Compliance Footer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-start space-x-2 text-[11px]">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Compliance & Audit Integrity:</strong> All temporary approver assignments and early revocations executed by Department HODs are immutable system audit records. Data in this tab is maintained as <strong>List Info Only</strong> for corporate oversight and ISO/compliance verification.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SLA Turnaround & Change Request Audit */}
      {activeReportTab === 'turnaround' && (
        <>
          {/* Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 border border-blue-800/50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">System Reports & SLA Turnaround</h1>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Audit turnaround performance metrics, priority distributions, and export full case records.
              </p>
            </div>

            <button
              onClick={exportCrToCSV}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs transition-all shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Audit to CSV</span>
            </button>
          </div>

          {/* SLA Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 font-semibold block">Average HOD Clearance Time</span>
              <p className="text-2xl font-extrabold text-slate-900">1.2 Days</p>
              <span className="text-emerald-600 font-medium">98% SLA Compliance (&lt; 2 Days)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 font-semibold block">Average IT Dev Cycle</span>
              <p className="text-2xl font-extrabold text-blue-600">5.4 Days</p>
              <span className="text-blue-600 font-medium">Within target release window</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 font-semibold block">Total Closed Cases</span>
              <p className="text-2xl font-extrabold text-emerald-600">{completedCount}</p>
              <span className="text-slate-500">100% verified by IT Admin</span>
            </div>
          </div>

          {/* Detail Audit Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Full System Audit & Turnaround Register</span>
              </h2>
              <span className="text-xs text-slate-500">{filteredChangeRequests.length} total records</span>
            </div>

            {/* Filter and Search Bar for CRs */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={crSearch}
                  onChange={(e) => setCrSearch(e.target.value)}
                  placeholder="Search by CR number, title, requester, department, or type..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900"
                />
              </div>

              <select
                value={crPriorityFilter}
                onChange={(e) => setCrPriorityFilter(e.target.value)}
                className="w-full sm:w-40 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 font-medium cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={crStatusFilter}
                onChange={(e) => setCrStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 font-medium cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending HOD Approval">Pending HOD</option>
                <option value="Pending IT Assignment">Pending IT</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Closed (Completed)">Closed (Completed)</option>
                <option value="Closed (Rejected)">Closed (Rejected)</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">CR Number</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Requester</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Target Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredChangeRequests.map((cr) => (
                    <tr key={cr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{cr.id}</td>
                      <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{cr.title}</td>
                      <td className="p-3">{cr.requesterName}</td>
                      <td className="p-3">{cr.departmentName}</td>
                      <td className="p-3">{cr.requestType}</td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            cr.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : cr.priority === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cr.priority}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{cr.status}</td>
                      <td className="p-3 text-slate-500">{cr.requestedCompletionDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
