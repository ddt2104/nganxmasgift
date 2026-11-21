/**
 * Tiêu đề "NGAN'S XMAS GIFT" phong cách chữ bong bóng bo tròn viền trắng dày & ánh bóng hồng pastel
 */
export function BubbleTitle() {
  return (
    <div className="pointer-events-none flex flex-col items-center text-center select-none">
      <h1 className="sr-only">Ngan&apos;s Xmas Gift</h1>
      <svg
        viewBox="0 0 760 116"
        className="w-[270px] sm:w-[440px] md:w-[540px] h-auto overflow-visible"
        role="img"
        aria-label="Ngan's Xmas Gift"
      >
        <defs>
          <linearGradient id="pink-bubble-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f698ac" />
            <stop offset="55%" stopColor="#ef7b93" />
            <stop offset="100%" stopColor="#e56681" />
          </linearGradient>

          {/* Đổ bóng hồng mận nhẹ phía sau lớp viền trắng để chữ sticker hài hòa trên nền hồng phấn */}
          <filter id="sticker-shadow" x="-12%" y="-15%" width="124%" height="140%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4.5"
              floodColor="#8f3856"
              floodOpacity="0.34"
            />
          </filter>

          {/* Tạo ánh bóng trắng bo cong bên trong từng chữ cái hồng */}
          <filter id="pink-inner-gloss" x="-10%" y="-10%" width="120%" height="120%">
            <feMorphology in="SourceAlpha" operator="erode" radius="2.2" result="erodedBase" />
            <feOffset in="erodedBase" dx="2.6" dy="3.2" result="shiftedBase" />
            <feComposite
              in="erodedBase"
              in2="shiftedBase"
              operator="out"
              result="innerArc"
            />
            <feFlood floodColor="#ffffff" floodOpacity="0.78" result="glossColor" />
            <feComposite in="glossColor" in2="innerArc" operator="in" result="glossLayer" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="glossLayer" />
            </feMerge>
          </filter>
        </defs>

        {/* Lớp viền trắng dày kiểu sticker bên ngoài */}
        <text
          x="380"
          y="78"
          textAnchor="middle"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="16"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#sticker-shadow)"
          style={{
            fontFamily: "'Cherry Bomb One', 'Fredoka', cursive, sans-serif",
            fontSize: '64px',
            letterSpacing: '2px',
          }}
        >
          NGAN&apos;S XMAS GIFT
        </text>

        {/* Lớp chữ hồng pastel bóng mượt bên trên */}
        <text
          x="380"
          y="78"
          textAnchor="middle"
          fill="url(#pink-bubble-grad)"
          filter="url(#pink-inner-gloss)"
          style={{
            fontFamily: "'Cherry Bomb One', 'Fredoka', cursive, sans-serif",
            fontSize: '64px',
            letterSpacing: '2px',
          }}
        >
          NGAN&apos;S XMAS GIFT
        </text>
      </svg>
    </div>
  );
}
