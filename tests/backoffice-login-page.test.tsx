import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BackofficeLoginPage from '@/app/backoffice/login/page';

const replace = vi.fn();
const getSession = vi.fn();
const signInEmail = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace,
  }),
}));

vi.mock('@/lib/admin-auth', () => ({
  isExportAdminAuthMode: () => false,
  adminAuthClient: {
    adapter: {
      getSession,
      signIn: {
        email: signInEmail,
      },
    },
  },
}));

describe('BackofficeLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: null });
  });

  it('redirects immediately when a session already exists', async () => {
    getSession.mockResolvedValue({ data: { session: { email: 'admin@ceis.pt' } } });
    render(<BackofficeLoginPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/backoffice');
    });
  });

  it('submits credentials and redirects on success', async () => {
    signInEmail.mockResolvedValue({ data: { session: { email: 'admin@ceis.pt' } }, error: null });
    const user = userEvent.setup();

    render(<BackofficeLoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@ceis.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'segredo');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(signInEmail).toHaveBeenCalledWith({
        email: 'admin@ceis.pt',
        password: 'segredo',
      });
      expect(replace).toHaveBeenCalledWith('/backoffice');
    });
  });

  it('does not expose public account creation controls', () => {
    render(<BackofficeLoginPage />);

    expect(screen.queryByRole('button', { name: 'Criar conta' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Confirmar palavra-passe')).not.toBeInTheDocument();
  });

  it('shows the authentication error message', async () => {
    signInEmail.mockResolvedValue({ data: null, error: { message: 'Credenciais inválidas.' } });
    const user = userEvent.setup();

    render(<BackofficeLoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@ceis.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciais inválidas.')).toBeInTheDocument();
  });
});
