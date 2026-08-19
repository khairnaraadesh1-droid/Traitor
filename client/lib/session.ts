const SESSION_KEY = "traitors_session";

export interface SessionData {
  roomCode: string;
  sessionToken: string;
  nickname: string;
  isHost: boolean;
}

export function saveSession(data: SessionData): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function loadSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function updateSession(partial: Partial<SessionData>): void {
  const current = loadSession();
  if (current) {
    saveSession({ ...current, ...partial });
  }
}
