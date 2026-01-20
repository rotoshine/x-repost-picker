type EventCategory = 'button' | 'draw' | 'user';

interface TrackEventParams {
  category: EventCategory;
  label: string;
  value?: number;
}

export function trackEvent({ category, label, value }: TrackEventParams): void {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'click', {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

// 버튼 클릭 추적 헬퍼
export const analytics = {
  // 참가자 추가
  addParticipants: (count: number) =>
    trackEvent({ category: 'user', label: 'add_participants', value: count }),

  // 수동 참가자 추가
  addManualParticipant: () =>
    trackEvent({ category: 'user', label: 'add_manual_participant' }),

  // 참가자 제거
  removeParticipant: () =>
    trackEvent({ category: 'user', label: 'remove_participant' }),

  // 추첨 시작
  startDraw: (participantCount: number, winnerCount: number) =>
    trackEvent({
      category: 'draw',
      label: `start_draw_${winnerCount}_of_${participantCount}`,
      value: winnerCount,
    }),

  // 추첨 완료
  finishDraw: (winnerCount: number) =>
    trackEvent({ category: 'draw', label: 'finish_draw', value: winnerCount }),

  // 재추첨
  redraw: () => trackEvent({ category: 'draw', label: 'redraw' }),

  // 초기화
  reset: () => trackEvent({ category: 'button', label: 'reset' }),

  // 테마 변경
  toggleTheme: (theme: string) =>
    trackEvent({ category: 'button', label: `theme_${theme}` }),

  // 히스토리 열기
  openHistory: () => trackEvent({ category: 'button', label: 'open_history' }),

  // 도움말 열기
  openHelp: () => trackEvent({ category: 'button', label: 'open_help' }),

  // 결과 복사
  copyResult: () => trackEvent({ category: 'button', label: 'copy_result' }),

  // 결과 공유 (X)
  shareToX: () => trackEvent({ category: 'button', label: 'share_to_x' }),
};
