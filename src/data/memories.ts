/**
 * ============================================================================
 * DỮ LIỆU CHÒM SAO KỶ NIỆM & VÍ VOUCHER TÌNH YÊU
 * ============================================================================
 * Bạn có thể dễ dàng cá nhân hóa nội dung tại đây:
 * - imageUrl: Thay bằng đường dẫn ảnh thật của hai bạn (ví dụ: "/anh-ky-niem/1.jpg" hoặc URL HTTPS)
 * - date: Ngày tháng kỷ niệm
 * - title: Tiêu đề ngắn hiển thị dưới khung ảnh Polaroid
 * - message: Lời nhắn / nhật ký ngọt ngào khi bấm vào ảnh
 * - voucherTitle: Tên tấm Voucher Tình Yêu đi kèm
 * - voucherDesc: Mô tả chi tiết quyền lợi của Voucher
 * - voucherCode: Mã vé kỷ niệm (chỉ để trang trí)
 * - fallbackGradient: Màu nền dự phòng nếu ảnh chưa tải kịp
 * ============================================================================
 */

export type VoucherStatus = 'available' | 'saved' | 'used';

export interface MemoryItem {
  id: string;
  /** Đường dẫn ảnh kỷ niệm (có thể thay bằng link ảnh thật của hai đứa) */
  imageUrl: string;
  /** Ngày tháng kỷ niệm */
  date: string;
  /** Tiêu đề ngắn trên khung ảnh Polaroid */
  title: string;
  /** Đoạn nhật ký / lời nhắn ngọt ngào */
  message: string;
  /** Tên tấm Voucher Tình Yêu */
  voucherTitle: string;
  /** Điều khoản / mô tả quyền lợi Voucher */
  voucherDesc: string;
  /** Mã số vé quà tặng */
  voucherCode: string;
  /** Hạn sử dụng */
  voucherExpiry: string;
  /** Màu gradient dự phòng nếu ảnh không tải được */
  fallbackGradient: [string, string];
}

export const MEMORIES_DATA: MemoryItem[] = [
  {
    id: 'mem-01',
    imageUrl: '/src/assets/images/memory_first_coffee_1794833149438.jpg',
    date: '14 . 11 . 2024',
    title: 'Buổi hẹn cà phê đầu tiên',
    message:
      'Anh vẫn nhớ mãi cái cách em cười và trêu đùa với anh, khoảnh khắc khiến mọi mùa đông về sau trở nên dịu dàng.',
    voucherTitle: 'Voucher Đi xem phim & Bắp nước không giới hạn',
    voucherDesc: 'Áp dụng cho bất kỳ bộ phim nào em muốn xem, kèm combo bắp phô mai size lớn và nước tùy chọn.',
    voucherCode: 'NOEL-01-CINE',
    voucherExpiry: 'Dùng bất cứ khi nào',
    fallbackGradient: ['#3b1d2a', '#8b0000'],
  },
  {
    id: 'mem-02',
    imageUrl: '/src/assets/images/memory_winter_walk_1794833150263.jpg',
    date: '20 . 12 . 2024',
    title: '',
    message: '',
    voucherTitle: 'Voucher Massage vai gáy',
    voucherDesc: 'Dành riêng cho những tối em tan làm mệt mỏi.',
    voucherCode: 'NOEL-02-RELAX',
    voucherExpiry: 'Dùng bất cứ khi nào',
    fallbackGradient: ['#1a253a', '#4a3520'],
  },
  {
    id: 'mem-03',
    imageUrl: '/src/assets/images/memory_christmas_eve_1794833150726.jpg',
    date: '24 . 12 . 2024',
    title: '',
    message: '',
    voucherTitle: 'Voucher Một bữa tối tự chọn',
    voucherDesc: 'Em chọn nhà hàng hoặc món ăn yêu thích bất kỳ — từ lẩu ấm nóng, đồ Nhật đến steak dưới ánh nến.',
    voucherCode: 'NOEL-03-DINNER',
    voucherExpiry: 'Dùng bất cứ khi nào',
    fallbackGradient: ['#4a0e17', '#132a1c'],
  },
  {
    id: 'mem-04',
    imageUrl: '/src/assets/images/memory_seaside_dawn_1794833150509.jpg',
    date: '14 . 02 . 2025',
    title: '',
    message: '',
    voucherTitle: 'Voucher du lịch bất kì',
    voucherDesc: 'Một kỳ nghỉ 2 ngày 1 đêm tại bất cứ đâu mà em muốn',
    voucherCode: 'NOEL-04-ESCAPE',
    voucherExpiry: 'Dùng bất cứ khi nào',
    fallbackGradient: ['#472836', '#a4645e'],
  },
  {
    id: 'mem-05',
    imageUrl: '/src/assets/images/memory_candlelight_dinner_1794833151403.jpg',
    date: '08 . 03 . 2025',
    title: '',
    message: '',
    voucherTitle: 'Voucher Gội đầu dưỡng sinh tại gia',
    voucherDesc: 'Dịch vụ chăm sóc tóc thư giãn tại nhà do chính anh phục vụ.',
    voucherCode: 'NOEL-05-SPA',
    voucherExpiry: 'Dùng bất cứ khi nào',
    fallbackGradient: ['#2d1b2e', '#6d2e2e'],
  },
  {
    id: 'mem-06',
    imageUrl: '/src/assets/images/memory_vintage_bookstore_1794833151162.jpg',
    date: '19 . 07 . 2025',
    title: '',
    message: '',
    voucherTitle: 'Voucher ĐẶC BIỆT',
    voucherDesc: '5 năm 1 tỉ, 10 năm 2 tỉ',
    voucherCode: 'NOEL-06-SHOP',
    voucherExpiry: 'Chỉ khả dụng khi em làm vợ anh thui nha',
    fallbackGradient: ['#2c221e', '#755336'],
  },
  {
    id: 'mem-07',
    imageUrl: '/src/assets/images/memory_starry_night_1794833151769.jpg',
    date: '25 . 12 . 2026',
    title: '',
    message: '',
    voucherTitle: 'Voucher QUEEN',
    voucherDesc: 'Một tấm thẻ quyền năng cho phép em đưa ra bất kỳ yêu cầu hợp lý hoặc bất hợp lý nào anh sẽ thực hiện ngay không một lời từ chối trong khả năng của mình.',
    voucherCode: 'NOEL-07-WISH',
    voucherExpiry: 'Dùng bất cứ khi nào',
    fallbackGradient: ['#0c172b', '#23395d'],
  },
];
