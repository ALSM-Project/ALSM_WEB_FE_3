import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Eye,
  Download,
  PenTool,
  RefreshCw,
  Zap,
  Building2,
  ShieldCheck,
  Ban,
  Calendar,
} from 'lucide-react';
import { PageContainer, StatCard, Button, Modal } from '@/shared/ui';
import { contractsApi } from '../api/contracts.api';
import type { EnterpriseContract, ContractDashboardStats } from '../api/contracts.api';

export const ContractsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ContractDashboardStats | null>(null);
  const [contracts, setContracts] = useState<EnterpriseContract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quick Action Modal states
  const [quickSignContract, setQuickSignContract] = useState<EnterpriseContract | null>(null);
  const signerRole = 'CUSTOMER';
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('');
  const [signerEmail, setSignerEmail] = useState<string>('');
  const [isSigningSubmitting, setIsSigningSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, listData] = await Promise.all([
        contractsApi.getDashboardStats(),
        contractsApi.listContracts({
          tab: activeTab === 'ALL' ? undefined : activeTab,
          serviceMode: serviceFilter === 'ALL' ? undefined : serviceFilter,
          search: searchTerm || undefined,
        }),
      ]);
      setStats(statsData);
      setContracts(listData.items || []);
    } catch (err) {
      console.error('Failed to load contract dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, serviceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleQuickSignSubmit = async () => {
    if (!quickSignContract) return;
    try {
      setIsSigningSubmitting(true);
      await contractsApi.signContract(quickSignContract.id, {
        signerRole,
        signerName,
        signerTitle,
        signerEmail,
      });
      setActionSuccess(`Contract ${quickSignContract.contractNumber} signed successfully with VNPT eContract assurance.`);
      setQuickSignContract(null);
      await loadData();
    } catch (err: any) {
      alert(`Signing error: ${err?.message || 'Failed to sign contract'}`);
    } finally {
      setIsSigningSubmitting(false);
    }
  };

  const formatCurrency = (val: number, cur: string = 'VND') => {
    if (cur === 'USD') return `$${val.toLocaleString('en-US')}`;
    return `${val.toLocaleString('vi-VN')} VND`;
  };

  const getStatusBadge = (status: string, lifecycle?: string) => {
    const eff = (lifecycle || status || '').toUpperCase();
    if (['ACTIVE', 'COMPLETED'].includes(eff)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
        </span>
      );
    }
    if (['READY_FOR_SIGNATURE', 'SENT_TO_CUSTOMER', 'ALSM_SIGNED', 'CUSTOMER_VIEWED'].includes(eff)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <PenTool className="w-3 h-3 text-blue-600" /> Awaiting Signature
        </span>
      );
    }
    if (['INTERNAL_REVIEW', 'PENDING'].includes(eff)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> Under Review
        </span>
      );
    }
    if (['DRAFT', 'CHANGES_REQUESTED'].includes(eff)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      );
    }
    if (['TERMINATED', 'CANCELLED', 'REJECTED'].includes(eff)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <Ban className="w-3 h-3 text-rose-600" /> Terminated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  const getServiceModeBadge = (mode: string) => {
    switch (mode) {
      case 'SELF_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <Zap className="w-3 h-3" /> Platform-Based Modernization
          </span>
        );
      case 'WE_CONVERT_FOR_YOU':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Building2 className="w-3 h-3" /> Managed Modernization Services
          </span>
        );
      case 'SELF_SERVICE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Zap className="w-3 h-3" /> Platform-Based Modernization
          </span>
        );
    }
  };

  return (
    <PageContainer variant="full">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>

          <h1 className="text-2xl font-bold text-[#0F172A] mt-2 tracking-tight">
            Enterprise Contract Management
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] mt-1">
            Legally Binding Electronic Contracts & Service Agreements
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/billing/contracts/new')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Contract
          </Button>
        </div>
      </div>

      {/* ── Success Alert ────────────────────────────────────────────────────── */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── KPI Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <StatCard
          label="Total Contracts"
          value={stats?.total ?? 0}
          icon={FileText}
          iconColor="text-[#2563EB]"
          iconBg="bg-[#EFF6FF] border-[#BFDBFE]"
        />
        <StatCard
          label="Active & Bound"
          value={stats?.active ?? 0}
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 border-emerald-200"
        />
        <StatCard
          label="Awaiting Signature"
          value={stats?.pendingSignature ?? 0}
          icon={PenTool}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 border-blue-200"
        />
        <StatCard
          label="Under Review"
          value={stats?.underReview ?? 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 border-amber-200"
        />
        <StatCard
          label="Draft Proposals"
          value={stats?.draft ?? 0}
          icon={FileCheck}
          iconColor="text-slate-600"
          iconBg="bg-slate-100 border-slate-200"
        />
        <StatCard
          label="Expiring Soon"
          value={stats?.expiringSoon ?? 0}
          icon={AlertTriangle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 border-rose-200"
        />
      </div>

      {/* ── Tabs, Filters & Search ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E2E8F0]">
          {[
            { id: 'ALL', label: 'All Contracts' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'PENDING_SIGNATURE', label: 'Pending Signature' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { id: 'TERMINATED', label: 'Terminated' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters and Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contract number, title, customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:bg-white transition-all"
            />
          </form>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Filter className="w-3.5 h-3.5" />
              <span>Service:</span>
            </div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="ALL">All Service Modes</option>
              <option value="SELF_SERVICE">Platform-Based Modernization</option>
              <option value="WE_CONVERT_FOR_YOU">Managed Modernization Services</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Enterprise Contracts Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="px-4 py-3">Contract Number</th>
                <th className="px-4 py-3">Customer / Organization</th>
                <th className="px-4 py-3">Service Scope</th>
                <th className="px-4 py-3">Contract Value</th>
                <th className="px-4 py-3">Effective Term</th>
                <th className="px-4 py-3">E-Signing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin" />
                      <span>Loading enterprise contracts...</span>
                    </div>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-[#94A3B8]" />
                      <p className="font-semibold text-[#0F172A]">No contracts found in this view</p>
                      <p className="text-[11px]">Adjust your filter or initialize a new agreement via the Create Contract wizard.</p>
                      <Button
                        variant="primary"
                        onClick={() => navigate('/billing/contracts/new')}
                        className="mt-2 text-xs bg-[#2563EB]"
                      >
                        Create Contract Draft
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#F8FAFC]/80 transition-colors group"
                  >
                    {/* Contract Number */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {c.contractNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 truncate max-w-[220px]" title={c.title}>
                        {c.title}
                      </p>
                    </td>

                    {/* Customer & Organization */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#0F172A]">
                        {c.organizationName || c.customer?.companyName || 'Enterprise Customer'}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate max-w-[180px]">
                        {c.customer?.contactEmail || 'partner@alsm.io'}
                      </p>
                    </td>

                    {/* Service Mode & Quota */}
                    <td className="px-4 py-3.5 space-y-1">
                      <div>{getServiceModeBadge(c.serviceMode)}</div>
                      <p className="text-[11px] text-[#64748B]">
                        Capacity: <strong className="text-[#0F172A]">{c.screensQuota || c.scope?.screensQuota} screens</strong>
                      </p>
                    </td>

                    {/* Total Value */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-[#0F172A]">
                        {formatCurrency(c.totalValue, c.currency)}
                      </span>
                      <p className="text-[10px] text-[#64748B]">
                        VAT 10% included
                      </p>
                    </td>

                    {/* Term / Duration */}
                    <td className="px-4 py-3.5 text-[11px] text-[#475569]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#94A3B8]" />
                        <span>{c.effectiveDate}</span>
                      </div>
                      <span className="text-[#94A3B8]">&darr;</span>
                      <div>{c.endDate}</div>
                    </td>

                    {/* E-Signing Progress */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            c.signingStatus?.alsm ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.signingStatus?.alsm ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          ALSM: {c.signingStatus?.alsm ? 'Signed' : 'Pending'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 ${
                            c.signingStatus?.customer ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.signingStatus?.customer ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          Partner: {c.signingStatus?.customer ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {getStatusBadge(c.status, c.lifecycleStatus)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/billing/contracts/${c.id}`)}
                          className="px-2.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-lg font-semibold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="View complete contract details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <a
                          href={contractsApi.getPdfUrl(c.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors inline-block"
                          title="Preview HTML / Print PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Sign Action: Navigate to full-page formal contract document */}
                        {!c.signingStatus?.customer && c.status !== 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => navigate(`/billing/contracts/${c.id}`)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                            title="Open full contract document to sign electronically"
                          >
                            <PenTool className="w-3 h-3" />
                            <span>Sign Contract</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Electronic Signing Quick Modal ───────────────────────────────────── */}
      {quickSignContract && (
        <Modal
          isOpen={true}
          onClose={() => setQuickSignContract(null)}
          title={`Electronic Contract Signing — ${quickSignContract.contractNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[#1E40AF] space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                Digital Certificate & VNPT eContract Signature Verification
              </span>
              <p className="text-[11px] text-[#1E3A8A]">
                By confirming the digital signature, you as an authorized representative of{' '}
                <strong>{quickSignContract.organizationName}</strong> commit to adhering to the contract terms. An immutable SHA-256 hash and timestamp will be electronically sealed onto the document.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Signer Full Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Full name..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Title / Designation</label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  placeholder="Position (Director, Legal Representative...)"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Email for Signed Contract Copy</label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="email@doanhnghiep.vn"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickSignContract(null)}
                disabled={isSigningSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleQuickSignSubmit}
                disabled={isSigningSubmitting}
                className="bg-[#2563EB]"
              >
                {isSigningSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Sealing Digitally...
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5 mr-1" />
                    Confirm Digital Signature
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};

export default ContractsDashboardPage;
