// X(Twitter) 리포스트 페이지에서 username 추출 스크립트
// Chrome DevTools Console에서 실행하세요

(function() {
  // 모든 username 링크 찾기
  const usernameLinks = document.querySelectorAll('a[href^="/"][href*="@"]:not([href*="/status/"]):not([href*="/photo/"]):not([href*="/header_photo"])');

  // Set으로 중복 제거
  const usernames = new Set();

  usernameLinks.forEach(link => {
    const href = link.getAttribute('href');
    // /username 형태에서 username 추출
    const match = href.match(/^\/([a-zA-Z0-9_]+)$/);
    if (match && match[1]) {
      usernames.add(match[1]);
    }
  });

  // 배열로 변환하고 @를 붙여서 포맷팅
  const result = Array.from(usernames).map(u => `@${u}`).join('\n');

  // 클립보드에 복사
  navigator.clipboard.writeText(result).then(() => {
    console.log(`✅ ${usernames.size}명의 username이 클립보드에 복사되었습니다!`);
    console.log('\n복사된 내용:');
    console.log(result);

    // 화면에 알림 표시
    const notification = document.createElement('div');
    notification.textContent = `✅ ${usernames.size}명 복사 완료!`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1DA1F2;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }).catch(err => {
    console.error('❌ 클립보드 복사 실패:', err);
    alert('클립보드 복사에 실패했습니다. 콘솔에서 결과를 확인해주세요.\n\n' + result);
  });

  // CSS 애니메이션 추가
  if (!document.getElementById('clipboard-notification-style')) {
    const style = document.createElement('style');
    style.id = 'clipboard-notification-style';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
