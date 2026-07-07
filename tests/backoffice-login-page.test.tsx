import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BackofficeLoginPage from '@/app/backoffice/login/page';

const { replace, clearForceAuth0Login, getSession, getAuth0AdminLoginHref, isExportAdminAuthMode, shouldForceAuth0Login } = vi.hoisted(() => ({
  replace: vi.fn(),
  clearForceAuth0Login: vi.fn(),
  getSession: vi.fn(),
  getAuth0AdminLoginHref: vi.fn(),
  isExportAdminAuthMode: vi.fn(),
  shouldForceAuth0Login: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace,
  }),
}));

vi.mock('@/lib/admin-auth', () => ({
  AUTH0_ADMIN_LOGIN_PATH: '/auth/login?returnTo=%2Fbackoffice',
  clearForceAuth0Login,
  getAuth0AdminLoginHref,
  isExportAdminAuthMode,
  shouldForceAuth0Login,
  adminAuthClient: {
    adapter: {
      getSession,
    },
  },
}));

describe('BackofficeLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: null });
    getAuth0AdminLoginHref.mockReturnValue('/auth/login?returnTo=%2Fbackoffice');
    isExportAdminAuthMode.mockReturnValue(false);
    shouldForceAuth0Login.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects immediately when a session already exists', async () => {
    getSession.mockResolvedValue({ data: { session: { email: 'admin@ceis.pt' } } });
    render(<BackofficeLoginPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/backoffice');
    });
  });

  it('shows an Auth0 login call to action in runtime mode', async () => {
    render(<BackofficeLoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Entrar com Auth0' })).toHaveAttribute('href', '/auth/login?returnTo=%2Fbackoffice');
    });
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Palavra-passe')).not.toBeInTheDocument();
  });

  it('uses the normalized Auth0 login href for local loopback hosts', async () => {
    getAuth0AdminLoginHref.mockReturnValue('http://localhost:3000/auth/login?returnTo=%2Fbackoffice');
    render(<BackofficeLoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Entrar com Auth0' })).toHaveAttribute(
        'href',
        'http://localhost:3000/auth/login?returnTo=%2Fbackoffice'
      );
    });
    expect(screen.getByText(/Usar 127\.0\.0\.1 pode invalidar o state do Auth0/i)).toBeInTheDocument();
  });

  it('does not restore an Auth0 session automatically immediately after sign out', async () => {
    shouldForceAuth0Login.mockReturnValue(true);
    getAuth0AdminLoginHref.mockReturnValue('/api/admin/auth0-login');
    render(<BackofficeLoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Entrar com Auth0' })).toHaveAttribute(
        'href',
        '/api/admin/auth0-login'
      );
    });
    expect(getAuth0AdminLoginHref).toHaveBeenCalledWith(null, { promptLogin: true });
    expect(getSession).not.toHaveBeenCalled();
  });

  it('does not expose public account creation controls', () => {
    render(<BackofficeLoginPage />);

    expect(screen.queryByRole('button', { name: 'Criar conta' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Confirmar palavra-passe')).not.toBeInTheDocument();
  });

  it('renders the legacy email and password form in export mode', async () => {
    isExportAdminAuthMode.mockReturnValue(true);
    render(<BackofficeLoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entrar com Auth0' })).not.toBeInTheDocument();
  });
});
