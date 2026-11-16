import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ProjectsListPage } from './ProjectsListPage';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { ROUTES } from '@/shared/constants/routes';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspace, serviceMode } = useWorkspace();
  const isManaged = activeWorkspace === 'MANAGED' || serviceMode === 'WE_CONVERT_FOR_YOU';

  return (
    <>
      <ProjectsListPage />
      <CreateProjectModal
        isOpen={true}
        onClose={() => navigate(ROUTES.PROJECTS.LIST)}
        defaultServiceType={isManaged ? 'MANAGED' : 'SELF_SERVICE'}
        onProjectCreated={(projectId) => {
          if (isManaged) {
            navigate(`/project-files?projectId=${projectId}`);
          } else {
            navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          }
        }}
      />
    </>
  );
};

export default CreateProjectPage;
