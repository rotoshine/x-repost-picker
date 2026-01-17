import { useState, useEffect } from 'react';
import { User } from '../types';
import Confetti from './Confetti';
import Button from './Button';
import { soundGenerator } from '../utils/sounds';

interface WinnerDisplayProps {
  winners: User[];
  onReset: () => void;
  eventName?: string;
  totalParticipants: number;
  showRanking?: boolean;
  onShowToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

// 250자 기준으로 포스트 분할 (username이 잘리지 않도록)
function splitPostContent(header: string, usernames: string[], maxLength: number = 250): string[] {
  const posts: string[] = [];
  let currentPost = header;

  for (const username of usernames) {
    const line = `\n@${username}`;

    if (currentPost.length + line.length > maxLength) {
      // 현재 포스트 저장하고 새 포스트 시작
      posts.push(currentPost.trim());
      currentPost = line.trim();
    } else {
      currentPost += line;
    }
  }

  // 마지막 포스트 저장
  if (currentPost.trim()) {
    posts.push(currentPost.trim());
  }

  return posts;
}

function WinnerDisplay({ winners, onReset, eventName, totalParticipants, showRanking = false, onShowToast }: WinnerDisplayProps) {
  const [showFlash, setShowFlash] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    // Flash effect for gacha-style entrance
    const timer = setTimeout(() => {
      setShowFlash(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 포스트 내용 생성
  const generatePosts = () => {
    const header = eventName
      ? `🎉 [${eventName}] 당첨자 발표!\n\n참가자 ${totalParticipants}명 중 ${winners.length}명 당첨!\n\n축하합니다! 🎊`
      : `🎉 당첨자 발표!\n\n참가자 ${totalParticipants}명 중 ${winners.length}명 당첨!\n\n축하합니다! 🎊`;

    const usernames = winners.map(w => w.username);
    return splitPostContent(header, usernames);
  };

  const posts = generatePosts();

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      soundGenerator.playClick();
      onShowToast(`포스트 ${index + 1} 복사 완료!`, 'success');
    } catch {
      onShowToast('복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 relative overflow-hidden">
      <Confetti />

      {/* Gacha-style flash effect */}
      {showFlash && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            animation: 'gacha-flash 0.8s ease-out forwards',
          }}
        />
      )}

      <div
        className="container mx-auto p-8 relative z-10"
        style={{
          animation: 'gacha-zoom 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-center mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl">
            🎉 당첨자 발표! 🎉
          </h1>
          <p className="text-center opacity-70 mb-8 text-lg">
            축하합니다! {winners.length}명의 당첨자가 선정되었습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {winners.map((winner, index) => (
              <div
                key={winner.username}
                className="card bg-base-100 shadow-2xl transform hover:scale-105 transition-transform animate-fade-in relative overflow-hidden border-2 border-yellow-400"
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                {/* Rank badge with special styling for 1st place */}
                {showRanking && (
                  <div className="absolute top-2 right-2 z-20">
                    {index === 0 ? (
                      <div className="relative">
                        <div className="badge badge-warning badge-lg animate-pulse font-bold text-lg shadow-lg">
                          👑 1등
                        </div>
                        <div className="absolute inset-0 animate-ping opacity-75">
                          <div className="badge badge-warning badge-lg opacity-75"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="badge badge-primary badge-lg font-bold">
                        {index + 1}등
                      </div>
                    )}
                  </div>
                )}

                <div className="card-body items-center text-center relative z-10">
                  <figure className="mb-4 relative">
                    {/* Solid ring background for clean border */}
                    <div className="relative z-10 p-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-full shadow-lg">
                      <div className="p-0.5 bg-base-100 rounded-full">
                        <img
                          src={winner.profileImageUrl}
                          alt={winner.username}
                          className="rounded-full w-24 h-24 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${winner.username}&background=random&size=128`;
                          }}
                        />
                      </div>
                    </div>
                  </figure>
                  <h2 className="card-title text-xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                    {winner.displayName}
                  </h2>
                  <p className="opacity-70 font-medium">@{winner.username}</p>
                  <div className="card-actions justify-center mt-4">
                    <a
                      href={winner.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm shadow-lg hover:shadow-xl transition-shadow"
                    >
                      📱 프로필 보기
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                soundGenerator.playClick();
                setShowPostModal(true);
              }}
            >
              📢 당첨결과 포스트하기
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                soundGenerator.playClick();
                onReset();
              }}
            >
              🔄 새로 추첨하기
            </Button>
          </div>
        </div>
      </div>

      {/* 포스트 모달 */}
      {showPostModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl mb-2">📢 당첨결과 포스트하기</h3>
            <p className="text-sm opacity-70 mb-4">
              각 섹션을 복사하여 X(트위터)에 포스트하세요.
              {posts.length > 1 && ` (총 ${posts.length}개 포스트)`}
            </p>

            <div className="space-y-4">
              {posts.map((post, index) => (
                <div key={index} className="card bg-base-200 shadow-md">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge badge-primary">
                        {posts.length > 1 ? `포스트 ${index + 1}/${posts.length}` : '포스트'}
                      </span>
                      <span className="text-xs opacity-60">{post.length}/250자</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm p-4 rounded-lg border-2 border-primary/30 font-sans bg-neutral text-neutral-content leading-relaxed">
                      {post}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleCopy(post, index)}
                    >
                      📋 복사하기
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-action">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowPostModal(false)}
              >
                닫기
              </Button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setShowPostModal(false)}
          />
        </div>
      )}
    </div>
  );
}

export default WinnerDisplay;
