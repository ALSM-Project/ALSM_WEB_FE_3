import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { conversionService } from '../services/conversion.service';
import type { MethodMappingView } from '../types/conversion';
import { useMethodMapping, useSaveMethodMapping } from './useMethodMapping';

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getMethodMapping: vi.fn(),
    saveMethodMapping: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const sampleView: MethodMappingView = {
  projectId: 'proj-1',
  screenId: 'scr-1',
  hasGeneratedCode: true,
  entries: [
    {
      relativePath: 'AccountTasklet.java',
      kind: 'CLASS',
      originalName: 'AccountTasklet',
      targetName: 'AccountTasklet',
    },
  ],
  updatedBy: null,
  updatedAt: null,
};

describe('useMethodMapping hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches method mapping view for project and screen', async () => {
    vi.mocked(conversionService.getMethodMapping).mockResolvedValue(sampleView);

    const { result } = renderHook(
      () => useMethodMapping('proj-1', 'scr-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleView);
    expect(conversionService.getMethodMapping).toHaveBeenCalledWith('proj-1', 'scr-1');
  });

  it('saves method mapping mutation successfully', async () => {
    const updatedView = {
      ...sampleView,
      entries: [{ ...sampleView.entries[0], targetName: 'CustomAccountTasklet' }],
    };
    vi.mocked(conversionService.saveMethodMapping).mockResolvedValue(updatedView);

    const { result } = renderHook(
      () => useSaveMethodMapping('proj-1', 'scr-1'),
      { wrapper: createWrapper() },
    );

    result.current.mutate(updatedView.entries);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(conversionService.saveMethodMapping).toHaveBeenCalledWith('proj-1', 'scr-1', updatedView.entries);
  });
});
