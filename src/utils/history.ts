import { DrawHistory, User, WinnerRecord } from '../types';

const HISTORY_KEY = 'draw_history';
const MAX_HISTORY_COUNT = 50;

export function getDrawHistory(): DrawHistory[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveDrawResult(
  eventName: string,
  winners: User[],
  participants: User[],
  showRanking: boolean = false
): DrawHistory {
  const history = getDrawHistory();

  const toRecord = (u: User): WinnerRecord => ({
    username: u.username,
    displayName: u.displayName,
    profileUrl: u.profileUrl,
    profileImageUrl: u.profileImageUrl,
  });

  const newEntry: DrawHistory = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    eventName: eventName || '이름 없는 추첨',
    totalParticipants: participants.length,
    participants: participants.map(toRecord),
    winners: winners.map(toRecord),
    showRanking,
  };

  const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_COUNT);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Failed to save draw history:', e);
  }

  return newEntry;
}

export function deleteDrawHistory(id: string): void {
  const history = getDrawHistory();
  const filtered = history.filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export function clearAllHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
