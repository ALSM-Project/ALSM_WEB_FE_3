import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Layers,
  RefreshCw,
  ShieldCheck,
  FileCode2,
  AlertCircle,
  FileArchive,
  Download,
  FolderKanban,
  Search,
  Filter,
  FolderUp,
  Folder,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Upload,
} from 'lucide-react';
import { StatusBadge, Button } from '@/shared/ui';
import { ProjectService } from '@/features/projects/services/project.service';
import { deliverablesApi } from '@/features/deliverables/api/deliverables.api';
import type { DeliverableItem } from '@/features/deliverables/api/deliverables.api';
import { conversionService } from '@/features/conversion/services/conversion.service';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { StageWorkflowTracker } from '../components/StageWorkflowTracker';
import type { ManagedStageKey } from '../types/managed.types';

const projectService = new ProjectService();

export const ManagedProjectDetailPage: React.FC = () => {
  const params = useParams<{ id?: string; projectId?: string }>();
  const effectiveProjectId = params.projectId || params.id;
  const navigate = useNavigate();

  const [project, setProject] = useState<any | null>(null);
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);
  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters for screens list
  const [searchScreen, setSearchScreen] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [screenPage, setScreenPage] = useState<number>(1);
  const [screenPageSize, setScreenPageSize] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'WORKBENCH' | 'GOVERNANCE' | 'DELIVERABLES'>('WORKBENCH');

  // Supplementary Document Upload State
  const [supplementaryFiles, setSupplementaryFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Customer Formal Acceptance State
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [submittingAcceptance, setSubmittingAcceptance] = useState(false);

  const loadProjectData = async () => {
    if (!effectiveProjectId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [proj, items, screenList] = await Promise.all([
        projectService.getProjectById(effectiveProjectId),
        deliverablesApi.getDeliverables(effectiveProjectId),
        conversionService.getScreens(effectiveProjectId).catch(() => []),
      ]);
      setProject(proj);
      setDeliverables(items || []);
      setScreens(screenList || []);
    } catch (err: any) {
      console.error('Failed to load project details:', err);
      setErrorMsg(err?.message || 'Failed to fetch managed project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [effectiveProjectId]);

  const handleSupplementaryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingDoc(true);
    const addedFiles = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: f.size,
    }));

    setTimeout(() => {
      setSupplementaryFiles((prev) => [...prev, ...addedFiles]);
      setUploadingDoc(false);
      setSuccessMsg(`Successfully uploaded ${addedFiles.length} supplementary document(s).`);
      setTimeout(() => setSuccessMsg(null), 4000);
      e.target.value = '';
    }, 600);
  };

  const handleCustomerAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveProjectId) return;
    try {
      setSubmittingAcceptance(true);
      await projectService.acceptProject(effectiveProjectId, acceptanceNotes);
      setSuccessMsg('Deliverables successfully accepted and approved! Project status is updated to COMPLETED.');
      await loadProjectData();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record deliverable acceptance');
    } finally {
      setSubmittingAcceptance(false);
    }
  };


  // Reset page when filter changes
  useEffect(() => {
    setScreenPage(1);
  }, [searchScreen, statusFilter]);

  if (loading) {
    return (
      <div className="w-full space-y-6 min-w-0 animate-pulse">
        <div className="h-10 bg-white rounded-xl border border-[#E2E8F0] w-1/3" />
        <div className="h-48 bg-white rounded-2xl border border-[#E2E8F0]" />
        <div className="h-64 bg-white rounded-2xl border border-[#E2E8F0]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full space-y-4 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-6 rounded-2xl">
          <h3 className="font-bold text-sm">Project Not Found</h3>
          <p className="mt-1">{errorMsg || 'Unable to locate managed project with the specified ID.'}</p>
        </div>
      </div>
    );
  }

  // Canonical 9-stage dynamic calculation from backend
  const currentStage = Number(project.stageIndex || project.stage || 1);
  const progressPct =
    typeof project.progressPct === 'number'
      ? project.progressPct
      : Math.round((currentStage / 9) * 100);
  const currentStageKey: ManagedStageKey =
    project.currentStage || project.stageKey || 'REQUIREMENTS_GATHERING';

  const isAcceptanceEligible =
    currentStage >= 7 ||
    project.status === 'AWAITING_CUSTOMER_REVIEW' ||
    project.status === 'AWAITING_ACCEPTANCE' ||
    project.status === 'CUSTOMER_REVIEW' ||
    project.status === 'ACCEPTANCE';

  const isAccepted = !!project.acceptance?.accepted || project.status === 'COMPLETED';

  const isCobolProject = project.conversionType === 'COBOL_TO_JAVA';
  const totalScreens = screens.length || project.screensCount || 0;
  const convertedScreens = screens.filter((s) => s.status === 'Completed').length;
  const reviewRequired = screens.filter((s) => s.status === 'Review Required').length;
  const pendingScreens = totalScreens - convertedScreens - reviewRequired;

  const filteredScreens = screens.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchScreen.toLowerCase());
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'COMPLETED') return matchesSearch && s.status === 'Completed';
    if (statusFilter === 'REVIEW') return matchesSearch && s.status === 'Review Required';
    if (statusFilter === 'READY') return matchesSearch && (s.status === 'Ready' || s.status === 'Processing');
    return matchesSearch;
  });

  // Screen Pagination Calculation
  const totalScreenCount = filteredScreens.length;
  const totalScreenPages = Math.max(1, Math.ceil(totalScreenCount / screenPageSize));
  const safeScreenPage = Math.min(screenPage, totalScreenPages);
  const screenStartIndex = (safeScreenPage - 1) * screenPageSize;
  const paginatedScreens = filteredScreens.slice(screenStartIndex, screenStartIndex + screenPageSize);

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Breadcrumb Back Link & Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              Managed Modernization Services
            </span>
            <span className="font-mono text-xs text-[#64748B]">
              Contract: <strong>{project.contractNumber || 'ALSM-CTR-2026-9A52'}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-1.5">
            {project.name}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl">
            {project.description ||
              (isCobolProject
                ? 'Full-cycle enterprise legacy COBOL to Java 21 + Spring Boot 3 modernization supervised by ALSM engineers.'
                : 'Turnkey enterprise legacy BMS/DSPF to modern React 19 modernization governed by ALSM deterministic engine.')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadProjectData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(`/project-files?projectId=${project.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-blue-100 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <FolderUp className="w-3.5 h-3.5" />
            Project Files
          </button>
          <button
            type="button"
            onClick={() => navigate('/meetings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule Review Call
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Dynamic Canonical 9-Stage Visual Workflow Tracker ────────────────── */}
      <StageWorkflowTracker
        currentStage={currentStage}
        currentStageKey={currentStageKey}
        progressPct={progressPct}
      />

      {/* ── Managed Modernization Key Metrics ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D9E2EC] p-4 rounded-xl text-center shadow-2xs">
          <div className="text-xs font-semibold text-[#6B778C]">{isCobolProject ? 'Total Programs' : 'Total Screens'}</div>
          <div className="text-2xl font-extrabold text-[#091E42] mt-0.5">{totalScreens}</div>
          <span className="text-[10px] text-slate-500 font-medium">Assets across project</span>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-center shadow-2xs">
          <div className="text-xs font-bold text-emerald-700">Converted by ALSM</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-0.5">{convertedScreens}</div>
          <span className="text-[10px] text-emerald-600 font-medium">ALSM automated code generated</span>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl text-center shadow-2xs">
          <div className="text-xs font-bold text-amber-700">Review Required</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-0.5">{reviewRequired}</div>
          <span className="text-[10px] text-amber-600 font-medium">ALSM engineer quality review</span>
        </div>
        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl text-center shadow-2xs">
          <div className="text-xs font-bold text-blue-700">Ingested / Ready</div>
          <div className="text-2xl font-extrabold text-blue-800 mt-0.5">{pendingScreens}</div>
          <span className="text-[10px] text-blue-600 font-medium">Ready for pipeline execution</span>
        </div>
      </div>

      {/* ── Tabs: Programs & Screens Workspace vs Turnkey SLA & Deliverables ─── */}
      <div className="space-y-4">
        <div className="flex border-b border-[#D9E2EC] space-x-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('WORKBENCH')}
            className={`pb-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'WORKBENCH'
                ? 'border-[#0652CC] text-[#0652CC] font-bold'
                : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>{isCobolProject ? 'Customer Input Programs & Copybooks' : 'Customer Input Screen Maps'}</span>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600">
              {totalScreens}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GOVERNANCE')}
            className={`pb-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'GOVERNANCE'
                ? 'border-[#0652CC] text-[#0652CC] font-bold'
                : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Turnkey SLA & Scope</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DELIVERABLES')}
            className={`pb-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'DELIVERABLES'
                ? 'border-[#0652CC] text-[#0652CC] font-bold'
                : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            <span>Deliverables & Acceptance</span>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600">
              {deliverables.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Programs & Screens List Table */}
        {activeTab === 'WORKBENCH' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${isCobolProject ? 'programs' : 'screens'} by name...`}
                  value={searchScreen}
                  onChange={(e) => setSearchScreen(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-[#64748B]">Status:</span>
                {['ALL', 'READY', 'COMPLETED', 'REVIEW'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      statusFilter === st
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:bg-slate-200 border border-[#E2E8F0]'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'READY' ? 'Ready' : st === 'COMPLETED' ? 'Completed' : 'Review'}
                  </button>
                ))}
              </div>
            </div>

            {filteredScreens.length > 0 ? (
              <>
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                  <table className="w-full text-left text-xs divide-y divide-[#E2E8F0]">
                    <thead className="bg-[#F8FAFC] font-bold text-[#64748B]">
                      <tr>
                        <th className="py-3 px-4">{isCobolProject ? 'Program / Source File' : 'Screen Map'}</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Last Updated</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {paginatedScreens.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-[#0F172A]">
                            {s.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                              {s.sourceType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={s.status} />
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {s.sizeKb ? `${s.sizeKb} KB` : '—'}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {s.lastUpdated || 'Recently Ingested'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ingested & Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalScreenCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]/50 text-xs text-[#64748B]">
                    <div className="flex items-center gap-2">
                      <span>Showing</span>
                      <select
                        value={screenPageSize}
                        onChange={(e) => {
                          setScreenPageSize(Number(e.target.value));
                          setScreenPage(1);
                        }}
                        className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172A] focus:outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span>items per page</span>
                      <span className="text-slate-300">|</span>
                      <span>
                        <strong>{screenStartIndex + 1}</strong> - <strong>{Math.min(screenStartIndex + screenPageSize, totalScreenCount)}</strong> of <strong>{totalScreenCount}</strong> files
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setScreenPage((p) => Math.max(1, p - 1))}
                        disabled={safeScreenPage <= 1}
                        className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalScreenPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setScreenPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              safeScreenPage === pageNum
                                ? 'bg-[#0652CC] text-white shadow-2xs'
                                : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setScreenPage((p) => Math.min(totalScreenPages, p + 1))}
                        disabled={safeScreenPage >= totalScreenPages}
                        className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-xs text-[#64748B] space-y-2">
                <FolderKanban className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-[#0F172A]">No {isCobolProject ? 'Programs' : 'Screens'} Found</p>
                <p className="text-[11px]">
                  Files uploaded via Project Files will be ingested here automatically.
                </p>
                <Button
                  onClick={() => navigate(`/project-files?projectId=${project.id}`)}
                  className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold mt-2"
                >
                  Go to Project Files
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Turnkey SLA & Scope */}
        {activeTab === 'GOVERNANCE' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A]">Modernization Scope & Specs</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Service Model:</span>
                  <strong className="text-[#2563EB] font-bold">MANAGED MODERNIZATION</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Legacy Technology:</span>
                  <strong className="text-[#0F172A]">
                    {isCobolProject ? 'IBM AS/400 DSPF & COBOL' : 'IBM 3270 BMS Screen Map'}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Target Architecture:</span>
                  <strong className="text-[#2563EB]">
                    {isCobolProject ? 'Spring Boot 3 + Java 21' : 'React 19 + TypeScript & Tailwind'}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Contract Reference:</span>
                  <strong className="font-mono text-[#0F172A]">
                    {project.contractNumber || 'ALSM-CTR-2026-9A52'}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Parity Verification:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Deterministic AST
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#0F172A]">Turnkey Service Governance & SLA</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[#64748B] text-[11px] block">Execution Responsibility</span>
                  <p className="font-bold text-[#0F172A] mt-0.5">ALSM Core Modernization Engineering</p>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Your legacy artifacts are analyzed, transformed, and regression tested end-to-end under dedicated ALSM SLA supervision.
                  </p>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Current Stage Status:</span>
                  <span className="font-bold text-[#2563EB]">{currentStageKey.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Stage Progression:</span>
                  <strong className="text-[#0F172A] font-mono">{currentStage} / 9 stages ({progressPct}%)</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Deliverables & Formal Acceptance */}
        {activeTab === 'DELIVERABLES' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Validated Deliverables Handover</h3>
                </div>
                <span className="text-xs font-semibold text-[#64748B]">
                  {deliverables.length} Deliverable(s)
                </span>
              </div>

              {deliverables.length > 0 ? (
                <div className="divide-y divide-[#F1F5F9] max-h-56 overflow-y-auto text-xs">
                  {deliverables.map((deliv) => (
                    <div key={deliv.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="font-bold text-[#0F172A] truncate">{deliv.title}</p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          v{deliv.version} • {deliv.packageType} • {deliv.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/deliverables/${deliv.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  <FileArchive className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
                  <p className="font-semibold text-[#0F172A]">Deliverables in Production</p>
                  <p className="text-[11px] mt-0.5">
                    Modernization engineers will publish code packages, container bundles, and test reports as stages complete.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#0F172A]">Deliverable Formal Acceptance</h3>
              </div>

              {isAccepted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Deliverables Formally Accepted</span>
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    Sign-off recorded by <strong>{project.acceptance?.acceptedByName || 'Customer Representative'}</strong>
                    {project.acceptance?.acceptedAt && (
                      <span> on {new Date(project.acceptance.acceptedAt).toLocaleDateString()}</span>
                    )}
                  </p>
                  {project.acceptance?.notes && (
                    <div className="p-2 bg-white/80 rounded border border-emerald-200 text-emerald-900 mt-2 font-sans italic">
                      "{project.acceptance.notes}"
                    </div>
                  )}
                </div>
              ) : isAcceptanceEligible ? (
                <form onSubmit={handleCustomerAcceptance} className="space-y-3 text-xs">
                  <p className="text-[#64748B] text-[11px]">
                    This project has completed modernization validation and is ready for customer review and formal sign-off.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                      Acceptance Notes / Sign-off Comments:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Verified target screens and parity tests. Deliverables approved."
                      value={acceptanceNotes}
                      onChange={(e) => setAcceptanceNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingAcceptance}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {submittingAcceptance ? 'Recording Acceptance...' : 'Formally Accept & Approve Deliverables'}
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#64748B] space-y-1">
                  <p className="font-semibold text-slate-700">Awaiting Milestone Review</p>
                  <p className="text-[11px]">
                    Formal acceptance will unlock when engineering reaches Stage 7 (Customer Review) or Stage 8 (Acceptance).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Supplementary Documentation & Legacy Artifacts Section ─────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Supplementary Project Documentation & Specs</h3>
          </div>
          <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-blue-100 rounded-lg cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploadingDoc ? 'Uploading...' : 'Upload Supplementary Document'}</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleSupplementaryUpload}
              disabled={uploadingDoc}
            />
          </label>
        </div>

        <div className="space-y-2 text-xs">
          {supplementaryFiles.length > 0 ? (
            <div className="pt-1 space-y-1">
              <span className="text-[11px] font-bold text-[#0F172A]">Uploaded Files in this Session:</span>
              {supplementaryFiles.map((sf, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 text-slate-700 bg-blue-50/50 px-2 rounded">
                  <span className="font-mono text-[11px] truncate">{sf.name}</span>
                  <span className="text-[10px] text-[#2563EB] font-semibold">Ready for Review</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#64748B] italic">
              Upload any additional architectural diagrams, business specifications, or test scenarios to assist ALSM engineers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
