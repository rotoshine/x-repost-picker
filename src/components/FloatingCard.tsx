import { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { soundGenerator } from '../utils/sounds';

interface FloatingCardProps {
  user: User;
  speed: number;
  isWinner: boolean;
  drawingState: 'idle' | 'floating' | 'drawing' | 'finished';
}

function FloatingCard({ user, speed, isWinner, drawingState }: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: user.x, y: user.y });
  const velocityRef = useRef({ vx: user.vx, vy: user.vy });
  const [rotation, setRotation] = useState(user.rotation);
  const animationRef = useRef<number | undefined>(undefined);

  // 호버 및 확대 상태
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);

  // 애니메이션 일시정지 여부
  const isPaused = isHovered || isExpanded || isWinner;

  useEffect(() => {
    const animate = () => {
      if (!cardRef.current) return;

      // 일시정지 상태면 애니메이션 스킵
      if (isPaused) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const container = cardRef.current.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const cardWidth = 120;
      const cardHeight = 160;

      setPosition((prev) => {
        let newX = prev.x + velocityRef.current.vx * speed;
        let newY = prev.y + velocityRef.current.vy * speed;

        // Bounce off walls
        if (newX <= 0 || newX >= containerWidth - cardWidth) {
          velocityRef.current.vx = -velocityRef.current.vx;
          newX = newX <= 0 ? 0 : containerWidth - cardWidth;
        }

        if (newY <= 0 || newY >= containerHeight - cardHeight) {
          velocityRef.current.vy = -velocityRef.current.vy;
          newY = newY <= 0 ? 0 : containerHeight - cardHeight;
        }

        return { x: newX, y: newY };
      });

      setRotation((prev) => prev + user.rotationSpeed * speed);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, user.rotationSpeed, isPaused]);

  // 확대 시 스핀 애니메이션
  useEffect(() => {
    if (isExpanded) {
      setSpinRotation(720); // 2바퀴 회전
    } else {
      setSpinRotation(0);
    }
  }, [isExpanded]);

  // 중앙 위치 계산
  const getCenterPosition = () => {
    if (!cardRef.current) return { x: position.x, y: position.y };

    const container = cardRef.current.parentElement;
    if (!container) return { x: position.x, y: position.y };

    const centerX = container.clientWidth / 2 - 60;
    const centerY = container.clientHeight / 2 - 80;

    return { x: centerX, y: centerY };
  };

  // 추첨 중에는 호버/클릭 비활성화
  const isInteractionDisabled = drawingState === 'drawing';

  // 클릭 핸들러
  const handleClick = () => {
    if (isWinner || isInteractionDisabled) return;

    soundGenerator.playClick();
    setIsExpanded(!isExpanded);
  };

  // 표시 위치 및 스타일 결정
  const getDisplayStyle = () => {
    if (isWinner) {
      const centerPos = getCenterPosition();
      return {
        left: `${centerPos.x}px`,
        top: `${centerPos.y}px`,
        transform: 'rotate(0deg) scale(1.8)',
        transition: 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        zIndex: 100,
      };
    }

    if (isExpanded) {
      const centerPos = getCenterPosition();
      return {
        left: `${centerPos.x}px`,
        top: `${centerPos.y}px`,
        transform: `rotate(${spinRotation}deg) scale(2)`,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 50,
      };
    }

    if (isHovered) {
      return {
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `rotate(${rotation}deg) scale(1.15)`,
        transition: 'transform 0.2s ease-out',
        zIndex: 20,
      };
    }

    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: `rotate(${rotation}deg)`,
      transition: 'none',
      zIndex: 10,
    };
  };

  const displayStyle = getDisplayStyle();

  // 당첨자는 winner-stack에서 표시하므로 FloatingCard에서는 숨김
  if (isWinner) {
    return null;
  }

  return (
    <>
      {/* 확대 시 배경 오버레이 */}
      {isExpanded && (
        <div
          className="absolute inset-0 bg-black/30 z-40"
          onClick={handleClick}
        />
      )}

      <div
        ref={cardRef}
        className={`absolute ${drawingState === 'drawing' ? 'animate-pulse' : ''}`}
        style={{ ...displayStyle, cursor: isInteractionDisabled ? 'default' : 'pointer' }}
        onClick={handleClick}
        onMouseEnter={() => !isExpanded && !isInteractionDisabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`card w-28 relative overflow-visible floating-card-bg ${
            isExpanded
              ? 'ring-2 ring-primary shadow-2xl'
              : 'border border-base-300 shadow-lg'
          }`}
        >
          {isExpanded && (
            <div className="absolute -inset-2 bg-primary rounded-2xl blur-md opacity-40 pointer-events-none" />
          )}
          <figure className="px-4 pt-4 relative z-10">
            <img
              src={user.profileImageUrl}
              alt={user.username}
              className={`rounded-full w-16 h-16 object-cover ${
                isExpanded ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
              }}
            />
          </figure>
          <div className="card-body p-2 items-center text-center relative z-10">
            <p className="text-xs font-bold truncate w-full">
              {user.displayName}
            </p>
            <p className="text-xs truncate w-full opacity-60">
              @{user.username}
            </p>
            {isExpanded && (
              <a
                href={user.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs px-3 py-1 bg-primary text-primary-content rounded-md hover:bg-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                프로필 보기
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FloatingCard;
