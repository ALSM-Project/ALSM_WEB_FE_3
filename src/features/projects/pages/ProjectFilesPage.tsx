import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileCode2,
  UploadCloud,
  FolderUp,
  FolderPlus,
  FileText,
  CheckCircle2,
  Trash2,
  Download,
  AlertCircle,
  ShieldCheck,
  Search,
  FileArchive,
  Package,
  Clock,
  AlertTriangle,
  Folder,
  RefreshCw,
  X,
  FileCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { projectService } from '../services/project.service';
import { conversionService } from '@/features/conversion/services/conversion.service';
import { deliverablesApi } from '@/features/deliverables/api/deliverables.api';
import type {
  DeliverableItem,
  DeliverableStatus,
  DeliverablePackageType,
} from '@/features/deliverables/api/deliverables.api';
import type { Project } from '../types/project';

const PROGRAM_EXTS = new Set(['.cob', '.cbl', '.rpg']);
const COPYBOOK_EXTS = new Set(['.cpy']);
const SCREEN_EXTS = new Set(['.bms', '.dspf']);

export interface IntakeFile {
  id: string;
  fileName: string;
  folder?: string;
  sizeKb: number;
  uploadedAt: string;
  status: string;
  inputReference?: string;
  screenId?: string;
}

export const ProjectFilesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramProjectId = searchParams.get('projectId');
  const paramSection = searchParams.get('tab') === 'deliverables' ? 'DELIVERABLES' : 'CUSTOMER_INPUT';

  // Section switcher: 'CUSTOMER_INPUT' or 'DELIVERABLES'
  const [activeSection, setActiveSection] = useState<'CUSTOMER_INPUT' | 'DELIVERABLES'>(paramSection);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(paramProjectId || '');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Customer Files States
  const [files, setFiles] = useState<IntakeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<string[]>(['root', 'sources', 'specifications', 'copybooks']);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SCREENS' | 'PROGRAMS' | 'COPYBOOKS' | 'DOCS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [delivPage, setDelivPage] = useState<number>(1);
  const [delivPageSize, setDelivPageSize] = useState<number>(10);

  // Deliverables States (Area B)
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);
  const [loadingDeliverables, setLoadingDeliverables] = useState(false);
  const [deliverableStatusFilter, setDeliverableStatusFilter] = useState<string>('ALL');
  const [deliverableSearchTerm, setDeliverableSearchTerm] = useState('');
  const [selectedForReview, setSelectedForReview] = useState<DeliverableItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REVISION_REQUESTED'>('APPROVED');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // 1. Load user projects
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.resolve(projectService.getProjects())
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        setProjects(list);
        if (paramProjectId) {
          setSelectedProjectId(paramProjectId);
        } else if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paramProjectId]);

  // 2. Load active project details and files whenever selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId) return;
    let cancelled = false;

    // Sync URL search param
    setSearchParams(
      {
        projectId: selectedProjectId,
        tab: activeSection === 'DELIVERABLES' ? 'deliverables' : 'inputs',
      },
      { replace: true }
    );

    Promise.resolve(projectService.getProjectById(selectedProjectId))
      .then((p) => {
        if (!cancelled && p) setCurrentProject(p);
      })
      .catch(() => {});

    Promise.resolve(conversionService.getScreens(selectedProjectId))
      .then((screens) => {
        if (cancelled || !Array.isArray(screens)) return;
        const mapped: IntakeFile[] = screens.map((s) => ({
          id: s.id,
          fileName: s.name,
          folder: s.name.endsWith('.cpy') ? 'copybooks' : s.name.endsWith('.pdf') || s.name.endsWith('.docx') ? 'specifications' : 'sources',
          sizeKb: s.sizeKb ?? 12,
          uploadedAt: s.lastUpdated ?? 'Recently',
          status: s.status || 'Received',
          inputReference: s.inputReference,
          screenId: s.id,
        }));
        setFiles(mapped);
      })
      .catch(() => {});

    // Fetch published deliverables for this project
    fetchProjectDeliverables(selectedProjectId);

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, activeSection, setSearchParams]);

  const fetchProjectDeliverables = async (projId: string) => {
    try {
      setLoadingDeliverables(true);
      const items = await deliverablesApi.getDeliverables(projId);
      setDeliverables(items);
    } catch (err) {
      console.error('Failed to load project deliverables:', err);
    } finally {
      setLoadingDeliverables(false);
    }
  };

  // Helper to categorize files
  const getFileCategory = (name: string): { label: string; color: string; kind: 'SCREENS' | 'PROGRAMS' | 'COPYBOOKS' | 'DOCS' } => {
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    if (SCREEN_EXTS.has(ext)) return { label: 'BMS/DSPF Screen Map', color: 'text-blue-700 bg-blue-50 border-blue-200', kind: 'SCREENS' };
    if (PROGRAM_EXTS.has(ext)) return { label: 'COBOL/RPG Program', color: 'text-purple-700 bg-purple-50 border-purple-200', kind: 'PROGRAMS' };
    if (COPYBOOK_EXTS.has(ext)) return { label: 'Copybook Data Definition', color: 'text-amber-700 bg-amber-50 border-amber-200', kind: 'COPYBOOKS' };
    return { label: 'Specification / Documentation', color: 'text-slate-700 bg-slate-50 border-slate-200', kind: 'DOCS' };
  };

  // Upload handlers
  const handleUploadFiles = async (fileList: File[]) => {
    if (!selectedProjectId || fileList.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);
    setUploadLabel(
      fileList.length > 1
        ? `Uploading ${fileList.length} intake files to project workspace…`
        : `Uploading ${fileList[0].name}…`
    );

    try {
      const result = await conversionService.uploadSource(selectedProjectId, fileList, setUploadProgress);
      const newItems: IntakeFile[] = (result?.files || fileList).map((f: any) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        fileName: f.name || f,
        folder: selectedFolder !== 'ALL' ? selectedFolder : 'sources',
        sizeKb: Math.round((f.sizeBytes || f.size || 12000) / 1024),
        uploadedAt: 'Just now',
        status: 'Received',
        inputReference: result?.inputReference || 'intake-ref',
      }));

      setFiles((prev) => [...newItems, ...prev]);
      setUploadSuccess(`Successfully ingested ${fileList.length} file(s) for ALSM modernization team.`);
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to upload files:', err);
      setUploadError(err?.message || 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadLabel('');
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      void handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDownloadFile = (file: IntakeFile) => {
    const blob = new Blob([`// ALSM Legacy Intake File: ${file.fileName}\n// Project ID: ${selectedProjectId}\n// Status: ${file.status}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteFile = async (file: IntakeFile) => {
    if (!selectedProjectId) return;
    if (!window.confirm(`Are you sure you want to remove "${file.fileName}" from the project intake?`)) {
      return;
    }
    setDeletingId(file.id);
    try {
      if (file.screenId) {
        await conversionService.deleteScreen(selectedProjectId, file.screenId);
      }
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setUploadSuccess(`File "${file.fileName}" removed.`);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to remove file.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const clean = newFolderName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!folders.includes(clean)) {
      setFolders((prev) => [...prev, clean]);
      setSelectedFolder(clean);
    }
    setNewFolderName('');
    setShowFolderModal(false);
  };

  // Deliverables Review Handlers
  const handleOpenReview = (item: DeliverableItem, defaultDecision: 'APPROVED' | 'REVISION_REQUESTED' = 'APPROVED') => {
    setSelectedForReview(item);
    setReviewDecision(defaultDecision);
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

      setUploadSuccess(
        reviewDecision === 'APPROVED'
          ? `Package ${updated.version} (${updated.title}) has been verified and approved!`
          : `Revision request for ${updated.version} has been submitted to ALSM team.`
      );
      setTimeout(() => setUploadSuccess(null), 6000);
      setSelectedForReview(null);
    } catch (err: any) {
      alert(`Error submitting review: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

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

  const getDeliverableStatusBadge = (status: DeliverableStatus) => {
    switch (status) {
      case 'PUBLISHED':
      case 'READY_FOR_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Published • Awaiting Sign-Off
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
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const cat = getFileCategory(f.fileName);
    if (filterCategory !== 'ALL' && cat.kind !== filterCategory) return false;
    if (selectedFolder !== 'ALL' && f.folder !== selectedFolder) return false;
    if (searchTerm.trim()) {
      return f.fileName.toLowerCase().includes(searchTerm.toLowerCase().trim());
    }
    return true;
  });

  const screenCount = files.filter((f) => getFileCategory(f.fileName).kind === 'SCREENS').length;
  const progCount = files.filter((f) => getFileCategory(f.fileName).kind === 'PROGRAMS').length;
  const cpyCount = files.filter((f) => getFileCategory(f.fileName).kind === 'COPYBOOKS').length;
  const docCount = files.filter((f) => getFileCategory(f.fileName).kind === 'DOCS').length;

  // Filtered deliverables
  const filteredDeliverables = deliverables.filter((item) => {
    if (deliverableStatusFilter !== 'ALL' && item.status !== deliverableStatusFilter) return false;
    if (deliverableSearchTerm) {
      const term = deliverableSearchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        item.version.toLowerCase().includes(term) ||
        item.packageType.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, searchTerm, selectedFolder, selectedProjectId]);

  useEffect(() => {
    setDelivPage(1);
  }, [deliverableStatusFilter, deliverableSearchTerm, selectedProjectId]);

  // Pagination calculation for Input Files
  const totalFilesCount = filteredFiles.length;
  const totalFilePages = Math.max(1, Math.ceil(totalFilesCount / pageSize));
  const safeFilePage = Math.min(currentPage, totalFilePages);
  const fileStartIndex = (safeFilePage - 1) * pageSize;
  const paginatedFiles = filteredFiles.slice(fileStartIndex, fileStartIndex + pageSize);

  // Pagination calculation for Deliverables
  const totalDelivCount = filteredDeliverables.length;
  const totalDelivPages = Math.max(1, Math.ceil(totalDelivCount / delivPageSize));
  const safeDelivPage = Math.min(delivPage, totalDelivPages);
  const delivStartIndex = (safeDelivPage - 1) * delivPageSize;
  const paginatedDeliverables = filteredDeliverables.slice(delivStartIndex, delivStartIndex + delivPageSize);

  if (loading && projects.length === 0) {
    return (
      <div className="w-full space-y-6 min-w-0 animate-pulse">
        <div className="h-10 bg-white rounded-xl border border-[#E2E8F0] w-1/3" />
        <div className="h-40 bg-white rounded-2xl border border-[#E2E8F0]" />
        <div className="h-64 bg-white rounded-2xl border border-[#E2E8F0]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              Managed Modernization Services
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Project Files & Deliverables
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl">
            Separated management of Customer Input Source Files and Official Published Deliverables.
          </p>
        </div>

        {/* Project Selector & Direct Action */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {projects.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
              <span className="text-xs font-semibold text-[#64748B]">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs font-bold text-[#0F172A] bg-transparent focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.conversionType === 'COBOL_TO_JAVA' ? 'COBOL 2 Java' : 'BMS 2 React 19'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Two Primary Architectural Areas Toggle ───────────────────────────── */}
      <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveSection('CUSTOMER_INPUT');
            setSearchParams({ projectId: selectedProjectId, tab: 'inputs' });
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'CUSTOMER_INPUT'
              ? 'bg-white text-[#0652CC] shadow-xs border border-blue-100'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Customer Input Files</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
            activeSection === 'CUSTOMER_INPUT' ? 'bg-blue-50 text-[#0652CC] font-bold' : 'bg-slate-200 text-slate-700'
          }`}>
            {files.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('DELIVERABLES');
            setSearchParams({ projectId: selectedProjectId, tab: 'deliverables' });
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'DELIVERABLES'
              ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Published Deliverables</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
            activeSection === 'DELIVERABLES' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-700'
          }`}>
            {deliverables.length}
          </span>
        </button>
      </div>

      {/* Notifications */}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          AREA A: CUSTOMER INPUT FILES
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'CUSTOMER_INPUT' && (
        <div className="space-y-6">
          {/* Context Banner */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] shrink-0 mt-0.5">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#0F172A]">
                    {currentProject?.name ? `Source Files & Dossier: ${currentProject.name}` : 'Input Source Files & Dossier for ALSM Engineers'}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SLA Guaranteed
                  </span>
                </div>
                <p className="text-xs text-[#64748B] max-w-3xl leading-relaxed">
                  Legacy source files (BMS/DSPF screens, COBOL programs, copybooks) and specification documents are securely stored in your enterprise project space. ALSM engineers handle full conversion, test harness construction, and acceptance packaging.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F1F5F9]">
              <div className="text-left md:text-right">
                <span className="text-[#64748B] text-[11px] block">Files Received</span>
                <strong className="text-base font-bold text-[#0F172A] font-mono">{files.length}</strong>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[#64748B] text-[11px] block">Status</span>
                <span className="inline-block px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                  Intake Active
                </span>
              </div>
            </div>
          </div>

          {/* Drag & Drop Intake Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="bg-white rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] p-8 text-center transition-all bg-slate-50/40 relative group"
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Drag and drop your legacy files or project folder here
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Drag and drop files here, or browse from your device
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0652CC] hover:bg-[#0655FF] rounded-xl cursor-pointer shadow-2xs transition-colors">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Browse Files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={isUploading || !selectedProjectId}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        void handleUploadFiles(Array.from(e.target.files));
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded-xl cursor-pointer shadow-2xs transition-colors">
                  <FolderUp className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Upload Entire Folder</span>
                  <input
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    className="hidden"
                    disabled={isUploading || !selectedProjectId}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        void handleUploadFiles(Array.from(e.target.files));
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowFolderModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#475569] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded-xl cursor-pointer shadow-2xs"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>New Folder</span>
                </button>
              </div>

              <p className="text-[11px] text-[#94A3B8]">
                Accepted: .bms, .dspf, .cbl, .cob, .cpy, .rpg, .pdf, .docx, .zip (Max 50MB per file)
              </p>
            </div>

            {/* Real Progress Bar */}
            {isUploading && (
              <div className="mt-6 max-w-sm mx-auto space-y-1.5">
                <div className="flex justify-between text-xs text-[#0F172A] font-semibold">
                  <span>{uploadLabel}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Folder Organizers & Filters */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden space-y-0">
            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterCategory === 'ALL'
                      ? 'bg-[#0652CC] text-white shadow-2xs'
                      : 'text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  All Files ({files.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('SCREENS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterCategory === 'SCREENS'
                      ? 'bg-[#0652CC] text-white shadow-2xs'
                      : 'text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  Screens ({screenCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('PROGRAMS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterCategory === 'PROGRAMS'
                      ? 'bg-[#0652CC] text-white shadow-2xs'
                      : 'text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  Programs ({progCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('COPYBOOKS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterCategory === 'COPYBOOKS'
                      ? 'bg-[#0652CC] text-white shadow-2xs'
                      : 'text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  Copybooks ({cpyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('DOCS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterCategory === 'DOCS'
                      ? 'bg-[#0652CC] text-white shadow-2xs'
                      : 'text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  Specs & Docs ({docCount})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search intake files..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Date Provided</th>
                    <th className="py-3 px-4">Intake Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {paginatedFiles.length > 0 ? (
                    paginatedFiles.map((file) => {
                      const cat = getFileCategory(file.fileName);
                      const isDeleting = deletingId === file.id;

                      return (
                        <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                              <span className="truncate max-w-xs">{file.fileName}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${cat.color}`}>
                              {cat.label}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[#64748B] font-mono">
                            {file.sizeKb} KB
                          </td>

                          <td className="py-3.5 px-4 text-[#64748B]">
                            {file.uploadedAt}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Received & Ingested
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(file)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Download intake file copy"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(file)}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove file from project intake"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#64748B]">
                        <FileArchive className="w-10 h-10 mx-auto text-[#CBD5E1] mb-2.5" />
                        <p className="font-bold text-[#0F172A] text-sm">No Intake Files Found</p>
                        <p className="mt-1 text-[#64748B]">
                          {files.length === 0
                            ? 'No input source files in this project yet. Please drag & drop or upload files above for ALSM engineers.'
                            : 'No files matched the current filter.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalFilesCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]/50 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span>Showing</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172A] focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>rows per page</span>
                  <span className="text-slate-300">|</span>
                  <span>
                    <strong>{fileStartIndex + 1}</strong> - <strong>{Math.min(fileStartIndex + pageSize, totalFilesCount)}</strong> of <strong>{totalFilesCount}</strong> files
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeFilePage <= 1}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalFilePages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalFilePages > 7 &&
                        pageNum !== 1 &&
                        pageNum !== totalFilePages &&
                        Math.abs(pageNum - safeFilePage) > 1
                      ) {
                        if (pageNum === 2 || pageNum === totalFilePages - 1) {
                          return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            safeFilePage === pageNum
                              ? 'bg-[#0652CC] text-white shadow-2xs'
                              : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalFilePages, p + 1))}
                    disabled={safeFilePage >= totalFilePages}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          AREA B: PUBLISHED DELIVERABLES
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'DELIVERABLES' && (
        <div className="space-y-6">
          {/* Deliverables Governance Banner */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0 mt-0.5">
                <Package className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#0F172A]">
                    Official Published Deliverables & Results
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> ALSM Verified Release
                  </span>
                </div>
                <p className="text-xs text-[#64748B] max-w-3xl leading-relaxed">
                  All modernized source code (React 19 / Spring Boot), AST test artifacts, and validation reports approved and officially published by ALSM. Customers can view, download, and confirm acceptance; modification or uploads are restricted to ensure integrity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchProjectDeliverables(selectedProjectId)}
                disabled={loadingDeliverables}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDeliverables ? 'animate-spin' : ''}`} />
                <span>Refresh Deliverables</span>
              </button>
            </div>
          </div>

          {/* Deliverables Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={deliverableSearchTerm}
                onChange={(e) => setDeliverableSearchTerm(e.target.value)}
                placeholder="Search deliverable packages, versions..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
              <button
                type="button"
                onClick={() => setDeliverableStatusFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  deliverableStatusFilter === 'ALL' ? 'bg-white text-[#0F172A] shadow-2xs' : 'hover:text-[#0F172A]'
                }`}
              >
                All ({deliverables.length})
              </button>
              <button
                type="button"
                onClick={() => setDeliverableStatusFilter('READY_FOR_REVIEW')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  deliverableStatusFilter === 'READY_FOR_REVIEW' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-[#0F172A]'
                }`}
              >
                Needs Review ({deliverables.filter((d) => d.status === 'READY_FOR_REVIEW' || d.status === 'PUBLISHED').length})
              </button>
              <button
                type="button"
                onClick={() => setDeliverableStatusFilter('APPROVED')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  deliverableStatusFilter === 'APPROVED' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'hover:text-[#0F172A]'
                }`}
              >
                Approved ({deliverables.filter((d) => d.status === 'APPROVED').length})
              </button>
            </div>
          </div>

          {/* Deliverables Table */}
          {loadingDeliverables ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
              ))}
            </div>
          ) : filteredDeliverables.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-3">
              <FileArchive className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-bold text-[#0F172A]">No official deliverables published yet</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Once ALSM engineers complete modernization, run AST validation tests, and Team Lead/Admin approve publication, the deliverable package will appear here for download and sign-off.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="py-3 px-4">Version & Title</th>
                      <th className="py-3 px-4">Artifact Type</th>
                      <th className="py-3 px-4">Files & Size</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-xs">
                    {paginatedDeliverables.map((item) => (
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
                              <strong>Accepted by:</strong> {item.customerReview.reviewedByUserName} on{' '}
                              {new Date(item.customerReview.reviewedAt).toLocaleDateString()}
                              {item.customerReview.feedbackNotes && (
                                <p className="mt-0.5 italic text-slate-600">
                                  "{item.customerReview.feedbackNotes}"
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Artifact Type */}
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
                          {getDeliverableStatusBadge(item.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={item.downloadUrl || `/api/v1/projects/${selectedProjectId}/partner-export/download`}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0652CC] hover:bg-[#0655FF] shadow-2xs transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>

                            {item.status !== 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenReview(item, 'APPROVED')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Sign-Off</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Deliverables Pagination Controls */}
              {totalDelivCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]/50 text-xs text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <span>Showing</span>
                    <select
                      value={delivPageSize}
                      onChange={(e) => {
                        setDelivPageSize(Number(e.target.value));
                        setDelivPage(1);
                      }}
                      className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172A] focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span>packages per page</span>
                    <span className="text-slate-300">|</span>
                    <span>
                      <strong>{delivStartIndex + 1}</strong> - <strong>{Math.min(delivStartIndex + delivPageSize, totalDelivCount)}</strong> of <strong>{totalDelivCount}</strong> deliverables
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDelivPage((p) => Math.max(1, p - 1))}
                      disabled={safeDelivPage <= 1}
                      className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalDelivPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setDelivPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            safeDelivPage === pageNum
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
                      onClick={() => setDelivPage((p) => Math.min(totalDelivPages, p + 1))}
                      disabled={safeDelivPage >= totalDelivPages}
                      className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Folder Creation Modal ────────────────────────────────────────────── */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#2563EB]" />
                Create Intake Folder
              </h3>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bms-screens, cobol-core, architecture-docs"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0652CC] hover:bg-[#0655FF] rounded-lg cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deliverable Review & Sign-Off Modal ───────────────────────────────── */}
      {selectedForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Review & Sign-Off Deliverable
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Package: <span className="font-mono font-bold text-[#2563EB]">{selectedForReview.version}</span> • {selectedForReview.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForReview(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-2">
                  Review Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      reviewDecision === 'APPROVED'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-100'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Approve Package</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('REVISION_REQUESTED')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      reviewDecision === 'REVISION_REQUESTED'
                        ? 'border-rose-500 bg-rose-50/50 text-rose-800 ring-2 ring-rose-100'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Request Revision</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">
                  Feedback Notes & Comments {reviewDecision === 'REVISION_REQUESTED' && <span className="text-rose-600">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder={
                    reviewDecision === 'APPROVED'
                      ? 'Optional acceptance comments or verification remarks...'
                      : 'Provide details on issues observed or required revisions...'
                  }
                  required={reviewDecision === 'REVISION_REQUESTED'}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setSelectedForReview(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg cursor-pointer transition-colors ${
                    reviewDecision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmittingReview ? 'Submitting…' : reviewDecision === 'APPROVED' ? 'Confirm Approval' : 'Submit Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilesPage;
