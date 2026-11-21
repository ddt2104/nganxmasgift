import { useEffect, useState } from 'react';
import {
  BookmarkMinus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  RotateCcw,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import type { MemoryItem, VoucherStatus } from '../data/memories';

interface MemoryModalProps {
  memory: MemoryItem | null;
  memories: MemoryItem[];
  voucherStatus: VoucherStatus;
  onClose: () => void;
  onChangeVoucherStatus: (id: string, status: VoucherStatus) => void;
  onNavigate: (memory: MemoryItem) => void;
}

interface BurstParticle {
  id: number;
  left: string;
  delay: string;
  txMid: string;
  txEnd: string;
  rot: string;
  rotEnd: string;
  kind: 'heart' | 'spark';
}

export function MemoryModal({
  memory,
  memories,
  voucherStatus,
  onClose,
  onChangeVoucherStatus,
  onNavigate,
}: MemoryModalProps) {
  const [imgError, setImgError] = useState(false);
  const [bursts, setBursts] = useState<BurstParticle[]>([]);

  // Reset lỗi ảnh khi mở hoặc chuyển Polaroid
  useEffect(() => {
    setImgError(false);
  }, [memory?.id]);

  // Hỗ trợ phím Esc và mũi tên Trái / Phải để chuyển ảnh
  useEffect(() => {
    if (!memory) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowLeft') {
        const idx = memories.findIndex((m) => m.id === memory.id);
        const prev = memories[(idx - 1 + memories.length) % memories.length];
        onNavigate(prev);
      } else if (e.key === 'ArrowRight') {
        const idx = memories.findIndex((m) => m.id === memory.id);
        const next = memories[(idx + 1) % memories.length];
        onNavigate(next);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [memory, memories, onClose, onNavigate]);

  if (!memory) return null;

  const currentIdx = memories.findIndex((m) => m.id === memory.id);
  const prevMemory = memories[(currentIdx - 1 + memories.length) % memories.length];
  const nextMemory = memories[(currentIdx + 1) % memories.length];

  const triggerBurst = () => {
    const nextBursts: BurstParticle[] = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + i,
      left: `${12 + Math.random() * 76}%`,
      delay: `${Math.random() * 0.28}s`,
      txMid: `${(Math.random() - 0.5) * 36}px`,
      txEnd: `${(Math.random() - 0.5) * 72}px`,
      rot: `${(Math.random() - 0.5) * 24}deg`,
      rotEnd: `${(Math.random() - 0.5) * 44}deg`,
      kind: i % 3 === 0 ? 'spark' : 'heart',
    }));
    setBursts(nextBursts);
    window.setTimeout(() => setBursts([]), 1600);
  };

  const handleSetStatus = (nextStatus: VoucherStatus) => {
    onChangeVoucherStatus(memory.id, nextStatus);
    if (nextStatus === 'saved' || nextStatus === 'used') {
      triggerBurst();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#050810]/82 p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={memory.title ? 'memory-modal-title' : undefined}
    >
      <div
        className="animate-modal-rise relative w-full max-w-4xl rounded-2xl border border-[#ffd700]/30 bg-[#0d1424]/95 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh trên cùng của Modal */}
        <div className="flex items-center justify-end border-b border-white/10 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate(prevMemory)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-[#f8f6f0] hover:border-[#ffd700]/50 hover:text-[#ffd700] transition-colors cursor-pointer"
              aria-label="Kỷ niệm trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate(nextMemory)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-[#f8f6f0] hover:border-[#ffd700]/50 hover:text-[#ffd700] transition-colors cursor-pointer"
              aria-label="Kỷ niệm tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-[#f8f6f0] hover:border-[#ffd700]/50 hover:text-[#ffd700] transition-colors cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nội dung chính chia 2 cột cân đối */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 items-stretch">
          {/* Cột trái: Khung ảnh Polaroid tinh khôi (không chữ, không ngày tháng) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm rounded-xl bg-[#f8f5ec] p-3.5 pb-7 shadow-xl border border-[#d4af37]/40 text-[#241a16] -rotate-1">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-[#1a1514]">
                {!imgError ? (
                  <img
                    src={memory.imageUrl}
                    alt={memory.title || memory.voucherTitle}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-[#f8f6f0]"
                    style={{
                      background: `linear-gradient(135deg, ${memory.fallbackGradient[0]}, ${memory.fallbackGradient[1]})`,
                    }}
                  >
                    <Sparkles className="h-8 w-8 text-[#ffd700]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Lời nhắn nhật ký (nếu có) & Tấm Voucher */}
          <div
            className={`lg:col-span-7 flex flex-col gap-5 ${
              memory.title || memory.message ? 'justify-between' : 'justify-center'
            }`}
          >
            {(memory.title || memory.message) && (
              <div>
                {memory.title && (
                  <h2
                    id="memory-modal-title"
                    className="font-display text-2xl sm:text-3xl font-semibold text-[#ffd700] leading-tight"
                  >
                    {memory.title}
                  </h2>
                )}
                {memory.message && (
                  <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-[#f1ede4]/90">
                    {memory.message}
                  </p>
                )}
              </div>
            )}

            {/* Tấm Vé Quà Tặng / Voucher Tình Yêu */}
            <div
              className={`relative rounded-xl border p-4 sm:p-5 overflow-visible transition-colors ${
                voucherStatus === 'used'
                  ? 'border-emerald-400/35 bg-[#111b2a]'
                  : 'border-[#ffd700]/45 bg-[#151e33]'
              }`}
            >
              {/* Hai rãnh khuyết bán nguyệt hai bên tạo dáng vé xem phim cổ điển */}
              <div
                className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#0d1424] border-r border-[#ffd700]/45"
                aria-hidden="true"
              />
              <div
                className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#0d1424] border-l border-[#ffd700]/45"
                aria-hidden="true"
              />

              {/* Hiệu ứng tim bay & tia vàng khi lưu / đánh dấu đã dùng Voucher */}
              {bursts.length > 0 && (
                <div className="pointer-events-none absolute inset-0 overflow-visible z-20">
                  {bursts.map((p) => (
                    <span
                      key={p.id}
                      className="animate-float-heart absolute bottom-6 text-lg select-none"
                      style={
                        {
                          left: p.left,
                          animationDelay: p.delay,
                          '--tx-mid': p.txMid,
                          '--tx-end': p.txEnd,
                          '--rot': p.rot,
                          '--rot-end': p.rotEnd,
                        } as React.CSSProperties
                      }
                    >
                      {p.kind === 'heart' ? (
                        <Heart className="h-4 w-4 fill-[#ff4d6d] text-[#ff4d6d]" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[#ffd700]" />
                      )}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-dashed border-[#ffd700]/35 p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#ffd700]/85">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Ticket className="h-3.5 w-3.5" />
                    <span>
                      Voucher ·{' '}
                      {voucherStatus === 'used'
                        ? 'Đã sử dụng ✓'
                        : voucherStatus === 'saved'
                          ? 'Đã lưu trong ví ✨'
                          : 'Chưa lưu'}
                    </span>
                  </span>
                  <span className="font-mono-code text-[#f8f6f0]/65">
                    #{memory.voucherCode}
                  </span>
                </div>

                <h3
                  className={`mt-2 font-display text-xl sm:text-2xl font-semibold leading-snug ${
                    voucherStatus === 'used'
                      ? 'text-[#f8f6f0]/75 line-through decoration-[#ffd700]/50'
                      : 'text-[#ffffff]'
                  }`}
                >
                  {memory.voucherTitle}
                </h3>

                <p className="mt-1.5 text-xs sm:text-sm text-[#e5dfd3]/80 leading-relaxed">
                  {memory.voucherDesc}
                </p>

                <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col gap-3">
                  <span className="text-xs text-[#ffd700]/75 flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 shrink-0" />
                    <span>{memory.voucherExpiry}</span>
                  </span>

                  {/* Các nút thao tác Voucher: Lưu / Hủy lưu / Đã dùng */}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {voucherStatus === 'available' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetStatus('saved')}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#8b0000] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white border border-[#ffd700]/35 hover:bg-[#a61212] transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-lg"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                          <span>Lưu vào ví quà tặng ❤️</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus('used')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#e4dfd3] hover:border-emerald-400/50 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Đánh dấu đã dùng</span>
                        </button>
                      </>
                    )}

                    {voucherStatus === 'saved' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetStatus('available')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#e4dfd3]/85 hover:border-red-400/50 hover:text-red-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <BookmarkMinus className="h-4 w-4" />
                          <span>Hủy lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus('used')}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffd700]/18 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#ffd700] border border-[#ffd700]/55 hover:bg-[#ffd700]/28 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Đánh dấu đã dùng ✓</span>
                        </button>
                      </>
                    )}

                    {voucherStatus === 'used' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetStatus('available')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#e4dfd3]/80 hover:border-red-400/50 hover:text-red-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <BookmarkMinus className="h-4 w-4" />
                          <span>Hủy lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus('saved')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#ffd700] hover:border-[#ffd700]/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Chưa dùng (Giữ trong ví)</span>
                        </button>
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-emerald-300 whitespace-nowrap shrink-0">
                          <Check className="h-4 w-4" />
                          <span>Đã dùng ✓</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
