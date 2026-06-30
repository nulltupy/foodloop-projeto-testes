import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Landing } from './Landing';

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe('Landing', () => {
  it('apresenta o FoodLoop e as ODS 2 e 12', () => {
    renderLanding();
    expect(screen.getByRole('heading', { name: /comida boa que sobrou/i })).toBeInTheDocument();
    expect(screen.getByText(/ODS 2/i)).toBeInTheDocument();
    expect(screen.getByText(/ODS 12/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quem somos/i })).toBeInTheDocument();
  });

  it('direciona para login e cadastro', () => {
    renderLanding();
    const hrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/login');
    expect(hrefs).toContain('/cadastro/cliente');
    expect(hrefs).toContain('/cadastro/comerciante');
  });

  it('usa os botões do design system nos CTAs principais', () => {
    renderLanding();
    expect(screen.getByRole('link', { name: /quero economizar/i })).toHaveClass('btn-primary');
    expect(screen.getByRole('link', { name: /sou um comércio/i })).toHaveClass('btn-outline');
  });
});
