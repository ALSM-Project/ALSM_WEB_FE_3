import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { QueryClientContext } from '@tanstack/react-query';
import { projectService } from '../services/project.service';
import { projectKeys } from '../queries/projectKeys';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export interface DeleteProjectModalProps {
  isOpen: boolean;
  projectId: string;
  projectName?: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  projectId,
  projectName: initialProjectName,
  onClose,
  onDeleted,
}) => {
  const queryClient = useContext(QueryClientContext);
  const [confirmName, setConfirmName] = useState(initialProjectName || '');
  const [typedName, setTypedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch project details if name not provided
  useEffect(() => {
    if (isOpen) {
      setTypedName('');
      setError(null);
      setSuccessMsg(null);
      document.body.style.overflow = 'hidden';

      if (initialProjectName) {
        setConfirmName(initialProjectName);
      } else if (projectId) {
        projectService
            .getProjectById(projectId)
            .then((p) => {
              if (p?.name) setConfirmName(p.name);
            })
            .catch(() => setConfirmName(''));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, projectId, initialProjectName]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isConfirmed = typedName.trim() === confirmName.trim() && confirmName.length > 0;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setLoading(true);
    setError(null);
    try {
      await projectService.deleteProject(projectId);
      queryClient?.invalidateQueries({ queryKey: projectKeys.all });
      setSuccessMsg(`Project "${confirmName}" was deleted successfully.`);
      setTimeout(() => {
        onClose();
        if (onDeleted) onDeleted();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen top-0 left-0 right-0 bottom-0 bg-[#091E42]/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-[#D9E2EC] rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5 my-auto overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warning Icon */}
        <div className="flex items-start justify-between border-b border-[#E5EAF0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#091E42] tracking-tight">
                Delete Modernization Project?
              </h2>
              <p className="text-xs text-[#6B778C]">Action cannot be easily undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B778C] hover:text-[#091E42] hover:bg-[#F7F9FC] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Warning Body */}
        <div className="space-y-3">
          <p className="text-xs text-[#42526E] leading-relaxed">
            This project will be soft-deleted. Associated workspace data, converted code, and AST
            artifacts will be archived and inaccessible.
          </p>

          <div className="bg-[#F7F9FC] border border-[#D9E2EC] p-3 rounded-xl space-y-1.5">
            <div className="text-[11px] font-semibold text-[#6B778C]">
              Please type the project name to confirm deletion:
            </div>
            <div className="font-mono text-xs font-bold text-[#091E42] select-all bg-white p-2 rounded-lg border border-[#D9E2EC]">
              {confirmName || '...'}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-2.5 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium">
            {successMsg}
          </div>
        )}

        {/* Form and Input */}
        <form onSubmit={handleDelete} className="space-y-4">
          <Input
            placeholder={confirmName}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            disabled={loading || Boolean(successMsg)}
            autoFocus
          />

          <div className="pt-2 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="text-xs px-4 py-2 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isConfirmed || loading || Boolean(successMsg)}
              isLoading={loading}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-5 py-2 font-bold shadow-xs space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default DeleteProjectModal;
