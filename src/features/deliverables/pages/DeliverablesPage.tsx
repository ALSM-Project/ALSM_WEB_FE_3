import React, { useState, useEffect } from 'react';
import {
  Download,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldCheck,
  Clock,
  X,
  FileCode,
} from 'lucide-react';
import { deliverablesApi } from '../api/deliverables.api';
import type {
  DeliverableItem,
  DeliverableStatus,
  DeliverablePackageType,
} from '../api/deliverables.api';
import { useAuth } from '@/app/providers';
import { PageContainer } from '@/shared/ui';

export const DeliverablesPage: React.FC = () => {
  const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Review Modal State
  const [selectedForReview, setSelectedForReview] = useState<DeliverableItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REVISION_REQUESTED'>('APPROVED');
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const items = await deliverablesApi.getDeliverables();
      setDeliverables(items);
    } catch (err: any) {
      console.error('Failed to load deliverables:', err);
      setErrorMsg(err?.message || 'Failed to retrieve deliverables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

  const handleOpenReview = (item: DeliverableItem, defaultDecision: 'APPROVED' | 'REVISION_REQUESTED' = 'APPROVED') => {
    setSelectedForReview(item);
    setReviewDecision(defaultDecision);
    setFeedbackNotes('');
  };

  const handleCloseReview = () => {
    setSelectedForReview(null);
    setFeedbackNotes('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForReview) return;
    if (reviewDecision === 'REVISION_REQUESTED' && !feedbackNotes.trim()) {
      alert('Please provide feedback notes explaining the revision requirements.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const updated = await deliverablesApi.reviewDeliverable(
        selectedForReview.id,
        reviewDecision,
        feedbackNotes.trim() || undefined
      );

      setDeliverables((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );

      setActionSuccess(
        reviewDecision === 'APPROVED'
          ? `Package ${updated.version} (${updated.title}) has been officially APPROVED!`
          : `Revision request for ${updated.version} has been submitted to ALSM engineering.`
      );
      setTimeout(() => setActionSuccess(null), 6000);
      handleCloseReview();
    } catch (err: any) {
      alert(`Error submitting review: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filtered = deliverables.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        item.projectName.toLowerCase().includes(term) ||
        item.version.toLowerCase().includes(term) ||
        item.packageType.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getPackageBadge = (pkg: DeliverablePackageType) => {
    switch (pkg) {
      case 'FULL_MODERNIZATION_PACKAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileArchive className="w-3.5 h-3.5 text-blue-600" /> Full Package
          </span>
        );
      case 'FRONTEND_COMPONENTS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileCode className="w-3.5 h-3.5 text-emerald-600" /> React 19 Frontend
          </span>
        );
      case 'BACKEND_SERVICES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FileCode className="w-3.5 h-3.5 text-indigo-600" /> Spring Boot 3 Java
          </span>
        );
      case 'VALIDATION_REPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> AST Validation Dossier
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {pkg}
          </span>
        );
    }
  };

  const getStatusBadge = (status: DeliverableStatus) => {
    switch (status) {
      case 'READY_FOR_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Awaiting Customer Sign-Off
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved & Verified
          </span>
        );
      case 'REVISION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Revision Requested
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer variant="full">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-2">
            Deliverables & Quality Sign-Off
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchDeliverables}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Action Success Alert ──────────────────────────────────────────────── */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Filters & Search ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deliverables, projects, versions..."
            className="w-full h-8 pl-8 pr-3 py-0 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'ALL' ? 'bg-white text-[#0F172A] shadow-2xs' : 'hover:text-[#0F172A]'
            }`}
          >
            All ({deliverables.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('READY_FOR_REVIEW')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'READY_FOR_REVIEW' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            Needs Review ({deliverables.filter((d) => d.status === 'READY_FOR_REVIEW').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'APPROVED' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            Approved ({deliverables.filter((d) => d.status === 'APPROVED').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('REVISION_REQUESTED')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'REVISION_REQUESTED' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            Revision Requested ({deliverables.filter((d) => d.status === 'REVISION_REQUESTED').length})
          </button>
        </div>
      </div>

      {/* ── Deliverables List Table ─────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-3">
          <FileArchive className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">No Deliverables Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            There are currently no deliverables matching your filter criteria. As modernization sprints reach internal QA sign-off, production artifacts will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Version & Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Artifact Type</th>
                  <th className="py-3 px-4">Files & Size</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Version & Title */}
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.version}
                        </span>
                        <span className="font-bold text-[#0F172A]">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      {item.customerReview && (
                        <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <strong>Signed by:</strong> {item.customerReview.reviewedByUserName} on{' '}
                          {new Date(item.customerReview.reviewedAt).toLocaleDateString()}
                          {item.customerReview.feedbackNotes && (
                            <p className="mt-0.5 italic text-slate-600">
                              "{item.customerReview.feedbackNotes}"
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0F172A]">{item.projectName}</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">
                        Delivered on {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Package Type */}
                    <td className="py-3.5 px-4">
                      {getPackageBadge(item.packageType)}
                    </td>

                    {/* Files & Size */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-[#0F172A]">{item.fileCount} files</div>
                      <div className="text-[11px] text-[#64748B]">{item.totalSizeFormatted}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.downloadUrl && (
                          <a
                            href={item.downloadUrl}
                            download
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
                            title="Download package bundle (.zip)"
                          >
                            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
                            Download
                          </a>
                        )}

                        {item.status === 'READY_FOR_REVIEW' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenReview(item, 'APPROVED')}
                              className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReview(item, 'REVISION_REQUESTED')}
                              className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Request Revision
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Review Sign-Off Modal ────────────────────────────────────────────── */}
      {selectedForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E2E8F0] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {reviewDecision === 'APPROVED' ? 'Approve Deliverable Sign-Off' : 'Request Milestone Revision'}
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Package: {selectedForReview.title} ({selectedForReview.version})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReview}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              {/* Decision Toggle */}
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">
                  Customer Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      reviewDecision === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approve Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('REVISION_REQUESTED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      reviewDecision === 'REVISION_REQUESTED'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Request Changes
                  </button>
                </div>
              </div>

              {/* Signer Info */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                  Authorised Signatory
                </span>
                <div className="font-bold text-[#0F172A]">
                  {user?.fullName || 'Authorized Organization Representative'}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  {user?.email} • Organization: Fintech Nexus Ltd.
                </div>
              </div>

              {/* Feedback Notes */}
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">
                  {reviewDecision === 'APPROVED'
                    ? 'Acceptance Notes / Verification Comments (Optional)'
                    : 'Revision Requirements & Discrepancy Details (Required)'}
                </label>
                <textarea
                  rows={4}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder={
                    reviewDecision === 'APPROVED'
                      ? 'e.g., Code reviewed against AS/400 test transactions. Ready for staging deployment.'
                      : 'e.g., Screen MAP03 field validation for balance precision requires 2 decimals instead of integer.'
                  }
                  required={reviewDecision === 'REVISION_REQUESTED'}
                  className="w-full text-xs p-3 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-[#94A3B8]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-2xs ${
                    reviewDecision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmittingReview
                    ? 'Submitting...'
                    : reviewDecision === 'APPROVED'
                    ? 'Confirm Approval'
                    : 'Submit Revision Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
