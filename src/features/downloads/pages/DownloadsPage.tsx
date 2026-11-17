import React, { useState, useEffect } from 'react';
import {
  Download,
  Search,
  RefreshCw,
} from 'lucide-react';
import { deliverablesApi } from '@/features/deliverables/api/deliverables.api';
import type { DeliverableItem } from '@/features/deliverables/api/deliverables.api';

export const DownloadsPage: React.FC = () => {
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const items = await deliverablesApi.getDeliverables();
      setDeliverables(items || []);
    } catch (err) {
      console.error('Failed to load downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = deliverables.filter((d) => {
    if (typeFilter !== 'ALL' && d.packageType !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        d.title.toLowerCase().includes(term) ||
        d.projectName.toLowerCase().includes(term) ||
        d.version.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              Code Artifacts & Exports
            </span>
            <span className="text-xs text-[#64748B]">Central Download Distribution Center</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-2">
            Downloads & Export Packages
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
            Retrieve modernized application packages, generated React 19 component archives, Spring Boot 3 services, and deterministic AST validation compliance dossiers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Filters & Search ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search packages, versions, projects..."
            className="w-full h-8 pl-8 pr-3 py-0 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 px-3 py-0 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        >
          <option value="ALL">All Package Types</option>
          <option value="FULL_MODERNIZATION_PACKAGE">Full Modernization Packages</option>
          <option value="FRONTEND_COMPONENTS">React 19 Components</option>
          <option value="BACKEND_SERVICES">Spring Boot Services</option>
          <option value="VALIDATION_REPORT">AST Validation Reports</option>
        </select>
      </div>

      {/* ── Download Items List ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center space-y-3">
          <Download className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">No Download Packages Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Once code conversions or managed project milestones are completed, their download packages will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-6">Package Name</th>
                  <th className="py-3 px-6">Project Source</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">File Count & Size</th>
                  <th className="py-3 px-6">Released Date</th>
                  <th className="py-3 px-6 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-6 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.version}
                        </span>
                        <strong className="text-[#0F172A]">{item.title}</strong>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">{item.description}</p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#0F172A]">{item.projectName}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.packageType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-xs">
                      <div>{item.fileCount} files</div>
                      <div className="text-[11px] text-[#64748B]">{item.totalSizeFormatted}</div>
                    </td>

                    <td className="py-4 px-6 text-[#64748B]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      {item.downloadUrl ? (
                        <a
                          href={item.downloadUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#244A70] hover:bg-[#1B3856] rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Bundle
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Generating</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
