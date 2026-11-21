import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Gift,
  Music,
  RotateCcw,
  Snowflake,
  VolumeX,
} from 'lucide-react';
import { MusicBoxSynth } from './audio/musicBox';
import { BubbleTitle } from './components/BubbleTitle';
import { GalleryDrawer } from './components/GalleryDrawer';
import { LoginGate } from './components/LoginGate';
import { MemoryModal } from './components/MemoryModal';
import { PortraitBackdrop } from './components/PortraitBackdrop';
import { SnowGlobeCanvas } from './components/SnowGlobeCanvas';
import { MEMORIES_DATA, type MemoryItem, type VoucherStatus } from './data/memories';

const LEGACY_STORAGE_KEY = 'vutrukyniem_redeemed_vouchers_v1';
const STATUS_STORAGE_KEY = 'vutrukyniem_voucher_statuses_v1';
const WISHES_STORAGE_KEY = 'vutrukyniem_secret_wishes_v1';

function loadVoucherStatuses(): Record<string, VoucherStatus> {
  const result: Record<string, VoucherStatus> = {};
  try {
    const rawStatuses = localStorage.getItem(STATUS_STORAGE_KEY);
    if (rawStatuses) {
      const parsed = JSON.parse(rawStatuses);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (v === 'saved' || v === 'used') {
            result[k] = v;
          }
        }
        return result;
      }
    }
    // Tự động chuyển đổi dữ liệu cũ (nếu có) sang trạng thái 'saved'
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (Array.isArray(parsedLegacy)) {
        parsedLegacy.forEach((id) => {
          if (typeof id === 'string') result[id] = 'saved';
        });
      }
    }
  } catch {
    // Bỏ qua nếu localStorage bị hạn chế
  }
  return result;
}

