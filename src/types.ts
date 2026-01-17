export interface User {
  username: string;
  displayName: string;
  profileUrl: string;
  profileImageUrl: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

export interface DrawState {
  status: 'idle' | 'floating' | 'drawing' | 'finished';
  winners: User[];
  speed: number;
}

export interface WinnerRecord {
  username: string;
  displayName: string;
  profileUrl: string;
  profileImageUrl: string;
}

export interface DrawHistory {
  id: string;
  date: string;
  eventName: string;
  totalParticipants: number;
  participants: WinnerRecord[];
  winners: WinnerRecord[];
  showRanking?: boolean;
}
