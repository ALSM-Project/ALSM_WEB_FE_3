import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Play, CheckSquare, Square, Clock, FileCode } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import { useBulkConvert } from '../queries/useBulkConvert';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';
import { EnsureQueryClient } from '@/shared/ui/EnsureQueryClient';
import { useProjectQuery } from '@/features/projects/queries/useProjects';

const PROGRAM_SOURCE_TYPES = new Set(['COBOL', 'RPG']);

const BulkConvertContent: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [screensLoading, setScreensLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<'immediately' | 'later'>('immediately');
  const bulkConvert = useBulkConvert(projectId);

  const { data: project } = useProjectQuery(projectId);

  // Check if passed initial selection from ScreensListPage navigation state
  const stateSelectedIds = useMemo(() => {
    const s = (location.state as { selectedIds?: string[] } | undefined)?.selectedIds;
    return Array.isArray(s) ? s : null;
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    setScreensLoading(true);
    conversionService.getScreens(projectId).then((data) => {
      if (cancelled) return;
      setScreens(data);

      if (stateSelectedIds && stateSelectedIds.length > 0) {
        const validIds = stateSelectedIds.filter((id) => data.some((s) => s.id === id));
        setSelectedIds(validIds.length > 0 ? validIds : data.filter((s) => s.status !== 'Completed').map((s) => s.id));
      } else {
        setSelectedIds(data.filter((s) => s.status !== 'Completed').map((s) => s.id));
      }
      setScreensLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, stateSelectedIds]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === screens.length) setSelectedIds([]);
    else setSelectedIds(screens.map((s) => s.id));
  };

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartConversion = () => {
    bulkConvert.mutate(selectedIds, {
      onSuccess: () => navigate(ROUTES.PROJECTS.SCREENS(projectId)),
    });
  };

  const isCobolProject =
    project?.conversionType === 'COBOL_TO_JAVA' ||
    (screens.length > 0 && screens.every((s) => PROGRAM_SOURCE_TYPES.has(s.sourceType)));

  const targetFramework = isCobolProject ? 'Java 17 + Spring Boot' : 'React 19 + TypeScript';
  const conversionEngine = isCobolProject ? 'ALSM tool2java Pipeline' : 'ALSM Synthesis Pipeline';

  const alreadyCompletedCount = useMemo(() => {
    return screens.filter(
      (s) => selectedIds.includes(s.id) && (s.status === 'Completed' || s.status === 'COMPLETED' || s.status === 'Converted')
    ).length;
  }, [screens, selectedIds]);

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Bulk Convert Screens & Programs</h1>
        <p className="text-slate-500 text-sm mt-1">Convert multiple legacy screens and programs to modern target frameworks simultaneously.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <button
              onClick={handleToggleSelectAll}
              disabled={screensLoading || screens.length === 0}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {selectedIds.length === screens.length && screens.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-brand-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({screens.length} screens in view)</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-xs text-brand-600 font-semibold">
                {selectedIds.length} screens selected
              </span>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
            {screensLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading screens…</div>
            ) : screens.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No screens available for this project.</div>
            ) : (
              screens.map((screen) => {
                const isSelected = selectedIds.includes(screen.id);
                return (
                  <div
                    key={screen.id}
                    onClick={() => handleToggleOne(screen.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <FileCode className="w-4 h-4 text-[#0652CC] flex-shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-slate-900 font-mono">{screen.name}</p>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {screen.sourceType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{screen.path || screen.inputReference || 'Legacy source'}</p>
                      </div>
                    </div>

                    <StatusBadge status={screen.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 space-y-6 shadow-2xs">
            <h3 className="text-xs font-bold text-[#42526E] uppercase tracking-wider">Conversion Settings</h3>

            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#D9E2EC] space-y-3 text-xs">
              <div className="flex justify-between items-center font-medium">
                <span className="text-[#6B778C]">Target Framework</span>
                <span className="text-[#0652CC] font-bold">{targetFramework}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-[#6B778C]">Conversion Engine</span>
                <span className="text-[#091E42] font-semibold">{conversionEngine}</span>
              </div>
              <p className="text-[#0652CC] font-semibold pt-1 border-t border-[#E5EAF0]">
                {selectedIds.length} screen(s) selected for bulk modernization synthesis.
              </p>
              {alreadyCompletedCount > 0 && (
                <p className="text-amber-700 text-[11px] pt-1">
                  Note: Includes {alreadyCompletedCount} already completed {alreadyCompletedCount === 1 ? 'screen' : 'screens'} that will be re-synthesized.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#42526E]">SCHEDULING</label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center space-x-2.5 p-2.5 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleMode === 'immediately'}
                    onChange={() => setScheduleMode('immediately')}
                    className="text-[#0652CC] focus:ring-[#0652CC]"
                  />
                  <span className="text-[#091E42] font-semibold">Start immediately</span>
                </label>
                <label className="flex items-center space-x-2.5 p-2.5 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleMode === 'later'}
                    onChange={() => setScheduleMode('later')}
                    className="text-[#0652CC] focus:ring-[#0652CC]"
                  />
                  <span className="text-[#091E42] font-semibold">Schedule for later (Off-peak)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-[#6B778C] pt-2 border-t border-[#E5EAF0] font-medium">
              <Clock className="w-4 h-4 text-[#0652CC]" />
              <span>Estimated total time: ~{Math.max(1, selectedIds.length * 0.5)} minutes</span>
            </div>

            <div className="space-y-2 pt-2">
              {bulkConvert.isError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {bulkConvert.error instanceof Error
                    ? bulkConvert.error.message
                    : 'Could not start the bulk conversion. Please try again.'}
                </p>
              )}
              <Button
                onClick={handleStartConversion}
                isLoading={bulkConvert.isPending}
                disabled={selectedIds.length === 0 || screensLoading}
                className="w-full py-2.5 space-x-2 font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white shadow-xs"
              >
                <Play className="w-4 h-4" />
                <span>Start Conversion ({selectedIds.length})</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
                className="w-full text-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BulkConvertPage: React.FC = () => {
  return (
    <EnsureQueryClient>
      <BulkConvertContent />
    </EnsureQueryClient>
  );
};

export default BulkConvertPage;
