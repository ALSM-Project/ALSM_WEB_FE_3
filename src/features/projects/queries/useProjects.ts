import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/project.service';
import { conversionService } from '@/features/conversion/services/conversion.service';
import { projectKeys } from './projectKeys';
import type { CreateProjectPayload, Project, UpdateProjectPayload } from '../types/project';
import type { LegacyScreen } from '@/features/screens/types/screen';

export const useProjectsQuery = () => {
  return useQuery<Project[], Error>({
    queryKey: projectKeys.lists(),
    queryFn: () => projectService.getProjects(),
    staleTime: 30_000,
  });
};

export const useProjectQuery = (projectId?: string) => {
  return useQuery<Project | null, Error>({
    queryKey: projectId ? projectKeys.detail(projectId) : ['projects', 'detail', 'none'],
    queryFn: () => (projectId ? projectService.getProjectById(projectId) : Promise.resolve(null)),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
};

export const useProjectScreensQuery = (projectId?: string) => {
  return useQuery<LegacyScreen[], Error>({
    queryKey: projectId ? projectKeys.screens(projectId) : ['projects', 'screens', 'none'],
    queryFn: () => (projectId ? conversionService.getScreens(projectId) : Promise.resolve([])),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
};

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectPayload>({
    mutationFn: (payload: CreateProjectPayload) => projectService.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { id: string; payload: UpdateProjectPayload }>({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      projectService.updateProject(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(updated.id) });
    },
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};
