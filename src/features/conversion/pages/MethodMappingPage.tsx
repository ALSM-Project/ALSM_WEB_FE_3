import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Save,
  XCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  RotateCcw,
  Code2,
  FileCode,
  Cpu,
} from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { MethodMappingEntry } from '../types/conversion';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { EnsureQueryClient } from '@/shared/ui/EnsureQueryClient';
import { conversionKeys } from '../queries/conversionKeys';
import { projectKeys } from '@/features/projects/queries/projectKeys';

const JAVA_IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Report 3 Section 3.5.7 & UC-34: Method & Class Mapping Studio.
 * Allows architects and engineers to inspect and refine mappings between legacy
 * COBOL PROCEDURE DIVISION paragraphs/sections and modernized Java 21 Spring Boot
 * service routines, DTO contracts, and repository interfaces.
 */
const MethodMappingContent: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [entries, setEntries] = useState<MethodMappingEntry[]>([]);
  const [initialEntries, setInitialEntries] = useState<MethodMappingEntry[]>([]);
  const [hasGeneratedCode, setHasGeneratedCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | 'CLASS' | 'METHOD'>('ALL');

  const loadData = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    conversionService
      .getMethodMapping(projectId, screenId)
      .then((view) => {
        if (cancelled) return;
        setEntries(view.entries);
        setInitialEntries(view.entries);
        setHasGeneratedCode(view.hasGeneratedCode);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Could not load method mapping.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, screenId]);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const handleRename = (relativePath: string, kind: 'CLASS' | 'METHOD', originalName: string, targetName: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.relativePath === relativePath && e.kind === kind && e.originalName === originalName
          ? { ...e, targetName }
          : e,
      ),
    );
  };

  const handleResetRow = (relativePath: string, kind: 'CLASS' | 'METHOD', originalName: string) => {
    const initial = initialEntries.find(
      (e) => e.relativePath === relativePath && e.kind === kind && e.originalName === originalName,
    );
    if (initial) {
      handleRename(relativePath, kind, originalName, initial.targetName);
    }
  };

  const handleResetAll = () => {
    setEntries(initialEntries);
  };

  const invalidNames = useMemo(
    () => entries.filter((e) => !JAVA_IDENTIFIER_PATTERN.test(e.targetName)),
    [entries],
  );

  const modifiedCount = useMemo(() => {
    let count = 0;
    for (const e of entries) {
      const init = initialEntries.find(
        (i) => i.relativePath === e.relativePath && i.kind === e.kind && i.originalName === e.originalName,
      );
      if (init && init.targetName !== e.targetName) count++;
    }
    return count;
  }, [entries, initialEntries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesKind = kindFilter === 'ALL' || entry.kind === kindFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        entry.originalName.toLowerCase().includes(term) ||
        entry.targetName.toLowerCase().includes(term) ||
        entry.relativePath.toLowerCase().includes(term);
      return matchesKind && matchesSearch;
    });
  }, [entries, kindFilter, searchTerm]);

  const classCount = useMemo(() => entries.filter((e) => e.kind === 'CLASS').length, [entries]);
  const methodCount = useMemo(() => entries.filter((e) => e.kind === 'METHOD').length, [entries]);

  const handleSave = async () => {
    setSaveError(null);
    setSavedMsg('');
    setSaving(true);
    try {
      const view = await conversionService.saveMethodMapping(projectId, screenId, entries);
      setEntries(view.entries);
      setInitialEntries(view.entries);
      setSavedMsg('Method mapping has been saved and applied to the generated code.');

      try {
        await queryClient.invalidateQueries({ queryKey: conversionKeys.all });
        await queryClient.invalidateQueries({ queryKey: projectKeys.screens(projectId) });
        await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      } catch (cacheErr) {
        console.warn('Query invalidation error:', cacheErr);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save method mapping.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-2.5 py-0.5 rounded-full">
                Backend Modernization Studio
              </span>
              <span className="text-xs font-semibold text-[#6B778C]">
                Java 21 • Spring Boot 3
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#091E42] tracking-tight">
              Method &amp; Class Mapping Studio
            </h1>
            <p className="text-xs text-[#42526E] max-w-2xl leading-relaxed">
              Refine mappings between legacy COBOL PROCEDURE DIVISION paragraphs, record copybooks, and modernized
              Spring Boot service routines, DTOs, and typed contract methods.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))}
              className="text-xs font-semibold space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Result</span>
            </Button>
            {modifiedCount > 0 && (
              <Button
                variant="secondary"
                onClick={handleResetAll}
                className="text-xs font-semibold space-x-1 text-slate-600 hover:text-slate-900"
                title="Discard unsaved edits"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ({modifiedCount})</span>
              </Button>
            )}
            <Button
              onClick={handleSave}
              isLoading={saving}
              disabled={loading || !hasGeneratedCode || invalidNames.length > 0}
              className="space-x-1.5 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Mapping</span>
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E5EAF0]">
          <div className="bg-[#F7F9FC] border border-[#D9E2EC] p-3 rounded-xl text-center">
            <div className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">Total Symbols</div>
            <div className="text-lg font-bold text-[#091E42] mt-0.5">{entries.length}</div>
          </div>
          <div className="bg-[#F7F9FC] border border-[#D9E2EC] p-3 rounded-xl text-center">
            <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Classes &amp; DTOs</div>
            <div className="text-lg font-bold text-purple-900 mt-0.5">{classCount}</div>
          </div>
          <div className="bg-[#F7F9FC] border border-[#D9E2EC] p-3 rounded-xl text-center">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Service Methods</div>
            <div className="text-lg font-bold text-blue-900 mt-0.5">{methodCount}</div>
          </div>
          <div className="bg-[#F7F9FC] border border-[#D9E2EC] p-3 rounded-xl text-center">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Modified</div>
            <div className="text-lg font-bold text-emerald-900 mt-0.5">{modifiedCount}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {savedMsg && (
        <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-4 rounded-xl text-xs font-medium flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-2.5 shadow-2xs">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {invalidNames.length > 0 && (
        <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs flex items-center space-x-2.5 font-medium shadow-2xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            Every target name must be a valid Java identifier (letters, digits, _ or $, not starting with a digit).
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#D9E2EC] p-4 rounded-xl flex flex-col sm:flex-row gap-3 justify-between items-center shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
          <input
            type="text"
            placeholder="Search symbols or files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-9 pr-3 py-0 text-xs bg-[#F7F9FC] border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0652CC] text-[#091E42]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#6B778C]">Kind:</span>
          <div className="inline-flex rounded-lg border border-[#D9E2EC] p-0.5 bg-[#F7F9FC]">
            <button
              type="button"
              onClick={() => setKindFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                kindFilter === 'ALL' ? 'bg-white text-[#0652CC] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('CLASS')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                kindFilter === 'CLASS' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classes ({classCount})
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('METHOD')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                kindFilter === 'METHOD' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Methods ({methodCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-16 text-center space-y-3 shadow-2xs">
          <div className="w-7 h-7 border-2 border-[#0652CC] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#091E42]">Loading method mappings from AST...</p>
        </div>
      ) : loadError ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-700 text-xs font-medium flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadData} className="text-xs font-semibold space-x-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      ) : !hasGeneratedCode ? (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-12 text-center text-xs text-[#6B778C] shadow-2xs space-y-3">
          <Cpu className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No Generated Java Code Available</p>
          <p className="max-w-md mx-auto text-slate-500">
            Run the COBOL→Java conversion for this screen first — there is no generated code to map yet.
          </p>
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId))}
            className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold px-4 py-2 mt-2"
          >
            Run Logic Conversion
          </Button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-12 text-center text-xs text-slate-500 shadow-2xs">
          No symbols match the current search or filter criteria.
        </div>
      ) : (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[30%]" />
                <col className="w-[32%]" />
                <col className="w-[20%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-[#6B778C] uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Kind</th>
                  <th className="py-3 px-4">Original COBOL Paragraph</th>
                  <th className="py-3 px-4">Modernized Java Identifier</th>
                  <th className="py-3 px-4">Target File Path</th>
                  <th className="py-3 px-4 text-center">Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {filteredEntries.map((entry) => {
                  const isInvalid = !JAVA_IDENTIFIER_PATTERN.test(entry.targetName);
                  const initial = initialEntries.find(
                    (i) => i.relativePath === entry.relativePath && i.kind === entry.kind && i.originalName === entry.originalName,
                  );
                  const isModified = initial && initial.targetName !== entry.targetName;

                  return (
                    <tr key={`${entry.relativePath}-${entry.kind}-${entry.originalName}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Kind */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                            entry.kind === 'CLASS'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {entry.kind}
                        </span>
                      </td>

                      {/* Original Name */}
                      <td className="py-3 px-4 font-mono font-semibold text-[#091E42]">
                        <div className="flex items-center space-x-1.5">
                          <Code2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            aria-label="Original Name"
                            value={entry.originalName}
                            disabled
                            readOnly
                            className="w-full font-mono text-xs font-semibold px-2 py-1 bg-transparent border-0 text-[#091E42] cursor-default focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Target Name (Editable) */}
                      <td className="py-3 px-4">
                        <div className="relative">
                          <input
                            type="text"
                            aria-label="Target Name"
                            value={entry.targetName}
                            onChange={(e) => handleRename(entry.relativePath, entry.kind, entry.originalName, e.target.value)}
                            className={`w-full font-mono text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                              isInvalid
                                ? 'border-rose-400 bg-rose-50 text-rose-800 focus:ring-rose-400'
                                : isModified
                                  ? 'border-emerald-300 bg-emerald-50/50 text-[#0652CC] focus:ring-blue-500'
                                  : 'border-[#D9E2EC] bg-white text-[#091E42] focus:ring-[#0652CC]'
                            } focus:outline-none focus:ring-2`}
                            placeholder="Enter Java identifier"
                          />
                          {isModified && !isInvalid && (
                            <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">
                              MODIFIED
                            </span>
                          )}
                        </div>
                        {isInvalid && (
                          <p className="text-[10px] text-rose-600 mt-1">Invalid Java identifier syntax</p>
                        )}
                      </td>

                      {/* File Path */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#6B778C]">
                        <div className="flex items-center space-x-1.5">
                          <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs" title={entry.relativePath}>
                            {entry.relativePath}
                          </span>
                        </div>
                      </td>

                      {/* Reset Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleResetRow(entry.relativePath, entry.kind, entry.originalName)}
                          disabled={!isModified}
                          className={`p-1.5 rounded-md transition-colors ${
                            isModified
                              ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'
                              : 'text-slate-300 cursor-not-allowed opacity-40'
                          }`}
                          title="Reset to original default"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const MethodMappingPage: React.FC = () => (
  <EnsureQueryClient>
    <MethodMappingContent />
  </EnsureQueryClient>
);

export default MethodMappingPage;
