import { useState, useEffect } from 'react';
import { DrawHistory } from '../types';
import { getDrawHistory, deleteDrawHistory, clearAllHistory, formatDate } from '../utils/history';
import { soundGenerator } from '../utils/sounds';
import Button from './Button';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<DrawHistory[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'winners' | 'participants'>('winners');

  useEffect(() => {
    if (isOpen) {
      setHistory(getDrawHistory());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteDrawHistory(id);
    setHistory(getDrawHistory());
    soundGenerator.playClick();
  };

  const handleClearAll = () => {
    if (confirm('모든 히스토리를 삭제하시겠습니까?')) {
      clearAllHistory();
      setHistory([]);
      soundGenerator.playClick();
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setActiveTab('winners');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl max-h-[85vh] bg-base-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl text-base-content">추첨 히스토리</h3>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-error"
              onClick={handleClearAll}
            >
              전체 삭제
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 opacity-60">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-base-content">저장된 추첨 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="card bg-base-200 shadow-sm"
              >
                <div className="card-body p-4">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(entry.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎉</div>
                      <div>
                        <p className="font-bold text-base-content text-lg">
                          {entry.eventName}
                        </p>
                        <p className="text-sm opacity-70 text-base-content">
                          {formatDate(entry.date)} · 당첨 {entry.winners.length}명 / 참가 {entry.totalParticipants}명
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
                        title="삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform ${expandedId === entry.id ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === entry.id && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                      {/* Tabs */}
                      <div className="tabs tabs-boxed mb-4 bg-base-300">
                        <button
                          className={`tab ${activeTab === 'winners' ? 'tab-active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('winners');
                          }}
                        >
                          🏆 당첨자 ({entry.winners.length})
                        </button>
                        <button
                          className={`tab ${activeTab === 'participants' ? 'tab-active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('participants');
                          }}
                        >
                          👥 전체 참가자 ({entry.participants?.length || entry.totalParticipants})
                        </button>
                      </div>

                      {/* Winners Tab */}
                      {activeTab === 'winners' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {entry.winners.map((winner, index) => (
                            <div
                              key={winner.username}
                              className="flex items-center gap-3 p-2 bg-base-100 rounded-lg"
                            >
                              <div className="relative">
                                {entry.showRanking && index === 0 && (
                                  <span className="absolute -top-1 -right-1 text-sm">👑</span>
                                )}
                                <img
                                  src={winner.profileImageUrl}
                                  alt={winner.username}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-400"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${winner.username}&background=random&size=64`;
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate text-base-content">
                                  {winner.displayName}
                                </p>
                                <a
                                  href={winner.profileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  @{winner.username}
                                </a>
                              </div>
                              {entry.showRanking && (
                                <div className="badge badge-warning badge-sm">
                                  {index + 1}등
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Participants Tab */}
                      {activeTab === 'participants' && (
                        <div className="max-h-60 overflow-y-auto">
                          {entry.participants && entry.participants.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {entry.participants.map((participant) => {
                                const isWinner = entry.winners.some(w => w.username === participant.username);
                                return (
                                  <div
                                    key={participant.username}
                                    className={`flex items-center gap-2 p-2 rounded-lg ${isWinner ? 'bg-yellow-500/20 ring-1 ring-yellow-400' : 'bg-base-100'}`}
                                  >
                                    <img
                                      src={participant.profileImageUrl}
                                      alt={participant.username}
                                      className="w-8 h-8 rounded-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://ui-avatars.com/api/?name=${participant.username}&background=random&size=64`;
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs truncate text-base-content">
                                        @{participant.username}
                                      </p>
                                    </div>
                                    {isWinner && (
                                      <span className="text-xs">🏆</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-center text-sm opacity-60 py-4">
                              참가자 목록이 저장되지 않은 기록입니다.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-action">
          <Button variant="primary" size="md" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}

export default HistoryModal;
