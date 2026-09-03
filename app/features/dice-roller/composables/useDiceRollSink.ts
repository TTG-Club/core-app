import type { DiceDetail } from '../types';

/** Бросок в том виде, в каком его получает сторонний приёмник. */
export interface BroadcastRoll {
  /** Формула, как её записал игрок. */
  notation: string;
  total: number;
  /** Что выпало на кубах, по группам одного вида. */
  details: Array<DiceDetail>;

  /** Чем бросали: оружие, навык, характеристика. */
  subject?: string;

  /** Что за бросок: атака, урон, проверка. */
  label?: string;
}

/** Куда уходит бросок помимо истории: например, в чат игровой комнаты. */
export type DiceRollSink = (roll: BroadcastRoll) => void;

/**
 * Приёмник бросков.
 *
 * Бросок с листа персонажа, из таблицы или из роллера делает один и тот же
 * обработчик, и он ничего не знает о том, где сейчас находится игрок. Чтобы
 * комната показывала броски своей группе, она ставит сюда свой приёмник, пока
 * открыта, — а обработчик просто отдаёт ему каждый удавшийся бросок.
 *
 * Не `provide`/`inject`: лист персонажа открывается в дровере, который
 * монтируется вне дерева страницы, и до него внедрение не доходит.
 */
export const useDiceRollSink = createSharedComposable(() => {
  const sink = shallowRef<DiceRollSink | null>(null);

  /**
   * Ставит приёмник. Прежний заменяется: одновременно открыта одна комната.
   * @param next Куда отдавать броски.
   */
  function setSink(next: DiceRollSink): void {
    sink.value = next;
  }

  /**
   * Снимает приёмник — комната закрыта, и броски снова никуда не уходят.
   * @param current Приёмник, который снимают; чужой не трогаем.
   */
  function clearSink(current: DiceRollSink): void {
    if (sink.value === current) {
      sink.value = null;
    }
  }

  /**
   * Отдаёт бросок приёмнику, если он есть.
   * @param roll Удавшийся бросок.
   */
  function broadcast(roll: BroadcastRoll): void {
    sink.value?.(roll);
  }

  return { broadcast, clearSink, setSink };
});
