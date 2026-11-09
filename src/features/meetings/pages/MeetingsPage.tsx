import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Users,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  Copy,
  Check,
  FolderGit2,
  Building,
  RotateCcw,
  X,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import { Button, Modal } from '@/shared/ui';
import { useAuth } from '@/app/providers';
import { useWorkspace } from '@/context/WorkspaceContext';
import { meetingRequestsApi } from '../api/meeting-requests.api';
import type {
  MeetingRequest,
  MeetingRequestStatus,
  ConsultationType,
  ConsultationTypeConfig,
} from '../types/meeting';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types/project';

export const MeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useWorkspace();

  // Data states
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationTypeConfig[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgMembers, setOrgMembers] = useState<Array<{ id: string; name: string; email: string; role: string; status: string }>>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filter States
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'upcoming'>('newest');

  // Modal States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form States
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    projectId: '',
    consultationType: 'TECHNICAL' as ConsultationType,
    requestedDate: '',
    requestedTime: '10:00',
    durationMinutes: 45,
    timezone: 'Asia/Ho_Chi_Minh',
    selectedMembers: [] as string[],
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledStartTime: '',
    scheduledEndTime: '',
    reason: '',
  });

  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // User role check
  const userRole = (user?.role || '').toUpperCase();
  const isViewer = userRole === 'VIEWER';

  // Load Initial Metadata (consultation types, projects, members)
  useEffect(() => {
    meetingRequestsApi
      .getConsultationTypes()
      .then((data) => setConsultationTypes(data))
      .catch((err) => console.warn('Failed to load consultation types:', err));

    projectService
      .getProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch((err) => console.warn('Failed to load projects:', err));

    meetingRequestsApi
      .getOrganizationMembers(organization?.id)
      .then((data) => {
        if (Array.isArray(data)) setOrgMembers(data);
      })
      .catch((err) => console.warn('Failed to load members:', err));
  }, [organization?.id]);

  // Fetch Meetings
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await meetingRequestsApi.listMeetingRequests({
        organizationId: organization?.id,
        search: searchTerm.trim() || undefined,
        status: statusTab === 'ALL' || statusTab === 'UPCOMING' ? '' : (statusTab as MeetingRequestStatus),
        consultationType: selectedType === 'ALL' ? undefined : selectedType,
        projectId: selectedProject === 'ALL' ? undefined : selectedProject,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res && Array.isArray(res.items)) {
        setMeetings(res.items);
        if (res.statusCounts) {
          setStatusCounts(res.statusCounts);
        }
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.error('Failed to load meeting requests:', err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [statusTab, selectedType, selectedProject, startDate, endDate, organization?.id]);

  // Derived filtered & sorted meetings
  const displayMeetings = useMemo(() => {
    let result = [...meetings];

    // Local tab filtering for UPCOMING vs others
    if (statusTab === 'UPCOMING') {
      result = result.filter(
        (m) =>
          (m.status === 'CONFIRMED' || m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS') &&
          (!m.scheduling?.scheduledStartTime ||
            new Date(m.scheduling.scheduledStartTime).getTime() >= Date.now() - 3600000),
      );
    } else if (statusTab === 'PENDING') {
      result = result.filter(
        (m) => m.status === 'NEW_REQUEST' || m.status === 'PENDING_SCHEDULING' || m.status === 'RESCHEDULE_REQUESTED',
      );
    } else if (statusTab === 'CONFIRMED') {
      result = result.filter((m) => m.status === 'CONFIRMED' || m.status === 'SCHEDULED');
    } else if (statusTab === 'COMPLETED') {
      result = result.filter((m) => m.status === 'COMPLETED');
    } else if (statusTab === 'CANCELLED') {
      result = result.filter((m) => m.status === 'CANCELLED' || m.status === 'NO_SHOW');
    }

    // Sort
    if (sortBy === 'upcoming') {
      result.sort((a, b) => {
        const timeA = new Date(a.scheduling?.scheduledStartTime || a.scheduling?.requestedDate || a.createdAt).getTime();
        const timeB = new Date(b.scheduling?.scheduledStartTime || b.scheduling?.requestedDate || b.createdAt).getTime();
        return timeA - timeB;
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [meetings, statusTab, sortBy]);

  // KPI Calculations
  const totalCount = meetings.length;
  const pendingCount = meetings.filter(
    (m) => m.status === 'NEW_REQUEST' || m.status === 'PENDING_SCHEDULING' || m.status === 'RESCHEDULE_REQUESTED',
  ).length;
  const upcomingCount = meetings.filter(
    (m) => m.status === 'CONFIRMED' || m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS',
  ).length;
  const completedCount = meetings.filter((m) => m.status === 'COMPLETED').length;

  // Handle Create Request Submit
  const handleCreateMeetingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    if (!requestForm.title.trim()) return;

    try {
      setSubmitting(true);
      const chosenProj = projects.find((p) => p.id === requestForm.projectId);

      const attendeeEmails = [
        user?.email || 'customer@alsm.dev',
        ...requestForm.selectedMembers,
      ].filter(Boolean);

      await meetingRequestsApi.createMeetingRequest({
        fullName: user?.fullName || user?.email?.split('@')[0] || 'Enterprise Lead',
        companyName: organization?.name || 'Enterprise Customer',
        email: user?.email || 'customer@alsm.dev',
        topic: requestForm.title.trim(),
        consultationType: requestForm.consultationType,
        businessRequirements: requestForm.description.trim() || undefined,
        requestedDate: requestForm.requestedDate || undefined,
        requestedTime: requestForm.requestedTime || '10:00',
        durationMinutes: requestForm.durationMinutes,
        timezone: requestForm.timezone,
        organizationId: organization?.id,
        projectId: requestForm.projectId || undefined,
        projectName: chosenProj?.name,
        attendeeEmails,
      });

      setShowRequestModal(false);
      setRequestForm({
        title: '',
        description: '',
        projectId: '',
        consultationType: 'TECHNICAL',
        requestedDate: '',
        requestedTime: '10:00',
        durationMinutes: 45,
        timezone: 'Asia/Ho_Chi_Minh',
        selectedMembers: [],
      });

      setActionSuccessMsg('Your consultation meeting request has been submitted for ALSM review.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchMeetings();
    } catch (err) {
      console.error('Failed to submit meeting request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reschedule Submit
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting || !rescheduleForm.reason.trim()) return;

    try {
      setSubmitting(true);
      await meetingRequestsApi.rescheduleMeeting(selectedMeeting.id || (selectedMeeting as any)._id, {
        scheduledStartTime: rescheduleForm.scheduledStartTime,
        scheduledEndTime: rescheduleForm.scheduledEndTime,
        reason: rescheduleForm.reason.trim(),
      });

      setShowRescheduleModal(false);
      setSelectedMeeting(null);
      setActionSuccessMsg('Meeting rescheduling requested successfully.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchMeetings();
    } catch (err) {
      console.error('Failed to reschedule meeting:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel Submit
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting || !cancelReason.trim()) return;

    try {
      setSubmitting(true);
      await meetingRequestsApi.cancelMeeting(selectedMeeting.id || (selectedMeeting as any)._id, cancelReason.trim());

      setShowCancelModal(false);
      setSelectedMeeting(null);
      setCancelReason('');
      setActionSuccessMsg('Meeting cancelled successfully.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchMeetings();
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Status Badge
  const renderStatusBadge = (status: MeetingRequestStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E3FCEF] text-[#006644]">
            <CheckCircle2 className="w-3 h-3 text-[#36B37E]" />
            <span>Confirmed</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#DEEBFF] text-[#0747A6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] animate-ping" />
            <span>In Progress</span>
          </span>
        );
      case 'NEW_REQUEST':
      case 'PENDING_SCHEDULING':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFF0B3] text-[#172B4D]">
            <Clock className="w-3 h-3 text-[#FFAB00]" />
            <span>Pending Review</span>
          </span>
        );
      case 'RESCHEDULE_REQUESTED':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFEBE6] text-[#BF2600]">
            <RotateCcw className="w-3 h-3 text-[#FF5630]" />
            <span>Reschedule Requested</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAE6FF] text-[#403294]">
            <Check className="w-3 h-3 text-[#6554C0]" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F4F5F7] text-[#6B778C]">
            <X className="w-3 h-3 text-[#6B778C]" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Helper: Format meeting time
  const formatMeetingDate = (meeting: MeetingRequest) => {
    if (meeting.scheduling?.scheduledStartTime) {
      const start = new Date(meeting.scheduling.scheduledStartTime);
      const end = meeting.scheduling.scheduledEndTime ? new Date(meeting.scheduling.scheduledEndTime) : null;
      return {
        dateStr: start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        timeStr: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${
          end ? ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
        }`,
      };
    }
    if (meeting.scheduling?.requestedDate) {
      return {
        dateStr: meeting.scheduling.requestedDate,
        timeStr: meeting.scheduling.requestedTime || 'Preferred time slot',
      };
    }
    return {
      dateStr: new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeStr: 'Pending scheduling',
    };
  };

  // Copy meeting link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Selected project for team preview in Request Modal
  const modalSelectedProject = projects.find((p) => p.id === requestForm.projectId);

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Page Header */}
      <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-2.5 py-0.5 rounded-full">
                Enterprise Collaboration
              </span>
              <span className="text-xs font-semibold text-[#6B778C]">
                Google Meet API Integrated
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#091E42] tracking-tight">
              Meeting Requests
            </h1>
            <p className="text-xs text-[#42526E] max-w-2xl leading-relaxed">
              Schedule and manage consultations with your assigned ALSM modernization team. Connect
              with Solutions Architects for AST conversion mappings, Spring Boot microservice
              architectures, and delivery reviews.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <Button
              variant="secondary"
              onClick={fetchMeetings}
              disabled={loading}
              className="text-xs flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            {!isViewer && (
              <Button
                variant="primary"
                onClick={() => navigate('/meeting-requests/new')}
                className="text-xs shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Meeting</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-[#E3FCEF] border border-[#ABF5D1] rounded-xl flex items-center justify-between text-xs text-[#006644] font-medium shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#36B37E] shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setActionSuccessMsg(null)} className="text-[#006644]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meetings */}
        <button
          type="button"
          onClick={() => setStatusTab('ALL')}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
            statusTab === 'ALL'
              ? 'bg-white border-[#0652CC] ring-2 ring-[#0652CC]/10 shadow-xs'
              : 'bg-white border-[#D9E2EC] hover:border-[#B3D4FF] shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B778C]">
            Total Meetings
          </span>
          <div className="text-2xl font-black text-[#091E42] mt-1.5">{totalCount}</div>
          <span className="text-[11px] text-[#42526E] mt-0.5 block">Recorded consultations</span>
        </button>

        {/* Pending Requests */}
        <button
          type="button"
          onClick={() => setStatusTab('PENDING')}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
            statusTab === 'PENDING'
              ? 'bg-white border-[#FFAB00] ring-2 ring-[#FFAB00]/20 shadow-xs'
              : 'bg-white border-[#D9E2EC] hover:border-[#FFE380] shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8B00]">
            Pending Requests
          </span>
          <div className="text-2xl font-black text-[#FF8B00] mt-1.5">{pendingCount}</div>
          <span className="text-[11px] text-[#42526E] mt-0.5 block">Awaiting ALSM review</span>
        </button>

        {/* Upcoming Meetings */}
        <button
          type="button"
          onClick={() => setStatusTab('UPCOMING')}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
            statusTab === 'UPCOMING'
              ? 'bg-white border-[#0652CC] ring-2 ring-[#0652CC]/10 shadow-xs'
              : 'bg-white border-[#D9E2EC] hover:border-[#B3D4FF] shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0652CC]">
            Upcoming Meetings
          </span>
          <div className="text-2xl font-black text-[#0652CC] mt-1.5">{upcomingCount}</div>
          <span className="text-[11px] text-[#42526E] mt-0.5 block">Confirmed schedule slots</span>
        </button>

        {/* Completed Meetings */}
        <button
          type="button"
          onClick={() => setStatusTab('COMPLETED')}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
            statusTab === 'COMPLETED'
              ? 'bg-white border-[#36B37E] ring-2 ring-[#36B37E]/20 shadow-xs'
              : 'bg-white border-[#D9E2EC] hover:border-[#ABF5D1] shadow-2xs'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#006644]">
            Completed Meetings
          </span>
          <div className="text-2xl font-black text-[#006644] mt-1.5">{completedCount}</div>
          <span className="text-[11px] text-[#42526E] mt-0.5 block">Conducted sessions</span>
        </button>
      </div>

      {/* Status Tabs Navigation */}
      <div className="border-b border-[#D9E2EC] flex items-center space-x-1 overflow-x-auto text-xs font-semibold text-[#42526E]">
        {[
          { key: 'ALL', label: 'All Meetings', count: totalCount },
          { key: 'PENDING', label: 'Pending', count: pendingCount },
          { key: 'CONFIRMED', label: 'Confirmed', count: statusCounts['CONFIRMED'] || 0 },
          { key: 'UPCOMING', label: 'Upcoming', count: upcomingCount },
          { key: 'COMPLETED', label: 'Completed', count: completedCount },
          { key: 'CANCELLED', label: 'Cancelled', count: statusCounts['CANCELLED'] || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusTab(tab.key)}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              statusTab === tab.key
                ? 'border-[#0652CC] text-[#0652CC] font-bold'
                : 'border-transparent hover:text-[#091E42] hover:border-[#DFE1E6]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusTab === tab.key
                  ? 'bg-[#E8F1FF] text-[#0652CC]'
                  : 'bg-[#EBECF0] text-[#6B778C]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B778C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meetings by title, project, host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMeetings()}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
            />
          </div>

          {/* Meeting Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
            >
              <option value="ALL">All Meeting Types</option>
              {consultationTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
            >
              <option value="ALL">All Related Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
            >
              <option value="newest">Newest Created</option>
              <option value="upcoming">Upcoming Schedule Date</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter (Web2 inspired) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0F4F8] text-xs text-[#42526E]">
          <span className="text-[11px] font-medium text-[#6B778C]">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 text-xs bg-[#F8FAFC] border border-[#DFE3E8] rounded-md focus:outline-none focus:border-[#0652CC] text-[#091E42]"
          />
          <span className="text-[#6B778C]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 text-xs bg-[#F8FAFC] border border-[#DFE3E8] rounded-md focus:outline-none focus:border-[#0652CC] text-[#091E42]"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-[#0652CC] hover:underline ml-2 font-medium"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Meeting Cards / List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="bg-white rounded-xl border border-[#D9E2EC] p-12 text-center text-xs text-[#6B778C]">
            <RefreshCw className="w-6 h-6 mx-auto mb-2.5 animate-spin text-[#0652CC]" />
            Loading meeting requests and schedules...
          </div>
        ) : displayMeetings.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#D9E2EC] p-16 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F6F8] border border-[#DFE3E8] flex items-center justify-center text-[#6B778C] mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#091E42]">No Meeting Requests Found</h3>
            <p className="text-xs text-[#42526E] max-w-sm mx-auto">
              There are no consultation meetings matching the selected filter. Click + Request
              Meeting to schedule a session with your ALSM modernization team.
            </p>
            {!isViewer && (
              <Button
                variant="primary"
                onClick={() => navigate('/meeting-requests/new')}
                className="text-xs mt-2 flex items-center space-x-1.5 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Meeting</span>
              </Button>
            )}
          </div>
        ) : (
          displayMeetings.map((meeting) => {
            const { dateStr, timeStr } = formatMeetingDate(meeting);
            const isConfirmed = meeting.status === 'CONFIRMED' || meeting.status === 'SCHEDULED';
            const isPending =
              meeting.status === 'NEW_REQUEST' ||
              meeting.status === 'PENDING_SCHEDULING' ||
              meeting.status === 'RESCHEDULE_REQUESTED';
            const hasMeetUrl = Boolean(meeting.scheduling?.meetingUrl);

            return (
              <div
                key={meeting.id || (meeting as any)._id}
                className="bg-white rounded-xl border border-[#D9E2EC] p-5 shadow-2xs hover:border-[#B3D4FF] transition-all space-y-4"
              >
                {/* Top Row: Badges and Room code */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderStatusBadge(meeting.status)}

                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#403294] bg-[#EAE6FF] px-2 py-0.5 rounded-full">
                      {meeting.consultationType || 'TECHNICAL'}
                    </span>

                    {meeting.requirements?.projectName && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-[#0652CC] bg-[#E8F1FF] px-2 py-0.5 rounded-full">
                        <FolderGit2 className="w-3 h-3" />
                        <span>{meeting.requirements.projectName}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono font-semibold text-[#6B778C]">
                    ID: {meeting.requestId || (meeting.scheduling?.meetingCode ? `alsm-${meeting.scheduling.meetingCode}` : 'MTR')}
                  </span>
                </div>

                {/* Middle Row: Title & Agenda */}
                <div>
                  <h3 className="text-base font-bold text-[#091E42] tracking-tight hover:text-[#0652CC] transition-colors">
                    {meeting.topic}
                  </h3>
                  {meeting.requirements?.businessRequirements && (
                    <p className="text-xs text-[#42526E] mt-1 leading-relaxed line-clamp-2">
                      {meeting.requirements.businessRequirements}
                    </p>
                  )}
                </div>

                {/* Schedule & Host Details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#42526E] pt-2 border-t border-[#F1F3F5]">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <CalendarDays className="w-4 h-4 text-[#0652CC]" />
                    <span className="text-[#091E42] font-semibold">{dateStr}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 font-medium">
                    <Clock className="w-4 h-4 text-[#6B778C]" />
                    <span>{timeStr}</span>
                    <span className="text-[10px] text-[#6B778C] bg-[#EBECF0] px-1.5 py-0.2 rounded">
                      {meeting.scheduling?.durationMinutes || 45} mins
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-[#6B778C]" />
                    <span>
                      Host: <strong className="text-[#091E42]">{meeting.assignment?.assignedSalesName || 'ALSM Solutions Architect'}</strong>
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Actions based on status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F3F5]">
                  <div className="flex items-center space-x-2 text-[11px] text-[#6B778C]">
                    <Building className="w-3.5 h-3.5" />
                    <span>{meeting.customer?.companyName || organization?.name || 'Client Org'}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowDetailsModal(true);
                      }}
                      className="text-xs"
                    >
                      View Details
                    </Button>

                    {/* Pending actions */}
                    {isPending && !isViewer && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setShowCancelModal(true);
                        }}
                        className="text-xs text-[#FF5630] hover:bg-[#FFEBE6] border-[#FFBDAD]"
                      >
                        Cancel Request
                      </Button>
                    )}

                    {/* Confirmed actions */}
                    {isConfirmed && !isViewer && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setRescheduleForm({
                              scheduledStartTime: meeting.scheduling?.scheduledStartTime || '',
                              scheduledEndTime: meeting.scheduling?.scheduledEndTime || '',
                              reason: '',
                            });
                            setShowRescheduleModal(true);
                          }}
                          className="text-xs"
                        >
                          Request Reschedule
                        </Button>

                        {hasMeetUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(meeting.scheduling.meetingUrl, '_blank', 'noopener,noreferrer')}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0652CC] hover:bg-[#0052CC] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Google Meet</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Modal 1: + Request Meeting ────────────────────────── */}
      {showRequestModal && (
        <Modal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          title="Request Consultation & Technical Meeting"
        >
          <form onSubmit={handleCreateMeetingRequest} className="space-y-5 text-xs">
            {/* Section 1: Meeting Information */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#0652CC] border-b border-[#E5EAF0] pb-1">
                Section 1 — Meeting Information
              </h4>

              <div>
                <label className="block font-bold text-[#091E42] mb-1">
                  Meeting Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COBOL-to-Java Architecture & AST Transform Strategy"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#091E42] mb-1">
                    Meeting Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={requestForm.consultationType}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        consultationType: e.target.value as ConsultationType,
                      })
                    }
                    className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] bg-white"
                  >
                    {consultationTypes.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#091E42] mb-1">
                    Related Modernization Project
                  </label>
                  <select
                    value={requestForm.projectId}
                    onChange={(e) => setRequestForm({ ...requestForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] bg-white"
                  >
                    <option value="">Select project (optional)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#091E42] mb-1">Description / Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Briefly outline topics, code blocks, or architectural questions to cover..."
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  className="w-full p-2.5 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
                />
              </div>
            </div>

            {/* Section 2: Scheduling */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#0652CC] border-b border-[#E5EAF0] pb-1">
                Section 2 — Scheduling Preferences
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#091E42] mb-1">Preferred Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={requestForm.requestedDate}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#091E42] mb-1">Preferred Start Time</label>
                  <input
                    type="time"
                    value={requestForm.requestedTime}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedTime: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#091E42] mb-1">Duration</label>
                  <select
                    value={requestForm.durationMinutes}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] bg-white"
                  >
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-[#6B778C] flex items-center space-x-1.5">
                <span>Timezone:</span>
                <strong className="text-[#091E42]">{requestForm.timezone} (UTC+7)</strong>
              </div>
            </div>

            {/* Section 3: Participants */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#0652CC] border-b border-[#E5EAF0] pb-1">
                Section 3 — Participants
              </h4>

              <div>
                <label className="block font-bold text-[#091E42] mb-1">
                  Customer Organization Attendees
                </label>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg space-y-1.5 max-h-36 overflow-y-auto">
                  <div className="flex items-center space-x-2 text-[11px] text-[#0652CC] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{user?.fullName || user?.email} (Requester - Included)</span>
                  </div>

                  {orgMembers.filter((m) => m.email.toLowerCase() !== user?.email?.toLowerCase()).length === 0 ? (
                    <p className="text-[11px] text-[#6B778C] italic py-1">
                      No other members currently registered in your organization.
                    </p>
                  ) : (
                    orgMembers
                      .filter((m) => m.email.toLowerCase() !== user?.email?.toLowerCase())
                      .map((member) => {
                      const isChecked = requestForm.selectedMembers.includes(member.email);
                      return (
                        <label
                          key={member.id}
                          className="flex items-center space-x-2 text-[11px] text-[#42526E] hover:text-[#091E42] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRequestForm({
                                  ...requestForm,
                                  selectedMembers: [...requestForm.selectedMembers, member.email],
                                });
                              } else {
                                setRequestForm({
                                  ...requestForm,
                                  selectedMembers: requestForm.selectedMembers.filter(
                                    (em) => em !== member.email,
                                  ),
                                });
                              }
                            }}
                            className="rounded border-[#DFE3E8] text-[#0652CC] focus:ring-0"
                          />
                          <span>
                            {member.name} ({member.email}) — <em className="text-[#6B778C]">{member.role}</em>
                          </span>
                        </label>
                      );
                    }))}
                </div>
              </div>

              {/* ALSM Team Preview */}
              <div>
                <label className="block font-bold text-[#091E42] mb-1">
                  Assigned ALSM Modernization Team
                </label>
                <div className="p-3 bg-[#E8F1FF]/50 border border-[#B3D4FF] rounded-lg flex items-center space-x-3 text-xs">
                  <ShieldCheck className="w-5 h-5 text-[#0652CC] shrink-0" />
                  <div className="text-[11px] text-[#091E42]">
                    {modalSelectedProject ? (
                      <p>
                        Assigned Project Team: <strong>Lead Architect & Modernization Staff</strong> for{' '}
                        <em>{modalSelectedProject.name}</em>
                      </p>
                    ) : (
                      <p>
                        Dedicated ALSM Solutions Architect team will be assigned and confirmed upon
                        request review.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submission buttons */}
            <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E5EAF0]">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowRequestModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Meeting Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal 2: View Details ─────────────────────────────── */}
      {showDetailsModal && selectedMeeting && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMeeting(null);
          }}
          title={`Meeting Details — ${selectedMeeting.requestId || 'Consultation'}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF0]">
              <div>
                <h3 className="font-bold text-base text-[#091E42]">{selectedMeeting.topic}</h3>
                <p className="text-[11px] text-[#6B778C]">
                  Type: {selectedMeeting.consultationType} • Created: {new Date(selectedMeeting.createdAt).toLocaleDateString()}
                </p>
              </div>
              {renderStatusBadge(selectedMeeting.status)}
            </div>

            {/* Schedule details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B778C]">
                  Scheduled Time
                </span>
                <p className="font-bold text-sm text-[#091E42] mt-0.5">
                  {formatMeetingDate(selectedMeeting).dateStr}
                </p>
                <p className="text-xs text-[#42526E]">
                  {formatMeetingDate(selectedMeeting).timeStr} ({selectedMeeting.scheduling?.timezone || 'Asia/Ho_Chi_Minh'})
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B778C]">
                  Assigned Host
                </span>
                <p className="font-bold text-sm text-[#091E42] mt-0.5">
                  {selectedMeeting.assignment?.assignedSalesName || 'ALSM Solutions Architect'}
                </p>
                <p className="text-xs text-[#42526E]">
                  {selectedMeeting.assignment?.assignedSalesEmail || 'architect@alsm.io'}
                </p>
              </div>
            </div>

            {/* Google Meet Link */}
            {selectedMeeting.scheduling?.meetingUrl ? (
              <div className="p-3.5 bg-[#E8F1FF] border border-[#B3D4FF] rounded-xl flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0652CC] flex items-center space-x-1">
                    <Video className="w-3.5 h-3.5" />
                    <span>Google Meet Video Room</span>
                  </span>
                  <p className="font-mono text-xs text-[#091E42] font-semibold truncate mt-0.5">
                    {selectedMeeting.scheduling.meetingUrl}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedMeeting.scheduling.meetingUrl!)}
                    className="p-1.5 bg-white border border-[#B3D4FF] rounded-lg text-[#0652CC] hover:bg-[#F4F6F8] transition-colors"
                    title="Copy Meet link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#36B37E]" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(selectedMeeting.scheduling.meetingUrl!, '_blank', 'noopener,noreferrer')}
                    className="px-3 py-1.5 bg-[#0652CC] hover:bg-[#0052CC] text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <span>Join</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#F4F6F8] border border-[#DFE3E8] rounded-xl text-xs text-[#6B778C]">
                Google Meet link will be generated automatically upon schedule confirmation by your ALSM host.
              </div>
            )}

            {/* Agenda */}
            {selectedMeeting.requirements?.businessRequirements && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B778C]">
                  Agenda / Discussion Points
                </span>
                <p className="mt-1 p-3 bg-white border border-[#DFE3E8] rounded-lg text-xs text-[#091E42] leading-relaxed whitespace-pre-wrap">
                  {selectedMeeting.requirements.businessRequirements}
                </p>
              </div>
            )}

            {/* Timeline history */}
            {selectedMeeting.meetingHistory && selectedMeeting.meetingHistory.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B778C]">
                  Request History Timeline
                </span>
                <div className="mt-1.5 space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedMeeting.meetingHistory.map((item, idx) => (
                    <div key={idx} className="text-[11px] text-[#42526E] flex items-center justify-between p-1.5 bg-[#F8FAFC] rounded">
                      <span className="font-semibold text-[#091E42]">{item.action}</span>
                      <span className="text-[10px] text-[#6B778C]">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#E5EAF0]">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedMeeting(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Modal 3: Reschedule Meeting ──────────────────────── */}
      {showRescheduleModal && selectedMeeting && (
        <Modal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedMeeting(null);
          }}
          title="Request Meeting Rescheduling"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
            <p className="text-xs text-[#42526E]">
              Request a new time slot for <strong>{selectedMeeting.topic}</strong>. Your assigned
              ALSM Solutions Architect will review and update the calendar schedule.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#091E42] mb-1">
                  New Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleForm.scheduledStartTime}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, scheduledStartTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#091E42] mb-1">
                  New End Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleForm.scheduledEndTime}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, scheduledEndTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#091E42] mb-1">
                Reason for Rescheduling <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Explain the reason for requesting a new consultation slot..."
                value={rescheduleForm.reason}
                onChange={(e) =>
                  setRescheduleForm({ ...rescheduleForm, reason: e.target.value })
                }
                className="w-full p-2.5 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedMeeting(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Reschedule Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal 4: Cancel Meeting ──────────────────────────── */}
      {showCancelModal && selectedMeeting && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedMeeting(null);
          }}
          title="Cancel Consultation Request"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
            <p className="text-xs text-[#42526E]">
              Are you sure you want to cancel the meeting request for{' '}
              <strong>{selectedMeeting.topic}</strong>?
            </p>

            <div>
              <label className="block font-bold text-[#091E42] mb-1">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Please state the reason for cancelling this session..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedMeeting(null);
                }}
                disabled={submitting}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={submitting}
                className="bg-[#FF5630] hover:bg-[#DE350B] text-white"
              >
                {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
