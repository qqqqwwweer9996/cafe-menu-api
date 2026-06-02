// 샘플 카페 메뉴 데이터.
// 수동 시드 스크립트(`npm run seed`)와 빈 DB 자동 시드(SEED_ON_EMPTY=true)에서 공용으로 사용한다.
// 휘발성 디스크 배포 환경(예: Render 무료 티어)에서 배포 직후 시연용 데이터로 쓰인다.
export const SAMPLE_MENUS = [
  {
    name: "아메리카노",
    description: "에스프레소에 물을 더한 기본 커피",
    price: 4500,
    category: "coffee",
    imageUrl: "https://picsum.photos/seed/americano/400/300",
  },
  {
    name: "카페라떼",
    description: "에스프레소와 부드러운 스팀밀크",
    price: 5000,
    category: "coffee",
    imageUrl: "https://picsum.photos/seed/latte/400/300",
  },
  {
    name: "카푸치노",
    description: "풍성한 우유 거품의 클래식 커피",
    price: 5000,
    category: "coffee",
    imageUrl: "https://picsum.photos/seed/cappuccino/400/300",
  },
  {
    name: "바닐라 라떼",
    description: "바닐라 시럽을 더한 달콤한 라떼",
    price: 5500,
    category: "coffee",
    imageUrl: "https://picsum.photos/seed/vanilla/400/300",
  },
  {
    name: "녹차",
    description: "은은한 향의 우전 녹차",
    price: 4800,
    category: "tea",
    imageUrl: "https://picsum.photos/seed/greentea/400/300",
  },
  {
    name: "캐모마일 티",
    description: "편안한 휴식을 위한 허브티",
    price: 4800,
    category: "tea",
    imageUrl: "https://picsum.photos/seed/chamomile/400/300",
  },
  {
    name: "자몽 에이드",
    description: "상큼한 자몽 과육이 가득한 에이드",
    price: 6000,
    category: "ade",
    imageUrl: "https://picsum.photos/seed/grapefruit/400/300",
  },
  {
    name: "레몬 에이드",
    description: "톡 쏘는 청량한 레몬 에이드",
    price: 5800,
    category: "ade",
    imageUrl: "https://picsum.photos/seed/lemon/400/300",
  },
  {
    name: "치즈케이크",
    description: "진한 뉴욕 스타일 치즈케이크",
    price: 6500,
    category: "dessert",
    imageUrl: "https://picsum.photos/seed/cheesecake/400/300",
  },
  {
    name: "티라미수",
    description: "마스카포네 크림의 클래식 디저트",
    price: 6800,
    category: "dessert",
    imageUrl: "https://picsum.photos/seed/tiramisu/400/300",
    isAvailable: false,
  },
];
