import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileCode2,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  conversionRequestsApi,
  type ConversionRequest,
} from '../api/conversion-requests.api';

export const ConversionRequestDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ConversionRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await conversionRequestsApi.getById(requestId);
      setRequest(data);
    } catch (err: any) {
      console.error('Failed to load conversion request detail:', err);
      setErrorMsg(err?.message || 'Failed to load request detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-[#64748B] space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-xs font-semibold">Loading conversion request...</p>
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div className="w-full min-w-0 py-12">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-[#0F172A]">Request Not Found</h2>
          <p className="text-xs text-[#64748B]">{errorMsg || 'Could not locate the requested conversion proposal.'}</p>
          <button
            type="button"
            onClick={() => navigate('/conversion-requests')}
            className="px-4 py-2 text-xs font-bold text-white bg-[#2563EB] rounded-lg"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Top Header & Breadcrumb ───────────────────────────────────────────── */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <button
          type="button"
          onClick={() => navigate('/conversion-requests')}
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Conversion Requests</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#2563EB]">
                {request.requestNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Service B &bull; Managed Conversion
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              {request.projectName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDetail}
              className="px-3 py-1.5 text-xs font-semibold text-[#475569] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Review Feedback / Status Banner ──────────────────────────────────── */}
      {request.status === 'PROJECT_CREATED' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-2 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-purple-900">Modernization Project Initialized</p>
              <p className="text-purple-800 text-[11px] mt-0.5">
                ALSM Platform Admin reviewed and confirmed this request. An official managed project workspace has been allocated.
              </p>
            </div>
          </div>

          {request.linkedProjectId && (
            <button
              type="button"
              onClick={() => navigate(`/projects/${request.linkedProjectId}`)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5 shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Go to Project</span>
            </button>
          )}
        </div>
      )}

      {request.status === 'ACCEPTED' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-900">Request Accepted by ALSM Enterprise Team</p>
            <p className="text-emerald-800 text-[11px]">
              {request.reviewFeedback || 'Scope verified. The team lead and conversion engineers are preparing the modernization pipeline.'}
            </p>
          </div>
        </div>
      )}

      {request.status === 'UNDER_REVIEW' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-bold text-blue-900">Architecture Review in Progress</p>
            <p className="text-blue-800 text-[11px]">
              ALSM Enterprise Architects are inspecting the submitted code archives and specifications.
            </p>
          </div>
        </div>
      )}

      {/* ── Scope & Architecture Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scope Overview */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Project Scope
          </span>
          <div className="text-xl font-extrabold text-[#0F172A]">
            {request.scope?.estimatedScreens || 0} Screens
          </div>
          <p className="text-xs text-[#64748B]">
            {request.scope?.estimatedPrograms || 0} Programs &bull; Complexity: {request.scope?.complexity || 'MEDIUM'}
          </p>
        </div>

        {/* Pipeline & Origin */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Conversion Pipeline
          </span>
          <div className="text-sm font-bold text-[#0F172A] font-mono">
            {request.pipeline}
          </div>
          <p className="text-xs text-[#64748B] truncate" title={request.sourceTechnology}>
            From: {request.sourceTechnology}
          </p>
        </div>

        {/* Contact & Timeline */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Target SLA & Contact
          </span>
          <div className="text-base font-bold text-[#0F172A]">
            {request.preferredTimelineWeeks ? `${request.preferredTimelineWeeks} Weeks` : 'Standard SLA'}
          </div>
          <p className="text-xs text-[#64748B] truncate">
            {request.contact?.name} &bull; {request.contact?.email}
          </p>
        </div>
      </div>

      {/* ── Details & Files Layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Requirements & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Technical Requirements & Instructions
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#64748B] font-semibold block mb-1">Target Architecture:</span>
                <p className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono text-[11px]">
                  {request.targetArchitecture}
                </p>
              </div>

              <div>
                <span className="text-[#64748B] font-semibold block mb-1">Special Instructions:</span>
                <p className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] whitespace-pre-wrap leading-relaxed">
                  {request.specialInstructions || 'None specified.'}
                </p>
              </div>

              <div>
                <span className="text-[#64748B] font-semibold block mb-1">Expected Deliverables:</span>
                <p className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] whitespace-pre-wrap leading-relaxed">
                  {request.expectedDeliverables || 'Turnkey React 19 component package.'}
                </p>
              </div>
            </div>
          </div>

          {/* Attached Files List */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Attached Source Code & Documentation ({(request.files || []).length})
            </h3>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden divide-y divide-[#E2E8F0]">
              {(request.files || []).map((f) => (
                <div key={f.fileId} className="p-3 flex items-center justify-between text-xs hover:bg-[#F8FAFC]">
                  <div className="flex items-center gap-2.5">
                    <FileCode2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <div>
                      <span className="font-semibold text-[#0F172A]">{f.originalName}</span>
                      <span className="text-[10px] text-[#64748B] block">
                        {(f.fileSize / 1024).toFixed(1)} KB &bull; {f.category}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Uploaded
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Modernization Governance & Audit */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-3 text-xs">
            <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Lifecycle Milestones
            </h4>

            <div className="space-y-3 border-l-2 border-[#E2E8F0] pl-3 py-1">
              <div>
                <span className="text-[10px] text-[#64748B] block">Submission</span>
                <span className="font-semibold text-[#0F172A]">
                  {request.submittedAt ? new Date(request.submittedAt).toLocaleString('vi-VN') : '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#64748B] block">Architecture Verification</span>
                <span className="font-semibold text-[#0F172A]">
                  {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('vi-VN') : 'In queue'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#64748B] block">Project Created</span>
                <span className="font-semibold text-[#0F172A]">
                  {request.projectCreatedAt ? new Date(request.projectCreatedAt).toLocaleString('vi-VN') : 'Pending confirmation'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#EFF6FF]/70 border border-[#BFDBFE] rounded-xl p-4 text-xs space-y-1.5 text-[#1E40AF]">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Partner Data Privacy</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#1E3A8A]">
              Source files are stored within your isolated organization boundary. Only authorized ALSM modernization engineers assigned to this engagement can access your codebase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionRequestDetailPage;
