import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  X,
  FileCode,
  CheckSquare,
  Square,
  Play,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { LegacyScreen } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';

export interface BulkConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isPrograms?: boolean;
  programs: LegacyScreen[];
  onConfirm: (selectedIds: string[]) => void;
  isSubmitting?: boolean;
  error?: Error | null;
}

export const BulkConvertModal: React.FC<BulkConvertModalProps> = ({
  isOpen,
  onClose,
  projectId,
  isPrograms = true,
  programs,
  onConfirm,
  isSubmitting = false,
  error = null,
}) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Synchronize selection whenever modal opens or programs list changes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(programs.map((p) => p.id));
    }
  }, [isOpen, programs]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isSubmitting]);

  const allSelected = useMemo(
    () => programs.length > 0 && selectedIds.length === programs.length,
    [programs.length, selectedIds.length],
  );

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(programs.map((p) => p.id));
    }
  };

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleChoosePrograms = () => {
    onClose();
    navigate(ROUTES.PROJECTS.BULK_CONVERT(projectId), {
      state: { selectedIds: selectedIds.length > 0 ? selectedIds : undefined },
    });
  };

  const handleConvert = () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    onConfirm(selectedIds);
  };

  if (!isOpen) return null;

  const hasPrograms = programs.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-[#14263F]/70 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full bg-white border border-[#D9E2EC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
        style={{
          width: '760px',
          maxWidth: 'calc(100vw - 32px)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-convert-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E5EAF0] bg-white shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F1FF] border border-[#D4E3FC] text-[#244A70] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[#244A70]" />
            </div>
            <div className="min-w-0">
              <h3
                id="bulk-convert-modal-title"
                className="text-base sm:text-lg font-bold text-[#091E42] tracking-tight"
              >
                Bulk Convert
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ── 2. Modal Body ──────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!hasPrograms ? (
            /* State A: Empty State Design */
            <div className="py-6 px-4 text-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F1FF] border border-[#D4E3FC] flex items-center justify-center text-[#244A70] mx-auto shadow-2xs">
                <FileCode className="w-7 h-7 text-[#244A70]" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-[#091E42] tracking-tight">
                  No Programs Available
                </h4>
                <p className="text-xs sm:text-sm text-[#42526E] font-medium leading-relaxed max-w-sm mx-auto">
                  All eligible COBOL programs have already been processed or are currently being converted.
                </p>
                <p className="text-xs text-[#6B778C] leading-normal max-w-md mx-auto pt-1">
                  You can select specific programs to review their conversion status or upload additional source files.
                </p>
              </div>
            </div>
          ) : (
            /* State B: Programs Available */
            <div className="space-y-3.5">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-[#091E42]">
                  Convert all pending {isPrograms ? 'COBOL programs' : 'screens'} ({programs.length} {isPrograms ? 'programs' : 'screens'})?
                </p>
                <p className="text-xs text-[#6B778C]">
                  They are placed in the queue and converted in parallel; this workspace follows their live progress.
                </p>
              </div>

              {/* Selection Summary and Toggle Bar */}
              <div className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 text-[#244A70] hover:text-[#1B3856] cursor-pointer disabled:opacity-50"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#244A70]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All ({programs.length})</span>
                </button>

                <span className="text-slate-600 font-medium">
                  Selected: <strong className="text-[#244A70]">{selectedIds.length}</strong> / {programs.length} programs
                </span>
              </div>

              {/* Scrollable Programs List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white">
                {programs.map((prog) => {
                  const isSelected = selectedIds.includes(prog.id);
                  return (
                    <div
                      key={prog.id}
                      onClick={() => {
                        if (!isSubmitting) handleToggleOne(prog.id);
                      }}
                      className={`p-3 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#244A70]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold font-mono text-slate-900 truncate">
                            {prog.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                            {prog.sourceType} • {prog.sizeKb ? `${prog.sizeKb} KB` : 'Source file'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={prog.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* State C: Conversion In Progress Indicator */}
          {isSubmitting && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center space-x-3 text-xs text-[#244A70]">
              <Loader2 className="w-4 h-4 animate-spin text-[#244A70] shrink-0" />
              <div>
                <p className="font-bold">Conversion in progress</p>
                <p className="text-[#42526E] text-[11px] mt-0.5">
                  Submitting {selectedIds.length} COBOL program(s) to the BullMQ transpiler queue...
                </p>
              </div>
            </div>
          )}

          {/* Error Message Notice */}
          {error && (
            <div className="flex items-start space-x-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">Conversion Request Failed</p>
                <p className="mt-0.5 text-rose-600 leading-relaxed text-[11px]">
                  {error.message || 'Could not start the bulk conversion. Please try again.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Dedicated Footer & Action Buttons ───────────────────────── */}
        <div className="px-6 py-4 bg-[#F7F9FC] border-t border-[#E5EAF0] flex items-center justify-end gap-2.5 sm:gap-3 shrink-0 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs font-semibold px-3.5 py-2 cursor-pointer"
          >
            Cancel
          </Button>

          {!hasPrograms ? (
            /* When no programs are available, prioritize Choose Programs as the main available action */
            <Button
              onClick={handleChoosePrograms}
              disabled={isSubmitting}
              className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold px-4 py-2 space-x-1.5 shadow-xs cursor-pointer"
            >
              <span>Choose Programs</span>
            </Button>
          ) : (
            /* When programs are available, allow both Choose Programs and Convert Programs */
            <>
              <Button
                variant="secondary"
                onClick={handleChoosePrograms}
                disabled={isSubmitting}
                className="text-xs font-semibold px-3.5 py-2 cursor-pointer"
              >
                Choose Programs
              </Button>

              <Button
                onClick={handleConvert}
                isLoading={isSubmitting}
                disabled={selectedIds.length === 0 || isSubmitting}
                aria-label={`Convert ${selectedIds.length} programs`}
                className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold px-4 py-2 space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {selectedIds.length > 0
                    ? `Convert Programs (${selectedIds.length})`
                    : 'Convert Programs'}
                </span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BulkConvertModal;
