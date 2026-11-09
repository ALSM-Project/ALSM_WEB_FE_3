import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  FileCode2,
  Server,
  Layers,
  HelpCircle,
  FileText,
  Clock,
  Award,
} from 'lucide-react';
import { billingService } from '@/features/billing/services/billing.service';

export const ServiceCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sub = await billingService.getCurrentSubscription();
        setSubscription(sub);
      } catch {
        // default fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const planName = subscription?.planTier || subscription?.tier || subscription?.plan || 'Enterprise Evaluation';

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                Enterprise Modernization Services
              </span>
              <span className="text-xs text-[#64748B]">Active Tier: <strong className="text-[#0F172A]">{loading ? '...' : planName}</strong></span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mt-2">
              ALSM Service Catalog
            </h1>
            <p className="text-xs text-[#64748B] mt-1 max-w-3xl">
              Choose the modernization model that fits your organization: run conversions autonomously with developer-grade Platform-Based Modernization tools, or engage ALSM Modernization Engineers for guaranteed turnkey Managed Modernization Services.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/workspace/docs')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#475569] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#64748B]" />
              Architecture Docs
            </button>
            <button
              type="button"
              onClick={() => navigate('/workspace/contact')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#475569] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#64748B]" />
              Support Center
            </button>
          </div>
        </div>
      </div>

      {/* ── Service Comparison Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ── SERVICE A: PLATFORM-BASED MODERNIZATION ───────────────────────── */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#BFDBFE] transition-all flex flex-col justify-between overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            {/* Header Badge & Title */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  <Zap className="w-3.5 h-3.5" />
                  SERVICE A &bull; PLATFORM-BASED MODERNIZATION
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Instant Activation
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Platform-Based Modernization Workspace
              </h2>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Autonomous developer modernization platform. Upload legacy screen definitions and codebases, configure custom field/method mappings, inspect real-time preview studio, and export production-ready frontend bundles on your own schedule.
              </p>
            </div>

            {/* Key Pipeline Capabilities */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Supported Conversion Pipelines
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <FileCode2 className="w-4 h-4 text-[#2563EB]" />
                    <span>IBM BMS / DSPF</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Convert 3270 / 5250 maps to React 19 + Tailwind components.
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <Server className="w-4 h-4 text-[#2563EB]" />
                    <span>COBOL to Java 21</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Translate batch data divisions to Spring Boot DTOs and entities.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Included Platform Capabilities
              </h3>
              <ul className="space-y-2 text-xs text-[#475569]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Autonomous Project Pipeline:</strong> Upload &rarr; Analyze &rarr; Convert &rarr; Validate &rarr; Export without external delays.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Visual Mapping Studio:</strong> Direct interactive adjustment of field coordinates, colors, labels, and validation regexes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Automated Quality Review:</strong> Built-in structural rule verification and error log diagnostics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Admin Interference:</strong> Project files and code are strictly isolated inside your organization boundary.</span>
                </li>
              </ul>
            </div>

            {/* Entitlement & Rules Notice */}
            <div className="p-3.5 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-lg text-xs space-y-1 text-[#1E40AF]">
              <span className="font-semibold block">Organization Entitlement:</span>
              <p className="text-[11px] text-[#1E3A8A] leading-relaxed">
                Operated entirely by your organization members. Does not require ALSM staff allocation or scheduling. Available immediately under your active workspace capacity.
              </p>
            </div>
          </div>

          {/* Action CTA */}
          <div className="p-6 bg-[#F8FAFC] border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => navigate('/projects/new?serviceType=SELF_SERVICE')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>Create Platform-Based Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── SERVICE B: MANAGED MODERNIZATION SERVICES ──────────────────────── */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#DDD6FE] transition-all flex flex-col justify-between overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            {/* Header Badge & Title */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  SERVICE B &bull; MANAGED CONVERSION
                </span>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  Turnkey SLA Guaranteed
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Managed Modernization Services (Turnkey)
              </h2>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Full-service modernization executed by ALSM's dedicated enterprise modernization engineers and architects. We handle complex legacy codebases, perform manual gap remediation, ensure 100% functional equivalence, and hand over production deliverables.
              </p>
            </div>

            {/* Managed Scope Highlights */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Full-Lifecycle Service Scope
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Dedicated Team Lead</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Assigned technical lead coordinates architecture, QA, and milestones.
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Committed Delivery SLA</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Agreed timeline, verified milestone gates, and contract guarantees.
                  </p>
                </div>
              </div>
            </div>

            {/* Service Process Checklist */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Service Process & Handover
              </h3>
              <ul className="space-y-2 text-xs text-[#475569]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Structured Intake Wizard:</strong> Submit project scope, legacy source archives, and special instructions online.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>ALSM Review & Acceptance:</strong> Platform Admin inspects scope, confirms timeline, and creates managed project.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Public Milestone Tracking:</strong> Track conversion progress in real-time on your Partner Portal dashboard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Verified Deliverables Download:</strong> Access finalized, tested code packages and documentation in Downloads.</span>
                </li>
              </ul>
            </div>

            {/* Security & Isolation Notice */}
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-lg text-xs space-y-1 text-purple-900">
              <span className="font-semibold block">Enterprise Governance:</span>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                ALSM Web 3 displays public milestones and deliverables only. Internal staff notes, workloads, and other tenant source code remain strictly confidential and protected.
              </p>
            </div>
          </div>

          {/* Action CTA */}
          <div className="p-6 bg-[#F8FAFC] border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => navigate('/conversion-requests/new')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-purple-700 bg-white border border-purple-300 hover:bg-purple-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 text-purple-600" />
              <span>Submit Conversion Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Workflow Comparison Visualizer ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <span>Modernization Workflow Comparison</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Self Service Flow */}
          <div className="space-y-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <span className="text-xs font-bold text-[#2563EB] block">Platform-Based Project Lifecycle</span>
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-semibold text-[#475569] py-1">
              <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md shrink-0">1. Upload</span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md shrink-0">2. Analyze</span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md shrink-0">3. Convert</span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md shrink-0">4. Validate</span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-2.5 py-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] rounded-md shrink-0">5. Export</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Customer controls all stages directly inside their workspace.</p>
          </div>

          {/* Managed Flow */}
          <div className="space-y-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <span className="text-xs font-bold text-purple-700 block">Managed Modernization Services Lifecycle</span>
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-semibold text-[#475569] py-1">
              <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md shrink-0">1. Submit Request</span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md shrink-0">2. Review & Accept</span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md shrink-0">3. ALSM Execution</span>
              <span className="text-[#94A3B8]">&rarr;</span>
              <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-md shrink-0">4. Deliverables</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Admin & Team Lead assign conversion staff; results synced to partner.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ServiceCatalogPage;
