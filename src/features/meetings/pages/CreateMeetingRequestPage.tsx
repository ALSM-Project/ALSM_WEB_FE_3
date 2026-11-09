import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import { useAuth } from '@/app/providers';
import { useWorkspace } from '@/context/WorkspaceContext';
import { meetingRequestsApi } from '../api/meeting-requests.api';
import type {
  ConsultationType,
  ConsultationTypeConfig,
  CreateMeetingRequestPayload,
  MeetingPriority,
} from '../types/meeting';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types/project';

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export const CreateMeetingRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useWorkspace();

  const userRole = (user?.role || '').toUpperCase();
  const isViewer = userRole === 'VIEWER';

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('TECHNICAL');
  const [projectId, setProjectId] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [timezone] = useState('Asia/Ho_Chi_Minh');
  const [priority, setPriority] = useState<MeetingPriority>('MEDIUM');
  const [legacySystemType, setLegacySystemType] = useState('IBM 3270 BMS / COBOL');
  const [projectScale, setProjectScale] = useState<'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE'>('MEDIUM');
  const [selectedMemberEmails, setSelectedMemberEmails] = useState<string[]>([]);

  // Metadata
  const [consultationTypes, setConsultationTypes] = useState<ConsultationTypeConfig[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch consultation types & projects
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
  }, []);

  // Fetch strictly organization members
  useEffect(() => {
    setLoadingMembers(true);
    meetingRequestsApi
      .getOrganizationMembers(organization?.id)
      .then((members) => {
        if (Array.isArray(members)) {
          setOrgMembers(members);
        } else {
          setOrgMembers([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load organization members:', err);
        setOrgMembers([]);
      })
      .finally(() => setLoadingMembers(false));
  }, [organization?.id]);

  // Set default minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const handleMemberToggle = (email: string) => {
    setSelectedMemberEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const selectedProjectObj = projects.find((p) => p.id === projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Viewer accounts do not have permission to submit meeting requests.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Meeting Title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Collect all customer attendee emails (including requester)
      const attendeeEmails = [
        user?.email || 'customer@alsm.dev',
        ...selectedMemberEmails.filter((em) => em !== user?.email),
      ];

      const payload: CreateMeetingRequestPayload = {
        fullName: user?.fullName || 'Enterprise Member',
        companyName: organization?.name || 'Client Organization',
        email: user?.email || 'customer@alsm.dev',
        topic: title.trim(),
        consultationType,
        priority,
        serviceMode: 'ALSM_MANAGED',
        legacySystemType,
        estimatedScreens: 10,
        estimatedPrograms: 5,
        estimatedProjectScale: projectScale,
        businessRequirements: description.trim() || undefined,
        requestedDate: requestedDate || minDateStr,
        requestedTime,
        timezone,
        organizationId: organization?.id,
        projectId: projectId || undefined,
        projectName: selectedProjectObj?.name,
        attendeeEmails,
        durationMinutes,
      };

      await meetingRequestsApi.createMeetingRequest(payload);
      setSuccessMsg('Meeting request submitted successfully! Your ALSM team has been notified.');
      setTimeout(() => {
        navigate('/meeting-requests');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit meeting request:', err);
      setErrorMsg(err?.message || 'Failed to submit meeting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Page Header */}
      <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 shadow-2xs space-y-3">
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
              Request Consultation & Architecture Meeting
            </h1>
            <p className="text-xs text-[#42526E] max-w-2xl leading-relaxed">
              Schedule a dedicated consultation session with your assigned ALSM modernization team.
              Connect directly with Solutions Architects for AST conversion mappings, Spring Boot
              microservice architectures, and project milestone handoffs.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              variant="secondary"
              onClick={() => navigate('/meeting-requests')}
              className="text-xs flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Meetings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-[#FFEBE6] border border-[#FFBDAD] rounded-xl flex items-center space-x-2.5 text-xs text-[#BF2600] font-medium shadow-2xs">
          <AlertCircle className="w-4 h-4 text-[#FF5630] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#E3FCEF] border border-[#ABF5D1] rounded-xl flex items-center space-x-2.5 text-xs text-[#006644] font-medium shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#36B37E] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Meeting Information */}
        <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 shadow-2xs space-y-4">
          <div className="border-b border-[#E5EAF0] pb-2">
            <h3 className="font-bold text-sm text-[#091E42] uppercase tracking-wider text-[#0652CC]">
              Section 1 — Meeting Information & Context
            </h3>
            <p className="text-xs text-[#6B778C] mt-0.5">
              Specify the objectives, scope, and related modernization project for this session.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#091E42] mb-1.5">
                Meeting Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. COBOL-to-Java Architecture & AST Transform Strategy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#091E42] mb-1.5">
                  Meeting Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
                >
                  {consultationTypes.length > 0 ? (
                    consultationTypes.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="TECHNICAL">Technical Consultation</option>
                      <option value="ENTERPRISE_ARCHITECTURE">Architecture Review</option>
                      <option value="LEGACY_MODERNIZATION">Conversion Review</option>
                      <option value="CUSTOM_REQUIREMENTS">Project Progress Meeting</option>
                      <option value="SALES_SERVICE">Requirements Clarification</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#091E42] mb-1.5">
                  Related Modernization Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
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
              <label className="block font-bold text-[#091E42] mb-1.5">
                Description / Agenda
              </label>
              <textarea
                rows={3}
                placeholder="Briefly outline topics, code blocks, or architectural questions to cover during the consultation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Scheduling Preferences */}
        <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 shadow-2xs space-y-4">
          <div className="border-b border-[#E5EAF0] pb-2">
            <h3 className="font-bold text-sm text-[#091E42] uppercase tracking-wider text-[#0652CC]">
              Section 2 — Scheduling Preferences
            </h3>
            <p className="text-xs text-[#6B778C] mt-0.5">
              Choose your preferred date and time slot. Confirmed Google Meet rooms are provisioned upon ALSM team review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#091E42] mb-1.5">
                Preferred Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={minDateStr}
                required
                value={requestedDate || minDateStr}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#091E42] mb-1.5">
                Preferred Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#091E42] mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes (Recommended)</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#6B778C] bg-[#F8FAFC] p-3 rounded-lg border border-[#DFE3E8]">
            <Clock className="w-4 h-4 text-[#0652CC] shrink-0" />
            <span>
              Timezone: <strong className="text-[#091E42]">{timezone} (UTC+7)</strong>. All
              invitations will sync automatically to attendees&apos; calendars in their local time.
            </span>
          </div>
        </div>

        {/* SECTION 3: Participants (Organization Scoped) */}
        <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 shadow-2xs space-y-4">
          <div className="border-b border-[#E5EAF0] pb-2">
            <h3 className="font-bold text-sm text-[#091E42] uppercase tracking-wider text-[#0652CC]">
              Section 3 — Participants
            </h3>
            <p className="text-xs text-[#6B778C] mt-0.5">
              Select members belonging strictly to your enterprise organization (
              <strong>{organization?.name || 'Your Organization'}</strong>) and preview assigned ALSM staff.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Customer Organization Attendees */}
            <div>
              <label className="block font-bold text-[#091E42] mb-2 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-[#0652CC]" />
                <span>Customer Organization Attendees</span>
              </label>

              <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded-xl p-4 space-y-2.5 max-h-56 overflow-y-auto">
                {/* Requester always included */}
                <label className="flex items-center space-x-2.5 p-2 bg-[#E8F1FF] border border-[#B3D4FF] rounded-lg cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="w-4 h-4 text-[#0652CC] rounded accent-[#0652CC]"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[#0652CC]">
                      {user?.fullName || user?.email?.split('@')[0] || 'Requester'} (Requester — Included)
                    </span>
                    <span className="text-[11px] text-[#42526E] ml-2">({user?.email})</span>
                  </div>
                </label>

                {/* Other members of THIS organization only */}
                {loadingMembers ? (
                  <p className="text-[#6B778C] text-[11px] py-2 italic">Loading organization members...</p>
                ) : orgMembers.filter((m) => m.email.toLowerCase() !== user?.email?.toLowerCase()).length === 0 ? (
                  <p className="text-[#6B778C] text-[11px] py-2 italic">
                    No other members currently registered in {organization?.name || 'your organization'}. You can add colleagues in Organization &gt; Internal Teams.
                  </p>
                ) : (
                  orgMembers
                    .filter((m) => m.email.toLowerCase() !== user?.email?.toLowerCase())
                    .map((member) => {
                      const isChecked = selectedMemberEmails.includes(member.email);
                      return (
                        <label
                          key={member.id || member.email}
                          className="flex items-center space-x-2.5 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[#DFE3E8]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleMemberToggle(member.email)}
                            className="w-4 h-4 text-[#0652CC] rounded accent-[#0652CC]"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-[#091E42]">{member.name}</span>
                            <span className="text-[11px] text-[#6B778C] ml-2">({member.email})</span>
                            <span className="text-[10px] bg-[#EBECF0] text-[#42526E] px-1.5 py-0.2 rounded ml-2">
                              {member.role}
                            </span>
                          </div>
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            {/* ALSM Team Assignment Preview */}
            <div>
              <label className="block font-bold text-[#091E42] mb-2 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#36B37E]" />
                <span>Assigned ALSM Modernization Team</span>
              </label>

              <div className="p-4 bg-[#F8FAFC] border border-[#DFE3E8] rounded-xl flex items-start space-x-3 text-xs text-[#42526E]">
                <ShieldCheck className="w-4 h-4 text-[#0652CC] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#091E42]">
                    Dedicated Solutions Architect &amp; Engineering Lead
                  </p>
                  <p className="text-[11px] text-[#6B778C] mt-0.5">
                    {selectedProjectObj
                      ? `Your assigned lead for ${selectedProjectObj.name} will host this consultation and prepare the AST transformation scope.`
                      : 'An ALSM Solutions Architect specialized in your tech stack will be assigned upon request triage.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Modernization Scope (Optional Context) */}
        <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 shadow-2xs space-y-4">
          <div className="border-b border-[#E5EAF0] pb-2">
            <h3 className="font-bold text-sm text-[#091E42] uppercase tracking-wider text-[#0652CC]">
              Section 4 — Technical Scope &amp; System Details
            </h3>
            <p className="text-xs text-[#6B778C] mt-0.5">
              Provide legacy system context to help the ALSM architecture team prepare tailored benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#091E42] mb-1.5">
                Legacy System Type
              </label>
              <input
                type="text"
                value={legacySystemType}
                onChange={(e) => setLegacySystemType(e.target.value)}
                placeholder="e.g. IBM 3270 BMS / COBOL, CICS, DSPF"
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#091E42] mb-1.5">
                Estimated Project Scale
              </label>
              <select
                value={projectScale}
                onChange={(e) => setProjectScale(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              >
                <option value="SMALL">Small (1 - 20 screens)</option>
                <option value="MEDIUM">Medium (21 - 100 screens)</option>
                <option value="LARGE">Large (101 - 500 screens)</option>
                <option value="ENTERPRISE">Enterprise (500+ screens)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#091E42] mb-1.5">
                Request Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MeetingPriority)}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] text-xs"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium (Standard)</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (Milestone Blocker)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/meeting-requests')}
            className="text-xs px-5"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting || isViewer}
            className="text-xs px-6 flex items-center space-x-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Submit Meeting Request'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
export default CreateMeetingRequestPage;
