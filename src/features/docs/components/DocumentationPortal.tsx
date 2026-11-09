import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Workflow,
  Cpu,
  Layers,
  Terminal,
  Code2,
  FileCode,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Menu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import {
  DOCS_CATEGORIES,
  DEFAULT_TOC_ITEMS,
  SAMPLE_API_SPECS,
  CODE_SNIPPETS,
  type DocSectionItem,
} from '../data/docsContent';

import { DocsHeader } from './DocsHeader';
import { DocsSidebar } from './DocsSidebar';
import { DocsTableOfContents } from './DocsTableOfContents';
import { DocsBottomNav } from './DocsBottomNav';
import { DocsSearchModal } from './DocsSearchModal';
import { ModernizationPipelineFlow } from './ModernizationPipelineFlow';
import { ApiReferenceCard } from './ApiReferenceCard';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';

export const DocumentationPortal: React.FC = () => {
  const location = useLocation();
  const [activeSectionId, setActiveSectionId] = useState<string>('introduction');
  const [activeHeadingId, setActiveHeadingId] = useState<string>('introduction');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Flattened list of all topics for next / prev navigation
  const allTopicItems: DocSectionItem[] = DOCS_CATEGORIES.flatMap((c) => c.items);
  const currentTopicIndex = allTopicItems.findIndex((item) => item.id === activeSectionId);
  const previousTopic = currentTopicIndex > 0 ? allTopicItems[currentTopicIndex - 1] : null;
  const nextTopic = currentTopicIndex >= 0 && currentTopicIndex < allTopicItems.length - 1 ? allTopicItems[currentTopicIndex + 1] : null;

  // Active Category Title
  const activeCategory = DOCS_CATEGORIES.find((cat) =>
    cat.items.some((item) => item.id === activeSectionId)
  ) || DOCS_CATEGORIES[0];

  const currentTopic = allTopicItems.find((item) => item.id === activeSectionId) || allTopicItems[0];

  const scrollToElement = (id: string) => {
    setActiveSectionId(id);
    setActiveHeadingId(id);
    setIsMobileSidebarOpen(false);

    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80; // Offset for sticky headers
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for docs search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to URL hash change
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      scrollToElement(hash);
    }
  }, [location.hash]);

  // IntersectionObserver for scroll-spy TOC
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
      return;
    }

    const observedIds = DEFAULT_TOC_ITEMS.map((item) => item.id);
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -65% 0px',
        threshold: 0,
      }
    );

    observedIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Search Modal */}
      <DocsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTopic={scrollToElement}
      />

      <div className="w-full space-y-6 min-w-0">
        {/* Mobile Navigation Trigger Button */}
        <div className="lg:hidden mb-4 flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
          >
            <Menu className="w-4 h-4 text-slate-500" />
            <span>Documentation Navigation</span>
          </button>
          <span className="text-xs font-mono font-semibold text-slate-600">
            {currentTopic.label}
          </span>
        </div>

        {/* Mobile Drawer */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden mb-6 animate-in fade-in-0 duration-150">
            <DocsSidebar
              activeId={activeSectionId}
              onSelectSection={scrollToElement}
            />
          </div>
        )}

        {/* 3-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          {/* Column 1: Left Navigation Sidebar (Desktop 270px) */}
          <DocsSidebar
            activeId={activeSectionId}
            onSelectSection={scrollToElement}
            className="hidden lg:flex"
          />

          {/* Column 2: Constrained Main Content (max-w-[840px]) */}
          <main className="flex-1 w-full min-w-0 space-y-10">
            {/* Documentation Header */}
            <DocsHeader
              categoryTitle={activeCategory.title}
              topicTitle={currentTopic.label}
              onOpenSearch={() => setIsSearchOpen(true)}
            />

            {/* End-to-End Modernization Pipeline Flow */}
            <div id="pipeline-overview">
              <ModernizationPipelineFlow onSelectStage={scrollToElement} />
            </div>

            {/* ─── 1. Introduction Section ─── */}
            <section id="introduction" aria-labelledby="heading-introduction" className="space-y-4 pt-2">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-introduction" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  1. Introduction & Overview
                </h2>
              </div>

              <h3 className="text-base font-bold text-slate-900">What is ALSM?</h3>
              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                <strong className="text-slate-950 font-bold">ALSM (Automated Legacy Screen & Code Modernization)</strong> is an enterprise-grade platform designed to accelerate the digital transformation of mission-critical legacy mainframe and midrange systems. By deterministically parsing legacy IBM CICS BMS screen maps, AS/400 DSPF display files, and COBOL programs, ALSM automatically generates modern React 19 UI components and Java 21 Spring Boot 3.3 microservices.
              </p>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Unlike opaque black-box rewrite tools or uncontrolled LLM hallucinations, ALSM maintains complete developer transparency. Every step of the transformation—from coordinate identification to AST mapping, rule validation, and code emission—provides interactive preview studios, field mapping inspectors, and explicit diagnostic reports.
              </p>

              <Callout type="note" title="Deterministic Code Transformation">
                <p>
                  ALSM guarantees 100% mathematical and layout determinism. The exact same source BMS or COBOL input file will always yield identical TypeScript and Java AST structures across environments, ensuring zero unexpected regressions in production banking and healthcare workloads.
                </p>
              </Callout>
            </section>

            {/* ─── 2. Getting Started Section ─── */}
            <section id="getting-started" aria-labelledby="heading-getting-started" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Workflow className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-getting-started" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  2. Getting Started Checklist
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Follow this sequential 5-step checklist to modernize your first legacy application module:
              </p>

              <ol className="max-w-prose space-y-3 text-xs sm:text-sm text-slate-800 list-decimal pl-5 leading-relaxed">
                <li>
                  <strong className="text-slate-950 font-bold">Create a Modernization Project:</strong> Navigate to the Projects dashboard, click <em>&ldquo;New Project&rdquo;</em>, and specify your project name, target framework (React 19), and backend runtime (Java 21).
                </li>
                <li>
                  <strong className="text-slate-950 font-bold">Upload Source Files:</strong> Ingest your legacy BMS maps (<code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-900 font-mono text-xs font-semibold">.bms</code>), AS/400 display files (<code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-900 font-mono text-xs font-semibold">.dspf</code>), or COBOL programs (<code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-900 font-mono text-xs font-semibold">.cbl</code>, <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-900 font-mono text-xs font-semibold">.cob</code>).
                </li>
                <li>
                  <strong className="text-slate-950 font-bold">Inspect Screen Maps & Coordinates:</strong> Use the interactive Screens inspector to review auto-detected 24x80 coordinates, labels, input fields, and attribute bytes.
                </li>
                <li>
                  <strong className="text-slate-950 font-bold">Execute Deterministic Conversion:</strong> Run the automated conversion pipeline to emit typed React 19 JSX and Spring Boot REST microservices.
                </li>
                <li>
                  <strong className="text-slate-950 font-bold">Validate & Export:</strong> Inspect generated code in the Preview Studio, verify rule test passes, and download the full production zip bundle.
                </li>
              </ol>

              <Callout type="tip" title="Rapid Onboarding Tip">
                <p>
                  You can test the entire pipeline without uploading proprietary files by using our pre-loaded sample datasets in the <em>&ldquo;Quick Start&rdquo;</em> section, including standard Core Banking Inquiry and Patient Admission modules.
                </p>
              </Callout>
            </section>

            {/* ─── 3. How ALSM Works (Deterministic AST Engine) ─── */}
            <section id="how-it-works" aria-labelledby="heading-how-it-works" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Cpu className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-how-it-works" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  3. Deterministic AST Engine
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Traditional legacy migration projects fail because they rely on manual line-by-line rewrites or raw generative AI prompts that produce hallucinated logic. ALSM uses an ANTLR4-powered lexical scanner that translates mainframe source files into a formal Abstract Syntax Tree (AST).
              </p>

              {/* Enterprise Architecture Comparison Table (Generous padding, high contrast) */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white my-5 shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-900 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-5">Architecture Feature</th>
                      <th className="py-3.5 px-5">ALSM Deterministic Engine</th>
                      <th className="py-3.5 px-5">Generic LLM Rewrite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-bold text-slate-900">Coordinate Accuracy</td>
                      <td className="py-3.5 px-5 text-emerald-800 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        100% exact (24x80 grid mapping)
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">Approximated / Inconsistent</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-bold text-slate-900">Financial Math Parity</td>
                      <td className="py-3.5 px-5 text-emerald-800 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Exact COMP-3 to BigDecimal
                      </td>
                      <td className="py-3.5 px-5 text-rose-700 font-medium">Double/Float precision loss</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-bold text-slate-900">Auditability & Diffs</td>
                      <td className="py-3.5 px-5 text-emerald-800 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Formal AST node diff reports
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">Unverifiable black box</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-bold text-slate-900">Execution Speed</td>
                      <td className="py-3.5 px-5 text-emerald-800 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        &lt; 500ms per screen map
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">15-45s per screen</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Callout type="important" title="Financial Precision Guarantee">
                <p>
                  Mainframe financial transactions rely on packed decimal (<code className="font-mono text-xs font-bold">COMP-3</code>) arithmetic. ALSM guarantees that all arithmetic operations in emitted Java code utilize <code className="font-mono text-xs font-bold">java.math.BigDecimal</code> with matching rounding modes, eliminating rounding drift in core banking records.
                </p>
              </Callout>
            </section>

            {/* ─── 4. BMS / DSPF Screen Mapping ─── */}
            <section id="bms-dspf" aria-labelledby="heading-bms-dspf" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Layers className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-bms-dspf" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  4. BMS / DSPF Screen Processing
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                IBM CICS Basic Mapping Support (BMS) and AS/400 Display Files (DSPF) organize green-screen terminal interfaces using 24 rows by 80 columns. ALSM maps legacy macro instructions into modern flexbox and grid layouts.
              </p>

              <CodeBlock code={CODE_SNIPPETS.bms} language="assembly" filename="ACCTMAP.bms (Source Legacy Screen)" />

              <h3 className="text-sm sm:text-base font-bold text-slate-900 pt-2">Screen Attribute Translation Matrix</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs my-4">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-900 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-5">BMS Attribute</th>
                      <th className="py-3.5 px-5">Legacy Behavior</th>
                      <th className="py-3.5 px-5">Modern Web Representation</th>
                      <th className="py-3.5 px-5">Tailwind CSS Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-950">ATTRB=ASKIP</td>
                      <td className="py-3.5 px-5">Auto-skip display label</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">&lt;label&gt; or &lt;span&gt;</td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-700">text-slate-700 select-none</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-950">ATTRB=UNPROT</td>
                      <td className="py-3.5 px-5">Unprotected user input</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">&lt;input type=&quot;text&quot;&gt;</td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-700">border border-slate-300 rounded-lg</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-950">ATTRB=NUM</td>
                      <td className="py-3.5 px-5">Numeric keyboard lock</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">inputMode=&quot;numeric&quot; pattern=&quot;[0-9]*&quot;</td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-700">font-mono</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-950">ATTRB=DRK</td>
                      <td className="py-3.5 px-5">Dark / invisible text</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">&lt;input type=&quot;password&quot;&gt;</td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-700">tracking-widest font-mono</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ─── 5. COBOL Logic Transformation ─── */}
            <section id="cobol" aria-labelledby="heading-cobol" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Terminal className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-cobol" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  5. COBOL Logic Transformation
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                ALSM converts COBOL <code className="font-mono text-xs font-bold">DATA DIVISION</code> records into typed Java DTO records and maps <code className="font-mono text-xs font-bold">PROCEDURE DIVISION</code> paragraphs into clean, testable Spring Boot service methods.
              </p>

              <CodeBlock code={CODE_SNIPPETS.cobol} language="cobol" filename="ACCTPROC.cbl (Source COBOL Logic)" />

              <Callout type="warning" title="Copybook Expansion Dependency">
                <p>
                  Ensure all referenced copybooks (<code className="font-mono text-xs font-bold">COPY &lt;NAME&gt;.</code>) are included in the uploaded archive. If an external copybook is missing, ALSM flags an unresolved symbol diagnostic in the AST verification tab.
                </p>
              </Callout>
            </section>

            {/* ─── 6. React 19 UI Generation ─── */}
            <section id="react-output" aria-labelledby="heading-react-output" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Code2 className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-react-output" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  6. React 19 UI Generation
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Generated UI code utilizes React 19 with strict TypeScript typing, Tailwind CSS utility styling, and keyboard shortcut support mimicking original mainframe function keys (Enter, F3, F12).
              </p>

              <CodeBlock code={CODE_SNIPPETS.react} language="typescript" filename="AccountManagementScreen.tsx (Generated React 19)" />
            </section>

            {/* ─── 7. Java 21 Spring Boot Microservices ─── */}
            <section id="java-output" aria-labelledby="heading-java-output" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <FileCode className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-java-output" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  7. Java 21 Spring Boot Microservices
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Backend services are packaged as modular Spring Boot 3.3 microservices using Java 21 records, immutable domain structures, and standard REST conventions.
              </p>

              <CodeBlock code={CODE_SNIPPETS.java} language="java" filename="AccountProcessorService.java (Generated Java 21)" />
            </section>

            {/* ─── 8. AI Validation & Quality Review ─── */}
            <section id="ai-validation" aria-labelledby="heading-ai-validation" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-ai-validation" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  8. Dual-Layer AI Validation
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                ALSM employs a patent-pending dual-layer validation architecture to certify 100% fidelity before code deployment:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm">Layer 1: Deterministic Rule Engine</h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    Evaluates mathematical precision, syntax conformance, coordinate overlaps, and type signatures against 140+ formal static rules. Pass rate must reach 100%.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm">Layer 2: AI Review Assistant</h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    Reviews modern UI layout ergonomics, WCAG 2.1 AA accessibility contrast, responsive behavior, and idiomatic Spring service patterns.
                  </p>
                </div>
              </div>
            </section>

            {/* ─── 9. Diagnostics & AST Telemetry ─── */}
            <section id="diagnostics" aria-labelledby="heading-diagnostics" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-diagnostics" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  9. Diagnostics & AST Telemetry
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                During conversion, the AST engine checks for coordinate collisions, unresolved macro tokens, or implicit paragraph falls. Any anomaly is flagged with exact line and column numbers.
              </p>

              <Callout type="note" title="Telemetry Logging">
                <p>
                  All transformation events are persisted in the Project Audit Log, allowing enterprise compliance officers to verify source code provenance and transformation timestamps.
                </p>
              </Callout>
            </section>

            {/* ─── 10. Project Workflow & Upload ─── */}
            <section id="project-workflow" aria-labelledby="heading-project-workflow" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Workflow className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-project-workflow" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  10. Project Workflow & Upload
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                ALSM Web 3 supports direct browser drag-and-drop uploading of source files as well as automated batch uploading via the REST API or CI/CD pipelines.
              </p>

              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5 text-xs sm:text-sm shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm">Supported Source File Formats:</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700 list-disc pl-5">
                  <li><strong className="text-slate-900">.bms / .map:</strong> IBM CICS BMS screen definitions</li>
                  <li><strong className="text-slate-900">.dspf:</strong> IBM AS/400 (IBM i) display files</li>
                  <li><strong className="text-slate-900">.cbl / .cob:</strong> Enterprise COBOL programs</li>
                  <li><strong className="text-slate-900">.cpy:</strong> COBOL Working-Storage copybooks</li>
                  <li><strong className="text-slate-900">.zip / .tar.gz:</strong> Structured application archive bundles</li>
                </ul>
              </div>
            </section>

            {/* ─── 11. REST API Reference ─── */}
            <section id="api-reference" aria-labelledby="heading-api-reference" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <Terminal className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-api-reference" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  11. Enterprise REST API Reference
                </h2>
              </div>

              <p className="max-w-prose text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                Integrate ALSM directly into your enterprise Jenkins, GitHub Actions, or GitLab CI/CD pipelines using our secure REST endpoints:
              </p>

              {SAMPLE_API_SPECS.map((spec) => (
                <ApiReferenceCard key={`${spec.method}-${spec.endpoint}`} spec={spec} />
              ))}
            </section>

            {/* ─── 12. Frequently Asked Questions ─── */}
            <section id="faq" aria-labelledby="heading-faq" className="space-y-4 pt-4">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 id="heading-faq" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  12. Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  {
                    q: 'How does ALSM handle proprietary IBM 3270 extended attributes?',
                    a: 'ALSM parses 3270 extended color attributes (Blue, Red, Pink, Green, Turquoise, Yellow, White) and highlighting (Blink, Reverse Video, Underline) into standardized Tailwind CSS utility classes and accessible ARIA attributes.',
                  },
                  {
                    q: 'Are generated microservices bound to proprietary ALSM runtime libraries?',
                    a: 'No. ALSM generates clean, 100% standard open-source React 19 JSX and Java 21 Spring Boot 3.3 source code with zero proprietary runtime lock-in. You own and can deploy the code to any standard cloud infrastructure.',
                  },
                  {
                    q: 'How is data privacy and source code security protected?',
                    a: 'All source code ingested into ALSM is isolated per tenant organization, encrypted at rest using AES-256, and processed in strictly isolated AST memory spaces. Source files are never used to train public AI models.',
                  },
                  {
                    q: 'Can ALSM be integrated into on-premise air-gapped data centers?',
                    a: 'Yes. Enterprise licenses include Docker containers and Helm charts for on-premise Kubernetes deployment without requiring outbound internet connectivity.',
                  },
                ].map((faq, index) => {
                  const isOpen = openFaqIndex === index;

                  return (
                    <div
                      key={faq.q}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-0 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-normal">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bottom Navigation & Helpfulness */}
            <DocsBottomNav
              previousTopic={previousTopic}
              nextTopic={nextTopic}
              onNavigate={scrollToElement}
            />
          </main>

          {/* Column 3: Right On-Page Table of Contents (Desktop 220px) */}
          <DocsTableOfContents
            items={DEFAULT_TOC_ITEMS}
            activeHeadingId={activeHeadingId}
            onSelectHeading={scrollToElement}
          />
        </div>
      </div>
    </div>
  );
};
