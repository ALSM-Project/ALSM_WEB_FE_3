import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DocumentationPortal } from './components/DocumentationPortal';

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.scrollTo = vi.fn();
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.IntersectionObserver = MockIntersectionObserver as any;
  }
});

describe('DocumentationPortal Component', () => {
  it('renders the main technical documentation heading as a semantic H1', () => {
    render(
      <MemoryRouter>
        <DocumentationPortal />
      </MemoryRouter>
    );

    const heading = screen.getByRole('heading', { level: 1, name: /Technical Documentation & Developer Guide/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the 6-stage modernization pipeline', () => {
    render(
      <MemoryRouter>
        <DocumentationPortal />
      </MemoryRouter>
    );

    expect(screen.getByText(/ALSM End-to-End Modernization Lifecycle/i)).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Mapping')).toBeInTheDocument();
    expect(screen.getByText('Convert')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders documentation categories in the sidebar', () => {
    render(
      <MemoryRouter>
        <DocumentationPortal />
      </MemoryRouter>
    );

    expect(screen.getAllByText('GETTING STARTED')[0]).toBeInTheDocument();
    expect(screen.getAllByText('PLATFORM OVERVIEW')[0]).toBeInTheDocument();
    expect(screen.getAllByText('MODERNIZATION GUIDES')[0]).toBeInTheDocument();
    expect(screen.getAllByText('DEVELOPER REFERENCE')[0]).toBeInTheDocument();
  });

  it('renders the On This Page Table of Contents', () => {
    render(
      <MemoryRouter>
        <DocumentationPortal />
      </MemoryRouter>
    );

    expect(screen.getByText('On This Page')).toBeInTheDocument();
    expect(screen.getAllByText(/Introduction & Overview/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Enterprise REST API Reference/i)[0]).toBeInTheDocument();
  });

  it('filters sidebar items when search input is used', () => {
    render(
      <MemoryRouter>
        <DocumentationPortal />
      </MemoryRouter>
    );

    const filterInputs = screen.getAllByPlaceholderText(/Filter documentation.../i);
    fireEvent.change(filterInputs[0], { target: { value: 'COBOL' } });

    expect(screen.getAllByText('COBOL Business Logic')[0]).toBeInTheDocument();
  });
});
