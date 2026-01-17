import { User } from '../types';

const SYSTEM_TEXTS = [
  '나를 팔로우합니다',
  '실시간 트렌드',
  '무슨 일이 일어나고 있나요?',
  '프본아님',
  'Senior Front-end Software Engineer',
  'Software Engineer',
  'DOCUMENTARY PHOTOGRAPHER',
];

export function parseTwitterRetweetText(text: string): User[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const users = new Map<string, User>();

  let currentDisplayName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip system texts and URLs
    if (
      SYSTEM_TEXTS.some(sys => line.includes(sys)) ||
      line.startsWith('http://') ||
      line.startsWith('https://') ||
      line.startsWith('@band_') ||
      line.includes('http://') ||
      line.includes('https://')
    ) {
      continue;
    }

    // Check if line contains @username
    const usernameMatch = line.match(/@([a-zA-Z0-9_]+)/);

    if (usernameMatch) {
      const username = usernameMatch[1];

      // Use previous non-username line as display name
      if (currentDisplayName && !users.has(username)) {
        users.set(username, {
          username,
          displayName: currentDisplayName,
          profileUrl: `https://x.com/${username}`,
          profileImageUrl: `https://unavatar.io/x/${username}`,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          rotation: 0,
          rotationSpeed: 0,
        });
        currentDisplayName = '';
      }
    } else if (line && !line.startsWith('@')) {
      // This might be a display name
      currentDisplayName = line;
    }
  }

  return Array.from(users.values());
}

export function initializeUserPositions(
  users: User[],
  containerWidth: number,
  containerHeight: number
): User[] {
  return users.map(user => ({
    ...user,
    x: Math.random() * (containerWidth - 100),
    y: Math.random() * (containerHeight - 100),
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 2,
  }));
}
