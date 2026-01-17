import { useState, useRef, useEffect } from 'react';
import { User, DrawState } from './types';
import { parseTwitterRetweetText, initializeUserPositions } from './utils/parser';
import FloatingCard from './components/FloatingCard';
import WinnerDisplay from './components/WinnerDisplay';
import HistoryModal from './components/HistoryModal';
import Toast from './components/Toast';
import Button from './components/Button';
import { soundGenerator } from './utils/sounds';
import { saveDrawResult } from './utils/history';
import { useTheme } from './hooks/useTheme';

interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

function App() {
  const [inputText, setInputText] = useState('');
  const [manualUsername, setManualUsername] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [drawState, setDrawState] = useState<DrawState>({
    status: 'idle',
    winners: [],
    speed: 1,
  });
  const [numWinners, setNumWinners] = useState(1);
  const [eventName, setEventName] = useState('');
  const [showRanking, setShowRanking] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const toastIdRef = useRef(0);
  const { theme, toggleTheme } = useTheme();

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  const handleParse = () => {
    const parsedUsers = parseTwitterRetweetText(inputText);
    if (parsedUsers.length === 0) {
      soundGenerator.playError();
      showToast('유저 정보를 찾을 수 없습니다. 형식을 확인해주세요.', 'warning');
      return;
    }

    // Merge with existing users (avoid duplicates)
    const existingUsernames = new Set(users.map(u => u.username));
    const newUsers = parsedUsers.filter(u => !existingUsernames.has(u.username));

    if (newUsers.length === 0) {
      showToast('모두 이미 추가된 사용자입니다.', 'info');
      return;
    }

    const allUsers = [...users, ...newUsers];
    const initializedUsers = initializeUserPositions(
      allUsers,
      window.innerWidth,
      window.innerHeight
    );
    setUsers(initializedUsers);
    setInputText('');
    soundGenerator.playClick();
    showToast(`${newUsers.length}명의 참가자가 추가되었습니다!`, 'success');

    // 2명 이상 등록 시 입력 패널 자동 접기
    if (allUsers.length >= 2) {
      setShowInput(false);
    }

    if (drawState.status === 'idle') {
      setDrawState({ status: 'floating', winners: [], speed: 1 });
    }
  };

  const handleAddManualUser = (e: React.FormEvent) => {
    e.preventDefault();
    const username = manualUsername.trim().replace('@', '');

    if (!username) {
      soundGenerator.playError();
      showToast('username을 입력해주세요.', 'warning');
      return;
    }

    // Check duplicate
    if (users.some(u => u.username === username)) {
      soundGenerator.playError();
      showToast('이미 추가된 사용자입니다.', 'warning');
      return;
    }

    const newUser: User = {
      username,
      displayName: username,
      profileUrl: `https://x.com/${username}`,
      profileImageUrl: `https://unavatar.io/x/${username}`,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
    };

    setUsers([...users, newUser]);
    setManualUsername('');
    soundGenerator.playClick();
    showToast(`@${username} 추가되었습니다!`, 'success');

    if (drawState.status === 'idle') {
      setDrawState({ status: 'floating', winners: [], speed: 1 });
    }
  };

  const handleRemoveUser = (username: string) => {
    setUsers(users.filter(u => u.username !== username));
    showToast(`@${username} 제거되었습니다.`, 'info');
  };

  // Re-initialize positions when container is ready
  useEffect(() => {
    if (drawState.status === 'floating' && users.length > 0 && containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const reInitializedUsers = initializeUserPositions(users, clientWidth, clientHeight);
      setUsers(reInitializedUsers);
    }
  }, [drawState.status]);

  // 추첨 인원이 참가자 수를 초과하지 않도록 보정
  useEffect(() => {
    if (users.length > 0 && numWinners > users.length) {
      setNumWinners(users.length);
    }
  }, [users.length, numWinners]);

  const handleStartDraw = () => {
    if (users.length === 0) {
      soundGenerator.playError();
      showToast('먼저 참가자를 추가해주세요.', 'warning');
      return;
    }

    if (numWinners > users.length) {
      soundGenerator.playError();
      showToast(`추첨 인원은 최대 ${users.length}명까지 가능합니다.`, 'warning');
      return;
    }

    // 토스트 모두 닫기
    clearToasts();

    // 드럼롤 시작!
    soundGenerator.playDrumRoll();

    // 전체 화면 기준으로 카드 위치 재배치
    const fullScreenUsers = users.map(user => ({
      ...user,
      x: Math.random() * (window.innerWidth - 120),
      y: Math.random() * (window.innerHeight - 160),
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
    }));
    setUsers(fullScreenUsers);

    setDrawState({ status: 'drawing', winners: [], speed: 1 });
    setShowInput(false);

    // Accelerate for 4 seconds for more drama
    let elapsedTime = 0;
    const accelerationInterval = setInterval(() => {
      elapsedTime += 100;
      const newSpeed = 1 + (elapsedTime / 1000) * 6; // Faster acceleration
      setDrawState(prev => ({ ...prev, speed: newSpeed }));

      // 카드 회전 소리 (가끔)
      if (elapsedTime % 300 === 0) {
        soundGenerator.playCardSpin();
      }

      if (elapsedTime >= 4000) {
        clearInterval(accelerationInterval);
        selectWinners();
      }
    }, 100);
  };

  const selectWinners = () => {
    const shuffled = users.toSorted(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, numWinners);

    // Reveal winners one by one with dramatic effect
    let revealedCount = 0;
    const revealInterval = setInterval(() => {
      // 당첨자 선정 효과음!
      soundGenerator.playWinnerSound();

      setDrawState(prev => ({
        ...prev,
        winners: winners.slice(0, revealedCount + 1),
      }));
      revealedCount++;

      if (revealedCount >= winners.length) {
        clearInterval(revealInterval);
        // Wait longer before showing final result screen (gacha style)
        setTimeout(() => {
          // 최종 팡파르!
          soundGenerator.playFanfare();
          // 히스토리에 저장
          saveDrawResult(eventName, winners, users, showRanking);
          setDrawState(prev => ({ ...prev, status: 'finished' }));
        }, 2000);
      }
    }, 1000); // Slower reveal for more drama
  };

  const handleReset = () => {
    soundGenerator.playClick();
    setUsers([]);
    setDrawState({ status: 'idle', winners: [], speed: 1 });
    setInputText('');
    setShowInput(true);
  };

  const handleRedraw = () => {
    // 현재 참가자와 설정을 유지한 채로 다시 추첨
    setDrawState({ status: 'floating', winners: [], speed: 1 });
    // 약간의 딜레이 후 추첨 시작
    setTimeout(() => {
      handleStartDraw();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast toast-top toast-center z-[9999]">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}

      {drawState.status === 'finished' ? (
        <WinnerDisplay
          winners={drawState.winners}
          onReset={handleReset}
          onRedraw={handleRedraw}
          eventName={eventName}
          totalParticipants={users.length}
          showRanking={showRanking}
          onShowToast={showToast}
        />
      ) : (
        <div className="min-h-screen flex flex-col">
          {/* Control Panel */}
          <div className={`header-gradient shadow-lg header-container ${drawState.status === 'drawing' ? 'header-hidden' : ''}`}>
            <div className="container mx-auto px-4 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10"></div> {/* Spacer for centering */}
                <h1 className="text-3xl font-bold text-white">
                  X 리포스트 추첨기
                </h1>
                <div className="flex items-center gap-1">
                  {/* History Button */}
                  <button
                    className="btn btn-ghost btn-circle text-white hover:bg-white/20"
                    onClick={() => {
                      soundGenerator.playClick();
                      setShowHistory(true);
                    }}
                    title="추첨 히스토리"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {/* Theme Toggle */}
                  <button
                    className="btn btn-ghost btn-circle text-white hover:bg-white/20"
                    onClick={() => {
                      soundGenerator.playClick();
                      toggleTheme();
                    }}
                    title={theme === 'light' ? '다크 모드' : '라이트 모드'}
                  >
                    {theme === 'light' ? (
                      // Moon icon for dark mode
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                    ) : (
                      // Sun icon for light mode
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Input Panel with Animation */}
              <div className={`input-panel ${showInput ? 'input-panel-open' : 'input-panel-closed'}`}>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Bulk Input */}
                  <div className="card bg-base-100/95 backdrop-blur-sm shadow-xl">
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="card-title text-sm text-base-content">일괄 입력 (X 복사 붙여넣기)</h3>
                        <button
                          className="btn btn-circle btn-ghost btn-xs"
                          onClick={() => setShowHelp(true)}
                          title="사용 방법 보기"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                      </div>
                      <textarea
                        className="textarea textarea-bordered w-full h-32 text-xs font-mono"
                        placeholder="X 리포스트 목록을 여기에 붙여넣기..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleParse}
                        disabled={!inputText.trim()}
                      >
                        파싱하여 추가
                      </Button>
                    </div>
                  </div>

                  {/* Manual Input */}
                  <div className="card bg-base-100/95 backdrop-blur-sm shadow-xl">
                    <div className="card-body p-4">
                      <h3 className="card-title text-sm text-base-content">수동 입력</h3>
                      <form onSubmit={handleAddManualUser} className="space-y-2">
                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text text-xs">X Username</span>
                          </label>
                          <input
                            type="text"
                            placeholder="예: winterwolf0412"
                            value={manualUsername}
                            onChange={(e) => setManualUsername(e.target.value)}
                            className="input input-bordered input-sm w-full"
                          />
                        </div>
                        <Button type="submit" variant="primary" size="sm" fullWidth>
                          추가
                        </Button>
                      </form>

                      {/* User List */}
                      <div className="mt-4">
                        <h4 className="text-xs font-bold mb-2 text-base-content">참가자 목록 ({users.length}명)</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {users.map(user => (
                            <div key={user.username} className="flex items-center justify-between bg-base-200 p-1 rounded text-xs">
                              <span>@{user.username}</span>
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => handleRemoveUser(user.username)}
                                disabled={drawState.status === 'drawing'}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Button - Centered at bottom of header */}
              <div className="flex justify-center pb-3 pt-2 border-t toggle-button-border">
                <button
                  className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
                  onClick={() => setShowInput(!showInput)}
                  title={showInput ? '입력 패널 숨기기' : '입력 패널 보기'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className={`w-6 h-6 transition-transform duration-300 ${showInput ? 'rotate-180' : 'rotate-0'}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>

              {/* Control Section */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-base-100/90 backdrop-blur-sm p-4 rounded-t-lg shadow-md mb-0">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold whitespace-nowrap">이벤트명:</label>
                  <input
                    type="text"
                    placeholder="예: 1월 리트윗 이벤트"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="input input-bordered input-sm w-48"
                    disabled={drawState.status === 'drawing'}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="badge badge-lg badge-warning">
                    참가자: {users.length}명
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm font-bold">순위</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={showRanking}
                      onChange={(e) => setShowRanking(e.target.checked)}
                      disabled={drawState.status === 'drawing'}
                    />
                  </label>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold">추첨 인원:</label>
                    <input
                      type="number"
                      min="1"
                      max={users.length || 1}
                      value={numWinners}
                      onChange={(e) => setNumWinners(Number(e.target.value))}
                      className="input input-bordered input-md w-24 text-center font-bold text-lg"
                      disabled={drawState.status === 'drawing'}
                    />
                    <span>명</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <Button
                        variant="primary"
                        size="xs"
                        square
                        onClick={() => setNumWinners(curr => Math.max(1, curr - 1))}
                        disabled={drawState.status === 'drawing' || numWinners <= 1}
                      >
                        -1
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        square
                        onClick={() => setNumWinners(curr => Math.min(users.length || 1, curr + 1))}
                        disabled={drawState.status === 'drawing' || numWinners >= users.length}
                      >
                        +1
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setNumWinners(Math.max(1, Math.floor(users.length * 0.5)))}
                        disabled={drawState.status === 'drawing' || users.length === 0}
                      >
                        50%
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setNumWinners(Math.max(1, Math.floor(users.length * 0.25)))}
                        disabled={drawState.status === 'drawing' || users.length === 0}
                      >
                        25%
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setNumWinners(Math.max(1, Math.floor(users.length * 0.125)))}
                        disabled={drawState.status === 'drawing' || users.length === 0}
                      >
                        12.5%
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartDraw}
                    disabled={drawState.status === 'drawing' || users.length === 0}
                  >
                    {drawState.status === 'drawing' ? '🎲 추첨 중...' : '🎉 추첨 시작'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleReset}
                    disabled={drawState.status === 'drawing'}
                  >
                    초기화
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Cards Area */}
          <div
            ref={containerRef}
            className={`flex-1 relative overflow-hidden bg-base-100 card-area ${drawState.status === 'drawing' ? 'card-area-fullscreen' : ''}`}
          >
            {/* Drawing status overlay - Winner card stack */}
            {drawState.status === 'drawing' && drawState.winners.length > 0 && (
              <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-50 pt-[30vh]">
                <div className="winner-stack-container">
                  {/* 새로 뽑힌 카드가 위에 오도록 역순으로 렌더링 */}
                  {[...drawState.winners].reverse().map((winner, reverseIndex) => {
                    const originalIndex = drawState.winners.length - 1 - reverseIndex;
                    return (
                      <div
                        key={winner.username}
                        className="winner-stack-card floating-card-bg rounded-xl shadow-2xl border-2 border-yellow-400 p-3 flex items-center gap-3"
                        style={{
                          width: '220px',
                          marginTop: reverseIndex === 0 ? 0 : '16px', // 카드 간격 (겹치지 않고 아래로 쌓임)
                          zIndex: drawState.winners.length - reverseIndex, // 새 카드가 위에
                          boxShadow: '0 0 20px 5px rgba(250, 204, 21, 0.5)',
                        }}
                      >
                        <img
                          src={winner.profileImageUrl}
                          alt={winner.username}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-yellow-400 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${winner.username}&background=random&size=64`;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-base-content">{winner.displayName}</p>
                          <p className="text-xs opacity-70 truncate">@{winner.username}</p>
                          {showRanking && (
                            <div className="badge badge-warning badge-xs mt-1">
                              {originalIndex + 1}등
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {users.length === 0 && drawState.status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center opacity-50">
                  <p className="text-2xl mb-2">👆</p>
                  <p className="text-lg">참가자를 추가해주세요</p>
                </div>
              </div>
            )}

            {/* 중앙 추첨 시작 버튼 - 패널 접힘 & 2명 이상 & 추첨 전 */}
            {!showInput && users.length >= 2 && (drawState.status === 'idle' || drawState.status === 'floating') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                <div className="text-center pointer-events-auto p-8 rounded-2xl border-2 border-base-300 bg-base-100/80 backdrop-blur-sm shadow-2xl">
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <span className="text-lg font-medium">추첨 인원:</span>
                    <input
                      type="number"
                      min="1"
                      max={users.length}
                      value={numWinners}
                      onChange={(e) => setNumWinners(Math.min(Number(e.target.value), users.length))}
                      className="input input-bordered input-lg w-24 text-center font-bold text-2xl"
                    />
                    <span className="text-lg opacity-70">/ {users.length}명</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex gap-1">
                      <Button
                        variant="primary"
                        size="sm"
                        square
                        onClick={() => setNumWinners(curr => Math.max(1, curr - 1))}
                        disabled={numWinners <= 1}
                      >
                        -1
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        square
                        onClick={() => setNumWinners(curr => Math.min(users.length, curr + 1))}
                        disabled={numWinners >= users.length}
                      >
                        +1
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setNumWinners(Math.max(1, Math.floor(users.length * 0.5)))}
                      >
                        50%
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setNumWinners(Math.max(1, Math.floor(users.length * 0.25)))}
                      >
                        25%
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setNumWinners(Math.max(1, Math.floor(users.length * 0.125)))}
                      >
                        12.5%
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="xl"
                    paddingX={48}
                    paddingY={24}
                    fontSize={24}
                    minHeight={80}
                    onClick={handleStartDraw}
                    className="shadow-2xl"
                  >
                    🎉 추첨 시작
                  </Button>
                </div>
              </div>
            )}
            {users.map((user) => (
              <FloatingCard
                key={user.username}
                user={user}
                speed={drawState.speed}
                isWinner={drawState.winners.some(w => w.username === user.username)}
                drawingState={drawState.status}
              />
            ))}
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="modal modal-open">
          <div className="modal-box max-w-5xl max-h-[90vh] overflow-y-auto bg-base-100">
            <h3 className="font-bold text-xl mb-4">X 리포스트 목록 가져오기</h3>

            <div className="space-y-6">
              {/* Method 1: JavaScript 스크립트 (추천) */}
              <div className="card help-card-bg border-2 border-primary">
                <div className="card-body">
                  <h4 className="card-title text-primary mb-4">
                    <span className="badge badge-primary mr-2">추천</span>
                    방법 1: 자동 추출 스크립트
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <strong className="text-base">X 리포스트 페이지 열기</strong>
                        <p className="text-sm opacity-70 mt-1">
                          예: https://x.com/username/status/123456/retweets
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <strong className="text-base">Chrome 개발자 도구 열기</strong>
                        <p className="text-sm opacity-70 mt-1">
                          Windows/Linux: <kbd className="kbd kbd-sm">F12</kbd> 또는 <kbd className="kbd kbd-sm">Ctrl</kbd>+<kbd className="kbd kbd-sm">Shift</kbd>+<kbd className="kbd kbd-sm">I</kbd>
                          <br />
                          Mac: <kbd className="kbd kbd-sm">Cmd</kbd>+<kbd className="kbd kbd-sm">Option</kbd>+<kbd className="kbd kbd-sm">I</kbd>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <strong className="text-base">Console 탭으로 이동</strong>
                        <p className="text-sm opacity-70 mt-1">
                          개발자 도구 상단의 "Console" 탭 클릭
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <strong className="text-base">아래 코드를 복사하여 실행</strong>
                        <div className="mockup-code mt-2 text-xs">
                          <pre><code>{`(function() {
  const links = document.querySelectorAll('a[href^="/"][href*="@"]');
  const usernames = new Set();
  links.forEach(link => {
    const match = link.getAttribute('href').match(/^\/([a-zA-Z0-9_]+)$/);
    if (match) usernames.add(match[1]);
  });
  const result = Array.from(usernames).map(u => '@' + u).join('\\n');
  navigator.clipboard.writeText(result).then(() => {
    alert('✅ ' + usernames.size + '명 복사 완료!');
  });
})()`}</code></pre>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const code = `(function() {
  const links = document.querySelectorAll('a[href^="/"][href*="@"]');
  const usernames = new Set();
  links.forEach(link => {
    const match = link.getAttribute('href').match(/^\/([a-zA-Z0-9_]+)$/);
    if (match) usernames.add(match[1]);
  });
  const result = Array.from(usernames).map(u => '@' + u).join('\\n');
  navigator.clipboard.writeText(result).then(() => {
    alert('✅ ' + usernames.size + '명 복사 완료!');
  });
})()`;
                            navigator.clipboard.writeText(code);
                            showToast('코드가 클립보드에 복사되었습니다!', 'success');
                          }}
                        >
                          📋 코드 복사하기
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full font-bold">
                        5
                      </div>
                      <div className="flex-1">
                        <strong className="text-base">붙여넣기</strong>
                        <p className="text-sm opacity-70 mt-1">
                          자동으로 클립보드에 복사되면 여기 붙여넣기!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="divider">또는</div>

              {/* Method 2: Manual */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">방법 2: 수동 복사</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>X 리포스트 페이지에서 리포스트 목록 확인</li>
                    <li>전체 선택 (<kbd className="kbd kbd-sm">Ctrl</kbd>+<kbd className="kbd kbd-sm">A</kbd>) 후 복사</li>
                    <li>위 일괄 입력 영역에 붙여넣기</li>
                    <li>"파싱하여 추가" 버튼 클릭</li>
                  </ol>
                </div>
              </div>

              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h4 className="font-bold">💡 Tip</h4>
                  <ul className="text-sm list-disc list-inside mt-2">
                    <li>방법 1이 더 정확하고 빠릅니다 (추천!)</li>
                    <li>자동으로 중복이 제거됩니다</li>
                    <li>여러 번 추가해도 중복되지 않습니다</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <Button variant="primary" size="md" onClick={() => setShowHelp(false)}>
                확인
              </Button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowHelp(false)}></div>
        </div>
      )}

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

export default App;
