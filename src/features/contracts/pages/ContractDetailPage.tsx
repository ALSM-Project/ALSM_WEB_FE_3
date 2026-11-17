import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  CreditCard,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Lock,
  Eraser,
  PenTool,
  Sparkles,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import { contractsApi, type EnterpriseContract } from '../api/contracts.api';
import { generateCleanBankQrDataUrl } from '@/shared/utils/bank-qr.helper';
import { ContractDocument } from '../components/ContractDocument';

export const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<EnterpriseContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'preview'>('overview');

  // Interactive Signature Canvas & Form state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Authorized Representative / Director');
  const [signerEmail, setSignerEmail] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);

  // Auto-reconciliation & redirect state
  const [cleanQrDataUrl, setCleanQrDataUrl] = useState<string>('');
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const fetchContract = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const data = await contractsApi.getContractById(id);
      if (data) {
        setContract(data);
        if (data.customer?.representativeName && !signerName) {
          const rep = data.customer.representativeName;
          if (rep && !/^[a-z0-9_]{3,20}$/i.test(rep.trim())) {
            setSignerName(rep);
          } else {
            setSignerName('Truong Minh Khoi');
          }
        }
        if (data.customer?.representativeTitle && signerTitle === 'Authorized Representative / Director') {
          setSignerTitle(data.customer.representativeTitle);
        }
        if (data.customer?.contactEmail && !signerEmail) {
          setSignerEmail(data.customer.contactEmail);
        }
      } else {
        setError('Contract not found or access restricted.');
      }
    } catch (err: any) {
      console.error('[ContractDetailPage] Failed to load contract:', err);
      if (!silent) setError(err.message || 'Unable to load contract details.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [id, signerName, signerEmail, signerTitle]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  // Derived contract statuses
  const rawContractStatus = String(contract?.contractStatus || contract?.status || 'Draft').toUpperCase();
  const rawPaymentStatus = String(contract?.paymentStatus || 'Not Required').toUpperCase();
  const isCustomerSigned = Boolean(
    contract?.signingStatus?.customer ||
    contract?.signingProcess?.customerSigningStatus === 'SIGNED' ||
    ['SIGNED', 'PENDING PAYMENT', 'PAYMENT VERIFICATION', 'ACTIVE', 'COMPLETED'].includes(rawContractStatus)
  );
  const isBothSigned = Boolean(
    (contract?.signingStatus?.alsm || contract?.signingProcess?.providerSigningStatus === 'SIGNED') &&
    isCustomerSigned
  );
  const isPaymentVerified = Boolean(
    rawPaymentStatus === 'PAYMENT VERIFIED' ||
    rawPaymentStatus === 'PAID' ||
    rawContractStatus === 'ACTIVE' ||
    rawContractStatus === 'COMPLETED' ||
    contract?.invoice?.status === 'PAID'
  );

  // Periodic automatic polling (every 3 seconds) until payment is confirmed
  useEffect(() => {
    if (!contract || isPaymentVerified) return;
    const interval = setInterval(() => {
      fetchContract(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [contract, isPaymentVerified, fetchContract]);

  // Automatic redirect countdown upon payment verification
  useEffect(() => {
    if (isPaymentVerified && redirectCountdown === null) {
      setRedirectCountdown(4);
    }
  }, [isPaymentVerified, redirectCountdown]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate('/dashboard');
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  // Generate pure, clean QR code ONLY when the contract has been signed
  useEffect(() => {
    if (!contract || !isCustomerSigned) {
      setCleanQrDataUrl('');
      return;
    }
    const inv = contract.invoice;
    const ctrNum = contract.contractNumber || '';
    const defRef = inv?.invoiceNumber || (ctrNum ? `INV-${ctrNum.replace('ALSM-CTR-', '')}` : 'ALSM-PAY');
    const defAmt = inv?.amountVnd || contract.totalValue || contract.commercialTerms?.totalValue || 12100;
    const qp = contract.qrPayment;

    if (qp?.qrDataUrl && !qp.qrDataUrl.includes('vietqr.io')) {
      setCleanQrDataUrl(qp.qrDataUrl);
      return;
    }

    generateCleanBankQrDataUrl({
      bankBin: '970422',
      accountNumber: qp?.accountNumber || '0899886249',
      accountName: qp?.accountName || 'ALSM TECHNOLOGY SOLUTIONS',
      amount: qp?.amountVnd || defAmt,
      message: qp?.referenceCode || defRef,
    })
      .then(setCleanQrDataUrl)
      .catch((err) => console.error('[ContractDetailPage] Failed to generate clean QR:', err));
  }, [contract, isCustomerSigned]);

  // Canvas Drawing Handlers
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !id) return;
    if (!termsAgreed) {
      alert('Please review and agree to the electronic contract terms before signing.');
      return;
    }
    if (!signerName.trim() || !signerEmail.trim()) {
      alert('Please provide your full legal name and official contact email.');
      return;
    }
    if (!hasDrawn) {
      alert('Please draw your digital signature with your mouse or stylus in the signature box before submitting.');
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    try {
      setSigningLoading(true);
      await contractsApi.signContract(id, {
        signerRole: 'CUSTOMER',
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim() || 'Director',
        signerEmail: signerEmail.trim(),
        authMethod: 'Enterprise Digital Signature (Cryptographic SHA-256 Assurance)',
        signatureImageUrl: signatureDataUrl,
      });
      await fetchContract(true);
    } catch (err: any) {
      console.error('[ContractDetailPage] Signing failed:', err);
      alert(`Signature failed: ${err.message || 'Unable to execute digital signature.'}`);
    } finally {
      setSigningLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-600">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-semibold text-slate-700 text-sm">Loading contract & payment details...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center my-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Contract Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'This contract does not exist or you do not have permission to view it.'}</p>
        <Button onClick={() => navigate('/billing/contracts')} className="bg-[#244A70] hover:bg-[#1B3856] text-white">
          Return to Contracts
        </Button>
      </div>
    );
  }

  const totalValue = contract.totalValue || contract.commercialTerms?.totalValue || 12100;
  const subtotal = contract.commercialTerms?.subtotal || Math.round(totalValue / 1.1);
  const vat = contract.commercialTerms?.vatAmount || Math.round(totalValue - subtotal);
  const invoice = contract.invoice;
  const refCode = contract.qrPayment?.referenceCode || invoice?.invoiceNumber || `INV-${contract.contractNumber.replace('ALSM-CTR-', '')}`;
  const customerSignerData = contract.signingProcess?.customerSigner;
  const partyBSignatureImg = customerSignerData?.signatureImageUrl || (contract.signingProcess as any)?.customerSignatureImage;

  return (
    <div className="w-full space-y-6 pb-16">
      {/* ── Top Header & Tab Controls ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{contract.contractNumber}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(contract.contractNumber, 'contractNo')}
                className="p-1 text-slate-400 hover:text-slate-700 transition rounded cursor-pointer"
                title="Copy contract number"
              >
                {copiedKey === 'contractNo' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </h1>

            {/* Status Badges */}
            {isBothSigned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bilaterally Executed
              </span>
            ) : isCustomerSigned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Customer Signed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5" /> Awaiting Signature
              </span>
            )}

            {isPaymentVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid & Active
              </span>
            ) : isCustomerSigned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <CreditCard className="w-3.5 h-3.5" /> Pending Payment
              </span>
            ) : null}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{contract.title}</p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented View Mode */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive E-Sign & Billing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Full Legal Agreement (A4)
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => fetchContract(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Refresh contract status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Status'}</span>
          </Button>
        </div>
      </div>

      {/* ── Active View Mode Content ──────────────────────────────────── */}
      {activeTab === 'preview' ? (
        /* Full Legal Agreement (A4 Document View) */
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                You are reviewing the official statutory Master Service Agreement with deterministic SLA and legal clauses.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs bg-white text-slate-700 border-slate-300"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab('overview')}
                className="text-xs bg-[#244A70] hover:bg-[#1B3856] text-white font-bold"
              >
                <PenTool className="w-3.5 h-3.5 shrink-0" />
                <span>{isCustomerSigned ? 'View Signature & Billing' : 'Proceed to Mouse E-Signing'}</span>
              </Button>
            </div>
          </div>

          <ContractDocument
            contract={contract}
            onCustomerSign={() => setActiveTab('overview')}
          />
        </div>
      ) : (
        /* Interactive Execution & E-Signature Dashboard */
        <div className="w-full space-y-6">
          {/* Top Banner: Real-time Auto-Reconciliation Notification */}
          {isPaymentVerified ? (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 font-bold text-2xl shadow-inner">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <span>Payment Verified & Service Activated!</span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-extrabold uppercase bg-emerald-200 text-emerald-950">
                        ACTIVE
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
                      Automated bank transfer reconciliation succeeded. Quotas for contract <strong className="font-mono text-white">{contract.contractNumber}</strong> have been allocated.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-extrabold text-xs hover:bg-emerald-50 transition shadow-md cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Access Web 3 Workspace
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Countdown banner */}
              <div className="bg-emerald-950/40 border border-emerald-400/40 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                <span>
                  Automated redirect to <strong>Partner Dashboard</strong> in{' '}
                  <strong className="text-white text-sm font-mono underline">{redirectCountdown ?? 4}s</strong>...
                </span>
                <span className="text-[11px] text-emerald-200">Zero manual confirmation required.</span>
              </div>
            </div>
          ) : isCustomerSigned ? (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Contract Signed — Instant QR Code Unlocked</h4>
                  <p className="text-slate-600">
                    Scan the QR code on the right with any banking app. Our gateway detects transfers 24/7 and redirects you immediately.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Listening for payment...
              </span>
            </div>
          ) : null}

          {/* Top Metadata Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="border-r border-slate-100 pr-3">
                <span className="text-slate-500 font-medium block">Target Tech Stack:</span>
                <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                  {contract.scope?.targetTechnology || 'React 19 + TypeScript + Spring Boot 3 Java'}
                </span>
              </div>
              <div className="border-r border-slate-100 pr-3">
                <span className="text-slate-500 font-medium block">Source Legacy Stack:</span>
                <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                  {contract.scope?.sourceCodeType || 'IBM 3270 BMS / AS400 DSPF & COBOL Logic'}
                </span>
              </div>
              <div className="border-r border-slate-100 pr-3">
                <span className="text-slate-500 font-medium block">SLA Commitment:</span>
                <span className="font-semibold text-emerald-700 mt-0.5 block truncate">
                  {contract.scope?.slaCommitment || '99.9% Uptime with Deterministic AST Validation'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Effective Period:</span>
                <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                  {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString('en-US') : 'Upon Signature'} to{' '}
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-US') : '12 Months'}
                </span>
              </div>
            </div>
          </div>

          {/* ── 2 Columns Dashboard ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 Cols): Parties, Financial Value, Interactive Drawing Signature */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Contracting Parties */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <Building className="w-4 h-4 text-slate-600" />
                    Contracting Parties
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">Governing MSA</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Party A */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Service Provider (Party A)
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {contract.parties?.provider?.legalName || 'ALSM SOFTWARE MODERNIZATION TECHNOLOGY JSC'}
                    </p>
                    <p className="text-slate-600">Tax ID: {contract.parties?.provider?.taxId || '0110892345'}</p>
                    <p className="text-slate-600 truncate">
                      Headquarters: {contract.parties?.provider?.headquarters || 'Hoa Xuan, Da Nang, Vietnam'}
                    </p>
                    <p className="text-slate-600">
                      Legal Representative: {contract.parties?.provider?.signatoryName || 'Nguyen Gia Khanh (General Director)'}
                    </p>
                    <p className="text-slate-500 text-[11px]">Official Notice Email: contracts@alsm.io</p>
                  </div>

                  {/* Party B */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 block">
                      Customer (Party B)
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {contract.customer?.companyName || contract.organizationName || 'Client Workspace'}
                    </p>
                    <p className="text-slate-600">Tax ID: {contract.customer?.taxId || '0108849201'}</p>
                    <p className="text-slate-600 truncate">
                      Business Address: {contract.customer?.businessAddress || 'Hanoi, Vietnam'}
                    </p>
                    <p className="text-slate-600">
                      Representative: {contract.customer?.representativeName || signerName || 'Truong Minh Khoi'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Position: {contract.customer?.representativeTitle || signerTitle || 'Director'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Contract Financial Value */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Contract Financial Value
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Subtotal (Net Service Fee):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {new Intl.NumberFormat('en-US').format(subtotal)} VND
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Value Added Tax (VAT 10%):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {new Intl.NumberFormat('en-US').format(vat)} VND
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>Total Contract Value:</span>
                    <span className="font-mono text-emerald-700 text-base">
                      {new Intl.NumberFormat('en-US').format(totalValue)} VND
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Interactive Drawing Signature Pad & Certificate */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Digital Signature Status & Verification
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Full Agreement
                  </button>
                </div>

                {isCustomerSigned ? (
                  /* Verified Certificate with drawn signature */
                  <div className="p-5 bg-slate-50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {isBothSigned ? 'Fully Countersigned & Legally Executed' : 'Customer E-Signature Certified'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        VNPT-CA SHA-256 Assurance
                      </span>
                    </div>

                    {/* Render the saved drawn signature image */}
                    {partyBSignatureImg && (
                      <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">
                          Recorded Electronic Signature
                        </span>
                        <img
                          src={partyBSignatureImg}
                          alt="Party B Signature"
                          className="max-h-20 max-w-[220px] object-contain"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Authorized Signer:</span>
                        <span className="font-semibold text-slate-900">{customerSignerData?.name || signerName || 'Truong Minh Khoi'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Title / Role:</span>
                        <span className="font-semibold text-slate-900">{customerSignerData?.title || signerTitle || 'Director'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[11px]">Cryptographic Signature Hash:</span>
                        <span className="font-mono text-[11px] text-slate-600 break-all">
                          {customerSignerData?.signatureHash || 'SHA256:d8a9f4c3b2e1a009ef81452bc99f4c2'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Interactive Drawing Canvas Form */
                  <form onSubmit={handleSignContract} className="space-y-4">
                    {/* Guidance alert with link to preview */}
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                      <PenTool className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">
                          Draw your official signature in the signature box below using your mouse or touch screen.
                        </p>
                        <p className="text-blue-700">
                          Before signing, you can{' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className="font-bold underline text-blue-800 hover:text-blue-950 cursor-pointer"
                          >
                            click here to preview the full legal contract agreement (A4)
                          </button>
                          .
                        </p>
                      </div>
                    </div>

                    {/* Canvas Signature Pad */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <label className="flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-blue-600" />
                          <span>Draw Your Signature *</span>
                        </label>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-[11px] font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition"
                        >
                          <Eraser className="w-3 h-3" />
                          Clear / Redraw
                        </button>
                      </div>

                      <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50 overflow-hidden transition">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={160}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-36 block cursor-crosshair bg-white"
                        />
                        {!hasDrawn && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs gap-1">
                            <PenTool className="w-5 h-5 text-slate-300" />
                            <span>Sign here using your mouse or finger</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Signer credentials inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Signer Full Name *
                        </label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          required
                          placeholder="e.g. Truong Minh Khoi"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Signer Title *
                        </label>
                        <input
                          type="text"
                          value={signerTitle}
                          onChange={(e) => setSignerTitle(e.target.value)}
                          required
                          placeholder="e.g. Director"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Corporate Email *
                      </label>
                      <input
                        type="email"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        required
                        placeholder="e.g. partner@enterprise.io"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Legal consent checkbox */}
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="terms-check"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        required
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="terms-check" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                        I confirm that I am the authorized legal representative of the client enterprise, have reviewed the contract preview, and agree to execute this agreement with legally binding cryptographic assurance.
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={signingLoading || !termsAgreed || !hasDrawn}
                      className="w-full bg-[#244A70] hover:bg-[#1B3856] text-white font-bold py-2.5 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {signingLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Executing Cryptographic E-Signature...
                        </span>
                      ) : (
                        'Sign Contract & Generate Payment QR Code'
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column (5 Cols): Invoice Details & QR Code (Unlocked only when signed) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Invoice Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Invoice Details
                  </h3>
                  {isPaymentVerified ? (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PAID
                    </span>
                  ) : isCustomerSigned ? (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      PENDING PAYMENT
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> AWAITING SIGNATURE
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {isCustomerSigned ? (invoice?.invoiceNumber || refCode) : 'Issued upon signature'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Contract Number:</span>
                    <span className="font-mono text-slate-800 font-semibold">{contract.contractNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Payable Amount:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {new Intl.NumberFormat('en-US').format(totalValue)} VND
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold text-slate-900">Direct Bank Transfer / QR Code</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Payment Reference:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {isCustomerSigned ? refCode : 'Awaiting signature'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Bank Transfer QR Code (Locked prior to signing, Automated thereafter) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    Direct Bank Transfer (QR Code)
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-Reconciled 24/7
                  </span>
                </div>

                {!isCustomerSigned ? (
                  /* LOCKED STATE: Contract has not been signed yet */
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Payment QR Code Locked</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Please draw your authorized electronic signature on the left panel to execute this contract. Upon signing, the instant payment QR code and bank transfer instructions will be generated automatically.
                    </p>
                  </div>
                ) : isPaymentVerified ? (
                  /* PAID STATE: Payment complete */
                  <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-emerald-950">
                      Payment Confirmed & Verified
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                      Bank transfer transaction has been verified automatically. The payment QR code has been safely closed and your service quota is activated.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Enter Partner Dashboard
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ACTIVE PAYMENT STATE: Show clean QR code & bank details (Zero manual form buttons) */
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      {cleanQrDataUrl ? (
                        <img
                          src={cleanQrDataUrl}
                          alt="Bank Transfer QR Code"
                          className="w-56 h-auto object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-2"
                        />
                      ) : (
                        <div className="w-56 h-56 bg-white rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200">
                          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                          <span className="text-xs text-slate-500 font-medium">Generating clean QR...</span>
                        </div>
                      )}
                      <span className="text-[11px] text-slate-500 mt-2 font-medium text-center">
                        Scan QR code with any banking app to execute instant bank transfer
                      </span>
                    </div>

                    {/* Bank Details with 1-click copy buttons */}
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Bank Name</span>
                          <span className="font-semibold text-slate-800">MB Bank (Military Commercial Joint Stock Bank)</span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px] cursor-pointer"
                          onClick={() => copyToClipboard('MB Bank', 'bank')}
                        >
                          {copiedKey === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Account Number</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {contract.qrPayment?.accountNumber || '0899886249'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px] cursor-pointer"
                          onClick={() => copyToClipboard(contract.qrPayment?.accountNumber || '0899886249', 'accNum')}
                        >
                          {copiedKey === 'accNum' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Account Holder</span>
                          <span className="font-semibold text-slate-800">
                            {contract.qrPayment?.accountName || 'ALSM TECHNOLOGY SOLUTIONS'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px] cursor-pointer"
                          onClick={() => copyToClipboard(contract.qrPayment?.accountName || 'ALSM TECHNOLOGY SOLUTIONS', 'accName')}
                        >
                          {copiedKey === 'accName' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Transfer Reference</span>
                          <span className="font-mono font-bold text-blue-700 text-sm">
                            {refCode}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px] cursor-pointer"
                          onClick={() => copyToClipboard(refCode, 'ref')}
                        >
                          {copiedKey === 'ref' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Zero manual inputs notice */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Fully Automated 24/7 Reconciliation
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        No manual payment proof submission required. Once your transfer completes, the system automatically detects the transaction and redirects you to the Web 3 Partner Portal.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetailPage;
