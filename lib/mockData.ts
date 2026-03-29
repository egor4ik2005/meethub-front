export interface MeetEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  price: string;
  description: string;
  category: string;
  imageUrl: string;
  program: string[];
}

export const MOSCOW_EVENTS: MeetEvent[] = [
  {
    id: '1',
    title: 'VK Fest 2024',
    date: 'Суббота, 20 Июл',
    time: '12:00',
    location: 'Лужники',
    address: 'Стадион Лужники, Москва',
    latitude: 55.7151,
    longitude: 37.5539,
    price: '2 500 ₽',
    description:
      'Главный музыкальный фестиваль лета от ВКонтакте. Три дня живой музыки, фудкорты, творческие зоны и масса активностей для всей семьи. Выступят топовые артисты Russia и зарубежные хедлайнеры.',
    category: 'Музыка',
    imageUrl:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop',
    program: [
      '12:00 — Открытие и регистрация',
      '14:00 — Первый блок выступлений',
      '17:00 — Хедлайнер основной сцены',
      '21:00 — Ночной блок и afterparty',
    ],
  },
  {
    id: '2',
    title: 'Артефакт: Выставка ИИ-искусства',
    date: 'Воскресенье, 21 Июл',
    time: '11:00',
    location: 'Гараж',
    address: 'Музей Гараж, Парк Горького, Москва',
    latitude: 55.7298,
    longitude: 37.6018,
    price: '800 ₽',
    description:
      'Интерактивная выставка работ, созданных искусственным интеллектом в соавторстве с художниками. Живопись, скульптура, видеоарт и звуковые инсталляции, которые переосмысляют творческий процесс.',
    category: 'Искусство',
    imageUrl:
      'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&auto=format&fit=crop',
    program: [
      '11:00 — Открытие галерей',
      '13:00 — Лекция куратора выставки',
      '15:00 — Воркшоп "Создай свой ИИ-арт"',
      '18:00 — Закрытие экспозиции',
    ],
  },
  {
    id: '3',
    title: 'Дизайн-выходные на Флаконе',
    date: 'Суббота, 03 Авг',
    time: '10:00',
    location: 'Дизайн-завод Флакон',
    address: 'Флакон, ул. Большая Новодмитровская, 36',
    latitude: 55.8017,
    longitude: 37.5878,
    price: 'Бесплатно',
    description:
      'Два дня погружения в мир дизайна, типографики и брендинга. Мастер-классы, лекции от дизайнеров ведущих студий России, маркет независимых брендов и ярмарка принтов.',
    category: 'Дизайн',
    imageUrl:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop',
    program: [
      '10:00 — Открытие маркета',
      '12:00 — Лекция "Тренды дизайна 2024"',
      '14:00 — Мастер-класс по каллиграфии',
      '17:00 — Portfolio review с арт-директорами',
    ],
  },
  {
    id: '4',
    title: 'TEDxMoscow 2024',
    date: 'Пятница, 09 Авг',
    time: '18:00',
    location: 'Сколково',
    address: 'Инновационный центр Сколково, Москва',
    latitude: 55.7,
    longitude: 37.36,
    price: '3 000 ₽',
    description:
      'Ежегодная конференция TED в Москве. Восемь спикеров с идеями, достойными распространения — от нейронаук до устойчивого развития городов. Живое общение, нетворкинг и вдохновение.',
    category: 'Конференция',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    program: [
      '18:00 — Регистрация и welcome drinks',
      '19:00 — Открытие и первый блок докладов',
      '20:30 — Нетворкинг пауза',
      '21:00 — Финальный блок и закрытие',
    ],
  },
  {
    id: '5',
    title: 'Джазовые вечера в Парке Горького',
    date: 'Четверг, 15 Авг',
    time: '20:00',
    location: 'Парк Горького',
    address: 'Центральный Парк Культуры и Отдыха, Москва',
    latitude: 55.7287,
    longitude: 37.6012,
    price: 'Бесплатно',
    description:
      'Еженедельные джазовые концерты под открытым небом в самом сердце Москвы. Профессиональные музыканты, мягкий вечерний воздух и атмосфера лёгкости — лучший формат летнего вечера.',
    category: 'Музыка',
    imageUrl:
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&auto=format&fit=crop',
    program: [
      '20:00 — Открытие и разминочный сет',
      '20:30 — Выступление Moscow Jazz Quartet',
      '21:30 — Guestset: DJ Soul Collective',
      '23:00 — Завершение',
    ],
  },
];
