import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { conversionService } from '../services/conversion.service';
import type { FieldMapping } from '../types/conversion';
import { useFieldMapping, useSaveFieldMapping, useReconvertScreen } from './useFieldMapping';

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getFieldMappings: vi.fn(),
    saveFieldMapping: vi.fn(),
    reconvert: vi.fn(),
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

const sampleMappings: FieldMapping[] = [
  {
    id: 'fm-0',
    legacyField: { name: 'ACCTNO', type: 'ALPHA_NUMERIC', length: 16, position: 'Ln 05, Col 21' },
    componentMapping: {
      componentType: 'Text Field',
      labelText: 'Account',
      isRequired: true,
      minLength: 1,
      maxLength: 16,
      regexPattern: '^[0-9]+$',
    },
  },
];

describe('useFieldMapping hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches field mappings for project and screen', async () => {
    vi.mocked(conversionService.getFieldMappings).mockResolvedValue(sampleMappings);

    const { result } = renderHook(
      () => useFieldMapping('proj-1', 'scr-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleMappings);
    expect(conversionService.getFieldMappings).toHaveBeenCalledWith('proj-1', 'scr-1');
  });

  it('saves field mapping mutation successfully', async () => {
    vi.mocked(conversionService.saveFieldMapping).mockResolvedValue(true);

    const { result } = renderHook(
      () => useSaveFieldMapping('proj-1', 'scr-1'),
      { wrapper: createWrapper() },
    );

    result.current.mutate(sampleMappings);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(conversionService.saveFieldMapping).toHaveBeenCalledWith('proj-1', 'scr-1', sampleMappings);
  });

  it('triggers screen reconversion mutation successfully', async () => {
    vi.mocked(conversionService.reconvert).mockResolvedValue({
      job: {
        id: 'job-new',
        status: 'QUEUED',
        createdAt: new Date().toISOString(),
      },
      validation: {},
    });

    const { result } = renderHook(
      () => useReconvertScreen('proj-1', 'scr-1'),
      { wrapper: createWrapper() },
    );

    result.current.mutate(sampleMappings);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(conversionService.reconvert).toHaveBeenCalledWith('proj-1', 'scr-1', sampleMappings);
  });
});
