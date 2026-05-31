export type SessionStatus = 'unknown' | 'logged_out' | 'logged_in' | 'error';

export interface SessionInfo {
  provider: string;
  status: SessionStatus;
  lastChecked: number;
  profileDir: string;
  error?: string;
}

export interface ISessionManager {
  getSession(provider: string): Promise<SessionInfo>;
  checkLogin(provider: string): Promise<SessionStatus>;
  initialize(provider: string): Promise<void>;
  reset(provider: string): Promise<void>;
  wipe(provider: string): Promise<void>;
}
