import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { FieldMapping } from '../types/conversion';
import { FieldMappingPage } from './FieldMappingPage';

const mocks = vi.hoisted(() => ({
  getFieldMappings: vi.fn(),
  getLatestConversion: vi.fn(),
  getConversionResult: vi.fn(),
  saveFieldMapping: vi.fn(),
  reconvert: vi.fn(),
  saveScreenCode: vi.fn(),
  triggerAiValidation: vi.fn(),
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getFieldMappings: mocks.getFieldMappings,
    getLatestConversion: mocks.getLatestConversion,
    getConversionResult: mocks.getConversionResult,
    saveFieldMapping: mocks.saveFieldMapping,
    reconvert: mocks.reconvert,
    saveScreenCode: mocks.saveScreenCode,
  },
}));

vi.mock('../services/validation.service', () => ({
  validationService: {
    triggerAiValidation: mocks.triggerAiValidation,
  },
}));

const sampleMappings: FieldMapping[] = [
  {
    id: 'fm-0',
    legacyField: {
      name: 'ACCTNO',
      type: 'ALPHA_NUMERIC',
      length: 16,
      position: 'Ln 05, Col 21',
    },
    componentMapping: {
      componentType: 'Text Field',
      labelText: 'Account Number (ACCTNO)',
      isRequired: true,
      minLength: 10,
      maxLength: 16,
      regexPattern: '^[0-9-]+$',
    },
  },
  {
    id: 'fm-1',
    legacyField: {
      name: 'CUSTNAME',
      type: 'ALPHABETIC',
      length: 30,
      position: 'Ln 07, Col 21',
    },
    componentMapping: {
      componentType: 'Text Field',
      labelText: 'Customer Name',
      isRequired: false,
      minLength: 2,
      maxLength: 30,
      regexPattern: '',
    },
  },
];

