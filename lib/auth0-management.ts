const DEFAULT_AUTH0_CONNECTION = 'Username-Password-Authentication';
const AUTH0_ADMIN_ROLE_NAMES = ['owner', 'editor'] as const;

type Auth0AdminRoleName = (typeof AUTH0_ADMIN_ROLE_NAMES)[number];

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Defina ${name} nas variáveis de ambiente para concluir a integração com o Auth0.`);
  }

  return value;
}

function getAuth0Domain() {
  return getRequiredEnv('AUTH0_DOMAIN').replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function getAuth0ManagementConnection() {
  return process.env.AUTH0_MANAGEMENT_CONNECTION?.trim() || DEFAULT_AUTH0_CONNECTION;
}

async function getAuth0ManagementToken() {
  const domain = getAuth0Domain();
  const clientId = getRequiredEnv('AUTH0_CLIENT_ID');
  const clientSecret = getRequiredEnv('AUTH0_CLIENT_SECRET');

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        error?: string;
        error_description?: string;
      }
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'Não foi possível autenticar a API de gestão do Auth0.');
  }

  return payload.access_token;
}

async function fetchAuth0Management<T>(path: string, init?: RequestInit) {
  const domain = getAuth0Domain();
  const token = await getAuth0ManagementToken();
  const response = await fetch(`https://${domain}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as T | { message?: string; error?: string; error_description?: string } | null;

  if (!response.ok) {
    const errorPayload = payload as { message?: string; error?: string; error_description?: string } | null;
    throw new Error(
      formatAuth0ErrorMessage(response.status, {
        message: errorPayload?.message || errorPayload?.error_description || errorPayload?.error,
        error: errorPayload?.error,
      })
    );
  }

  return payload as T;
}

function formatAuth0ErrorMessage(status: number, payload: { message?: string; error?: string; errorCode?: string } | null) {
  const message = payload?.message || payload?.error || 'O Auth0 devolveu um erro inesperado.';

  if (status === 409 || message.toLowerCase().includes('already exists')) {
    return 'Já existe uma conta Auth0 com este email.';
  }

  if (message.toLowerCase().includes('connection')) {
    return 'A ligação de base de dados do Auth0 não está pronta. Confirme AUTH0_MANAGEMENT_CONNECTION e ative Username-Password-Authentication.';
  }

  return message;
}

export async function createAuth0PasswordUser(input: { email: string; password: string }) {
  const response = await fetchAuth0Management<{
    user_id?: string;
    email?: string;
  }>('/api/v2/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connection: getAuth0ManagementConnection(),
      email: input.email,
      password: input.password,
      email_verified: false,
      verify_email: false,
    }),
  });

  if (!response?.user_id) {
    throw new Error('O Auth0 não devolveu um identificador de utilizador válido.');
  }

  return {
    id: response.user_id,
    email: response?.email || input.email,
  };
}

export async function deleteAuth0User(userId: string) {
  if (!userId) {
    return;
  }

  await fetchAuth0Management<null>(`/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  }).catch(() => undefined);
}

export async function updateAuth0UserPassword(userId: string, password: string) {
  if (!userId) {
    throw new Error('O utilizador Auth0 é inválido.');
  }

  if (!password || password.trim().length < 6) {
    throw new Error('A nova palavra-passe deve ter pelo menos 6 caracteres.');
  }

  await fetchAuth0Management<null>(`/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connection: getAuth0ManagementConnection(),
      password: password.trim(),
    }),
  });
}

async function listAuth0Roles() {
  return fetchAuth0Management<Array<{ id: string; name: string }>>('/api/v2/roles');
}

async function getAuth0RoleIdByName(roleName: Auth0AdminRoleName) {
  const roles = await listAuth0Roles();
  const role = roles.find((item) => item.name === roleName);

  if (!role) {
    throw new Error(`A role "${roleName}" não foi encontrada no Auth0. Confirme as roles owner/editor no tenant.`);
  }

  return role.id;
}

async function getAuth0UserRoleIds(userId: string) {
  const roles = await fetchAuth0Management<Array<{ id: string; name: string }>>(
    `/api/v2/users/${encodeURIComponent(userId)}/roles`
  );

  return roles.filter((role) => AUTH0_ADMIN_ROLE_NAMES.includes(role.name as Auth0AdminRoleName)).map((role) => role.id);
}

export async function syncAuth0AdminRole(userId: string, roleName: Auth0AdminRoleName) {
  if (!userId) {
    throw new Error('O utilizador Auth0 é inválido.');
  }

  const targetRoleId = await getAuth0RoleIdByName(roleName);
  const currentRoleIds = await getAuth0UserRoleIds(userId);
  const removableRoleIds = currentRoleIds.filter((roleId) => roleId !== targetRoleId);

  if (removableRoleIds.length > 0) {
    await fetchAuth0Management<null>(`/api/v2/users/${encodeURIComponent(userId)}/roles`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roles: removableRoleIds,
      }),
    });
  }

  if (!currentRoleIds.includes(targetRoleId)) {
    await fetchAuth0Management<null>(`/api/v2/users/${encodeURIComponent(userId)}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roles: [targetRoleId],
      }),
    });
  }
}
