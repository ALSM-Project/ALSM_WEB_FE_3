import { apiClient } from '@/services/api/apiClient';

export interface BackendNavItem {
  id: string;
  key: string;
  application: string;
  label: string;
  type: string;
  icon: string;
  route: string | null;
  parentId: string | null;
  order: number;
  visibility: boolean;
  status: string;
  requiredPermissions: string[];
  openInNewTab?: boolean;
  hideParentLabel?: boolean;
  children?: BackendNavItem[];
}

export const navigationApi = {
  getNavigation: async (application: string = 'WEB_3', contractType?: string): Promise<BackendNavItem[]> => {
    let url = `/navigation?application=${application}`;
    if (contractType) {
      url += `&contractType=${contractType}`;
    }
    return apiClient.get<BackendNavItem[]>(url);
  },
};