describe('FieldMappingPage', () => {
  const renderPage = (
    route = '/projects/proj-acme/screens/scr-login/mapping',
  ) =>
    render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route
            path="/projects/:projectId/screens/:screenId/mapping"
            element={<FieldMappingPage />}
          />
          <Route
            path="/projects/:projectId/screens/:screenId/review"
            element={<div data-testid="review-page">Review Findings Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getFieldMappings.mockResolvedValue(JSON.parse(JSON.stringify(sampleMappings)));
    mocks.getLatestConversion.mockResolvedValue(null);
    mocks.getConversionResult.mockResolvedValue({ files: [] });
    mocks.saveFieldMapping.mockResolvedValue(true);
    mocks.reconvert.mockResolvedValue({ job: { id: 'job-123' }, validation: {} });
    mocks.saveScreenCode.mockResolvedValue({ success: true, conversionJobId: 'job-123' });
    mocks.triggerAiValidation.mockResolvedValue({ id: 'val-1', status: 'QUEUED' });
  });

  it('renders field mapping page heading and loads legacy source fields', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: /Automated Field Mapping/i })).toBeInTheDocument();
    const acctnoElements = await screen.findAllByText('ACCTNO');
    expect(acctnoElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CUSTNAME')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Account Number (ACCTNO)')).toBeInTheDocument();
  });

  it('shows empty state when no field mappings are returned from backend', async () => {
    mocks.getFieldMappings.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText(/No field mapping has been saved for this screen yet/i),
    ).toBeInTheDocument();
  });

  it('shows error state with retry button when loading field mappings fails', async () => {
    mocks.getFieldMappings.mockRejectedValue(new Error('Backend connection refused'));

    renderPage();

    expect(await screen.findByText(/Backend connection refused/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();

    mocks.getFieldMappings.mockResolvedValue(JSON.parse(JSON.stringify(sampleMappings)));
    fireEvent.click(retryBtn);

    const acctnoElements = await screen.findAllByText('ACCTNO');
    expect(acctnoElements.length).toBeGreaterThanOrEqual(1);
  });

  it('allows switching selected legacy fields to inspect their component mapping', async () => {
    renderPage();

    await screen.findAllByText('ACCTNO');
    const custnameCard = screen.getByText('CUSTNAME');
    fireEvent.click(custnameCard);

    expect(await screen.findByDisplayValue('Customer Name')).toBeInTheDocument();
  });

  it('validates minLength and maxLength and displays a clear error warning', async () => {
    renderPage();

    await screen.findAllByText('ACCTNO');
    const minLengthInput = screen.getByLabelText(/Min Length/i);
    const maxLengthInput = screen.getByLabelText(/Max Length/i);

    fireEvent.change(minLengthInput, { target: { value: '25' } });
    fireEvent.change(maxLengthInput, { target: { value: '10' } });

    expect(
      await screen.findByText(/Min Length \(25\) cannot exceed Max Length \(10\)/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Re-convert/i })).toBeDisabled();
  });

  it('validates regex pattern syntax and displays an error if pattern is invalid', async () => {
    renderPage();

    await screen.findAllByText('ACCTNO');
    const regexInput = screen.getByLabelText(/Regex Pattern/i);

    fireEvent.change(regexInput, { target: { value: '[a-z' } });

    expect(
      await screen.findByText(/Invalid regular expression pattern/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Re-convert/i })).toBeDisabled();
  });

  it('successfully saves field mapping and reconverts screen', async () => {
    renderPage();

    await screen.findAllByText('ACCTNO');
    const saveBtn = screen.getByRole('button', { name: /Save & Re-convert/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mocks.reconvert).toHaveBeenCalledWith(
        'proj-acme',
        'scr-login',
        expect.any(Array),
      );
    });

    expect(
      await screen.findByText(/Field mapping saved! Re-conversion triggered/i),
    ).toBeInTheDocument();
  });

  it('falls back to saveFieldMapping if reconvert fails on backend', async () => {
    mocks.reconvert.mockRejectedValue(new Error('Reconvert endpoint not available'));
    renderPage();

    await screen.findAllByText('ACCTNO');
    const saveBtn = screen.getByRole('button', { name: /Save & Re-convert/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mocks.saveFieldMapping).toHaveBeenCalledWith(
        'proj-acme',
        'scr-login',
        expect.any(Array),
      );
    });

    expect(await screen.findByText(/Field mapping updated!/i)).toBeInTheDocument();
  });

  it('displays real backend error and retains user edits if saving completely fails', async () => {
    mocks.reconvert.mockRejectedValue(new Error('Internal server error'));
    mocks.saveFieldMapping.mockRejectedValue(new Error('Failed to persist in database'));
    renderPage();

    await screen.findAllByText('ACCTNO');
    const labelInput = screen.getByDisplayValue('Account Number (ACCTNO)');
    fireEvent.change(labelInput, { target: { value: 'Modified Account Label' } });

    const saveBtn = screen.getByRole('button', { name: /Save & Re-convert/i });
    fireEvent.click(saveBtn);

    expect(
      await screen.findByText(/Failed to persist in database/i),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Modified Account Label')).toBeInTheDocument();
    expect(screen.queryByTestId('review-page')).not.toBeInTheDocument();
  });

  it('switches to direct TSX code editor mode and allows editing and saving code', async () => {
    mocks.getLatestConversion.mockResolvedValue({ id: 'job-latest' });
    mocks.getConversionResult.mockResolvedValue({
      files: [
        {
          relativePath: 'components/ScrLogin.tsx',
          content: 'export const ScrLogin = () => <div>Login Screen</div>;',
        },
      ],
    });

    renderPage();

    await screen.findAllByText('ACCTNO');
    const codeModeTab = screen.getByRole('button', { name: /Direct TSX Code Editor/i });
    fireEvent.click(codeModeTab);

    expect(await screen.findByText(/React Component Editor/i)).toBeInTheDocument();
    const saveCodeButtons = await screen.findAllByRole('button', {
      name: /Save Code/i,
    });
    fireEvent.click(saveCodeButtons[0]);

    await waitFor(() => {
      expect(mocks.saveScreenCode).toHaveBeenCalledWith(
        'proj-acme',
        'scr-login',
        expect.any(String),
        expect.any(String),
      );
    });
    expect(await screen.findByText(/TSX Code saved!/i)).toBeInTheDocument();
  });

  it('retains code and displays error if saveScreenCode fails', async () => {
    mocks.saveScreenCode.mockRejectedValue(new Error('Failed to save code to server'));
    renderPage();

    await screen.findAllByText('ACCTNO');
    const codeModeTab = screen.getByRole('button', { name: /Direct TSX Code Editor/i });
    fireEvent.click(codeModeTab);

    const saveCodeButtons = await screen.findAllByRole('button', {
      name: /Save Code/i,
    });
    fireEvent.click(saveCodeButtons[0]);

    expect(
      await screen.findByText(/Failed to save code to server/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('review-page')).not.toBeInTheDocument();
  });
});
