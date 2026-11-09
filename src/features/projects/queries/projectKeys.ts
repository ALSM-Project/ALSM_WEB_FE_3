export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  screens: (projectId: string) => [...projectKeys.all, 'detail', projectId, 'screens'] as const,
};
