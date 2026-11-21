import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Heart, KeyRound, Lock, Sparkles } from 'lucide-react';
import { MEMORY_QUIZ_QUESTIONS, type MemoryQuizQuestion } from '../data/memoryQuiz';
import { BubbleTitle } from './BubbleTitle';

interface LoginGateProps {
  questions?: MemoryQuizQuestion[];
  onPlayChime: () => void;
  onUnlock: () => void;
}

interface BurstHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  txMid: string;
  txEnd: string;
  rot: string;
  rotEnd: string;
}

const BURST_COLORS = ['#ef477c', '#ff7aa8', '#d92662', '#ffadc7', '#ffd700'];

const TEASE_MESSAGES = [
  'Ủa khoan, không phải Ngân mà cũng đòi mở quà hả? ',
  'Nút hồng bự chà bá bên kia kìa cô nương ơi ',
  'Đừng có chọc nữa mà, bấm Đăng nhập mở quà đi nè ',
  'Tui chạy đó nha, chỉ Ngân mới bắt được tui thôi ',
];

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function LoginGate({
  questions = MEMORY_QUIZ_QUESTIONS,
  onPlayChime,
  onUnlock,
}: LoginGateProps) {
  const [step, setStep] = useState<'envelope' | 'welcome' | 'quiz' | 'celebrating'>('envelope');
  const [openPhase, setOpenPhase] = useState<'idle' | 'flap' | 'rise' | 'fade'>('idle');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'wrong' | 'right'; text: string } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Nút tinh nghịch né trỏ chuột / nhấp thử
  const [teaseCount, setTeaseCount] = useState(0);
  const [dodgeOffset, setDodgeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hiệu ứng bắn tim bay nhẹ khi mở phong thư / trả lời đúng
  const [burstHearts, setBurstHearts] = useState<BurstHeart[]>([]);
  const nextBurstIdRef = useRef(1);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const spawnBurstHearts = useCallback((x: number, y: number, count = 6) => {
    const created: BurstHeart[] = Array.from({ length: count }, () => {
      const id = nextBurstIdRef.current++;
      return {
        id,
        x: x + (Math.random() - 0.5) * 38,
        y: y + (Math.random() - 0.5) * 24,
        size: 14 + Math.random() * 14,
        color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
        txMid: `${Math.round((Math.random() - 0.5) * 70)}px`,
        txEnd: `${Math.round((Math.random() - 0.5) * 120)}px`,
        rot: `${Math.round((Math.random() - 0.5) * 45)}deg`,
        rotEnd: `${Math.round((Math.random() - 0.5) * 75)}deg`,
      };
    });

    setBurstHearts((prev) => [...prev.slice(-20), ...created]);
    const cleanupId = window.setTimeout(() => {
      const ids = new Set(created.map((c) => c.id));
      setBurstHearts((prev) => prev.filter((item) => !ids.has(item.id)));
    }, 1400);
    timersRef.current.push(cleanupId);
  }, []);

  const handleOpenEnvelope = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (openPhase !== 'idle') return;
    setOpenPhase('flap');
    const rect = e.currentTarget.getBoundingClientRect();
    spawnBurstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
    onPlayChime();

    // Pha 1 -> Pha 2: Khi nắp xoay qua góc 90°, đưa nắp ra sau và cho tờ thư lướt lên êm ái
    const riseTimer = window.setTimeout(() => {
      setOpenPhase('rise');
    }, 240);

    // Pha 3: Phong thư mờ tan nhẹ nhàng trước khi hiện thẻ đăng nhập
    const fadeTimer = window.setTimeout(() => {
      setOpenPhase('fade');
    }, 620);

    const welcomeTimer = window.setTimeout(() => {
      setStep('welcome');
      setOpenPhase('idle');
    }, 880);

    timersRef.current.push(riseTimer, fadeTimer, welcomeTimer);
  };

  const handleStartQuiz = () => {
    onPlayChime();
    setStep('quiz');
    setQuizIndex(0);
    setSelectedOpt(null);
    setFeedback(null);
    setIsAdvancing(false);
  };

  const handlePlayfulDodge = () => {
    setTeaseCount((c) => c + 1);
    const angle = Math.random() * Math.PI * 2;
    const dist = 36 + Math.random() * 34;
    setDodgeOffset({
      x: Math.round(Math.cos(angle) * dist),
      y: Math.round(Math.sin(angle) * 18 - 6),
    });
  };

  // Nút "Không" chạy trốn liên tục khắp màn hình ở câu hỏi cuối
  const [runawayPos, setRunawayPos] = useState<{ x: number; y: number; rot: number } | null>(null);

  const currentQuestion = questions[quizIndex] ?? questions[0];

  const jumpRunawayNo = useCallback(() => {
    const pad = 20;
    const btnW = 152;
    const btnH = 48;
    const maxX = Math.max(pad + 20, window.innerWidth - btnW - pad);
    const maxY = Math.max(pad + 20, window.innerHeight - btnH - pad);

    setRunawayPos((prev) => {
      let nextX = pad + Math.random() * (maxX - pad);
      let nextY = pad + Math.random() * (maxY - pad);
      if (prev) {
        for (let attempt = 0; attempt < 5; attempt++) {
          if (Math.hypot(nextX - prev.x, nextY - prev.y) > 120) break;
          nextX = pad + Math.random() * (maxX - pad);
          nextY = pad + Math.random() * (maxY - pad);
        }
      }
      return {
        x: Math.round(nextX),
        y: Math.round(nextY),
        rot: Math.round((Math.random() - 0.5) * 24),
      };
    });
  }, []);

  // Đặt lại vị trí nút "Không" khi rời câu hỏi cuối hoặc đã chọn "Có"
  useEffect(() => {
    const isRunawayActive =
      step === 'quiz' && Boolean(currentQuestion?.isRunawayNo) && !isAdvancing;

    if (!isRunawayActive) {
      setRunawayPos(null);
    }
  }, [step, currentQuestion, isAdvancing]);

  const handleSelectAnswer = (optionIdx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (isAdvancing || !currentQuestion) return;

    // Tuyệt đối không cho phép chọn đáp án "Không"
    if (currentQuestion.isRunawayNo && optionIdx !== currentQuestion.correctIndex) {
      e.preventDefault();
      jumpRunawayNo();
      return;
    }

    setSelectedOpt(optionIdx);

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (optionIdx === currentQuestion.correctIndex) {
      setIsAdvancing(true);
      setFeedback({ type: 'right', text: currentQuestion.rightPraise });
      onPlayChime();
      spawnBurstHearts(cx, cy, 12);

      const nextTimer = window.setTimeout(() => {
        if (quizIndex + 1 < questions.length) {
          setQuizIndex((idx) => idx + 1);
          setSelectedOpt(null);
          setFeedback(null);
          setIsAdvancing(false);
        } else {
          setStep('celebrating');
          spawnBurstHearts(window.innerWidth / 2, window.innerHeight / 2, 18);
          const unlockTimer = window.setTimeout(() => {
            onUnlock();
          }, 1050);
          timersRef.current.push(unlockTimer);
        }
      }, 920);
      timersRef.current.push(nextTimer);
    } else {
      setFeedback({ type: 'wrong', text: currentQuestion.wrongHint });
      setShakeKey((k) => k + 1);
      spawnBurstHearts(cx, cy, 3);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:py-8">

      {/* Các hạt trái tim nổ tung theo con trỏ & lượt bấm */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-40">
        {burstHearts.map((b) => (
          <span
            key={b.id}
            className="animate-float-heart fixed"
            style={
              {
                left: `${b.x}px`,
                top: `${b.y}px`,
                '--tx-mid': b.txMid,
                '--tx-end': b.txEnd,
                '--rot': b.rot,
                '--rot-end': b.rotEnd,
              } as CSSProperties
            }
          >
            <Heart
              style={{ width: b.size, height: b.size, color: b.color }}
              className="fill-current drop-shadow-sm"
            />
          </span>
        ))}
      </div>

      {/* Tiêu đề "NGAN'S XMAS GIFT" phía trên phong thư / thẻ đăng nhập */}
      <div className="relative z-10 mb-5 sm:mb-7">
        <BubbleTitle />
      </div>

      {/* Bước 0: Phong thư bí mật — mở nắp 3D mượt mà không đè chữ */}
      {step === 'envelope' ? (
        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-300 ease-out ${
            openPhase === 'fade'
              ? 'opacity-0 scale-105 -translate-y-2'
              : 'animate-modal-rise opacity-100 scale-100'
          }`}
        >
          <button
            type="button"
            onClick={handleOpenEnvelope}
            aria-label="Mở phong thư bí mật"
            className={`group relative w-[300px] sm:w-[370px] h-[206px] sm:h-[246px] cursor-pointer focus:outline-none transition-transform duration-300 ${
              openPhase === 'idle' ? 'animate-envelope-float' : ''
            }`}
            style={{ perspective: '1100px' }}
          >
            {/* Đổ bóng mềm phía dưới phong thư */}
            <div
              aria-hidden="true"
              className={`absolute -bottom-5 left-1/2 -translate-x-1/2 h-6 w-[84%] rounded-full bg-[#9e355b]/22 blur-[6px] transition-all duration-300 ${
                openPhase === 'idle' ? 'group-hover:scale-105 opacity-100' : 'opacity-60 scale-95'
              }`}
            />

            {/* Thân phong thư màu kem hồng pastel */}
            <div className="relative w-full h-full rounded-[22px] border-2 border-[#f49cb8] bg-gradient-to-b from-[#fad3e1] to-[#ffeaf1] shadow-[0_24px_55px_-14px_rgba(143,45,82,0.34)] overflow-visible transition-transform duration-300 ease-out group-hover:scale-[1.025]">
              {/* Tờ giấy thư tinh khôi bên trong (không chữ) trượt lên êm ái sau khi nắp mở */}
              <div
                aria-hidden="true"
                className="absolute left-4 right-4 top-3 bottom-3 rounded-xl border border-[#f6c4d5] bg-gradient-to-b from-[#ffffff] to-[#fff7fa] p-4 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  zIndex: 8,
                  transform:
                    openPhase === 'rise' || openPhase === 'fade'
                      ? 'translate3d(0, -34px, 0) scale(1.02)'
                      : 'translate3d(0, 4px, 0) scale(1)',
                }}
              >
                <div className="h-full w-full rounded-lg border border-dashed border-[#f7cad9]/80" />
              </div>

              {/* Nếp gấp trái, phải & đáy phong thư che phần dưới tờ thư (z-10) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[20px] overflow-hidden"
                style={{ zIndex: 12 }}
              >
                <div
                  className="absolute inset-0 bg-[#ffdde9]"
                  style={{ clipPath: 'polygon(0 0, 52% 52%, 0 100%)' }}
                />
                <div
                  className="absolute inset-0 bg-[#ffd4e3]"
                  style={{ clipPath: 'polygon(100% 0, 48% 52%, 100% 100%)' }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#ffc6da] via-[#ffdce8] to-[#ffeaf1]"
                  style={{ clipPath: 'polygon(0 100%, 50% 44%, 100% 100%)' }}
                />
              </div>

              {/* Nắp tam giác phía trên bật mở 3D mượt (giữ z-20 khi 0->90°, chuyển xuống z-4 khi qua 90°) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transformOrigin: 'top center',
                  transform: openPhase === 'idle' ? 'rotateX(0deg)' : 'rotateX(-174deg)',
                  zIndex: openPhase === 'rise' || openPhase === 'fade' ? 4 : 20,
                }}
              >
                <div
                  className="w-full h-full rounded-t-[20px] bg-gradient-to-b from-[#fff2f7] via-[#ffe2ec] to-[#ffd2e1] drop-shadow-[0_4px_6px_rgba(143,56,86,0.14)]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 50% 58%)' }}
                />
              </div>

              {/* Con dấu sáp hình trái tim nhún nhảy ở giữa phong thư */}
              <div
                className={`pointer-events-none absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-250 ease-out ${
                  openPhase === 'idle' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}
              >
                <div className="animate-heart-bounce flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[#fff0f5] bg-gradient-to-br from-[#ff6a9a] via-[#e33d71] to-[#b91c4e] shadow-[0_8px_22px_rgba(211,42,97,0.48)] group-hover:scale-110 transition-transform">
                  <Heart className="h-7 w-7 sm:h-8 sm:w-8 fill-white text-white" />
                </div>
              </div>
            </div>
          </button>
        </div>
      ) : (
        /* Thẻ đăng nhập & xác minh kỷ niệm */
        <div
          key={shakeKey}
          className={`relative z-10 w-full max-w-[460px] rounded-[28px] border-2 border-[#f49ab6] bg-[#fff7fa]/96 p-5 sm:p-7 text-[#4a182b] shadow-[0_24px_60px_-14px_rgba(138,44,78,0.34)] ${
            shakeKey > 0 ? 'animate-playful-shake' : 'animate-modal-rise'
          }`}
        >
        {/* Huy hiệu trái tim nhún nhảy tinh nghịch trên đầu thẻ */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="animate-heart-bounce flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br from-[#ff7ea8] to-[#dc3568] shadow-[0_8px_20px_rgba(220,53,104,0.38)]">
            <Heart className="h-6 w-6 fill-white text-white" />
          </div>
        </div>

        {step === 'welcome' && (
          <div className="mt-4 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5a9c1] bg-[#ffeaf1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b93460] uppercase">
              <Lock className="h-3 w-3" />
              Hộp quà bí mật · Dành riêng cho Ngân
            </span>

            <p className="mt-4 rounded-2xl border border-[#f8c4d4] bg-[#fff0f5] px-4 py-3.5 text-sm sm:text-[15px] leading-relaxed font-medium text-[#5c2238]">
              “Đây là món quà dành riêng cho Ngân vì vậy bạn cần phải đăng nhập để có thể truy cập món quà”
            </p>

            {/* Nút hành động chính + nút trêu tinh nghịch */}
            <div className="mt-5 flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={handleStartQuiz}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e33d71] via-[#f05c8c] to-[#dc3568] px-5 py-3.5 text-sm sm:text-base font-bold text-white shadow-[0_10px_24px_-6px_rgba(220,53,104,0.52)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <KeyRound className="h-4 w-4 transition-transform group-hover:rotate-12" />
                <span>Đăng nhập</span>
              </button>

              <button
                type="button"
                onMouseEnter={handlePlayfulDodge}
                onClick={handlePlayfulDodge}
                style={{
                  transform: `translate3d(${dodgeOffset.x}px, ${dodgeOffset.y}px, 0)`,
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#f3b6c9] bg-white/80 px-4 py-2 text-xs sm:text-sm font-medium text-[#9e4765] hover:bg-[#fff0f5] transition-transform duration-200 cursor-pointer"
              >
                <span>Không phải Ngân</span>
              </button>
            </div>

            {teaseCount > 0 && (
              <p className="mt-3 text-xs font-medium text-[#c83768]">
                {TEASE_MESSAGES[(teaseCount - 1) % TEASE_MESSAGES.length]}
              </p>
            )}
          </div>
        )}

        {step === 'quiz' && currentQuestion && (
          <div className="mt-4">
            {/* Thanh tiến trình các trái tim */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('welcome');
                  setFeedback(null);
                  setSelectedOpt(null);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#9e4765] hover:bg-[#ffeaf1] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại</span>
              </button>

              <div className="flex items-center gap-1.5">
                {questions.map((q, idx) => {
                  const passed = idx < quizIndex || (idx === quizIndex && feedback?.type === 'right');
                  const active = idx === quizIndex;
                  return (
                    <Heart
                      key={q.id}
                      className={`h-4 w-4 transition-all duration-300 ${
                        passed
                          ? 'fill-[#e33d71] text-[#e33d71] scale-110'
                          : active
                            ? 'fill-[#ffb4cc] text-[#e33d71] scale-105'
                            : 'fill-[#ffe8f0] text-[#f2b3c8]'
                      }`}
                    />
                  );
                })}
                <span className="ml-1 text-xs font-semibold text-[#9b3257] tabular-nums">
                  {quizIndex + 1}/{questions.length}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-[#f7bfd1] bg-[#fff0f5] p-3.5 sm:p-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#611530] leading-snug">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Danh sách lựa chọn */}
            <div className="mt-3.5 grid grid-cols-1 gap-2">
              {currentQuestion.options.map((opt, idx) => {
                const isRunawayBtn =
                  Boolean(currentQuestion.isRunawayNo) && idx !== currentQuestion.correctIndex;
                const isFloatingAcrossScreen = isRunawayBtn && runawayPos !== null && !isAdvancing;

                // Khi chữ "Không" đã tách ra chạy khắp màn hình thì không render thêm trong khung nữa
                if (isFloatingAcrossScreen) {
                  return null;
                }

                const isSelected = selectedOpt === idx;
                const isRightChoice =
                  feedback?.type === 'right' && idx === currentQuestion.correctIndex;
                const isWrongChoice = feedback?.type === 'wrong' && isSelected;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAdvancing}
                    onMouseEnter={isRunawayBtn ? jumpRunawayNo : undefined}
                    onPointerDown={
                      isRunawayBtn
                        ? (e) => {
                            e.preventDefault();
                            jumpRunawayNo();
                          }
                        : undefined
                    }
                    onClick={(e) => handleSelectAnswer(idx, e)}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isRightChoice
                        ? 'border-[#1f9d68] bg-[#e9fbf3] text-[#146c47] shadow-sm'
                        : isWrongChoice
                          ? 'border-[#e0486d] bg-[#ffe7ed] text-[#9f1d3e]'
                          : 'border-[#f4c0d1] bg-white hover:border-[#e85d8b] hover:bg-[#fff3f7] text-[#4a182b] active:scale-[0.99]'
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isRightChoice
                          ? 'bg-[#1f9d68] text-white'
                          : isWrongChoice
                            ? 'bg-[#e0486d] text-white'
                            : 'bg-[#ffe6ef] text-[#b93460] group-hover:bg-[#e33d71] group-hover:text-white'
                      }`}
                    >
                      {isRightChoice ? <CheckCircle2 className="h-3.5 w-3.5" /> : OPTION_LABELS[idx]}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    <Heart
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isRightChoice
                          ? 'fill-[#1f9d68] text-[#1f9d68] scale-110'
                          : 'fill-transparent text-[#f09bb6] group-hover:fill-[#f05c8c] group-hover:text-[#f05c8c] group-hover:scale-110'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                className={`mt-3 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-medium leading-relaxed ${
                  feedback.type === 'right'
                    ? 'border-[#96dfc0] bg-[#ebfbf3] text-[#166d48]'
                    : 'border-[#f6adc0] bg-[#ffeaf0] text-[#a72448]'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>
        )}

        {step === 'celebrating' && (
          <div className="mt-5 flex flex-col items-center py-4 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe6ef] text-[#e33d71]">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#7a193b]">
              Đúng hết rồi nè Ngân ơi! 💖
            </h2>
            <p className="mt-2 text-sm text-[#6b2740]">
              Quả cầu tuyết Giáng sinh đang từ từ mở ra dành riêng cho em...
            </p>
          </div>
        )}
      </div>
      )}

      {/* Nút "Không" nhảy chạy trốn khi cố rê chuột hoặc ấn vào */}
      {step === 'quiz' && currentQuestion?.isRunawayNo && runawayPos && !isAdvancing && (
        <button
          type="button"
          tabIndex={-1}
          onMouseEnter={jumpRunawayNo}
          onPointerDown={(e) => {
            e.preventDefault();
            jumpRunawayNo();
          }}
          onClick={(e) => {
            e.preventDefault();
            jumpRunawayNo();
          }}
          style={{
            transform: `translate3d(${runawayPos.x}px, ${runawayPos.y}px, 0) rotate(${runawayPos.rot}deg)`,
          }}
          className="fixed top-0 left-0 z-50 inline-flex items-center gap-2.5 rounded-xl border-2 border-[#f49ab6] bg-[#fff7fa] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#9e4765] shadow-[0_12px_28px_rgba(164,56,94,0.28)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-not-allowed select-none"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#ffe6ef] text-xs font-bold text-[#b93460]">
            B
          </span>
          <span>Không</span>
        </button>
      )}
    </div>
  );
}
