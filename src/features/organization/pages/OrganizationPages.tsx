import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderGit2,
  Download,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  UserCheck,
  UserPlus,
  Users,
  Edit2,
  Mail,
  Clock,
  Check,
  X,
  Building2,
  Cpu,
  Database,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, Button, Badge, PageHeader, Modal } from '@/shared/ui';
import {
  organizationApi,
  type OrganizationMemberItem,
  type OrganizationInvitationItem,
  type OrganizationMembersResponse,
  type SystemRoleItem,
  type PermissionInventoryItem,
  type OrganizationAnalyticsData,
  type AuditLogItem,
} from '../api/organization.api';
import type { Project } from '@/features/projects/types/project';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORGANISATION PROFILE PAGE (Legal Profile & Registry Verification)
// ─────────────────────────────────────────────────────────────────────────────
import { CompanyLegalProfilePage } from '@/features/account/pages/CompanyLegalProfilePage';

export const OrganizationProfilePage: React.FC = () => {
  return <CompanyLegalProfilePage />;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEAM MANAGEMENT PAGE (Customer Organization Accounts Only)
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationMembersPage: React.FC = () => {
  const [data, setData] = useState<OrganizationMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Owner' | 'Admin' | 'Member' | 'Viewer'>('Member');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Role Edit Modal
  const [roleEditMember, setRoleEditMember] = useState<OrganizationMemberItem | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<'Owner' | 'Admin' | 'Member' | 'Viewer'>('Member');
  const [roleEditError, setRoleEditError] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Lock Account Modal
  const [lockTarget, setLockTarget] = useState<OrganizationMemberItem | null>(null);
  const [lockReason, setLockReason] = useState('Security policy review');
  const [lockDuration, setLockDuration] = useState('24_HOURS');
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Account Modal
  const [unlockTarget, setUnlockTarget] = useState<OrganizationMemberItem | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Remove Member Modal
  const [deletingMember, setDeletingMember] = useState<OrganizationMemberItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Cancel Invitation Modal
  const [cancelingInvite, setCancelingInvite] = useState<OrganizationInvitationItem | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await organizationApi.getMembersData();
      setData(res);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load organization members.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Calculate active Owner count for Owner Protection
  const activeOwnersCount = useMemo(() => {
    if (!data?.members) return 1;
    return data.members.filter(
      (m) => (m.role.toUpperCase() === 'OWNER') && (m.status === 'Active' || !m.status)
    ).length;
  }, [data]);

  // Unified items list (Members + Invitations)
  interface UnifiedMemberRow {
    id: string;
    isInvitation: boolean;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Invited' | 'Inactive' | 'Locked' | 'Disabled';
    joinedDate: string;
    lastActive: string;
    isCurrentUser?: boolean;
    invitationId?: string;
    expiresAt?: string;
  }

  const unifiedList = useMemo<UnifiedMemberRow[]>(() => {
    if (!data) return [];
    const memberRows: UnifiedMemberRow[] = (data.members || []).map((m) => ({
      id: m.id,
      isInvitation: false,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      joinedDate: m.joinedDate,
      lastActive: m.lastActive || 'Recently',
      isCurrentUser: m.isCurrentUser,
    }));

    const inviteRows: UnifiedMemberRow[] = (data.invitations || [])
      .filter((i) => i.status === 'Pending')
      .map((i) => ({
        id: `invite-${i.id}`,
        isInvitation: true,
        invitationId: i.id,
        name: i.name || 'Invited User',
        email: i.email,
        role: i.role,
        status: 'Invited' as const,
        joinedDate: i.invitedAt ? new Date(i.invitedAt).toLocaleDateString() : 'Pending',
        lastActive: 'Awaiting Acceptance',
        expiresAt: i.expiresAt,
      }));

    return [...memberRows, ...inviteRows];
  }, [data]);

  const filteredItems = useMemo(() => {
    return unifiedList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase());

      const normRole = item.role.toUpperCase();
      const matchRole =
        roleFilter === 'ALL' ||
        normRole === roleFilter.toUpperCase() ||
        (roleFilter === 'MEMBER' && normRole === 'MEMBER');

      const matchStatus =
        statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [unifiedList, searchQuery, roleFilter, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  // Role Capabilities Description
  const getRoleCapabilities = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case 'OWNER':
        return 'Full organization ownership, enterprise contract oversight, billing & quota management, member access control, and complete modernization authority.';
      case 'ADMIN':
        return 'Administrative management of team members, project workspaces, modernization configurations, and compliance report exports.';
      case 'MEMBER':
        return 'Create and manage modernization workspaces, upload legacy COBOL/BMS sources, execute transpiler & conversion pipelines, and review findings.';
      case 'VIEWER':
      default:
        return 'Read-only access to project workspaces, conversion telemetry, AST validation metrics, and downloaded artifacts.';
    }
  };

  // Actions
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteError('Please provide a valid business email address.');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError('');
      await organizationApi.inviteMember({
        email: inviteEmail.trim(),
        name: inviteName.trim() || inviteEmail.split('@')[0],
        role: inviteRole,
      });
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Member');
      setFeedback({ type: 'success', message: `Invitation successfully sent to ${inviteEmail}.` });
      await fetchMembers();
    } catch (err: any) {
      setInviteError(err?.message || 'Failed to send invitation. Please verify permissions.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleOpenRoleModal = (m: UnifiedMemberRow) => {
    const rawRole = (m.role.charAt(0).toUpperCase() + m.role.slice(1).toLowerCase()) as 'Owner' | 'Admin' | 'Member' | 'Viewer';
    setRoleEditMember({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      joinedDate: m.joinedDate,
      isCurrentUser: m.isCurrentUser,
    });
    setNewSelectedRole(['Owner', 'Admin', 'Member', 'Viewer'].includes(rawRole) ? rawRole : 'Member');
    setRoleEditError('');
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleEditMember) return;

    // Owner protection: cannot demote the last remaining active owner
    const isTargetOwner = roleEditMember.role.toUpperCase() === 'OWNER';
    const isDemoting = newSelectedRole.toUpperCase() !== 'OWNER';
    if (isTargetOwner && isDemoting && activeOwnersCount <= 1) {
      setRoleEditError('Cannot demote the last remaining active Owner. Another member must be promoted to Owner first.');
      return;
    }

    try {
      setIsUpdatingRole(true);
      setRoleEditError('');
      await organizationApi.updateMemberRole(roleEditMember.id, newSelectedRole);
      setRoleEditMember(null);
      setFeedback({ type: 'success', message: `Updated ${roleEditMember.name}'s role to ${newSelectedRole}.` });
      await fetchMembers();
    } catch (err: any) {
      setRoleEditError(err?.message || 'Failed to update member role.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleConfirmLock = async () => {
    if (!lockTarget) return;

    // Owner protection: cannot lock last owner
    if (lockTarget.role.toUpperCase() === 'OWNER' && activeOwnersCount <= 1) {
      setFeedback({ type: 'error', message: 'Cannot lock the last remaining active Owner of the organization.' });
      setLockTarget(null);
      return;
    }
    if (lockTarget.isCurrentUser) {
      setFeedback({ type: 'error', message: 'You cannot suspend or lock your own account.' });
      setLockTarget(null);
      return;
    }

    try {
      setIsLocking(true);
      await organizationApi.lockMember(lockTarget.id, lockReason);
      setFeedback({ type: 'success', message: `Account access suspended for ${lockTarget.name}.` });
      setLockTarget(null);
      await fetchMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to lock member account.' });
    } finally {
      setIsLocking(false);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    try {
      setIsUnlocking(true);
      await organizationApi.unlockMember(unlockTarget.id);
      setFeedback({ type: 'success', message: `Account access restored for ${unlockTarget.name}.` });
      setUnlockTarget(null);
      await fetchMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to unlock member account.' });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!deletingMember) return;

    if (deletingMember.role.toUpperCase() === 'OWNER' && activeOwnersCount <= 1) {
      setFeedback({ type: 'error', message: 'Cannot remove the last remaining active Owner of the organization.' });
      setDeletingMember(null);
      return;
    }
    if (deletingMember.isCurrentUser) {
      setFeedback({ type: 'error', message: 'You cannot remove your own account from the organization.' });
      setDeletingMember(null);
      return;
    }

    try {
      setIsRemoving(true);
      await organizationApi.removeMember(deletingMember.id);
      setFeedback({ type: 'success', message: `Removed ${deletingMember.name} from the organization.` });
      setDeletingMember(null);
      await fetchMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to remove member.' });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleResendInvite = async (invitationId: string, email: string) => {
    try {
      await organizationApi.resendInvitation(invitationId);
      setFeedback({ type: 'success', message: `Invitation email resent to ${email}.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to resend invitation.' });
    }
  };

  const handleConfirmCancelInvite = async () => {
    if (!cancelingInvite) return;
    try {
      setIsCanceling(true);
      await organizationApi.cancelInvitation(cancelingInvite.id);
      setFeedback({ type: 'success', message: `Invitation for ${cancelingInvite.email} cancelled.` });
      setCancelingInvite(null);
      await fetchMembers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to cancel invitation.' });
    } finally {
      setIsCanceling(false);
    }
  };

  // Helper for role badges
  const renderRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'OWNER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Shield className="w-3 h-3 text-indigo-600" />
          Owner
        </span>
      );
    }
    if (r === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <ShieldCheck className="w-3 h-3 text-blue-600" />
          Admin
        </span>
      );
    }
    if (r === 'MEMBER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Member
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Viewer
      </span>
    );
  };

  // Helper for status badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'Invited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Invited
          </span>
        );
      case 'Locked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-500" />
            Locked
          </span>
        );
      case 'Disabled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Disabled
          </span>
        );
    }
  };

  // KPI Metrics
  const summary = data?.summary || {
    totalMembers: unifiedList.length,
    activeMembers: unifiedList.filter((m) => m.status === 'Active').length,
    pendingInvitations: unifiedList.filter((m) => m.status === 'Invited').length,
    lockedAccounts: unifiedList.filter((m) => m.status === 'Locked').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        subtitle="Manage customer organization members, role-based access permissions, and account security."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchMembers} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsInviteOpen(true)}>
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Invite Member</span>
            </Button>
          </div>
        }
      />

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Total Members</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0652CC] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#091E42] mt-2">{summary.totalMembers}</p>
          <span className="text-[11px] text-[#6B778C] block mt-0.5">Organization accounts</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Active Members</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{summary.activeMembers}</p>
          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Authenticated & active</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Pending Invitations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{summary.pendingInvitations}</p>
          <span className="text-[11px] text-amber-700 font-medium block mt-0.5">Awaiting user acceptance</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Locked Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{summary.lockedAccounts}</p>
          <span className="text-[11px] text-rose-700 font-medium block mt-0.5">Security policy hold</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#6B778C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            <input
              type="text"
              placeholder="Search members by name or email address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full h-8 pl-10 pr-4 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 px-3 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 px-3 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Invited">Invited</option>
              <option value="Locked">Locked</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5">Joined Date</th>
                <th className="px-4 py-3.5">Last Active</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#6B778C]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0652CC]" />
                    Loading organization members...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#6B778C]">
                    No organization members found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isOwner = item.role.toUpperCase() === 'OWNER';
                  const isLastActiveOwner = isOwner && activeOwnersCount <= 1;

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Member Name + Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#244A70] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#091E42]">{item.name}</span>
                              {item.isCurrentUser && (
                                <span className="bg-blue-100 text-[#0652CC] text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            {item.isInvitation && (
                              <span className="text-[10px] text-amber-600 block">Pending Invitation</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 font-medium text-[#42526E] font-mono text-[11px]">
                        {item.email}
                      </td>

                      {/* Assigned Role */}
                      <td className="px-4 py-3.5">
                        {renderRoleBadge(item.role)}
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-3.5">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 text-[#6B778C] text-[11px]">
                        {item.joinedDate}
                      </td>

                      {/* Last Active */}
                      <td className="px-4 py-3.5 text-[#6B778C] text-[11px]">
                        {item.lastActive}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {item.isInvitation ? (
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              title="Resend invitation email"
                              onClick={() => item.invitationId && handleResendInvite(item.invitationId, item.email)}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              title="Cancel pending invitation"
                              onClick={() =>
                                setCancelingInvite({
                                  id: item.invitationId || item.id.replace('invite-', ''),
                                  name: item.name,
                                  email: item.email,
                                  role: item.role,
                                  status: 'Pending',
                                  invitedAt: item.joinedDate,
                                  expiresAt: item.expiresAt || '',
                                })
                              }
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Role edit */}
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              title={
                                isLastActiveOwner
                                  ? 'Last remaining Owner cannot be demoted'
                                  : 'Change member role'
                              }
                              onClick={() => handleOpenRoleModal(item)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Role
                            </Button>

                            {/* Lock / Unlock */}
                            {item.status === 'Locked' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-[11px] h-7 px-2 text-emerald-700 hover:text-emerald-800"
                                title="Unlock account access"
                                onClick={() =>
                                  setUnlockTarget({
                                    id: item.id,
                                    name: item.name,
                                    email: item.email,
                                    role: item.role,
                                    status: item.status,
                                    joinedDate: item.joinedDate,
                                  })
                                }
                              >
                                <Unlock className="w-3 h-3 mr-1" />
                                Unlock
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-[11px] h-7 px-2 text-rose-600 hover:text-rose-700 disabled:opacity-40"
                                disabled={Boolean(item.isCurrentUser) || isLastActiveOwner}
                                title={
                                  item.isCurrentUser
                                    ? 'You cannot suspend your own account'
                                    : isLastActiveOwner
                                    ? 'Cannot lock the last active Owner'
                                    : 'Suspend account access'
                                }
                                onClick={() =>
                                  setLockTarget({
                                    id: item.id,
                                    name: item.name,
                                    email: item.email,
                                    role: item.role,
                                    status: item.status,
                                    joinedDate: item.joinedDate,
                                    isCurrentUser: item.isCurrentUser,
                                  })
                                }
                              >
                                <Lock className="w-3 h-3" />
                              </Button>
                            )}

                            {/* Remove Member */}
                            <Button
                              variant="danger"
                              size="sm"
                              className="text-[11px] h-7 px-2 disabled:opacity-40"
                              disabled={Boolean(item.isCurrentUser) || isLastActiveOwner}
                              title={
                                item.isCurrentUser
                                  ? 'You cannot remove your own account'
                                  : isLastActiveOwner
                                  ? 'Cannot remove the last active Owner'
                                  : 'Remove member from organization'
                              }
                              onClick={() =>
                                setDeletingMember({
                                  id: item.id,
                                  name: item.name,
                                  email: item.email,
                                  role: item.role,
                                  status: item.status,
                                  joinedDate: item.joinedDate,
                                  isCurrentUser: item.isCurrentUser,
                                })
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
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

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 border-t border-[#E5EAF0] text-xs">
          <span className="text-[#6B778C]">
            Showing <strong className="text-[#091E42]">{Math.min(filteredItems.length, (page - 1) * pageSize + 1)}</strong> to{' '}
            <strong className="text-[#091E42]">{Math.min(filteredItems.length, page * pageSize)}</strong> of{' '}
            <strong className="text-[#091E42]">{filteredItems.length}</strong> members
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Organization Member">
          <form onSubmit={handleInvite} className="space-y-4">
            <p className="text-xs text-[#6B778C]">
              Send an email invitation to add a colleague to your customer organization under Platform-Based Modernization.
            </p>

            {inviteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{inviteError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Full Name (Optional)</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Alex Henderson"
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Business Email Address *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="e.g. a.henderson@enterprise.com"
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              >
                <option value="Owner">Owner (Full Organization & Contract Authority)</option>
                <option value="Admin">Admin (Project, Member & Configuration Management)</option>
                <option value="Member">Member (Create Workspaces & Run Modernization)</option>
                <option value="Viewer">Viewer (Read-Only Telemetry & Validation Reports)</option>
              </select>
            </div>

            {/* Role Capabilities Preview */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#0652CC] uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Role Capability Scope
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {getRoleCapabilities(inviteRole)}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isInviting}>
                {isInviting ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Role Modal */}
      {roleEditMember && (
        <Modal isOpen={Boolean(roleEditMember)} onClose={() => setRoleEditMember(null)} title="Reassign Member Role">
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-bold text-[#091E42]">{roleEditMember.name}</p>
              <p className="text-[11px] text-[#6B778C] font-mono">{roleEditMember.email}</p>
            </div>

            {roleEditError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{roleEditError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Select New Role</label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              >
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#0652CC] uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Granted Privileges
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {getRoleCapabilities(newSelectedRole)}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" type="button" onClick={() => setRoleEditMember(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isUpdatingRole}>
                {isUpdatingRole ? 'Updating...' : 'Save Role Assignment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lock Account Modal */}
      {lockTarget && (
        <Modal isOpen={Boolean(lockTarget)} onClose={() => setLockTarget(null)} title="Security Account Suspension">
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Suspend Active Session & Credentials</p>
                <p className="mt-0.5">
                  Are you sure you want to temporarily lock <strong>{lockTarget.name}</strong> ({lockTarget.email})? 
                  They will be logged out immediately and blocked from accessing modernization projects.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Suspension Reason</label>
              <select
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white"
              >
                <option value="Security policy review">Security policy review</option>
                <option value="Temporary access suspension">Temporary access suspension</option>
                <option value="Administrative hold during investigation">Administrative hold during investigation</option>
                <option value="Offboarding preparation">Offboarding preparation</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Duration</label>
              <select
                value={lockDuration}
                onChange={(e) => setLockDuration(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white"
              >
                <option value="24_HOURS">24 Hours</option>
                <option value="7_DAYS">7 Days</option>
                <option value="INDEFINITE">Indefinite (Until manually unlocked)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setLockTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmLock} disabled={isLocking}>
                {isLocking ? 'Suspending...' : 'Confirm Account Lock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Unlock Account Modal */}
      {unlockTarget && (
        <Modal isOpen={Boolean(unlockTarget)} onClose={() => setUnlockTarget(null)} title="Restore Account Access">
          <div className="space-y-4">
            <p className="text-xs text-[#42526E]">
              Unlock account for <strong>{unlockTarget.name}</strong> ({unlockTarget.email})?
              Their security hold will be cleared and they will regain full access based on their assigned role ({unlockTarget.role}).
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setUnlockTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmUnlock} disabled={isUnlocking}>
                {isUnlocking ? 'Restoring...' : 'Restore Access'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove Member Confirmation Modal */}
      {deletingMember && (
        <Modal isOpen={Boolean(deletingMember)} onClose={() => setDeletingMember(null)} title="Confirm Member Removal">
          <div className="space-y-4">
            <p className="text-xs text-[#42526E]">
              Are you sure you want to remove <strong>{deletingMember.name}</strong> ({deletingMember.email}) from your organization?
              Their project workspace access and API permissions will be revoked immediately.
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setDeletingMember(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmRemove} disabled={isRemoving}>
                {isRemoving ? 'Removing...' : 'Confirm Removal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Invitation Confirmation Modal */}
      {cancelingInvite && (
        <Modal isOpen={Boolean(cancelingInvite)} onClose={() => setCancelingInvite(null)} title="Cancel Invitation">
          <div className="space-y-4">
            <p className="text-xs text-[#42526E]">
              Cancel pending invitation for <strong>{cancelingInvite.email}</strong>?
              The invitation token will be invalidated and they will no longer be able to enroll into your organization.
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setCancelingInvite(null)}>
                Keep Invitation
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmCancelInvite} disabled={isCanceling}>
                {isCanceling ? 'Cancelling...' : 'Cancel Invitation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERNAL TEAMS NOTICE (Excluded from Web3 Platform-Based Modernization)
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationTeamsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-8 text-center shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0652CC] mx-auto flex items-center justify-center">
          <Building2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#091E42]">
            Self-Service Organization Structure
          </h2>
          <p className="text-xs text-[#6B778C] max-w-md mx-auto leading-relaxed">
            Under the <strong>Platform-Based Modernization</strong> agreement, your organization operates autonomously. Internal engineering squads and ALSM delivery teams belong exclusively to the ALSM operational environment (Web2).
          </p>
        </div>

        <div className="p-4 bg-[#F8FAFC] border border-[#E5EAF0] rounded-xl text-left text-xs text-[#42526E] space-y-2">
          <p className="font-semibold text-[#091E42] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#0652CC]" />
            Where to manage your team:
          </p>
          <p>
            All member onboarding, role delegations (Owner, Admin, Member, Viewer), and access security are centralized in <strong>Team Management</strong>.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/settings/team')}
            className="inline-flex items-center gap-2"
          >
            <span>Go to Team Management</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ORGANISATION PROJECTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modernization Workspaces"
        subtitle="Manage your legacy BMS/DSPF and COBOL modernization workspace projects."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchProjects}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>New Project</span>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#6B778C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            <input
              type="text"
              placeholder="Search organisation projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-10 pr-4 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-3 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-Width Projects Table */}
      <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Project Name</th>
                <th className="px-4 py-3.5">Architecture Target</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6B778C]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0652CC]" />
                    Loading organisation projects...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6B778C]">
                    No modernization projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-[#091E42] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          <FolderGit2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-[#091E42]">{p.name}</p>
                          <p className="text-[11px] text-[#6B778C]">{p.description || 'Legacy modernization workspace'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#42526E]">
                      {p.conversionType === 'BMS_DSPF_TO_FRONTEND' ? 'BMS/DSPF → React 19' : 'COBOL → Java 21'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/projects/${p.id}/diagnostics`)}
                        className="text-xs"
                      >
                        Diagnostics
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/projects/${p.id}/screens`)}
                        className="text-xs"
                      >
                        <span>Workspace</span>
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={() => {
          setIsCreateOpen(false);
          fetchProjects();
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. ROLES & PERMISSIONS PAGE (Customer Organization RBAC Only)
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationRolesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [roles, setRoles] = useState<SystemRoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionInventoryItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('OWNER');
  const [loading, setLoading] = useState(true);
  const [permSearch, setPermSearch] = useState('');

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      const [rData, pData, mData] = await Promise.all([
        organizationApi.getRoles(),
        organizationApi.getPermissions(),
        organizationApi.getMembersData().catch(() => null),
      ]);

      // Calculate member counts for customer roles
      const updatedRoles = rData.map((r) => {
        let count = r.assignedUsersCount;
        if (mData?.members) {
          const matchCount = mData.members.filter(
            (m) => m.role.toUpperCase() === r.id.toUpperCase()
          ).length;
          count = matchCount;
        }
        return { ...r, assignedUsersCount: count };
      });

      setRoles(updatedRoles);
      setPermissions(pData);

      if (updatedRoles.length > 0) {
        setSelectedRoleId(updatedRoles[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  // Group permissions by category
  const groupedPerms = useMemo(() => {
    const map = new Map<string, PermissionInventoryItem[]>();
    for (const p of permissions) {
      const list = map.get(p.group) || [];
      list.push(p);
      map.set(p.group, list);
    }
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }, [permissions]);

  const filteredPerms = useMemo(() => {
    if (!permSearch.trim()) return permissions;
    return permissions.filter(
      (p) =>
        p.key.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.label.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.group.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(permSearch.toLowerCase())
    );
  }, [permissions, permSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Review customer organization role-based access control (RBAC) and security authorization policies."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchRolesData} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-[#D9E2EC] flex space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 transition-colors ${
            activeTab === 'roles'
              ? 'border-b-2 border-[#0652CC] text-[#0652CC]'
              : 'text-[#6B778C] hover:text-[#091E42]'
          }`}
        >
          Roles & Policy Matrix ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 transition-colors ${
            activeTab === 'permissions'
              ? 'border-b-2 border-[#0652CC] text-[#0652CC]'
              : 'text-[#6B778C] hover:text-[#091E42]'
          }`}
        >
          Permission Catalog ({permissions.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B778C]">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0652CC]" />
          Loading RBAC policies...
        </div>
      ) : activeTab === 'roles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Predefined Roles List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">
                Organization Roles ({roles.length})
              </span>
            </div>

            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-50/60 border-[#0652CC] shadow-xs'
                        : 'bg-white border-[#D9E2EC] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#091E42]">{r.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded border border-slate-200">
                            System Defined
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#6B778C] mt-0.5">{r.id}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#42526E] mt-2 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px]">
                      <span className="text-[#6B778C]">
                        <strong className="text-[#091E42]">{r.assignedUsersCount}</strong> Users Assigned
                      </span>
                      <span className="text-[#0652CC] font-semibold">
                        {r.permissions.includes('*') ? 'Full System Authority' : `${r.permissions.length} Capabilities`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Role Permissions Matrix */}
          <div className="lg:col-span-8">
            {selectedRole && (
              <Card variant="default" padding="lg" className="space-y-5 shadow-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5EAF0] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#091E42]">{selectedRole.name}</h3>
                      <span className="text-[10px] bg-blue-100 text-[#0652CC] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                        System Defined
                      </span>
                    </div>
                    <p className="text-xs text-[#6B778C] mt-0.5">{selectedRole.description}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Role Identifier: {selectedRole.id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-lg border border-slate-200">
                      Immutable Policy
                    </span>
                  </div>
                </div>

                {/* System Role Security Notice */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#0652CC] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-blue-950 leading-relaxed">
                    <p className="font-bold">Protected Organization Role</p>
                    <p className="mt-0.5">
                      This role is standardized by ALSM Enterprise Security for Platform-Based Modernization. Its functional permissions are immutably granted to preserve system operational consistency and self-service pipeline integrity.
                    </p>
                  </div>
                </div>

                {/* 8 Permission Categories */}
                <div className="space-y-5">
                  {groupedPerms.map(({ group, items }) => (
                    <div key={group} className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-xs font-bold text-[#091E42] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0652CC]" />
                          {group}
                        </span>
                        <span className="text-[10px] text-[#6B778C]">
                          {items.length} capabilities
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {items.map((p) => {
                          const isRoot = selectedRole.permissions.includes('*');
                          const isChecked = isRoot || selectedRole.permissions.includes(p.key);

                          return (
                            <div
                              key={p.key}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                                isChecked
                                  ? 'bg-white border-[#D9E2EC]'
                                  : 'bg-slate-50/60 border-slate-200 opacity-60'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? 'bg-[#0652CC] text-white'
                                    : 'border border-slate-300 bg-white text-transparent'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-[#091E42] block">
                                  {p.label}
                                </span>
                                <span className="text-[10px] font-mono text-[#0652CC] block">
                                  {p.key}
                                </span>
                                <p className="text-[11px] text-[#6B778C] leading-tight">
                                  {p.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Permission Inventory Catalog */
        <div className="space-y-4">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#6B778C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder="Search permissions by key, module, or description..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="w-full h-8 pl-10 pr-4 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              />
            </div>
          </div>

          <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Permission Key</th>
                  <th className="px-4 py-3.5">Category / Group</th>
                  <th className="px-4 py-3.5">Functional Capability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {filteredPerms.map((p) => (
                  <tr key={p.key} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3 font-mono font-bold text-[#0652CC]">{p.key}</td>
                    <td className="px-4 py-3 font-medium text-[#091E42]">{p.group}</td>
                    <td className="px-4 py-3 text-[#42526E]">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. ORGANISATION ANALYTICS PAGE (Platform-Based Modernization Focus)
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<OrganizationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await organizationApi.getAnalytics();
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Metric,Value',
        `Contract Number,${data.contractNumber || 'ALSM-CTR-2026-343F'}`,
        `Service Model,${data.serviceMode || 'Platform-Based Modernization'}`,
        `Total Projects,${data.totalProjects}`,
        `Active Projects,${data.activeProjects}`,
        `Completed Projects,${data.completedProjects}`,
        `Screens Converted,${data.totalScreensConverted}`,
        `Screen Quota,${data.screenQuota}`,
        `Programs Converted,${data.totalProgramsConverted}`,
        `Program Quota,${data.programQuota}`,
        `Storage Used GB,${data.storageUsedGb}`,
        `Storage Quota GB,${data.storageQuotaGb}`,
        `AST Parity Accuracy,${data.averageAccuracyRate}%`,
        `AI Syntax Validation Rate,${data.aiValidationRate}%`,
        `SLA Commitment,${data.slaCommitment || '99.9% AST Parity Guaranteed'}`
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `organisation_analytics_${data.contractNumber || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Analytics"
        subtitle="Self-service modernization telemetry, conversion throughput, AST validation health, and resource quota usage."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="space-x-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B778C]">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0652CC]" />
          Loading organization modernization telemetry...
        </div>
      ) : (
        <>
          {/* Active Contract & SLA Context Header */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border border-blue-200/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#244A70] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#091E42]">
                    {data?.contractPlanName || 'Enterprise Modernization Agreement'}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    ACTIVE CONTRACT
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    Platform-Based Modernization
                  </span>
                </div>
                <p className="text-[11px] text-[#42526E] mt-0.5">
                  Contract #{data?.contractNumber || 'ALSM-CTR-2026-343F'} • SLA: {data?.slaCommitment || '99.9% Deterministic AST Parity'} • Valid until {data?.validUntil ? new Date(data.validUntil).toLocaleDateString() : 'Nov 09, 2027'}
                </p>
              </div>
            </div>
            <Link
              to="/billing/contracts"
              className="text-xs font-semibold text-[#0652CC] hover:text-[#0540A3] flex items-center gap-1 shrink-0 self-start md:self-auto bg-white px-3 py-1.5 rounded-xl border border-blue-200 hover:border-blue-300 transition-all shadow-2xs"
            >
              <span>View Full Contract Scope</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 5 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Total Projects */}
            <Card variant="default" padding="md" className="shadow-2xs">
              <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider block">
                Total Projects
              </span>
              <p className="text-2xl font-extrabold text-[#091E42] mt-1">{data?.totalProjects ?? 1}</p>
              <div className="flex items-center gap-2 text-[11px] text-[#42526E] mt-1 font-medium">
                <span className="text-blue-600 font-bold">{data?.activeProjects ?? 1} Active</span>
                <span>•</span>
                <span>{data?.statusBreakdown?.draft ?? 0} Draft</span>
              </div>
            </Card>

            {/* 2. Completed Projects */}
            <Card variant="default" padding="md" className="shadow-2xs">
              <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider block">
                Completed Projects
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{data?.completedProjects ?? 0}</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {data?.totalProjects ? Math.round(((data.completedProjects ?? 0) / data.totalProjects) * 100) : 0}% Completion Rate
              </p>
            </Card>

            {/* 3. Converted Assets */}
            <Card variant="default" padding="md" className="shadow-2xs">
              <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider block">
                Converted Assets
              </span>
              <p className="text-2xl font-extrabold text-[#091E42] mt-1">
                {(data?.totalScreensConverted ?? 0) + (data?.totalProgramsConverted ?? 0)}
              </p>
              <p className="text-[11px] text-[#0652CC] font-semibold mt-1">
                {data?.totalScreensConverted ?? 0} / {data?.screenQuota ?? 2000} Screens • {data?.totalProgramsConverted ?? 0} / {data?.programQuota ?? 5} Prgs
              </p>
            </Card>

            {/* 4. Validation Health */}
            <Card variant="default" padding="md" className="shadow-2xs">
              <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider block">
                Validation Parity
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {data?.averageAccuracyRate ?? 100}%
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                Deterministic AST Parity (0 Syntax Faults)
              </p>
            </Card>

            {/* 5. Storage Utilization */}
            <Card variant="default" padding="md" className="shadow-2xs">
              <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider block">
                Storage Quota
              </span>
              <p className="text-2xl font-extrabold text-[#091E42] mt-1">
                {Number(data?.storageUsedGb ?? 0).toFixed(1)} GB
              </p>
              <p className="text-[11px] text-[#6B778C] font-semibold mt-1">
                Of {data?.storageQuotaGb ?? 50.0} GB Quota
              </p>
            </Card>
          </div>

          {/* Activity Timeline & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Modernization Activity Timeline */}
            <Card variant="default" padding="lg" className="lg:col-span-7 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5EAF0] pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#091E42]">
                    Modernization Activity Velocity
                  </h3>
                  <p className="text-[11px] text-[#6B778C]">
                    AST conversions and code generation runs over time
                  </p>
                </div>

                <div className="flex items-center space-x-1 bg-[#F1F5F9] p-0.5 rounded-lg text-[11px]">
                  {(['7d', '30d', '90d', '12m'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all uppercase ${
                        timeframe === t
                          ? 'bg-white text-[#091E42] shadow-2xs'
                          : 'text-[#6B778C] hover:text-[#091E42]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
                {(data?.activityTrend || []).map((t) => {
                  const maxCount = Math.max(...(data?.activityTrend.map((x) => x.count) || [1]), 10);
                  const heightPx = Math.max(12, Math.round((t.count / maxCount) * 110));
                  return (
                    <div key={t.period} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#42526E]">{t.count}</span>
                      <div
                        className="w-full bg-[#244A70] rounded-t-md hover:bg-[#1B3856] transition-all opacity-90 shadow-2xs"
                        style={{ height: `${heightPx}px` }}
                        title={`${t.count} conversion operations in ${t.period}`}
                      />
                      <span className="text-[11px] font-semibold text-[#6B778C]">{t.period}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Right: Project Progress Overview */}
            <Card variant="default" padding="lg" className="lg:col-span-5 space-y-4 shadow-2xs">
              <div className="border-b border-[#E5EAF0] pb-3">
                <h3 className="text-sm font-bold text-[#091E42]">
                  Workspace Pipeline Statuses
                </h3>
                <p className="text-[11px] text-[#6B778C]">
                  Distribution of customer modernization projects
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Draft / Provisioning', count: data?.statusBreakdown?.draft ?? 1, color: 'bg-slate-400' },
                  { label: 'Source Uploaded', count: data?.statusBreakdown?.uploaded ?? 0, color: 'bg-blue-400' },
                  { label: 'AST Analyzing', count: data?.statusBreakdown?.analyzing ?? 0, color: 'bg-sky-500' },
                  { label: 'Code Converting', count: data?.statusBreakdown?.converting ?? 0, color: 'bg-indigo-600' },
                  { label: 'Validating & Parity Check', count: data?.statusBreakdown?.validating ?? 0, color: 'bg-amber-500' },
                  { label: 'Completed & Ready', count: data?.statusBreakdown?.completed ?? 0, color: 'bg-emerald-600' },
                  { label: 'Failed / Needs Attention', count: data?.statusBreakdown?.failed ?? 0, color: 'bg-rose-500' },
                ].map((s) => {
                  const total = Math.max(1, data?.totalProjects ?? 1);
                  const pct = Math.round((s.count / total) * 100);

                  return (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-medium text-[#42526E]">{s.label}</span>
                        <span className="font-bold text-[#091E42]">{s.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#E5EAF0] rounded-full h-1.5">
                        <div
                          className={`${s.color} h-1.5 rounded-full transition-all`}
                          style={{ width: `${s.count > 0 ? Math.max(6, pct) : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Conversion Breakdown & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Conversion Type Breakdown */}
            <Card variant="default" padding="lg" className="lg:col-span-5 space-y-4 shadow-2xs">
              <div className="border-b border-[#E5EAF0] pb-3">
                <h3 className="text-sm font-bold text-[#091E42]">
                  Conversion Technology Targets
                </h3>
                <p className="text-[11px] text-[#6B778C]">
                  Modernization workloads by architecture profile
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E5EAF0] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0652CC] flex items-center justify-center font-bold">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#091E42]">BMS / DSPF → React 19</h4>
                      <p className="text-[11px] text-[#6B778C]">Modern TypeScript Web Terminals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#091E42]">
                      {data?.conversionTypeBreakdown?.bmsDspf ?? 0}
                    </span>
                    <span className="text-[10px] text-[#6B778C] block">Workspaces</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E5EAF0] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#091E42]">COBOL → Java 21</h4>
                      <p className="text-[11px] text-[#6B778C]">Spring Boot Microservices</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#091E42]">
                      {data?.conversionTypeBreakdown?.cobol ?? 1}
                    </span>
                    <span className="text-[10px] text-[#6B778C] block">Workspaces</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Organization Activity */}
            <Card variant="default" padding="lg" className="lg:col-span-7 space-y-4 shadow-2xs">
              <div className="border-b border-[#E5EAF0] pb-3">
                <h3 className="text-sm font-bold text-[#091E42]">
                  Recent Organization Activity
                </h3>
                <p className="text-[11px] text-[#6B778C]">
                  Audit feed of modernization events triggered by your team
                </p>
              </div>

              <div className="divide-y divide-[#E5EAF0]">
                {(data?.recentActivity || []).length === 0 ? (
                  <p className="text-xs text-[#6B778C] py-4 text-center">No recent activity recorded.</p>
                ) : (
                  (data?.recentActivity || []).map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#0652CC] shrink-0" />
                        <div>
                          <p className="font-semibold text-[#091E42]">{act.title}</p>
                          <p className="text-[11px] text-[#6B778C]">Initiated by {act.user}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#6B778C] font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. SECURITY AUDIT LOGS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await organizationApi.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter,
      });
      setLogs(res.items);
      setTotalPages(res.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.ipAddress.includes(searchQuery);
      return matchSearch;
    });
  }, [logs, searchQuery]);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Action,Actor,Email,Resource,IP,Timestamp', ...logs.map((l) => `${l.action},${l.actor},${l.actorEmail},${l.resourceType},${l.ipAddress},${l.timestamp}`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'security_audit_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Audit Logs"
        subtitle="Immutable audit stream tracking authentication, role delegations, and modernization actions."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="space-x-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#6B778C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            <input
              type="text"
              placeholder="Filter audit events by actor, action name, or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-10 pr-4 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 px-3 py-0 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="PROJECT_CREATED">Project Creation</option>
              <option value="USER_INVITED">User Onboarding</option>
              <option value="EXPORT_BUNDLE_DOWNLOAD">Export Downloads</option>
              <option value="TEAM_MEMBER_ASSIGNED">Team Assignments</option>
              <option value="ROLE_PERMISSIONS_UPDATED">Role Permissions</option>
              <option value="MFA_VERIFIED_LOGIN">MFA Logins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-Width Immutable Audit Log Table */}
      <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Action / Event</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Target Resource</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0652CC]" />
                    Loading audit stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-3.5 h-3.5 text-[#0652CC] shrink-0" />
                        <span className="font-bold text-[#091E42] font-mono text-[11px]">{l.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#091E42]">{l.actor}</p>
                      <p className="text-[11px] text-[#6B778C]">{l.actorEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#42526E] text-[11px]">
                      {l.resourceType} {l.resourceId ? `(${l.resourceId})` : ''}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#6B778C]">{l.ipAddress}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#6B778C] text-[11px]">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 border-t border-[#E5EAF0] text-xs">
          <span className="text-[#6B778C]">
            Page <strong className="text-[#091E42]">{page}</strong> of <strong className="text-[#091E42]">{totalPages}</strong>
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
