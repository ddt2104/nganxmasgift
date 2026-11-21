/**
 * ============================================================================
 * CÂU HỎI KỶ NIỆM XÁC MINH DÀNH RIÊNG CHO NGÂN
 * ============================================================================
 * Bạn có thể dễ dàng chỉnh sửa hoặc thêm câu hỏi kỷ niệm của hai bạn tại đây:
 * - question: Nội dung câu hỏi hiển thị trên thẻ
 * - options: Danh sách 4 đáp án lựa chọn
 * - correctIndex: Vị trí đáp án đúng (bắt đầu từ 0)
 * - wrongHint: Lời trêu tinh nghịch khi chọn nhầm
 * - rightPraise: Lời khen ngọt ngào khi trả lời đúng
 * ============================================================================
 */

export interface MemoryQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  wrongHint: string;
  rightPraise: string;
  isRunawayNo?: boolean;
}

export const MEMORY_QUIZ_QUESTIONS: MemoryQuizQuestion[] = [
  {
    id: 'quiz-1',
    question: 'Buổi hẹn đầu tiên của hai đứa mình diễn ra trong khung cảnh nào ? ',
    options: [
      'Quán cà phê nhỏ ngày gió se lạnh',
      'Sân vận động cổ vũ bóng đá',
      'Phòng tập gym nâng tạ',
      'Siêu thị điện máy cuối tuần',
    ],
    correctIndex: 0,
    wrongHint: 'Ấy chà, có phải Ngân giả mạo hong đó? Nghĩ lại góc quán ấm áp hôm ấy xem nào 😜',
    rightPraise: 'Chuẩn không cần chỉnh! Lớp bọt latte hôm ấy vẫn ngọt tới giờ 💖',
  },
  {
    id: 'quiz-2',
    question: 'Chúng mình chính thức yêu nhau vào ngày nào ?',
    options: ['24/12/2024', '25/10/2024', '14/02/2025', '20/10/2024'],
    correctIndex: 1,
    wrongHint: 'Suýt nữa đúng rồi! Nhớ lại ngày đặc biệt tháng 10 năm 2024 nha 🥺💖',
    rightPraise: 'Chuẩn đét! Ngày 25/10/2024 mãi là ngày đẹp nhất của tụi mình 💘',
  },
  {
    id: 'quiz-3',
    question: 'Tài có yêu Ngân không?',
    options: ['Có', 'Không'],
    correctIndex: 0,
    wrongHint: '',
    rightPraise: 'Quá chuẩn luôn! Tài yêu Ngân nhất trên đời ✨💖',
    isRunawayNo: true,
  },
];
