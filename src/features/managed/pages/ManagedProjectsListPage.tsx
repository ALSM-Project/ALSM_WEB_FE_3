import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  RefreshCw,
  ChevronRight,
  Send,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { ProjectService } from '@/features/projects/services/project.service';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';
import { MANAGED_WORKFLOW_STAGES } from '../types/managed.types';

const projectService = new ProjectService();

export const ManagedProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const all = await projectService.getProjects();
      const managedList = (all || []).filter(
        (p) => p.serviceType === 'MANAGED' || p.conversionRequestId
      );
      setProjects(managedList.length > 0 ? managedList : (all || []));
    } catch (err) {
      console.error('Failed to load managed projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filtered = projects.filter((p) => {
    if (typeFilter !== 'ALL' && p.conversionType !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.contractNumber || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-2">
            Managed Modernization Projects
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#244A70] hover:bg-[#1B3856] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Project
          </button>
          <button
            type="button"
            onClick={() => navigate('/conversion-requests/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 text-[#2563EB]" />
            Submit Request
          </button>
        </div>
      </div>

      {/* ── Filter Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search managed projects or contracts..."
            className="w-full h-8 pl-8 pr-3 py-0 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-3 py-0 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          >
            <option value="ALL">All Conversion Engines</option>
            <option value="BMS_DSPF_TO_FRONTEND">IBM 3270 BMS & DSPF</option>
            <option value="COBOL_TO_JAVA">COBOL to Spring Boot</option>
          </select>
        </div>
      </div>

      {/* ── Projects Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">No Managed Projects Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You do not have any managed modernization projects matching the filter. Submit a new modernization request to begin.
          </p>
          <button
            onClick={() => navigate('/conversion-requests/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#244A70] hover:bg-[#1B3856] text-white rounded-lg text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Modernization Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const stage = Number(p.stageIndex || p.stage || 1);
            const progress = p.progressPct || Math.round((stage / 9) * 100);
            const stageInfo = MANAGED_WORKFLOW_STAGES.find((s) => s.step === stage) || MANAGED_WORKFLOW_STAGES[0];

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/managed-projects/${p.id}`)}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:border-[#BFDBFE] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      Stage {stage}: {stageInfo.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {progress}% Complete
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] mt-3 group-hover:text-[#2563EB] transition-colors flex items-center justify-between">
                    <span>{p.name}</span>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:translate-x-1 transition-transform" />
                  </h3>

                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                    {p.description || 'Turnkey legacy conversion project with SLA warranty.'}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
                      <span>Contract: <strong className="font-mono text-[#0F172A]">{p.contractNumber || 'ALSM-CTR-2026-9A52'}</strong></span>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> SLA Guaranteed
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E2E8F0]">
                      <div
                        className="h-full bg-[#244A70] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Engine: <strong className="text-[#0F172A]">{p.conversionType === 'COBOL_TO_JAVA' ? 'COBOL 2 Java' : 'BMS 2 React 19'}</strong></span>
                    <span className="font-bold text-[#2563EB] group-hover:underline">
                      Inspect 9-Stage Modernization Workflow →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal for Managed Modernization */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultServiceType="MANAGED"
        onProjectCreated={(id) => {
          loadProjects();
          navigate(`/project-files?projectId=${id}`);
        }}
      />
    </div>
  );
};
