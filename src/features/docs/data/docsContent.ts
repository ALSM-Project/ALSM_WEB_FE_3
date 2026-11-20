import type { ComponentType } from 'react';
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
  Server,
  Zap,
  HelpCircle,
  AlertTriangle,
  Lock,
  GitBranch,
  ArrowUpRight,
  Database,
  FileCheck2,
} from 'lucide-react';

export interface TocItem {
  id: string;
  title: string;
  level?: 2 | 3;
}

export const DEFAULT_TOC_ITEMS: TocItem[] = [
  { id: 'introduction', title: '1. Introduction & Overview', level: 2 },
  { id: 'pipeline-overview', title: '2. Modernization Pipeline', level: 2 },
  { id: 'getting-started', title: '3. Getting Started Checklist', level: 2 },
  { id: 'how-it-works', title: '4. Deterministic AST Engine', level: 2 },
  { id: 'bms-dspf', title: '5. BMS / DSPF Screen Mapping', level: 2 },
  { id: 'cobol', title: '6. COBOL Logic Transformation', level: 2 },
  { id: 'react-output', title: '7. React 19 UI Generation', level: 2 },
  { id: 'java-output', title: '8. Java 17 Spring Microservice', level: 2 },
  { id: 'ai-validation', title: '9. Dual-Layer AI Validation', level: 2 },
  { id: 'diagnostics', title: '10. Diagnostics & AST Telemetry', level: 2 },
  { id: 'project-workflow', title: '11. Project Workflow & Upload', level: 2 },
  { id: 'api-reference', title: '12. Enterprise REST API Reference', level: 2 },
  { id: 'faq', title: '13. Frequently Asked Questions', level: 2 },
];

export interface DocSectionItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  summary: string;
}

export interface DocCategory {
  id: string;
  title: string;
  items: DocSectionItem[];
}

export const DOCS_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    title: 'GETTING STARTED',
    items: [
      { id: 'introduction', label: 'Introduction', icon: BookOpen, summary: 'Platform overview, core modernization principles and mission.' },
      { id: 'getting-started', label: 'Getting Started', icon: Workflow, summary: 'Step-by-step onboarding and first project creation.' },
      { id: 'system-requirements', label: 'System Requirements', icon: Server, summary: 'Supported environments, input format specifications and hardware specs.' },
      { id: 'quick-start', label: 'Quick Start', icon: Zap, badge: '5 min', summary: 'Rapid 5-minute migration walkthrough with sample files.' },
    ],
  },
  {
    id: 'platform-overview',
    title: 'PLATFORM OVERVIEW',
    items: [
      { id: 'how-it-works', label: 'How ALSM Works', icon: Cpu, summary: 'Deterministic AST-based parsing versus heuristic rewrite engines.' },
      { id: 'architecture', label: 'Architecture', icon: Layers, summary: 'Multi-stage AST transformation pipeline and code emission layers.' },
      { id: 'modernization-pipeline', label: 'Modernization Pipeline', icon: GitBranch, badge: 'Workflow', summary: 'The 6-stage end-to-end modernization lifecycle.' },
      { id: 'supported-technologies', label: 'Supported Technologies', icon: Database, summary: 'Comprehensive compatibility matrix for legacy & target stacks.' },
    ],
  },
  {
    id: 'modernization-guides',
    title: 'MODERNIZATION GUIDES',
    items: [
      { id: 'bms-dspf', label: 'BMS / DSPF Screens', icon: Layers, summary: 'Parsing 3270 / 5250 coordinates, attribute bytes, and field macros.' },
      { id: 'cobol', label: 'COBOL Business Logic', icon: Terminal, summary: 'DATA DIVISION to Java records and PROCEDURE DIVISION mapping.' },
      { id: 'react-output', label: 'React 19 Output', icon: Code2, summary: 'Component architecture, Tailwind styling, and responsive layout generation.' },
      { id: 'java-output', label: 'Java 17 Spring Boot', icon: FileCode, summary: 'Modern REST controllers, Spring Service beans, and domain model generation.' },
    ],
  },
  {
    id: 'validation',
    title: 'VALIDATION & VERIFICATION',
    items: [
      { id: 'ai-validation', label: 'AI Validation', icon: Sparkles, badge: 'AI Assistant', summary: 'Dual-layer validation: deterministic rule checker + LLM review assistant.' },
      { id: 'diagnostics', label: 'Diagnostics & Telemetry', icon: Cpu, summary: 'Resolving coordinate collisions, syntax anomalies and unmapped fields.' },
      { id: 'review-workflow', label: 'Review Workflow', icon: ShieldCheck, summary: 'Approval gateways, supervisor sign-offs, and AST comparison diffs.' },
    ],
  },
  {
    id: 'project-workflow',
    title: 'PROJECT WORKFLOW',
    items: [
      { id: 'projects', label: 'Project Management', icon: BookOpen, summary: 'Managing enterprise modernization workspaces and access control.' },
      { id: 'upload', label: 'Source Code Upload', icon: Workflow, summary: 'Archive bundling (.zip, .tar.gz), character encoding and pre-flight checks.' },
      { id: 'conversion-process', label: 'Conversion Process', icon: Cpu, summary: 'Running deterministic AST translation jobs and monitoring progress.' },
      { id: 'export-downloads', label: 'Export & Downloads', icon: FileCheck2, summary: 'Downloading production-ready Maven/Vite zip bundles.' },
    ],
  },
  {
    id: 'developer-reference',
    title: 'DEVELOPER REFERENCE',
    items: [
      { id: 'api-reference', label: 'API Reference', icon: Terminal, badge: 'REST', summary: 'Complete REST endpoint specifications for enterprise integration.' },
      { id: 'authentication', label: 'Authentication & RBAC', icon: Lock, summary: 'Bearer JWT authentication, token rotation, and permission scopes.' },
      { id: 'data-models', label: 'Data Models & Schemas', icon: Database, summary: 'TypeScript interfaces and JSON schemas for AST entities.' },
      { id: 'error-handling', label: 'Error Handling', icon: AlertTriangle, summary: 'HTTP status codes, standard error payloads, and recovery procedures.' },
      { id: 'integration-guide', label: 'CI/CD Integration', icon: ArrowUpRight, summary: 'Automating legacy migrations via webhook notifications and CLI.' },
    ],
  },
  {
    id: 'support',
    title: 'SUPPORT & FAQS',
    items: [
      { id: 'faq', label: 'Frequently Asked Questions', icon: HelpCircle, summary: 'Answers to common licensing, security, and migration questions.' },
      { id: 'troubleshooting', label: 'Troubleshooting Guide', icon: AlertTriangle, summary: 'Common migration pitfalls and resolution protocols.' },
      { id: 'contact-support', label: 'Enterprise Support', icon: ShieldCheck, summary: 'Enterprise SLA tiers, dedicated architects, and support channels.' },
    ],
  },
];

