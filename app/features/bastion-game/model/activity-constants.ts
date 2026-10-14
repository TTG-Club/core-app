import type { FacilitySpaceCode, LedgerReason } from './schema';

/** Дней в ходе бастиона. */
export const DAYS_PER_TURN = 7;

/**
 * Цена и срок базового сооружения по пространству — из правил бастиона, те же,
 * что у сервера (`FacilitySpace`).
 */
export const BASIC_BUILD_TERMS: Record<
  FacilitySpaceCode,
  { cost: number; days: number }
> = {
  CRAMPED: { cost: 500, days: 20 },
  ROOMY: { cost: 1000, days: 45 },
  VAST: { cost: 3000, days: 125 },
};

export const SPACE_LABELS: Record<FacilitySpaceCode, string> = {
  CRAMPED: 'Тесное',
  ROOMY: 'Вместительное',
  VAST: 'Просторное',
};

export const ORDER_STATUS_COLORS = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
} as const;

export const LEDGER_REASON_LABELS: Record<LedgerReason, string> = {
  DEPOSIT: 'Пополнение',
  WITHDRAWAL: 'Списание',
  ORDER: 'Приказ',
  REFUND: 'Возврат',
  BUILD: 'Постройка',
  ENLARGE: 'Расширение',
};

export const ACTIVITY_LABELS = {
  journal: 'Журнал бастиона',
  ordersTab: 'Приказы',
  turnsTab: 'Ходы',
  ledgerTab: 'Казна',
  noOrders: 'Приказов пока не было',
  noTurns: 'Ходов пока не было',
  noLedger: 'Движений казны пока не было',
  turnLabel: 'Ход {turn}',
  orderTerms: 'отдан на ходу {given}, срок — ход {completes}',
  maintain: 'Обслуживание',
  maintainOrder: 'Обслуживать',
  maintainHint:
    '«Обслуживать» отдаётся всему бастиону вместо остальных приказов хода.',
  cancel: 'Отменить',
  cancelled: 'Приказ отменён',
  status: {
    ACTIVE: 'Выполняется',
    COMPLETED: 'Выполнен',
    CANCELLED: 'Отменён',
  },
  giveOrder: 'Приказ',
  giveOrderTitle: 'Приказ сооружению',
  order: 'Приказ',
  option: 'Вариант',
  optionPlaceholder: 'Без варианта',
  optionTerms: '{days} дн. · {cost}',
  free: 'бесплатно',
  costNote: 'цена по правилу: {note}',
  note: 'Пояснение',
  notePlaceholder: 'Тема исследования, что изготовить',
  submitOrder: 'Отдать приказ',
  orderGiven: 'Приказ отдан',
  turn: 'Сделать ход',
  turnTitle: 'Ход бастиона {turn}',
  turnHint:
    'Пройдут 7 дней: достроятся сооружения, завершатся приказы со сроком.',
  turnResults: 'Итоги приказов',
  turnResultPlaceholder: 'Что получили или узнали',
  turnNoCompleting: 'В этот ход приказы не завершаются.',
  turnEvent: 'Событие бастиона',
  turnEventHint:
    'Бастион обслуживали: бросьте по таблице событий бастиона и запишите итог.',
  turnDone: 'Ход сделан',
  treasury: 'Казна',
  treasuryTitle: 'Казна бастиона',
  treasuryAmount: 'Сумма, зм',
  treasuryAmountHint: 'Плюс — пополнение, минус — списание',
  treasuryNote: 'За что',
  treasuryDone: 'Казна обновлена',
  build: 'Построить',
  buildTitle: 'Новое базовое сооружение',
  buildHint: 'Строится за деньги из казны; готово через несколько ходов.',
  buildFacility: 'Сооружение',
  buildSpace: 'Пространство',
  buildTerms: '{cost} зм · {days} дн. (ходов: {turns})',
  buildDone: 'Стройка началась',
  addSpecial: 'Новое специализированное',
  addSpecialTitle: 'Новое специализированное сооружение',
  addSpecialHint:
    'Персонаж дорос до следующего лимита — сооружение появляется сразу и бесплатно.',
  addSpecialDone: 'Сооружение добавлено',
  enlarge: 'Расширить',
  enlargeDone: 'Расширение началось',
  remove: 'Убрать',
  removeTitle: 'Убрать сооружение?',
  removeDescription:
    'Незавершённые приказы сооружения отменятся без возврата денег, клетки исчезнут с плана.',
  removeDone: 'Сооружение убрано',
  building: 'Строится, готово на ходу {turn}',
  enlarging: 'Расширяется до «{space}», готово на ходу {turn}',
  actionError: 'Не удалось выполнить действие',
  confirm: 'Подтвердить',
  gold: 'зм',
  specialOption: '{name} ({level} ур.)',
  cancelAction: 'Отмена',
} as const;
