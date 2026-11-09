import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Code2,
  Upload,
  Layers,
  FileSearch,
  Cpu,
  ShieldCheck,
  Eye,
  Download,
  ArrowRight,
  Trash2,
  Pencil,
  AlertTriangle,
  Activity,
  Calendar,
  Clock,
  Settings,
  PieChart,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button, EnsureQueryClient } from '@/shared/ui';
import { ModernizationWorkflow, type WorkflowStepId } from '@/shared/ui/ModernizationWorkflow';
import { EditProjectModal } from '../components/EditProjectModal';
import { DeleteProjectModal } from '../components/DeleteProjectModal';
import { useProjectQuery, useProjectScreensQuery } from '../queries/useProjects';
import type { Project } from '../types/project';

const LEGACY_TYPE_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'BMS / DSPF Screen Maps',
  COBOL_TO_JAVA: 'COBOL Source Programs',
};

const TARGET_FRAMEWORK_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'React 19 (TypeScript + Tailwind)',
  COBOL_TO_JAVA: 'Java 21 + Spring Boot',
};

const ProjectOverviewContent: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'SCREENS' | 'USAGE' | 'SETTINGS'>('SCREENS');

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
    refetch: refetchProject,
  } = useProjectQuery(projectId);

  const {
    data: screens = [],
    isLoading: isScreensLoading,
  } = useProjectScreensQuery(projectId);

  if (isProjectLoading) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-16 text-center shadow-2xs space-y-4">
        <div className="w-8 h-8 border-3 border-[#0652CC] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-sm font-semibold text-[#091E42]">Loading project workspace…</div>
        <p className="text-xs text-[#6B778C]">Fetching project details and screen metadata.</p>
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-12 text-center shadow-2xs space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#091E42]">Project Not Found</h2>
        <p className="text-xs text-[#6B778C] leading-relaxed">
          {projectError?.message ||
            'The requested modernization project does not exist, has been deleted, or you do not have permission to view it.'}
        </p>
        <div className="pt-2 flex items-center justify-center space-x-3">
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.LIST)}
            className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold px-4 py-2"
          >
            Back to Projects List
          </Button>
          <Button
            variant="secondary"
            onClick={() => refetchProject()}
            className="text-xs px-4 py-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Real screen counts computed from actual project screen records
  const totalScreens = screens.length;
  const convertedScreens = screens.filter((s) => s.status === 'Completed').length;
  const reviewRequired = screens.filter((s) => s.status === 'Review Required').length;
  const failedScreens = screens.filter((s) => s.status === 'Failed').length;
  const firstScreenId = screens[0]?.id;

  // Determine workflow progression
  let currentStep: WorkflowStepId = 'upload';
  const completedSteps: WorkflowStepId[] = [];
  if (totalScreens > 0) {
    completedSteps.push('upload');
    currentStep = 'conversion';
  }
  if (convertedScreens > 0 || reviewRequired > 0) {
    completedSteps.push('analysis');
    currentStep = 'conversion';
  }
  if (reviewRequired > 0) {
    completedSteps.push('conversion');
    currentStep = 'validation';
  }
  if (totalScreens > 0 && convertedScreens === totalScreens) {
    completedSteps.push('conversion', 'validation', 'review', 'result');
    currentStep = 'export';
  }

  const isCobolProject = project.conversionType === 'COBOL_TO_JAVA';

  const workflowModules = isCobolProject
    ? [
        {
          title: '1. Upload COBOL Programs',
          desc: 'Upload COBOL business logic source files (.cbl, .cob) and shared copybooks (.cpy).',
          icon: Upload,
          link: ROUTES.PROJECTS.UPLOAD(project.id),
          btnText: 'Upload Source',
        },
        {
          title: '2. Programs & Logic Workspace',
          desc: 'Inspect parsed COBOL programs, DATA DIVISION structures & PROCEDURE DIVISION paragraphs.',
          icon: Layers,
          link: ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'View Programs',
        },
        {
          title: '3. Method & Class Mapping',
          desc: 'Inspect and customize mappings from legacy paragraphs to Java classes and Spring Boot service methods.',
          icon: FileSearch,
          link: firstScreenId
            ? ROUTES.PROJECTS.METHOD_MAPPING(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Method Mapping',
        },
        {
          title: '4. Logic Modernization Engine',
          desc: 'Run deterministic conversion to synthesize Java 21 REST services, DTOs & repositories.',
          icon: Cpu,
          link: firstScreenId
            ? ROUTES.PROJECTS.CONVERT(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Convert Logic',
        },
        {
          title: '5. Rule-Based Validation',
          desc: 'Inspect datatype mapping (COMP-3 to BigDecimal), arithmetic parity & AI validation findings.',
          icon: ShieldCheck,
          link: firstScreenId
            ? ROUTES.PROJECTS.REVIEW(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Review Findings',
        },
        {
          title: '6. Java Source & Studio',
          desc: 'Inspect synthesized Java 21 Spring Boot service classes, DTOs, and method mapping trace.',
          icon: Code2,
          link: firstScreenId
            ? ROUTES.PROJECTS.RESULT(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Java Studio',
        },
        {
          title: '7. Export Java Package',
          desc: 'Export finalized Java 21 Spring Boot source archive ready for Maven or Gradle build integration.',
          icon: Download,
          link: ROUTES.PROJECTS.EXPORT(project.id),
          btnText: 'Export Java',
        },
        {
          title: '8. Diagnostics & Execution Logs',
          desc: 'Inspect copybook dependency resolution, parse errors, and execution traces.',
          icon: Activity,
          link: ROUTES.PROJECTS.DIAGNOSTICS(project.id),
          btnText: 'View Diagnostics',
        },
      ]
    : [
        {
          title: '1. Upload Legacy Files',
          desc: 'Upload IBM 3270 BMS map files or AS/400 DSPF display source maps.',
          icon: Upload,
          link: ROUTES.PROJECTS.UPLOAD(project.id),
          btnText: 'Upload Source',
        },
        {
          title: '2. Screens & Workspace',
          desc: 'Inspect detected legacy screens, metadata, field definitions & status.',
          icon: Layers,
          link: ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'View Screens',
        },
        {
          title: '3. Automated Field Mapping',
          desc: 'Inspect screen field structure and automated field name mappings.',
          icon: FileSearch,
          link: firstScreenId
            ? ROUTES.PROJECTS.MAPPING(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Inspect Mapping',
        },
        {
          title: '4. Algorithm Conversion',
          desc: 'Run deterministic conversion engine to produce modern React components.',
          icon: Cpu,
          link: firstScreenId
            ? ROUTES.PROJECTS.CONVERT(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Convert Engine',
        },
        {
          title: '5. Rule-Based Validation',
          desc: 'Review automated rule diagnostics & optional AI-assisted validation findings.',
          icon: ShieldCheck,
          link: firstScreenId
            ? ROUTES.PROJECTS.REVIEW(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Review Findings',
        },
        {
          title: '6. Preview & Result Studio',
          desc: 'Side-by-side comparison of original legacy screen vs modernized output.',
          icon: Eye,
          link: firstScreenId
            ? ROUTES.PROJECTS.RESULT(project.id, firstScreenId)
            : ROUTES.PROJECTS.SCREENS(project.id),
          btnText: 'Result Studio',
        },
        {
          title: '7. Export Code Bundle',
          desc: 'Export finalized React code components and modern project bundle.',
          icon: Download,
          link: ROUTES.PROJECTS.EXPORT(project.id),
          btnText: 'Export Code',
        },
        {
          title: '8. Diagnostics & Logs',
          desc: 'Inspect conversion jobs, AST parse traces, and migration diagnostics.',
          icon: Activity,
          link: ROUTES.PROJECTS.DIAGNOSTICS(project.id),
          btnText: 'View Diagnostics',
        },
      ];

  return (
    <div className="space-y-6">
      {/* Central Project Workspace Header */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-2.5 py-0.5 rounded-full">
                Modernization Project
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#091E42] tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-[#42526E] max-w-2xl">{project.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#42526E] pt-1">
              <span className="font-mono bg-[#F7F9FC] px-2 py-0.5 rounded-lg border border-[#D9E2EC]">
                Legacy: <strong className="text-[#091E42]">{LEGACY_TYPE_LABEL[project.conversionType]}</strong>
              </span>
              <span>&rarr;</span>
              <span className="font-mono bg-[#E8F1FF] px-2 py-0.5 rounded-lg border border-[#0652CC]/20">
                Target: <strong className="text-[#0652CC]">{TARGET_FRAMEWORK_LABEL[project.conversionType]}</strong>
              </span>
              <span className="inline-flex items-center space-x-1 text-[#6B778C]">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated: <strong className="text-[#091E42]">{new Date(project.updatedAt).toLocaleDateString()}</strong></span>
              </span>
              <span className="inline-flex items-center space-x-1 text-[#6B778C]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created: <strong className="text-[#091E42]">{new Date(project.createdAt).toLocaleDateString()}</strong></span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.UPLOAD(project.id))}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold space-x-1.5 shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Source</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.SCREENS(project.id))}
              className="text-xs font-semibold space-x-1"
            >
              <Layers className="w-4 h-4" />
              <span>{isCobolProject ? 'Programs' : 'Screens'}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 border border-[#D9E2EC] text-slate-500 hover:text-[#0652CC] hover:bg-[#E8F1FF] hover:border-[#0652CC] transition-colors rounded-xl"
              title="Edit Project"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 border border-[#D9E2EC] text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors rounded-xl"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Metrics - Clickable Interactive Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E5EAF0]">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(project.id))}
            className="bg-[#F7F9FC] border border-[#D9E2EC] hover:border-[#0652CC] p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title="Click to view all screens"
          >
            <div className="text-xs font-semibold text-[#6B778C]">{isCobolProject ? 'Total Programs' : 'Total Screens'}</div>
            <div className="text-xl font-extrabold text-[#091E42] mt-0.5">
              {isScreensLoading ? '…' : totalScreens}
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(project.id))}
            className="bg-emerald-50 border border-emerald-200 hover:border-emerald-500 p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title="Click to view converted screens"
          >
            <div className="text-xs font-bold text-emerald-700">Converted</div>
            <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
              {isScreensLoading ? '…' : convertedScreens}
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(project.id))}
            className="bg-amber-50 border border-amber-200 hover:border-amber-500 p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title="Click to view screens requiring review"
          >
            <div className="text-xs font-bold text-amber-700">Review Required</div>
            <div className="text-xl font-extrabold text-amber-800 mt-0.5">
              {isScreensLoading ? '…' : reviewRequired}
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.DIAGNOSTICS(project.id))}
            className="bg-rose-50 border border-rose-200 hover:border-rose-400 p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title="Click to view diagnostics and error logs"
          >
            <div className="text-xs font-bold text-rose-700">Failed / Errors</div>
            <div className="text-xl font-extrabold text-rose-800 mt-0.5">
              {isScreensLoading ? '…' : failedScreens}
            </div>
          </button>
        </div>
      </div>

      {/* Report 3 Canonical Tabs: Screens (or Programs) | Usage | Settings */}
      <div className="flex border-b border-[#D9E2EC] space-x-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('SCREENS')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'SCREENS'
              ? 'border-[#0652CC] text-[#0652CC] font-bold'
              : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isCobolProject ? 'Programs' : 'Screens'}</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600">
            {totalScreens}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('USAGE')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'USAGE'
              ? 'border-[#0652CC] text-[#0652CC] font-bold'
              : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Usage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'SETTINGS'
              ? 'border-[#0652CC] text-[#0652CC] font-bold'
              : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {activeTab === 'SCREENS' && (
        <div className="space-y-6">
          {/* Modernization Workflow Progress Bar */}
          <ModernizationWorkflow
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(stepId) => {
              if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(project.id));
              if (stepId === 'analysis' || stepId === 'analyze') navigate(ROUTES.PROJECTS.SCREENS(project.id));
              if (stepId === 'mapping') {
                navigate(firstScreenId ? (isCobolProject ? ROUTES.PROJECTS.METHOD_MAPPING(project.id, firstScreenId) : ROUTES.PROJECTS.MAPPING(project.id, firstScreenId)) : ROUTES.PROJECTS.SCREENS(project.id));
              }
              if (stepId === 'conversion' || stepId === 'convert') {
                navigate(firstScreenId ? ROUTES.PROJECTS.CONVERT(project.id, firstScreenId) : ROUTES.PROJECTS.SCREENS(project.id));
              }
              if (stepId === 'validation' || stepId === 'review' || stepId === 'validate') {
                navigate(firstScreenId ? ROUTES.PROJECTS.REVIEW(project.id, firstScreenId) : ROUTES.PROJECTS.SCREENS(project.id));
              }
              if (stepId === 'result') {
                navigate(firstScreenId ? ROUTES.PROJECTS.RESULT(project.id, firstScreenId) : ROUTES.PROJECTS.SCREENS(project.id));
              }
              if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(project.id));
            }}
            onActionClick={() => navigate(ROUTES.PROJECTS.UPLOAD(project.id))}
            actionLabel="Open Workspace"
          />

          {/* Modernization Golden Path Grid */}
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#091E42]">Modernization Golden Path</h2>
              <p className="text-xs text-[#6B778C]">Step-by-step legacy conversion modules in this workspace</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflowModules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.title}
                    className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-4 flex flex-col justify-between hover:border-[#0652CC]/40 transition-all space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-[#091E42]">{m.title}</h3>
                      <p className="text-xs text-[#42526E] leading-relaxed">{m.desc}</p>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => navigate(m.link)}
                      className="w-full text-xs font-semibold justify-between space-x-1 bg-white border border-[#D9E2EC] hover:bg-slate-50"
                    >
                      <span>{m.btnText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'USAGE' && (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#091E42]">Project Resource & Quota Consumption</h2>
            <p className="text-xs text-[#6B778C]">Monitor screens, programs and quota utilization for this project container</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-[#6B778C]">{isCobolProject ? 'Programs Converted' : 'Screens Converted'}</div>
              <div className="text-2xl font-extrabold text-[#0652CC]">
                {convertedScreens} / {totalScreens}
              </div>
              <div className="text-xs text-[#42526E]">
                Completion rate: <strong>{totalScreens > 0 ? Math.round((convertedScreens / totalScreens) * 100) : 0}%</strong>
              </div>
            </div>

            <div className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-[#6B778C]">Conversion Health</div>
              <div className="text-2xl font-extrabold text-emerald-600">
                {failedScreens === 0 ? 'Optimal' : `${failedScreens} Errors`}
              </div>
              <div className="text-xs text-[#42526E]">
                Review required: <strong>{reviewRequired} items</strong>
              </div>
            </div>

            <div className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-[#6B778C]">Enterprise Allocation</div>
              <div className="text-2xl font-extrabold text-[#091E42]">
                Guaranteed
              </div>
              <div className="text-xs text-[#42526E]">
                Under Enterprise MSA SLA
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.BILLING.USAGE)}
              className="text-xs font-semibold space-x-1.5"
            >
              <PieChart className="w-4 h-4 text-[#0652CC]" />
              <span>View Organization Service Quotas</span>
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#091E42]">Project Container Settings</h2>
            <p className="text-xs text-[#6B778C]">Manage project identity, target framework, and container metadata</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] space-y-1">
              <span className="text-[#6B778C] font-semibold">Project Identifier</span>
              <p className="font-mono font-bold text-[#091E42] text-sm">{project.id}</p>
            </div>
            <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] space-y-1">
              <span className="text-[#6B778C] font-semibold">Conversion Architecture</span>
              <p className="font-bold text-[#091E42] text-sm">{LEGACY_TYPE_LABEL[project.conversionType]} &rarr; {TARGET_FRAMEWORK_LABEL[project.conversionType]}</p>
            </div>
            <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] space-y-1">
              <span className="text-[#6B778C] font-semibold">Created Timestamp</span>
              <p className="text-[#091E42]">{new Date(project.createdAt).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] space-y-1">
              <span className="text-[#6B778C] font-semibold">Last Synchronization</span>
              <p className="text-[#091E42]">{new Date(project.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5EAF0]">
            <div>
              <h3 className="text-sm font-bold text-[#091E42]">Modify Project Information</h3>
              <p className="text-xs text-[#6B778C]">Update project display name or business description</p>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold space-x-1.5"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Details</span>
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-rose-100 bg-rose-50/50 p-4 rounded-xl border">
            <div>
              <h3 className="text-sm font-bold text-rose-700">Danger Zone — Delete Container</h3>
              <p className="text-xs text-rose-600">Permanently delete this project container and all converted artifacts.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(true)}
              className="border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </Button>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        project={project}
        onClose={() => setIsEditModalOpen(false)}
        onProjectUpdated={() => {
          refetchProject();
        }}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        projectId={project.id}
        projectName={project.name}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          setIsDeleteModalOpen(false);
          navigate(ROUTES.PROJECTS.LIST);
        }}
      />
    </div>
  );
};

export const ProjectOverviewPage: React.FC = () => {
  return (
    <EnsureQueryClient>
      <ProjectOverviewContent />
    </EnsureQueryClient>
  );
};

export default ProjectOverviewPage;
