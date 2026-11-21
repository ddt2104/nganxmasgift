import { type CSSProperties, useEffect, useRef } from 'react';

interface PortraitBackdropProps {
  isModalOpen: boolean;
}

interface BokehDot {
  left: string;
  top: string;
  size: number;
  bx: string;
  by: string;
  dur: string;
  delay: string;
  tone: 'pearl' | 'rose' | 'champagne';
}

const BOKEH_DOTS: BokehDot[] = [
  { left: '8%', top: '18%', size: 78, bx: '16px', by: '-26px', dur: '13s', delay: '-2s', tone: 'pearl' },
  { left: '19%', top: '72%', size: 112, bx: '-14px', by: '-30px', dur: '16s', delay: '-5s', tone: 'rose' },
  { left: '34%', top: '12%', size: 52, bx: '18px', by: '18px', dur: '11s', delay: '-1s', tone: 'champagne' },
  { left: '44%', top: '82%', size: 88, bx: '-12px', by: '-20px', dur: '15s', delay: '-7s', tone: 'pearl' },
  { left: '63%', top: '16%', size: 96, bx: '-18px', by: '22px', dur: '17s', delay: '-4s', tone: 'rose' },
  { left: '72%', top: '38%', size: 64, bx: '14px', by: '-24px', dur: '12s', delay: '-6s', tone: 'champagne' },
  { left: '79%', top: '76%', size: 124, bx: '-20px', by: '-28px', dur: '19s', delay: '-9s', tone: 'pearl' },
  { left: '88%', top: '24%', size: 84, bx: '-12px', by: '18px', dur: '14s', delay: '-3s', tone: 'rose' },
  { left: '91%', top: '58%', size: 58, bx: '15px', by: '-16px', dur: '13s', delay: '-8s', tone: 'champagne' },
  { left: '54%', top: '26%', size: 46, bx: '10px', by: '-18px', dur: '10s', delay: '-2.5s', tone: 'pearl' },
];

const BOKEH_GRADIENTS: Record<BokehDot['tone'], string> = {
  pearl: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,244,248,0.28) 52%, transparent 74%)',
  rose: 'radial-gradient(circle, rgba(255,198,218,0.68) 0%, rgba(247,154,186,0.24) 55%, transparent 76%)',
  champagne: 'radial-gradient(circle, rgba(255,240,206,0.66) 0%, rgba(255,215,150,0.2) 52%, transparent 75%)',
};

/**
 * Phông nền chân dung kết hợp nền màu nước hồng phấn hài hòa và chuyển động parallax dịu nhẹ
 */