function loadSecretWishes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(WISHES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.trim()) {
          clean[k] = v;
        }
      }
      return clean;
    }
  } catch {
    // Bỏ qua nếu localStorage bị hạn chế
  }
  return {};
}

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [voucherStatuses, setVoucherStatuses] = useState<Record<string, VoucherStatus>>(() =>
    loadVoucherStatuses()
  );
  const [secretWishes, setSecretWishes] = useState<Record<string, string>>(() => loadSecretWishes());
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [shakeSignal, setShakeSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [shakeNotice, setShakeNotice] = useState<string | null>(null);

  const synthRef = useRef<MusicBoxSynth | null>(null);
  const lastMotionShakeRef = useRef(0);
  const motionEnabledRef = useRef(false);

  // Dọn dẹp Web Audio khi unmount
  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new MusicBoxSynth();
    }
    return synthRef.current;
  }, []);

  const triggerSnowGlobeShake = useCallback(
    (source: 'button' | 'motion') => {
      setShakeSignal((n) => n + 1);
      getSynth().playSparkleChime();
      if (source === 'motion') {
        setShakeNotice('Đã cảm nhận nhịp lắc từ điện thoại của em ❄️');
        window.setTimeout(() => setShakeNotice(null), 2600);
      }
    },
    [getSynth]
  );

  // Lắng nghe cảm biến lắc DeviceMotion trên thiết bị di động
  const attachMotionListener = useCallback(() => {
    if (motionEnabledRef.current) return;
    motionEnabledRef.current = true;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const total = Math.abs(acc.x ?? 0) + Math.abs(acc.y ?? 0) + Math.abs(acc.z ?? 0);
      const now = Date.now();
      if (total > 29 && now - lastMotionShakeRef.current > 1800) {
        lastMotionShakeRef.current = now;
        triggerSnowGlobeShake('motion');
      }
    };

    window.addEventListener('devicemotion', handleMotion);
  }, [triggerSnowGlobeShake]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const DME = window.DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      // Android / trình duyệt không yêu cầu requestPermission có thể gắn listener trực tiếp
      if (typeof DME.requestPermission !== 'function') {
        attachMotionListener();
      }
    }
  }, [attachMotionListener]);

  const handleShakeButtonClick = async () => {
    // Xin quyền cảm biến lắc trên iOS 13+ nếu đang chạy trong thao tác chạm nút
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const DME = window.DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DME.requestPermission === 'function' && !motionEnabledRef.current) {
        try {
          const res = await DME.requestPermission();
          if (res === 'granted') {
            attachMotionListener();
          }
        } catch {
          // Người dùng từ chối hoặc thiết bị không hỗ trợ vẫn lắc quả cầu bình thường
        }
      }
    }
    triggerSnowGlobeShake('button');
  };

  const handleToggleMusic = async () => {
    const synth = getSynth();
    if (isMusicPlaying) {
      synth.stop();
      setIsMusicPlaying(false);
    } else {
      const started = await synth.start();
      setIsMusicPlaying(started);
    }
  };

  const handleChangeVoucherStatus = useCallback(
    (id: string, status: VoucherStatus) => {
      setVoucherStatuses((prev) => {
        const next = { ...prev };
        if (status === 'available') {
          delete next[id];
        } else {
          next[id] = status;
        }
        try {
          localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Bỏ qua lỗi quota storage
        }
        return next;
      });
      if (status === 'saved' || status === 'used') {
        getSynth().playSparkleChime();
      }
    },
    [getSynth]
  );

  // Phím tắt H để ẩn/hiện thanh điều khiển cho chế độ ngắm toàn cảnh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'h' || e.key === 'H') && !selectedMemory && !isGalleryOpen) {
        setIsDockCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMemory, isGalleryOpen]);

  const activeWalletCount = Object.keys(voucherStatuses).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f8cddb] text-[#f8f6f0] select-none">
      {/* 0. Phông nền chân dung hồng phấn hài hòa có chuyển động parallax dịu nhẹ */}
      <PortraitBackdrop isModalOpen={Boolean(selectedMemory) || isGalleryOpen} />

      {!isUnlocked ? (
        <LoginGate
          onPlayChime={() => getSynth().playSparkleChime()}
          onUnlock={() => setIsUnlocked(true)}
        />
      ) : (
        <>
          {/* 1. Không gian Quả Cầu Tuyết 3D toàn màn hình */}
          <SnowGlobeCanvas
            memories={MEMORIES_DATA}
            voucherStatuses={voucherStatuses}
            secretWishes={secretWishes}
            shakeSignal={shakeSignal}
            resetSignal={resetSignal}
            isModalOpen={Boolean(selectedMemory) || isGalleryOpen}
            onSelectMemory={(mem) => setSelectedMemory(mem)}
          />

          {/* 2. Tiêu đề "Ngan's Xmas Gift" căn giữa ngay phía trên quả cầu tuyết */}
          <header className="pointer-events-none fixed top-2.5 sm:top-4 left-0 right-0 z-10 flex flex-col items-center px-14 sm:px-6">
            <BubbleTitle />

        {/* Nút bật / tắt nhạc hộp góc trên bên phải */}
        <button
          type="button"
          onClick={handleToggleMusic}
          className={`pointer-events-auto fixed top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center justify-center gap-2 rounded-xl border h-10 px-3 sm:px-3.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors shadow-lg cursor-pointer ${
            isMusicPlaying
              ? 'border-[#ffd700]/65 bg-[#8b0024]/92 text-[#ffd700]'
              : 'border-[#f7b8cc]/45 bg-[#361322]/85 text-[#fff2f5] hover:border-[#ffd700]/60 hover:text-[#ffd700]'
          }`}
          aria-pressed={isMusicPlaying}
          title="Bật hoặc tắt giai điệu hộp nhạc Giáng sinh"
        >
          {isMusicPlaying ? (
            <>
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Đang phát nhạc hộp</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4" />
              <span className="hidden sm:inline">Bật nhạc Giáng sinh</span>
            </>
          )}
        </button>
      </header>

      {/* Thông báo nhẹ khi cảm biến lắc điện thoại kích hoạt */}
      {shakeNotice && (
        <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-20 rounded-lg border border-[#ffd700]/50 bg-[#361322]/92 px-4 py-2 text-xs text-[#ffd700] shadow-lg whitespace-nowrap">
          {shakeNotice}
        </div>
      )}

      {/* 3. Thanh điều khiển hợp nhất gắn ở mép dưới (Collapsible Bottom Dock) */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center w-[94vw] max-w-[780px]">
        <button
          type="button"
          onClick={() => setIsDockCollapsed((v) => !v)}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-[#f7b8cc]/40 bg-[#361322]/88 px-3 py-1 text-[11px] font-medium text-[#ffe6ee]/85 hover:text-[#ffd700] transition-colors cursor-pointer"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Mở thanh điều khiển</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Thu gọn</span>
            </>
          )}
        </button>

        {!isDockCollapsed && (
          <nav
            aria-label="Điều khiển Quả cầu tuyết"
            className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 rounded-2xl border border-[#f7b8cc]/40 bg-[#321220]/88 px-3 py-2.5 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleShakeButtonClick}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9e0b2e] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white border border-[#ffd700]/40 hover:bg-[#b8143b] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Snowflake className="h-4 w-4 text-[#ffd700]" />
              <span>Lắc quả cầu tuyết ❄️</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ffd700]/40 bg-[#4b1a2f] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#ffd700] hover:bg-[#5e223c] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
            >
              <Gift className="h-4 w-4" />
              <span>
                Danh sách Kỷ niệm & Voucher 🎁 ({activeWalletCount}/{MEMORIES_DATA.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setResetSignal((n) => n + 1)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#f7b8cc]/30 bg-white/10 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#fff2f5] hover:border-[#ffd700]/55 hover:text-[#ffd700] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Đưa camera về góc nhìn chính diện"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Góc nhìn chuẩn</span>
            </button>
          </nav>
        )}
      </div>

      {/* 4. Modal Kỷ niệm & Tấm Voucher Tình Yêu */}
      <MemoryModal
        memory={selectedMemory}
        memories={MEMORIES_DATA}
        voucherStatus={selectedMemory ? voucherStatuses[selectedMemory.id] ?? 'available' : 'available'}
        onClose={() => setSelectedMemory(null)}
        onChangeVoucherStatus={handleChangeVoucherStatus}
        onNavigate={(mem) => setSelectedMemory(mem)}
      />

          {/* 5. Danh sách lưới 2D toàn bộ Kỷ niệm & Ví Voucher */}
          <GalleryDrawer
            isOpen={isGalleryOpen}
            memories={MEMORIES_DATA}
            voucherStatuses={voucherStatuses}
            secretWishes={secretWishes}
            onClose={() => setIsGalleryOpen(false)}
            onSelectMemory={(mem) => {
              setIsGalleryOpen(false);
              setSelectedMemory(mem);
            }}
            onChangeVoucherStatus={handleChangeVoucherStatus}
          />
        </>
      )}
    </div>
  );
}
