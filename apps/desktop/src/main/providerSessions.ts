import { providerRegistry } from '@tessera-gateway/core/providers/registry';

export type SessionStatus = 'unknown' | 'logged_out' | 'logged_in' | 'error';

export interface ProviderSession {
  providerId: string;
  status: SessionStatus;
  partitionDir: string;
  lastChecked: number;
  error?: string;
}

export interface ProviderSessionsConfig {
  baseDir: string;
}

const DEFAULT_CONFIG: ProviderSessionsConfig = {
  baseDir: './data/provider-sessions',
};

const APPROVED_PROVIDER_URLS: Record<string, string> = Object.fromEntries(
  Object.values(providerRegistry).map((provider) => [provider.id, provider.browserUrl]),
);

const EXTRA_APPROVED_ORIGINS_BY_PROVIDER: Record<string, string[]> = {
  chatgpt: ['https://chatgpt.com'],
};

const APPROVED_PROVIDER_ORIGINS: Record<string, string[]> = Object.fromEntries(
  Object.entries(APPROVED_PROVIDER_URLS).map(([providerId, browserUrl]) => {
    const origin = getOrigin(browserUrl);
    return [providerId, [...(origin ? [origin] : []), ...(EXTRA_APPROVED_ORIGINS_BY_PROVIDER[providerId] ?? [])]];
  }),
);

function getOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function getApprovedUrls(): string[] {
  return Object.values(APPROVED_PROVIDER_ORIGINS).flat();
}

export function isApprovedUrl(url: string): boolean {
  const origin = getOrigin(url);
  if (!origin) return false;
  return Object.values(APPROVED_PROVIDER_ORIGINS).some((origins) => origins.includes(origin));
}

export function getUrlForProvider(providerId: string): string | null {
  return APPROVED_PROVIDER_URLS[providerId.toLowerCase()] || null;
}

export function getProviderIdFromUrl(url: string): string | null {
  const origin = getOrigin(url);
  if (!origin) return null;

  for (const [id, approvedOrigins] of Object.entries(APPROVED_PROVIDER_ORIGINS)) {
    if (approvedOrigins.includes(origin)) {
      return id;
    }
  }
  return null;
}

export class ProviderSessionManager {
  private config: ProviderSessionsConfig;
  private sessions: Map<string, ProviderSession> = new Map();

  constructor(config: Partial<ProviderSessionsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getPartitionDir(providerId: string): string {
    return `${this.config.baseDir}/${providerId}`;
  }

  async getSession(providerId: string): Promise<ProviderSession> {
    let session = this.sessions.get(providerId);

    if (!session) {
      session = {
        providerId,
        status: 'unknown',
        partitionDir: this.getPartitionDir(providerId),
        lastChecked: Date.now(),
      };
      this.sessions.set(providerId, session);
    }

    return session;
  }

  async setSessionStatus(providerId: string, status: SessionStatus, error?: string): Promise<void> {
    const session = await this.getSession(providerId);
    session.status = status;
    session.lastChecked = Date.now();
    if (error) {
      session.error = error;
    }
  }

  async resetSession(providerId: string): Promise<void> {
    const session = await this.getSession(providerId);
    session.status = 'unknown';
    session.lastChecked = Date.now();
    session.error = undefined;
  }

  async clearSession(providerId: string): Promise<void> {
    this.sessions.delete(providerId);
  }

  getAllSessions(): ProviderSession[] {
    return Array.from(this.sessions.values());
  }
}

let sessionManager: ProviderSessionManager | null = null;

export function createProviderSessionManager(config?: Partial<ProviderSessionsConfig>): ProviderSessionManager {
  return new ProviderSessionManager(config);
}

export function getProviderSessionManager(): ProviderSessionManager {
  if (!sessionManager) {
    sessionManager = createProviderSessionManager();
  }
  return sessionManager;
}

export { APPROVED_PROVIDER_URLS };