export interface PipelineStage {
  step: string;
  name: string;
  shortDesc: string;
  details: string;
  tech: string;
  targetId: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: '01',
    name: 'Upload',
    shortDesc: 'Source ingestion',
    details: 'Ingest raw IBM CICS BMS maps, AS/400 DSPF display files, and COBOL programs with automatic encoding detection (EBCDIC / UTF-8).',
    tech: 'BMS, DSPF, CBL',
    targetId: 'upload',
  },
  {
    step: '02',
    name: 'Analyze',
    shortDesc: 'AST parsing',
    details: 'Deep lexical analysis and Abstract Syntax Tree (AST) construction. Extracts 24x80 screen coordinates, color attributes, and data structures.',
    tech: 'ANTLR4 / Lexer',
    targetId: 'how-it-works',
  },
  {
    step: '03',
    name: 'Mapping',
    shortDesc: 'Field & logic map',
    details: 'Deterministic mapping of mainframe fields to modern web form controls. Maps COBOL copybooks to typed schema properties.',
    tech: 'Schema Engine',
    targetId: 'bms-dspf',
  },
  {
    step: '04',
    name: 'Convert',
    shortDesc: 'Code generation',
    details: 'Emits modular, type-safe React 19 UI components with Tailwind CSS alongside enterprise Java 17 Spring Boot 3.3 microservices.',
    tech: 'React 19 + Java 17',
    targetId: 'react-output',
  },
  {
    step: '05',
    name: 'Validate',
    shortDesc: 'Quality review',
    details: 'Multi-layer verification: 100% deterministic rule validation combined with optional AI review assistant to guarantee parity.',
    tech: 'Rule Engine + AI',
    targetId: 'ai-validation',
  },
  {
    step: '06',
    name: 'Export',
    shortDesc: 'Production bundle',
    details: 'Packages complete production-ready source code repository with Vite build configs, Maven pom.xml, and automated test suites.',
    tech: 'Zip / Git Repo',
    targetId: 'export-downloads',
  },
];

export interface ApiEndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  title: string;
  description: string;
  authRequired: boolean;
  permission: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: string;
  responseBody: string;
}

