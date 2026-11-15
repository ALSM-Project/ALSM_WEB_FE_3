import { useQuery } from '@tanstack/react-query';
import { navigationApi } from '../api/navigation.api';
import type { BackendNavItem } from '../api/navigation.api';

export const useNavigationQuery = (
  application: string = 'WEB_3',
  contractType?: string,
  enabled: boolean = true
) => {
  return useQuery<BackendNavItem[]>({
    queryKey: ['navigation', application, contractType].filter(Boolean),
    queryFn: () => navigationApi.getNavigation(application, contractType),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes cache to prevent aggressive refetch / layout jumps
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export type { BackendNavItem };
