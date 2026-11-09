import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  FileCode2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import {
  conversionRequestsApi,
  type CreateConversionRequestPayload,
  type ManagedConversionPipeline,
} from '../api/conversion-requests.api';

interface UploadedFileItem {
  fileId: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: 'SOURCE_CODE' | 'SPECIFICATION' | 'DOCUMENTATION' | 'OTHER';
}

export const SubmitConversionRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Step 1: Organization & Contact
  const [contractNumber, setContractNumber] = useState('ALSM-CTR-2026-9A52');
  const [businessRequirements, _setBusinessRequirements] = useState('');
  const [orgName, setOrgName] = useState('Enterprise Partner Workspace');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('Modernization Lead');

  // Step 2: Project Information
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [businessDomain, setBusinessDomain] = useState('Core Banking / Financial Services');
  const [pipeline, setPipeline] = useState<ManagedConversionPipeline>('BMS_DSPF_TO_FRONTEND');
  const [sourceTechnology, setSourceTechnology] = useState('IBM Mainframe BMS / 3270 Maps');
  const [targetArchitecture, setTargetArchitecture] = useState('React 19 + TypeScript + Tailwind CSS');
  const [estimatedScreens, setEstimatedScreens] = useState<number>(25);
  const [estimatedPrograms, setEstimatedPrograms] = useState<number>(10);
  const [complexity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE'>('HIGH');

  // Step 3: Files & Documentation
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Step 4: Service Requirements
  const [specialInstructions, setSpecialInstructions] = useState(
    'Please maintain strict field navigation order and keyboard shortcuts matching the original 3270 terminal screens.'
  );
  const [expectedDeliverables, setExpectedDeliverables] = useState(
    '1. Complete React 19 source package with unit tests\n2. Component mapping documentation\n3. OpenAPI / REST integration contracts'
  );
  const [preferredTimelineWeeks, setPreferredTimelineWeeks] = useState<number>(4);

  // Step 5: Terms
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  // Handle local simulated file additions
  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: 'SOURCE_CODE' | 'DOCUMENTATION') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const selectedFiles = Array.from(e.target.files);

    setTimeout(() => {
      const newItems: UploadedFileItem[] = selectedFiles.map((f, i) => ({
        fileId: `file-${Date.now()}-${i}`,
        originalName: f.name,
        fileSize: f.size,
        mimeType: f.type || 'application/octet-stream',
        category,
      }));
      setFiles((prev) => [...prev, ...newItems]);
      setIsUploading(false);
      e.target.value = '';
    }, 600);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!contactName.trim() || !contactEmail.trim()) {
        setErrorMsg('Please provide your contact name and email address.');
        return false;
      }
    }
    if (step === 2) {
      if (!projectName.trim()) {
        setErrorMsg('Please enter a project name.');
        return false;
      }
      if (estimatedScreens <= 0) {
        setErrorMsg('Estimated screen count must be at least 1.');
        return false;
      }
    }
    if (step === 3) {
      if (files.length === 0) {
        setErrorMsg('Please upload at least one legacy source archive or screen definition file.');
        return false;
      }
    }
    if (step === 5) {
      if (!acceptedTerms) {
        setErrorMsg('You must accept the Enterprise Service Terms before submitting.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload: CreateConversionRequestPayload = {
        projectName: projectName.trim(),
        projectDescription: projectDescription.trim(),
        businessDomain,
        contractNumber: contractNumber.trim(),
        businessRequirements: businessRequirements.trim() || specialInstructions,
        pipeline,
        sourceTechnology,
        targetArchitecture,
        scope: {
          estimatedScreens,
          estimatedPrograms,
          complexity,
        },
        contact: {
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          role: contactRole.trim(),
        },
        specialInstructions,
        expectedDeliverables,
        preferredTimelineWeeks,
        files: files.map((f) => ({
          fileId: f.fileId,
          originalName: f.originalName,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          category: f.category,
        })),
      };

      const result = await conversionRequestsApi.submit(payload);
      setSubmittedRequestId(result.id || result.requestNumber);
    } catch (err: any) {
      console.error('Failed to submit conversion request:', err);
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to submit conversion request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (submittedRequestId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Managed Modernization Services Request Submitted
            </span>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Request Received Successfully!
            </h1>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Your conversion request for <strong>{projectName}</strong> has been transmitted to the ALSM Enterprise Modernization Platform Admin.
            </p>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-2 text-left max-w-md mx-auto">
            <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
              <span className="text-[#64748B]">Status:</span>
              <span className="font-bold text-amber-700">SUBMITTED (Awaiting Review)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
              <span className="text-[#64748B]">Estimated Scope:</span>
              <span className="font-semibold text-[#0F172A]">{estimatedScreens} screens &bull; {estimatedPrograms} programs</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#64748B]">Source Files:</span>
              <span className="font-semibold text-[#0F172A]">{files.length} archives uploaded</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 text-left">
            <p className="font-semibold mb-1">What happens next?</p>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              1. ALSM Platform Admin will inspect the source code and scope.<br />
              2. Once verified, Admin creates the managed Project and assigns a dedicated Team Lead.<br />
              3. You can track progress and receive final deliverables right here in your Partner Portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => navigate('/conversion-requests')}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              View My Requests
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Stepper Header ─────────────────────────────────────────────────────────
  const steps = [
    { num: 1, title: 'Organization' },
    { num: 2, title: 'Project Scope' },
    { num: 3, title: 'Files & Code' },
    { num: 4, title: 'Requirements' },
    { num: 5, title: 'Review & Submit' },
  ];

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/service-catalog')}
            className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Service Catalog
          </button>
          <h1 className="text-xl font-bold text-[#0F172A]">
            Submit Conversion Request (Managed Modernization Services)
          </h1>
          <p className="text-xs text-[#64748B]">
            Provide legacy system source files and scope specifications for full-lifecycle managed modernization.
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
          Step {currentStep} of 5
        </span>
      </div>

      {/* ── Stepper Indicator ──────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <React.Fragment key={st.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#2563EB] text-white ring-4 ring-[#EFF6FF]'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.num}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-medium hidden sm:block ${
                      isCurrent ? 'text-[#0F172A] font-bold' : 'text-[#64748B]'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > st.num ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-500 font-bold">&times;</button>
        </div>
      )}

      {/* ── Step Content Form Container ────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8 shadow-2xs space-y-6">
        {/* STEP 1: ORGANIZATION & CONTACT */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#0F172A]">Organization & Key Contact</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Designate the enterprise contact person for technical alignment and review notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Enterprise Organization
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Master Contract Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ALSM-CTR-2026-9A52"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Contact Role / Title
                </label>
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="e.g. Lead Architect, IT Director"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Primary Contact Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+84 901 234 567"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PROJECT INFORMATION */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#0F172A]">Project Definition & Scope</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Define the modernization pipeline, legacy origin, and estimated complexity.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Core Banking Loan Servicing System"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Provide background context on the legacy system and modernization drivers..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Conversion Pipeline <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={pipeline}
                    onChange={(e) => setPipeline(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="BMS_DSPF_TO_FRONTEND">IBM BMS / DSPF to React 19 + Tailwind CSS</option>
                    <option value="COBOL_TO_JAVA">Micro Focus / IBM COBOL to Java 21 Spring Boot</option>
                    <option value="RPG_TO_FRONTEND">AS/400 RPG / DDS to Modern Web</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Business Domain
                  </label>
                  <input
                    type="text"
                    value={businessDomain}
                    onChange={(e) => setBusinessDomain(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Source Technology
                  </label>
                  <input
                    type="text"
                    value={sourceTechnology}
                    onChange={(e) => setSourceTechnology(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Target Architecture
                  </label>
                  <input
                    type="text"
                    value={targetArchitecture}
                    onChange={(e) => setTargetArchitecture(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Estimated Screen Count <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedScreens}
                    onChange={(e) => setEstimatedScreens(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Estimated Programs / Copybooks
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedPrograms}
                    onChange={(e) => setEstimatedPrograms(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SOURCE CODE & DOCUMENTS */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#0F172A]">Upload Source Files & Specifications</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Upload legacy maps, copybooks, or architecture documentation. Supports .zip, .tar, .bms, .cbl, .pdf.
              </p>
            </div>

            {/* Dropzone Box */}
            <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-xl p-6 text-center bg-[#F8FAFC] transition-colors">
              <Upload className="w-8 h-8 text-[#2563EB] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0F172A]">
                Drag and drop files here, or choose category below:
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Maximum bundle size: 250 MB. Encrypted in transit and at rest.
              </p>

              <div className="flex items-center justify-center gap-3 mt-4">
                <label className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg cursor-pointer transition-colors">
                  <span>Upload Source Code Archive</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleSimulateFileUpload(e, 'SOURCE_CODE')}
                  />
                </label>

                <label className="px-3.5 py-1.5 text-xs font-medium text-[#475569] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded-lg cursor-pointer transition-colors">
                  <span>Attach Documentation</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleSimulateFileUpload(e, 'DOCUMENTATION')}
                  />
                </label>
              </div>

              {isUploading && (
                <p className="text-xs text-[#2563EB] font-semibold mt-3 animate-pulse">
                  Uploading and inspecting archive files...
                </p>
              )}
            </div>

            {/* Uploaded Files Table */}
            <div>
              <h3 className="text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
                Attached Files ({files.length})
              </h3>
              {files.length === 0 ? (
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-center text-xs text-[#64748B]">
                  No files uploaded yet. Please attach at least one source file.
                </div>
              ) : (
                <div className="border border-[#E2E8F0] rounded-lg overflow-hidden divide-y divide-[#E2E8F0] bg-white">
                  {files.map((file) => (
                    <div key={file.fileId} className="p-3 flex items-center justify-between text-xs hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCode2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-[#0F172A] truncate">{file.originalName}</p>
                          <p className="text-[10px] text-[#64748B]">
                            {(file.fileSize / 1024).toFixed(1)} KB &bull; Category: {file.category}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.fileId)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: SERVICE REQUIREMENTS */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#0F172A]">Service Requirements & Timeline</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Specify custom architectural patterns, naming conventions, or target completion dates.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Special Instructions & Technical Constraints
                </label>
                <textarea
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Expected Deliverables
                </label>
                <textarea
                  rows={3}
                  value={expectedDeliverables}
                  onChange={(e) => setExpectedDeliverables(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Preferred Modernization Timeline (Weeks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={preferredTimelineWeeks}
                  onChange={(e) => setPreferredTimelineWeeks(Number(e.target.value))}
                  className="w-48 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#0F172A]">Review & Submit Conversion Request</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Please verify all request details before submitting to the ALSM Enterprise Team.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <span className="font-bold text-[#0F172A] block uppercase text-[11px] text-[#64748B]">Project Scope</span>
                <div><span className="text-[#64748B]">Project Name:</span> <strong className="text-[#0F172A]">{projectName}</strong></div>
                <div><span className="text-[#64748B]">Pipeline:</span> <strong className="text-[#0F172A]">{pipeline}</strong></div>
                <div><span className="text-[#64748B]">Scope:</span> <strong className="text-[#0F172A]">{estimatedScreens} Screens &bull; {estimatedPrograms} Programs</strong></div>
                <div><span className="text-[#64748B]">Complexity:</span> <strong className="text-[#0F172A]">{complexity}</strong></div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <span className="font-bold text-[#0F172A] block uppercase text-[11px] text-[#64748B]">Contact & Timeline</span>
                <div><span className="text-[#64748B]">Contact:</span> <strong className="text-[#0F172A]">{contactName} ({contactRole})</strong></div>
                <div><span className="text-[#64748B]">Email:</span> <strong className="text-[#0F172A]">{contactEmail}</strong></div>
                <div><span className="text-[#64748B]">Phone:</span> <strong className="text-[#0F172A]">{contactPhone || '—'}</strong></div>
                <div><span className="text-[#64748B]">Target Timeline:</span> <strong className="text-[#0F172A]">{preferredTimelineWeeks} Weeks</strong></div>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
              <span className="font-bold text-[#0F172A] block uppercase text-[11px] text-[#64748B]">Attached Files ({files.length})</span>
              <p className="text-[#475569]">
                {files.map((f) => f.originalName).join(', ')}
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#2563EB] focus:ring-0"
                />
                <span className="text-xs text-[#0F172A] leading-relaxed">
                  I confirm that the legacy source files provided belong to our organization and authorize the ALSM Enterprise Team to inspect and modernize these assets under the Enterprise Modernization Agreement.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ── Action Buttons Footer ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-[#475569] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Transmitting Request...' : 'Submit Conversion Request'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitConversionRequestPage;