export const SAMPLE_API_SPECS: ApiEndpointSpec[] = [
  {
    method: 'POST',
    endpoint: '/api/v1/conversions/run',
    title: 'Trigger Automated AST Conversion',
    description: 'Executes deterministic AST transformation for a specified project. Generates React 19 and Java 17 artifacts.',
    authRequired: true,
    permission: 'conversions.execute',
    parameters: [
      { name: 'projectId', type: 'string', required: true, description: 'Unique hex identifier of the enterprise project.' },
      { name: 'targetFramework', type: 'string', required: false, description: 'Target UI framework: "REACT_19" | "VUE_3". Default: "REACT_19".' },
      { name: 'javaVersion', type: 'string', required: false, description: 'Backend runtime version: "JAVA_17" | "JAVA_17". Default: "JAVA_17".' },
    ],
    requestBody: `{
  "projectId": "6ad999ed1287fa0337709c7",
  "pipeline": "BMS_DSPF_TO_FRONTEND",
  "options": {
    "emitTypeScript": true,
    "styling": "TAILWIND_V3",
    "includeValidationTests": true
  }
}`,
    responseBody: `{
  "statusCode": 200,
  "jobId": "job-conv-98831",
  "status": "PROCESSING",
  "screensDetected": 42,
  "programsDetected": 16,
  "estimatedDurationSeconds": 14,
  "createdAt": "2026-11-05T08:30:00.000Z"
}`,
  },
  {
    method: 'GET',
    endpoint: '/api/v1/projects/:id/export',
    title: 'Download Modernized Project Bundle',
    description: 'Generates and downloads a signed ZIP bundle containing modernized React 19 source, Java 17 microservice, and Dockerfile.',
    authRequired: true,
    permission: 'projects.export',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Project ID in hex format.' },
      { name: 'format', type: 'string', required: false, description: 'Export format: "zip" | "tar.gz". Default: "zip".' },
    ],
    responseBody: `Binary stream: application/zip
Content-Disposition: attachment; filename="ALSM-Modernized-CoreBanking.zip"
Content-Length: 14859230 bytes`,
  },
];

