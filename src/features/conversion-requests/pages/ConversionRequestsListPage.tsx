import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Search,
  RefreshCw,
  Plus,
  Eye,
  AlertCircle,
  Layers,
} from 'lucide-react';
import {
  conversionRequestsApi,
  type ConversionRequest,
  type ConversionRequestStatus,
} from '../api/conversion-requests.api';

export const ConversionRequestsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ConversionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await conversionRequestsApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
        page,
        limit: 10,
      });
      setRequests(res?.items || []);
      setTotalPages(res?.totalPages || 1);
      setTotalCount(res?.total || 0);
    } catch (err: any) {
      console.error('Failed to load conversion requests:', err);
      setErrorMsg(err?.message || 'Failed to fetch conversion requests from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const getStatusBadge = (status: ConversionRequestStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Under Review</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Accepted</span>;
      case 'PROJECT_CREATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Project Created</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'All Requests' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PROJECT_CREATED', label: 'Project Created' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Service B &bull; Managed Modernization Services
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-1">
            Conversion Requests
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Review submitted modernization requests, track technical review status, and view linked managed projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#475569] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/conversion-requests/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversion Request</span>
          </button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#F1F5F9]">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search request ID, project name, or contact..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:bg-white focus:border-[#2563EB]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-500 font-bold">&times;</button>
        </div>
      )}

      {/* ── Table Container ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Project & Scope</th>
                <th className="py-3 px-4">Conversion Pipeline</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Linked Project</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#2563EB]" />
                    <span>Loading conversion requests...</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    <Send className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
                    <p className="font-semibold text-[#0F172A]">No Conversion Requests Found</p>
                    <p className="text-[11px] text-[#64748B] mt-1 max-w-sm mx-auto">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'Submit your legacy source code to have ALSM engineers modernize it.'}
                    </p>
                    {!searchTerm && (
                      <button
                        type="button"
                        onClick={() => navigate('/conversion-requests/new')}
                        className="mt-3 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Submit Request
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Request ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      <button
                        type="button"
                        onClick={() => navigate(`/conversion-requests/${req.id}`)}
                        className="hover:underline cursor-pointer"
                      >
                        {req.requestNumber}
                      </button>
                    </td>

                    {/* Project & Scope */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0F172A]">{req.projectName}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {req.scope?.estimatedScreens || 0} screens &bull; {req.scope?.estimatedPrograms || 0} programs
                      </div>
                    </td>

                    {/* Pipeline */}
                    <td className="py-3.5 px-4 text-xs text-[#475569]">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] block w-fit">
                        {req.pipeline}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#0F172A]">{req.contact?.name || '—'}</div>
                      <div className="text-[11px] text-[#64748B]">{req.contact?.email}</div>
                    </td>

                    {/* Submission Date */}
                    <td className="py-3.5 px-4 text-xs text-[#64748B]">
                      {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString('vi-VN') : (req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '—')}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(req.status)}
                    </td>

                    {/* Linked Project */}
                    <td className="py-3.5 px-4">
                      {req.linkedProjectId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${req.linkedProjectId}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>View Project</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] italic">Pending setup</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/conversion-requests/${req.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#475569] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ──────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>
              Showing page {page} of {totalPages} ({totalCount} total requests)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-md disabled:opacity-50 hover:bg-[#F8FAFC] cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-md disabled:opacity-50 hover:bg-[#F8FAFC] cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversionRequestsListPage;
