import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PageContainer, Button } from '@/shared/ui';
import { contractsApi } from '../api/contracts.api';
import type {
  ServiceMode,
  ContractType,
  CustomerDetails,
  ServiceScope,
  ContractClause,
  ContractMilestone,
} from '../api/contracts.api';

const STEPS = [
  { id: 1, title: 'Select Customer', subtitle: 'Organization & Legal Entity' },
  { id: 2, title: 'Contract Type', subtitle: 'Platform-Based vs Managed Modernization SOW' },
  { id: 3, title: 'Configure Services', subtitle: 'Screen Capacity & Quotas' },
  { id: 4, title: 'Commercial Terms', subtitle: 'Pricing & Milestone Billing' },
  { id: 5, title: 'Legal Clauses', subtitle: 'IP, Warranty & SLA Terms' },
  { id: 6, title: 'Generate Draft', subtitle: 'Live Document Verification' },
];

export const CreateContractWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available data from backend
  const [orgList, setOrgList] = useState<any[]>([]);
  const [leadList, setLeadList] = useState<any[]>([]);
  const [templateList, setTemplateList] = useState<any[]>([]);
  const [clauseLibrary, setClauseLibrary] = useState<ContractClause[]>([]);

  // Step 1: Customer Form
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [customer, setCustomer] = useState<CustomerDetails>({
    companyName: 'Fintech Nexus Ltd.',
    taxId: '0108849201',
    businessAddress: 'Keangnam Landmark 72, Pham Hung, Nam Tu Liem, Hanoi, Vietnam',
    representativeName: 'Marcus Vance',
    representativeTitle: 'Managing Director / Legal Representative',
    contactEmail: 'partner@fintechnexus.io',
    contactPhone: '+84 24 3982 7710',
    powerOfAttorneyRef: 'POA-2026-FN-01',
  });

  // Step 2: Contract Type
  const [title, setTitle] = useState<string>('Platform-Based Modernization Subscription Agreement');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('SELF_SERVICE');
  const [contractType, setContractType] = useState<ContractType>('SELF_SERVICE_SUBSCRIPTION');
  const [planTier, setPlanTier] = useState<string>('Enterprise Core Modernization');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );

  // Step 3: Scope
  const [scope, setScope] = useState<ServiceScope>({
    screensQuota: 1000,
    programsQuota: 500,
    storageGb: 50,
    targetTechnology: 'React 19 + TypeScript + Spring Boot 3 Java',
    sourceCodeType: 'IBM BMS / AS400 DSPF & COBOL Logic',
    supportTier: 'Dedicated Enterprise SLA (2h response)',
    slaCommitment: '99.9% Uptime with Deterministic AST Validation',
    deliverables: [
      'Synthesized React 19 UI component repository with Tailwind styles',
      'Spring Boot 3 Java DTO contracts and JPA entities',
      'AST semantic equivalence & rule verification dossier',
      'Deployment architecture blueprint and migration runbook',
    ],
  });

  // Step 4: Commercial Terms
  const [subtotal, setSubtotal] = useState<number>(750000000); // 750M VND
  const [currency, setCurrency] = useState<string>('VND');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(10);
  const [paymentStructure, setPaymentStructure] = useState<'ONE_TIME' | 'MILESTONE_BASED' | 'MONTHLY_SUBSCRIPTION'>('MILESTONE_BASED');
  const [bankAccountInfo, setBankAccountInfo] = useState<string>(
    'Vietcombank — Account: 1029384756 (ALSM Technology Solutions JSC)',
  );

  // Computed Commercials
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = Math.round((afterDiscount * vatRate) / 100);
  const finalTotal = afterDiscount + vatAmount;

  // Step 5: Clauses & Milestones
  const [selectedClauses, setSelectedClauses] = useState<ContractClause[]>([]);
  const [milestones, setMilestones] = useState<ContractMilestone[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [custRes, tmplRes] = await Promise.all([
          contractsApi.getSelectableCustomers(),
          contractsApi.getTemplatesAndClauses(),
        ]);
        setOrgList(custRes.organizations || []);
        setLeadList(custRes.leads || []);
        setTemplateList(tmplRes.templates || []);
        const normalizedClauses = (tmplRes.clauses || []).map((c: any) => ({
          ...c,
          title: c.titleEn || c.title,
          description: c.descriptionEn || c.description,
        }));
        setClauseLibrary(normalizedClauses);
        setSelectedClauses(normalizedClauses);

        if (custRes.organizations && custRes.organizations.length > 0) {
          const first = custRes.organizations[0];
          setSelectedOrgId(first.id);
          setCustomer((prev) => ({
            ...prev,
            companyName: first.name,
            taxId: first.taxId,
            businessAddress: first.businessAddress,
            representativeName: first.representativeName,
            representativeTitle: first.representativeTitle,
            contactEmail: first.contactEmail,
          }));
        }

        // Initialize default milestones
        setMilestones([
          {
            title: 'Milestone 1: Legacy Extraction & Architecture Blueprint',
            description: 'Complete analysis of legacy BMS maps, copybooks, and batch dependencies.',
            targetDate: effectiveDate,
            paymentPercentage: 30,
            deliverables: ['Legacy Architecture Assessment', 'Component inventory matrix', 'Target schema specifications'],
            status: 'PENDING',
          },
          {
            title: 'Milestone 2: Deterministic AST Conversion & Validation',
            description: 'Automated synthesis of React 19 UI components and Spring Boot 3 microservices.',
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            paymentPercentage: 40,
            deliverables: ['Synthesized frontend bundles', 'Spring Boot backend microservices', 'AST compliance report'],
            status: 'PENDING',
          },
          {
            title: 'Milestone 3: Final Acceptance & Production Handover',
            description: 'User acceptance testing, gap remediation, and certified production deliverables handover.',
            targetDate: endDate,
            paymentPercentage: 30,
            deliverables: ['Production deployment bundle', 'Certified sign-off dossier', '30-day warranty coverage'],
            status: 'PENDING',
          },
        ]);
      } catch (err) {
        console.error('Failed to load initial wizard data:', err);
      }
    })();
  }, []);

  const handleSelectExistingOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
    const found = orgList.find((o) => o.id === orgId);
    if (found) {
      setCustomer((prev) => ({
        ...prev,
        companyName: found.name,
        taxId: found.taxId,
        businessAddress: found.businessAddress,
        representativeName: found.representativeName,
        representativeTitle: found.representativeTitle,
        contactEmail: found.contactEmail,
      }));
    }
  };

  const handleCreateDraft = async (submitForReviewDirectly: boolean = false) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const created = await contractsApi.createContract({
        title,
        serviceMode,
        contractType,
        organizationId: selectedOrgId || '',
        leadId: selectedLeadId || undefined,
        planTier,
        effectiveDate,
        endDate,
        customer,
        scope,
        commercialTerms: {
          totalValue: subtotal,
          currency,
          discountPercent,
          vatRate,
          paymentStructure,
          bankAccountInfo,
        },
        clauses: selectedClauses,
        milestones,
      });

      if (submitForReviewDirectly) {
        await contractsApi.submitForReview(created.id);
      }

      navigate(`/billing/contracts/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create contract draft:', err);
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to create contract draft');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer variant="full">
      {/* ── Breadcrumb & Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <button
            type="button"
            onClick={() => navigate('/billing/contracts')}
            className="hover:text-[#0F172A] inline-flex items-center gap-1 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Contracts</span>
          </button>
          <span>/</span>
          <span className="text-[#0F172A] font-bold">New Contract Wizard</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Step {currentStep} of 6</span>
        </div>
      </div>

      {/* ── Step Progress Indicator ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div
                key={s.id}
                onClick={() => isCompleted && setCurrentStep(s.id)}
                className={`flex items-start gap-2.5 p-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                    : isCompleted
                    ? 'cursor-pointer hover:bg-[#F8FAFC]'
                    : 'opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCurrent
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isCurrent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                    {s.title}
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate">{s.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* ── Step Content Panes ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 lg:p-8 shadow-2xs space-y-6">
        {/* ── STEP 1: SELECT CUSTOMER ────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 1: Select Customer & Corporate Legal Entity</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pick an existing customer organization or convert a verified CRM lead. Corporate registration and signatory credentials will be bound to the contract.
              </p>
            </div>

            {/* Existing Customer Quick Selector */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
              <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
                Quick Select Existing Enterprise Organization:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {orgList.slice(0, 6).map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelectExistingOrg(org.id)}
                    className={`p-3 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                      selectedOrgId === org.id
                        ? 'bg-white border-[#2563EB] ring-2 ring-[#2563EB]/15 shadow-xs'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <p className="font-bold text-[#0F172A] truncate">{org.name}</p>
                    <p className="text-[11px] text-[#64748B]">Tax ID: {org.taxId}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{org.contactEmail}</p>
                  </button>
                ))}
              </div>

              {leadList && leadList.length > 0 && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block mb-2">
                    Or Select Converted CRM Lead:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {leadList.slice(0, 6).map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setCustomer((prev) => ({
                            ...prev,
                            companyName: lead.companyName,
                            contactEmail: lead.contactEmail,
                            representativeName: lead.contactName,
                          }));
                        }}
                        className={`p-3 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                          selectedLeadId === lead.id
                            ? 'bg-white border-[#2563EB] ring-2 ring-[#2563EB]/15 shadow-xs'
                            : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <p className="font-bold text-[#0F172A] truncate">{lead.companyName}</p>
                        <p className="text-[11px] text-[#64748B]">Rep: {lead.contactName}</p>
                        <p className="text-[11px] text-[#2563EB] font-mono">Stage: {lead.stage}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Corporate Entity Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Company / Entity Legal Name *</label>
                <input
                  type="text"
                  value={customer.companyName}
                  onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Tax ID / Business Registration Code *</label>
                <input
                  type="text"
                  value={customer.taxId}
                  onChange={(e) => setCustomer({ ...customer, taxId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Registered Business Address *</label>
                <input
                  type="text"
                  value={customer.businessAddress}
                  onChange={(e) => setCustomer({ ...customer, businessAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Legal Representative Full Name *</label>
                <input
                  type="text"
                  value={customer.representativeName}
                  onChange={(e) => setCustomer({ ...customer, representativeName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Signatory Title / Position *</label>
                <input
                  type="text"
                  value={customer.representativeTitle}
                  onChange={(e) => setCustomer({ ...customer, representativeTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Official Contract Notice Email *</label>
                <input
                  type="email"
                  value={customer.contactEmail}
                  onChange={(e) => setCustomer({ ...customer, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Power of Attorney / Authorization Ref</label>
                <input
                  type="text"
                  value={customer.powerOfAttorneyRef}
                  onChange={(e) => setCustomer({ ...customer, powerOfAttorneyRef: e.target.value })}
                  placeholder="e.g. POA-2026-081"
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: SELECT CONTRACT TYPE ───────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 2: Select Service Mode & Contract Type</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                ALSM provides 2 distinct operating models. Select the appropriate commercial agreement structure.
              </p>
            </div>

            {/* Service Mode Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => {
                  setServiceMode('SELF_SERVICE');
                  setContractType('SELF_SERVICE_SUBSCRIPTION');
                  setTitle('Platform-Based Modernization Subscription Agreement');
                }}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  serviceMode === 'SELF_SERVICE'
                    ? 'bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    <Zap className="w-3.5 h-3.5" /> Option 1
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Platform-Based Modernization</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Client developers autonomously upload legacy code, execute AST synthesis, review real-time visual mapping, and download exports.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E2E8F0] mt-4 text-[11px] font-semibold text-[#2563EB]">
                  Instant workspace quota activation upon signing &rarr;
                </div>
              </div>

              <div
                onClick={() => {
                  setServiceMode('WE_CONVERT_FOR_YOU');
                  setContractType('MANAGED_CONVERSION_SOW');
                  setTitle('Statement of Work (SOW) — Managed Turnkey Legacy Conversion');
                }}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  serviceMode === 'WE_CONVERT_FOR_YOU'
                    ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <Building2 className="w-3.5 h-3.5" /> Option 2
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Managed Modernization Services</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    ALSM Modernization Engineers execute full-cycle analysis, code synthesis, manual gap remediation, and certified delivery.
                  </p>
                </div>
                <div className="pt-4 border-t border-purple-100 mt-4 text-[11px] font-semibold text-purple-700">
                  Turnkey SLA guarantee with milestone sign-off &rarr;
                </div>
              </div>
            </div>

            {/* Contract Title & Term Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E2E8F0]">
              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Contract Legal Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Service Tier</label>
                <select
                  value={planTier}
                  onChange={(e) => setPlanTier(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none"
                >
                  <option value="Enterprise Core Modernization">Enterprise Core Modernization</option>
                  <option value="Tier-1 Mission Critical Banking">Tier-1 Mission Critical Banking</option>
                  <option value="Government & High Assurance">Government & High Assurance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Effective Start Date *</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Contract End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none font-mono"
                />
              </div>
            </div>

            {templateList && templateList.length > 0 && (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-2">
                <span className="font-bold text-[#0F172A] block uppercase text-[11px] tracking-wider">
                  Available Legal-Approved Framework Templates:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {templateList.map((tmpl) => (
                    <div key={tmpl.id} className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-1">
                      <p className="font-bold text-[#0F172A]">{tmpl.title}</p>
                      <p className="text-[11px] text-[#64748B]">{tmpl.jurisdiction} • {tmpl.version}</p>
                      <p className="text-[11px] text-[#475569]">{tmpl.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: CONFIGURE SERVICES & SCOPE ─────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 3: Configure Modernization Capacity & Quotas</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Set quantitative screen transformation capacities, storage allocations, technology targets, and SLA commitments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                  Screen Capacity Quota *
                </label>
                <input
                  type="number"
                  value={scope.screensQuota}
                  onChange={(e) => setScope({ ...scope, screensQuota: parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-2xl font-extrabold text-[#0F172A] bg-transparent border-b border-[#CBD5E1] pb-1 focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-[11px] text-[#64748B]">BMS / DSPF terminal screens permitted</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                  Program Logic Quota *
                </label>
                <input
                  type="number"
                  value={scope.programsQuota}
                  onChange={(e) => setScope({ ...scope, programsQuota: parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-2xl font-extrabold text-[#0F172A] bg-transparent border-b border-[#CBD5E1] pb-1 focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-[11px] text-[#64748B]">COBOL batch modules & copybooks</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                  Encrypted Storage (GB) *
                </label>
                <input
                  type="number"
                  value={scope.storageGb}
                  onChange={(e) => setScope({ ...scope, storageGb: parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-2xl font-extrabold text-[#0F172A] bg-transparent border-b border-[#CBD5E1] pb-1 focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-[11px] text-[#64748B]">Air-gapped artifact storage</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Target Modernization Stack *</label>
                <input
                  type="text"
                  value={scope.targetTechnology}
                  onChange={(e) => setScope({ ...scope, targetTechnology: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Legacy Source Format *</label>
                <input
                  type="text"
                  value={scope.sourceCodeType}
                  onChange={(e) => setScope({ ...scope, sourceCodeType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">Enterprise Support SLA Tier</label>
                <input
                  type="text"
                  value={scope.supportTier}
                  onChange={(e) => setScope({ ...scope, supportTier: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1">SLA Uptime Commitment</label>
                <input
                  type="text"
                  value={scope.slaCommitment}
                  onChange={(e) => setScope({ ...scope, slaCommitment: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: COMMERCIAL TERMS & PRICING ─────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 4: Configure Commercial Terms & Payment Schedule</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Calculate total contract value, apply negotiated discounts, incorporate VAT, and configure payment milestone triggers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: Form Inputs */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1">Subtotal Value (pre-tax) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={subtotal}
                        onChange={(e) => setSubtotal(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white"
                    >
                      <option value="VND">Vietnamese Dong (VND)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1">Discount Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1">VAT Rate (%)</label>
                    <input
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1">Payment Structure</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'MILESTONE_BASED', label: 'Milestone-Based (30-40-30)' },
                        { id: 'ONE_TIME', label: '100% Upfront' },
                        { id: 'MONTHLY_SUBSCRIPTION', label: 'Annual Installments' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPaymentStructure(item.id as any)}
                          className={`p-2.5 rounded-lg border text-xs font-semibold text-center cursor-pointer ${
                            paymentStructure === item.id
                              ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                              : 'bg-white border-[#E2E8F0] text-[#64748B]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1">ALSM Designated Bank Account *</label>
                    <input
                      type="text"
                      value={bankAccountInfo}
                      onChange={(e) => setBankAccountInfo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Right Col: Live Financial Summary Box */}
              <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                    Commercial Breakdown
                  </h3>
                  <div className="space-y-2 text-xs divide-y divide-[#E2E8F0]">
                    <div className="flex justify-between py-1.5 text-[#64748B]">
                      <span>Contract Subtotal:</span>
                      <span className="font-mono font-bold text-[#0F172A]">{subtotal.toLocaleString('vi-VN')} {currency}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between py-1.5 text-emerald-700">
                        <span>Discount ({discountPercent}%):</span>
                        <span className="font-mono font-bold">- {discountAmount.toLocaleString('vi-VN')} {currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 text-[#64748B]">
                      <span>VAT ({vatRate}%):</span>
                      <span className="font-mono font-bold text-[#0F172A]">+ {vatAmount.toLocaleString('vi-VN')} {currency}</span>
                    </div>
                    <div className="flex justify-between pt-3 text-sm">
                      <strong className="text-[#0F172A]">Total Binding Value:</strong>
                      <strong className="font-mono text-base text-[#2563EB]">
                        {finalTotal.toLocaleString('vi-VN')} {currency}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 space-y-1">
                  <span className="font-bold block">Vietnamese Enterprise Commercial Standard:</span>
                  <p>Invoices issued via electronic VAT billing (e-Invoice Decree 123/2020/ND-CP) synchronized with payment stages.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: CONFIGURE LEGAL TERMS ─────────────────────────────────── */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 5: Configure Legal Terms & Compliance Clauses</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Review and select pre-approved legal clauses conforming to Vietnamese Intellectual Property and Cyber Security law.
              </p>
            </div>

            <div className="space-y-3">
              {clauseLibrary.map((clause, idx) => {
                const clauseTitle = clause.titleEn || clause.title;
                const clauseDesc = clause.descriptionEn || clause.description;
                return (
                  <div
                    key={idx}
                    className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {clauseTitle}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                        {clause.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      {clauseDesc}
                    </p>
                    {clause.legalReference && (
                      <p className="text-[11px] text-[#2563EB] font-medium">
                        Legal Basis: {clause.legalReference}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 6: GENERATE DRAFT & FINAL REVIEW ─────────────────────────── */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 6: Review & Generate Contract Draft</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Verify the rendered legal instrument. You can save as a draft or submit directly for Internal & Legal Review.
              </p>
            </div>

            {/* Document Preview Box */}
            <div className="border border-[#CBD5E1] rounded-xl p-8 bg-white shadow-xs w-full max-w-5xl mx-auto space-y-6 text-[#0F172A]">
              <div className="text-center space-y-1 border-b border-[#E2E8F0] pb-4">
                <p className="font-bold text-xs uppercase tracking-widest text-[#64748B]">SOCIALIST REPUBLIC OF VIETNAM</p>
                <p className="text-xs text-[#64748B]">Independence - Freedom - Happiness</p>
                <h3 className="text-base font-extrabold uppercase mt-3 text-[#0F172A]">{title}</h3>
                <p className="font-mono text-xs text-[#2563EB] font-bold">Generated Proposal ID: ALSM-CTR-2026-DRAFT</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8FAFC] p-4 rounded-lg">
                <div>
                  <strong className="block text-[#64748B] uppercase tracking-wider text-[10px]">ALSM Provider:</strong>
                  <p className="font-bold">ALSM Technology Solutions JSC</p>
                  <p className="text-[11px]">Tax ID: 0109876543</p>
                </div>
                <div>
                  <strong className="block text-[#64748B] uppercase tracking-wider text-[10px]">Client Organization:</strong>
                  <p className="font-bold">{customer.companyName}</p>
                  <p className="text-[11px]">Tax ID: {customer.taxId}</p>
                  <p className="text-[11px]">Rep: {customer.representativeName} ({customer.representativeTitle})</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <strong className="text-[#0F172A] block uppercase text-[11px] tracking-wider">Agreed Modernization Scope:</strong>
                <ul className="list-disc list-inside space-y-1 text-[#475569] text-xs">
                  <li>Screen Modernization Capacity: <strong>{scope.screensQuota} screens</strong></li>
                  <li>Target Technology Framework: <strong>{scope.targetTechnology}</strong></li>
                  <li>Total Contract Value: <strong>{finalTotal.toLocaleString('vi-VN')} {currency}</strong> (inclusive of 10% VAT)</li>
                  <li>Effective Period: <strong>{effectiveDate} to {endDate}</strong></li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                <span className="font-bold block">Status: Legal Review Required</span>
                <p className="text-[11px]">
                  Upon draft creation, this agreement will be routed to Legal Counsel and Management Approvers before electronic dispatch to the customer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom Navigation Controls ─────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-6 border-t border-[#E2E8F0]">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="text-xs h-9 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Previous Step
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {currentStep < 6 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 cursor-pointer"
              >
                <span>Continue to {STEPS[currentStep].title}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleCreateDraft(false)}
                  disabled={submitting}
                  className="text-xs h-9 cursor-pointer"
                >
                  Save as Editable Draft
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleCreateDraft(true)}
                  disabled={submitting}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Creating Draft...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Generate Draft & Submit for Review
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default CreateContractWizardPage;