export const CODE_SNIPPETS = {
  bms: `* ==================================================================
* IBM CICS BMS Screen Definition Sample (ACCTMAP.bms)
* 24x80 Character Display Matrix with Color & Highlight Attributes
* ==================================================================
ACCTMAP  DFHMSD TYPE=&SYSPARM,MODE=INOUT,LANG=COBOL,CTRL=FREEKB,   X
               STORAGE=AUTO,TIOAPFX=YES
ACCTMAP  DFHMDI SIZE=(24,80),LINE=1,COLUMN=1
HDRTXT   DFHMDF POS=(1,24),ATTRB=(ASKIP,NORM),HILIGHT=UNDERLINE,    X
               INITIAL='CORE BANKING ACCOUNT MANAGEMENT'
TITLE2   DFHMDF POS=(2,30),ATTRB=(ASKIP,BRT),COLOR=BLUE,             X
               INITIAL='CUSTOMER INQUIRY & UPDATE'
ACCTNO   DFHMDF POS=(4,10),ATTRB=(ASKIP,NORM),INITIAL='ACCOUNT NO:'
ACCTINP  DFHMDF POS=(4,25),ATTRB=(UNPROT,NUM),LENGTH=10,HILIGHT=REVERSE
NAME     DFHMDF POS=(6,10),ATTRB=(ASKIP,NORM),INITIAL='CUSTOMER NAME:'
NAMEINP  DFHMDF POS=(6,25),ATTRB=(UNPROT),LENGTH=35
BALTXT   DFHMDF POS=(8,10),ATTRB=(ASKIP,NORM),INITIAL='CURRENT BALANCE:'
BALINP   DFHMDF POS=(8,25),ATTRB=(ASKIP,BRT),LENGTH=15
MSGFLD   DFHMDF POS=(23,1),ATTRB=(ASKIP,BRT),COLOR=RED,LENGTH=78
         DFHMSD TYPE=FINAL
         END`,

  react: `// ==================================================================
// ALSM Generated React 19 Component (AccountManagementScreen.tsx)
// Modernized from ACCTMAP.bms using Tailwind CSS & Responsive Grid
// ==================================================================
import React, { useState, useTransition } from 'react';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface AccountData {
  accountNumber: string;
  customerName: string;
  balance: string;
  currency: string;
}

export const AccountManagementScreen: React.FC = () => {
  const [accountNumber, setAccountNumber] = useState('1004829104');
  const [customerName, setCustomerName] = useState('ACME CORP HOLDINGS LLC');
  const [balance, setBalance] = useState('$1,245,890.50');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Direct REST binding generated by ALSM backend service
      setStatusMessage('Account details verified with core ledger.');
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl shadow-xs">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          CORE BANKING ACCOUNT MANAGEMENT
        </h2>
        <p className="text-xs text-slate-500 mt-1">Customer Inquiry & Update (Modernized from ACCTMAP.bms)</p>
      </div>

      <form onSubmit={handleLookup} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Account Number (10 digits)
          </label>
          <input
            type="text"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Customer Legal Name
          </label>
          <input
            type="text"
            maxLength={35}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-slate-600">Verified Ledger Balance:</span>
          <span className="font-mono text-sm font-bold text-emerald-600">{balance}</span>
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-colors"
          >
            {isPending ? 'Verifying...' : 'Submit Inquiry (Enter)'}
          </button>
        </div>
      </form>
    </div>
  );
};`,

  cobol: `* ==================================================================
* COBOL Business Logic Sample (ACCTPROC.cbl)
* Enterprise COBOL for z/OS - Account Ledger Validation Procedure
* ==================================================================
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTPROC.
       AUTHOR. ALSM-CORE-TEAM.
       DATE-WRITTEN. 1988-04-12.
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-ACCOUNT-RECORD.
           05  WS-ACCOUNT-ID         PIC 9(10).
           05  WS-CUSTOMER-NAME      PIC X(35).
           05  WS-CURRENT-BALANCE    PIC S9(9)V99 COMP-3.
           05  WS-ACCOUNT-STATUS     PIC X(01).
               88  STATUS-ACTIVE     VALUE 'A'.
               88  STATUS-FROZEN     VALUE 'F'.
               88  STATUS-CLOSED     VALUE 'C'.
       
       01  WS-RESPONSE-CODE          PIC S9(4) COMP.
       
       PROCEDURE DIVISION.
       0000-MAIN-PROCESS.
           PERFORM 1000-VALIDATE-ACCOUNT
           PERFORM 2000-APPLY-LEDGER-RULES
           GOBACK.
           
       1000-VALIDATE-ACCOUNT.
           IF WS-ACCOUNT-ID EQUAL ZEROES
               MOVE 'ACCOUNT ID CANNOT BE ZERO' TO WS-ERROR-MSG
               MOVE 400 TO WS-RESPONSE-CODE
           END-IF.
           
       2000-APPLY-LEDGER-RULES.
           IF STATUS-ACTIVE AND WS-CURRENT-BALANCE > 0
               ADD 1 TO WS-ACTIVE-COUNT
           ELSE
               MOVE 'ACCOUNT INACTIVE OR OVERDRAWN' TO WS-ERROR-MSG
           END-IF.`,

  java: `// ==================================================================
// ALSM Generated Java 17 / Spring Boot 3.3 Microservice
// Modernized from ACCTPROC.cbl Procedure Division & Copybooks
// ==================================================================
package com.alsm.modernized.banking.service;

import com.alsm.modernized.banking.dto.AccountValidationRequest;
import com.alsm.modernized.banking.dto.AccountValidationResponse;
import com.alsm.modernized.banking.model.AccountStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class AccountProcessorService {

    private static final Logger log = LoggerFactory.getLogger(AccountProcessorService.class);

    /**
     * Translated from COBOL paragraphs: 1000-VALIDATE-ACCOUNT & 2000-APPLY-LEDGER-RULES.
     * Preserves exact S9(9)V99 COMP-3 decimal arithmetic precision.
     */
    public AccountValidationResponse validateAccount(AccountValidationRequest request) {
        Objects.requireNonNull(request, "Validation request must not be null");

        // 1000-VALIDATE-ACCOUNT logic
        if (request.accountId() == null || request.accountId().trim().isEmpty() || "0000000000".equals(request.accountId())) {
            log.warn("Account validation rejected: Empty or zero ID");
            return AccountValidationResponse.badRequest("ACCOUNT ID CANNOT BE ZERO");
        }

        // 2000-APPLY-LEDGER-RULES logic
        boolean isActive = AccountStatus.ACTIVE.equals(request.status());
        boolean hasPositiveBalance = request.balance() != null && request.balance().compareTo(BigDecimal.ZERO) > 0;

        if (isActive && hasPositiveBalance) {
            log.info("Account {} validated successfully with active ledger balance", request.accountId());
            return AccountValidationResponse.success(request.accountId(), request.balance(), "ACCOUNT ACTIVE");
        } else {
            log.warn("Account {} is either inactive or has insufficient funds", request.accountId());
            return AccountValidationResponse.nonCompliant("ACCOUNT INACTIVE OR OVERDRAWN");
        }
    }
}`,
};
