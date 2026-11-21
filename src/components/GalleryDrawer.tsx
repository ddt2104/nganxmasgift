import { useState } from 'react';
import {
  BookmarkMinus,
  Check,
  CheckCircle2,
  Gift,
  Heart,
  RotateCcw,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import type { MemoryItem, VoucherStatus } from '../data/memories';

interface GalleryDrawerProps {
  isOpen: boolean;
  memories: MemoryItem[];
  voucherStatuses: Record<string, VoucherStatus>;
  secretWishes: Record<string, string>;
  onClose: () => void;
  onSelectMemory: (memory: MemoryItem) => void;
  onChangeVoucherStatus: (id: string, status: VoucherStatus) => void;
}

type FilterMode = 'all' | 'available' | 'saved' | 'used';

export function GalleryDrawer({
  isOpen,
  memories,
  voucherStatuses,
  secretWishes,
  onClose,
  onSelectMemory,
  onChangeVoucherStatus,
}: GalleryDrawerProps) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const getStatus = (id: string): VoucherStatus => voucherStatuses[id] ?? 'available';

  const savedCount = memories.filter((m) => getStatus(m.id) === 'saved').length;
  const usedCount = memories.filter((m) => getStatus(m.id) === 'used').length;
  const availableCount = memories.length - savedCount - usedCount;

  const filteredMemories = memories.filter((item) => {
    const st = getStatus(item.id);
    if (filter === 'all') return true;
    return st === filter;
  });

  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-[#050810]/85 p-0 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
    >
      <div
        className="animate-modal-rise flex flex-col w-full max-w-6xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl border border-[#ffd700]/28 bg-[#0c1322]/98 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header của Bộ sưu tập */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-7 py-4">
          <div>
            <h2
              id="gallery-title"
              className="font-display text-2xl sm:text-3xl font-semibold text-[#ffd700]"
            >
              Bộ sưu tập Kỷ niệm & Ví Voucher
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#e4dfd3]/75 tabular-nums">
              {memories.length} khoảnh khắc · Chưa lưu {availableCount} · Đã lưu {savedCount} · Đã dùng {usedCount}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bộ lọc trạng thái Voucher */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#162036] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#8b0000] text-white'
                    : 'text-[#e4dfd3]/75 hover:text-white'
                }`}
              >
                Tất cả ({memories.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('available')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filter === 'available'
                    ? 'bg-[#8b0000] text-white'
                    : 'text-[#e4dfd3]/75 hover:text-white'
                }`}
              >
                Chưa lưu ({availableCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('saved')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filter === 'saved'
                    ? 'bg-[#8b0000] text-white'
                    : 'text-[#e4dfd3]/75 hover:text-white'
                }`}
              >
                Đã lưu ({savedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('used')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filter === 'used'
                    ? 'bg-[#8b0000] text-white'
                    : 'text-[#e4dfd3]/75 hover:text-white'
                }`}
              >
                Đã dùng ({usedCount})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-[#f8f6f0] hover:border-[#ffd700]/50 hover:text-[#ffd700] transition-colors cursor-pointer"
              aria-label="Đóng danh sách"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Danh sách dạng lưới Responsive */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-7">
          {filteredMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Gift className="h-10 w-10 text-[#ffd700]/60 mb-3" />
              <p className="font-display text-2xl text-[#f8f6f0]">
                {filter === 'saved'
                  ? 'Chưa có Voucher nào đang lưu trong ví'
                  : filter === 'used'
                    ? 'Em chưa đánh dấu Voucher nào đã sử dụng'
                    : 'Không còn Voucher nào ở mục chưa lưu ✨'}
              </p>
              <p className="mt-1.5 text-sm text-[#e4dfd3]/70">
                Chọn tab “Tất cả” hoặc chạm vào từng thẻ để thay đổi trạng thái Voucher nhé.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMemories.map((item) => {
                const status = getStatus(item.id);
                const imgBroken = failedImages[item.id];

                return (
                  <article
                    key={item.id}
                    className={`group flex flex-col justify-between rounded-xl border transition-colors overflow-hidden ${
                      status === 'used'
                        ? 'border-emerald-400/35 bg-[#101928]'
                        : status === 'saved'
                          ? 'border-[#ffd700]/45 bg-[#151e33]'
                          : 'border-white/12 bg-[#11192b] hover:border-[#ffd700]/40'
                    }`}
                  >
                    {/* Phần ảnh bấm để mở chi tiết */}
                    <button
                      type="button"
                      onClick={() => onSelectMemory(item)}
                      className="text-left focus:outline-none cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#161c2c]">
                        {!imgBroken ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title || item.voucherTitle}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                              status === 'used' ? 'opacity-75' : ''
                            }`}
                          />
                        ) : (
                          <div
                            className="flex h-full w-full flex-col items-center justify-center p-4 text-center"
                            style={{
                              background: `linear-gradient(135deg, ${item.fallbackGradient[0]}, ${item.fallbackGradient[1]})`,
                            }}
                          >
                            <Sparkles className="h-7 w-7 text-[#ffd700]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322]/45 via-transparent to-transparent" />
                      </div>

                      {(item.title || item.message) && (
                        <div className="p-4 pb-2">
                          {item.title && (
                            <h3 className="font-display text-xl font-semibold text-[#ffd700] leading-snug">
                              {item.title}
                            </h3>
                          )}
                          {item.message && (
                            <p className="mt-1.5 text-xs text-[#e4dfd3]/75 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Thẻ Voucher đi kèm bên dưới */}
                    <div
                      className={`p-4 flex flex-col gap-3 ${
                        item.title || item.message ? 'pt-2' : 'pt-4'
                      }`}
                    >
                      <div className="rounded-lg border border-dashed border-[#ffd700]/30 bg-[#0b1120] p-3">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#ffd700]/80">
                          <span className="inline-flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5" />
                            <span>Voucher đi kèm</span>
                          </span>
                          <span
                            className={
                              status === 'used'
                                ? 'text-emerald-300 font-medium'
                                : status === 'saved'
                                  ? 'text-[#ffd700] font-medium'
                                  : 'text-[#e4dfd3]/60'
                            }
                          >
                            {status === 'used'
                              ? 'Đã dùng ✓'
                              : status === 'saved'
                                ? 'Đã lưu ✨'
                                : 'Chưa lưu'}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-sm font-semibold leading-snug ${
                            status === 'used'
                              ? 'text-white/65 line-through decoration-[#ffd700]/50'
                              : 'text-white'
                          }`}
                        >
                          {item.voucherTitle}
                        </p>
                      </div>

                      {/* Các nút trạng thái Voucher trên thẻ 2D */}
                      <div className="flex flex-wrap items-center gap-2">
                        {status === 'available' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onSelectMemory(item)}
                              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#f8f6f0] hover:border-[#ffd700]/40 hover:text-[#ffd700] transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Xem chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => onChangeVoucherStatus(item.id, 'saved')}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8b0000] px-3 py-2 text-xs font-semibold text-white hover:bg-[#a61212] border border-[#ffd700]/30 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Heart className="h-3.5 w-3.5 fill-current" />
                              <span>Lưu Voucher</span>
                            </button>
                          </>
                        )}

                        {status === 'saved' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onChangeVoucherStatus(item.id, 'available')}
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#e4dfd3]/85 hover:border-red-400/50 hover:text-red-300 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <BookmarkMinus className="h-3.5 w-3.5" />
                              <span>Hủy lưu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onChangeVoucherStatus(item.id, 'used')}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ffd700]/18 px-3 py-2 text-xs font-semibold text-[#ffd700] border border-[#ffd700]/50 hover:bg-[#ffd700]/28 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Đã dùng</span>
                            </button>
                          </>
                        )}

                        {status === 'used' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onChangeVoucherStatus(item.id, 'available')}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#e4dfd3]/80 hover:border-red-400/50 hover:text-red-300 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <BookmarkMinus className="h-3.5 w-3.5" />
                              <span>Hủy lưu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onChangeVoucherStatus(item.id, 'saved')}
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#ffd700] hover:border-[#ffd700]/45 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Chưa dùng</span>
                            </button>
                            <span className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 whitespace-nowrap">
                              <Check className="h-3.5 w-3.5" />
                              <span>Đã dùng</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
