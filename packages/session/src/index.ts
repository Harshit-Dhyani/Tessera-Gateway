import { getLogger } from '@tessera-gateway/observability/logger.js';
import { type Browser, type BrowserContext, type Page, chromium } from 'playwright';
import type { ISessionManager, SessionInfo, SessionStatus } from './interfaces.js';

const logger = getLogger({ name: 'session' });

export interface SessionConfig {
  dataDir: string;
  headless?: boolean;
  visible?: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  dataDir: './data/profiles',
  headless: false,
  visible: true,
};

class SessionManager implements ISessionManager {
  private browsers: Map<string, Browser> = new Map();
  private contexts: Map<string, BrowserContext> = new Map();
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async getSession(provider: string): Promise<SessionInfo> {
    const browser = this.browsers.get(provider);
    const context = this.contexts.get(provider);

    if (browser && context) {
      const pages = context.pages();
      if (pages.length > 0) {
        return {
          provider,
          status: 'logged_in',
          lastChecked: Date.now(),
          profileDir: this.getProfileDir(provider),
        };
      }
    }

    return {
      provider,
      status: 'unknown',
      lastChecked: Date.now(),
      profileDir: this.getProfileDir(provider),
      error: 'No active session',
    };
  }

  async checkLogin(provider: string): Promise<SessionStatus> {
    const context = this.contexts.get(provider);
    if (!context) {
      return 'logged_out';
    }

    const pages = context.pages();
    if (pages.length === 0) {
      return 'logged_out';
    }

    try {
      const page = pages[0];
      const url = page.url();

      if (url.includes('chat.openai.com')) {
        await page.waitForLoadState('domcontentloaded');
        const isLoggedIn = (await page.locator('div[data-testid="user-menu"], button[id="user-menu"]').count()) > 0;
        return isLoggedIn ? 'logged_in' : 'logged_out';
      }

      return 'logged_out';
    } catch {
      return 'error';
    }
  }

  async initialize(provider: string): Promise<void> {
    logger.info({ provider }, 'Initializing browser session');

    const existingBrowser = this.browsers.get(provider);
    if (existingBrowser) {
      await existingBrowser.close();
    }

    const profileDir = this.getProfileDir(provider);

    const browser = await chromium.launch({
      channel: 'msedge',
      headless: false,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    const context = await browser.newContext({
      storageState: undefined,
      viewport: { width: 1280, height: 720 },
    });

    this.browsers.set(provider, browser);
    this.contexts.set(provider, context);

    const pages = context.pages();
    if (pages.length === 0) {
      await context.newPage();
    }

    logger.info({ provider, profileDir }, 'Browser session initialized');
  }

  async reset(provider: string): Promise<void> {
    logger.info({ provider }, 'Resetting browser session');

    const browser = this.browsers.get(provider);
    const context = this.contexts.get(provider);

    if (context) {
      await context.clearCookies();
      await context.clearPermissions();
    }

    if (browser) {
      await browser.close();
    }

    this.browsers.delete(provider);
    this.contexts.delete(provider);

    await this.initialize(provider);
  }

  async wipe(provider: string): Promise<void> {
    logger.info({ provider }, 'Wiping browser session');

    const browser = this.browsers.get(provider);
    const context = this.contexts.get(provider);

    if (context) {
      await context.clearCookies();
      await context.clearPermissions();
      const pages = context.pages();
      for (const page of pages) {
        await page.close();
      }
    }

    if (browser) {
      await browser.close();
    }

    this.browsers.delete(provider);
    this.contexts.delete(provider);
  }

  getContext(provider: string): BrowserContext | undefined {
    return this.contexts.get(provider);
  }

  getPage(provider: string): Page | undefined {
    const context = this.contexts.get(provider);
    if (!context) return undefined;
    const pages = context.pages();
    return pages[0];
  }

  getBrowser(provider: string): Browser | undefined {
    return this.browsers.get(provider);
  }

  private getProfileDir(provider: string): string {
    return `${this.config.dataDir}/${provider}`;
  }

  async close(): Promise<void> {
    for (const [provider, browser] of this.browsers) {
      logger.info({ provider }, 'Closing browser');
      await browser.close();
    }
    this.browsers.clear();
    this.contexts.clear();
  }
}

let sessionManager: ISessionManager | null = null;

export function createSessionManager(config?: Partial<SessionConfig>): ISessionManager {
  return new SessionManager(config);
}

export function getSessionManager(): ISessionManager {
  if (!sessionManager) {
    sessionManager = createSessionManager();
  }
  return sessionManager;
}

export { SessionManager };
export type { ISessionManager, SessionInfo, SessionStatus };