export function PortraitBackdrop({ isModalOpen }: PortraitBackdropProps) {
  const portraitParallaxRef = useRef<HTMLDivElement | null>(null);
  const bokehParallaxRef = useRef<HTMLDivElement | null>(null);
  const isModalOpenRef = useRef(isModalOpen);
  isModalOpenRef.current = isModalOpen;

  // Theo dõi vị trí con trỏ để tạo parallax chiều sâu mượt mà (Zero React re-render)
  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (isModalOpenRef.current) return;
      const nx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      const ny = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      targetX = nx;
      targetY = ny;
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const animate = () => {
      const damping = isModalOpenRef.current ? 0.03 : 0.055;
      const goalX = isModalOpenRef.current ? 0 : targetX;
      const goalY = isModalOpenRef.current ? 0 : targetY;

      currentX += (goalX - currentX) * damping;
      currentY += (goalY - currentY) * damping;

      if (portraitParallaxRef.current) {
        portraitParallaxRef.current.style.transform = `translate3d(${(-currentX * 14).toFixed(2)}px, ${(-currentY * 10).toFixed(2)}px, 0)`;
      }
      if (bokehParallaxRef.current) {
        bokehParallaxRef.current.style.transform = `translate3d(${(currentX * 22).toFixed(2)}px, ${(currentY * 16).toFixed(2)}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none"
      style={{
        background:
          'radial-gradient(circle at 28% 36%, #fdecf2 0%, #f9d2df 44%, #f4b9cd 78%, #ec9fb9 100%)',
      }}
    >
      {/* 1. Lớp loang màu nước hồng phấn - kem ấm chuyển động chậm */}
      <div
        className="animate-watercolor-a absolute -inset-[12%] opacity-85"
        style={{
          background:
            'radial-gradient(ellipse 52% 46% at 76% 28%, rgba(255, 245, 249, 0.72) 0%, rgba(255, 212, 228, 0.25) 55%, transparent 78%)',
        }}
      />
      <div
        className="animate-watercolor-b absolute -inset-[10%] opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 48% 52% at 62% 76%, rgba(244, 152, 184, 0.42) 0%, rgba(255, 220, 232, 0.2) 52%, transparent 78%)',
        }}
      />

      {/* 2. Lớp ảnh chân dung hòa tan viền mềm mại & hiệu ứng hít thở Ken Burns */}
      <div ref={portraitParallaxRef} className="absolute inset-0">
        {/* Desktop & Tablet: đặt cân đối phía trái-giữa để khuôn mặt & mũ nổi bật hài hòa cạnh quả cầu tuyết */}
        <div
          className="hidden md:block absolute top-[-2%] left-[1%] lg:left-[4%] xl:left-[7%] h-[106vh] aspect-[3/4] max-w-[68vw]"
          style={{
            WebkitMaskImage:
              'radial-gradient(ellipse 68% 82% at 49% 48%, #000 50%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.18) 88%, transparent 100%)',
            maskImage:
              'radial-gradient(ellipse 68% 82% at 49% 48%, #000 50%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.18) 88%, transparent 100%)',
          }}
        >
          <img
            src="/assets/aistudio/image_94057711.png"
            alt=""
            draggable={false}
            className="animate-portrait-breath w-full h-full object-cover object-top"
            style={{
              filter: 'saturate(1.03) contrast(0.98) brightness(1.02)',
            }}
          />
        </div>

        {/* Mobile (màn hình dọc): căn giữa phía trên với lớp sương hồng nhẹ để quả cầu tuyết hòa quyện bên dưới */}
        <div className="block md:hidden absolute inset-[-3%]">
          <img
            src="/assets/aistudio/image_94057711.png"
            alt=""
            draggable={false}
            className="animate-portrait-breath w-full h-full object-cover object-[50%_10%]"
            style={{
              opacity: 0.88,
              filter: 'saturate(1.02) contrast(0.97) brightness(1.03)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(253,234,240,0.22) 0%, rgba(251,218,230,0.08) 38%, rgba(244,185,205,0.42) 100%)',
            }}
          />
        </div>
      </div>

      {/* 3. Quầng sáng ấm nhẹ quanh tâm quả cầu tuyết giúp thủy tinh và cây thông nổi khối */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 56%, rgba(255, 246, 232, 0.34) 0%, rgba(255, 224, 236, 0.14) 28%, transparent 56%)',
        }}
      />

      {/* 4. Hạt bokeh ánh ngọc trai, hồng phấn và vàng champagne trôi lơ lửng */}
      <div ref={bokehParallaxRef} className="absolute inset-0">
        {BOKEH_DOTS.map((dot, idx) => (
          <span
            key={idx}
            className="animate-bokeh-float absolute rounded-full"
            style={
              {
                left: dot.left,
                top: dot.top,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                background: BOKEH_GRADIENTS[dot.tone],
                '--bx': dot.bx,
                '--by': dot.by,
                '--dur': dot.dur,
                '--delay': dot.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* 5. Viền vignette hồng ấm rất nhẹ tạo cảm giác studio lãng mạn */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 88% 84% at 50% 48%, transparent 52%, rgba(164, 72, 108, 0.18) 100%)',
        }}
      />
    </div>
  );
}
