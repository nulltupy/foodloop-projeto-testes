import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders the placeholder heading on /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const heading = screen.getByRole('heading', { name: /foodloop/i });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toMatch(/text-brand-700/);
  });

  it('imports @foodloop/lib without throwing', async () => {
    const mod = await import('@foodloop/lib');
    expect(typeof mod.api.createApiClient).toBe('function');
  });
});
