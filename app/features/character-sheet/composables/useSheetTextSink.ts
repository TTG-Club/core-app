/** Кусок листа, отправляемый в чат: заголовок и текст без разметки. */
export interface SharedSheetText {
  /** Что это: название особенности, заклинания, предмета. */
  title: string;

  /** Сам текст. */
  text: string;
}

/** Куда уходит текст с листа: например, в чат игровой комнаты. */
export type SheetTextSink = (shared: SharedSheetText) => void;

/**
 * Приёмник текста с листа персонажа.
 *
 * За столом текст особенности или заклинания зачитывают вслух — здесь его
 * кладут в чат, чтобы группа прочитала сама. Лист не знает, открыта ли
 * комната: пока она открыта, она ставит сюда свой приёмник, а лист лишь
 * показывает кнопку и отдаёт ему выбранный кусок.
 *
 * Не `provide`/`inject`: лист открывается в дровере, который монтируется вне
 * дерева страницы, и до него внедрение не доходит.
 */
export const useSheetTextSink = createSharedComposable(() => {
  const sink = shallowRef<SheetTextSink | null>(null);

  /** Есть ли куда отправлять: без комнаты кнопка на листе не нужна. */
  const hasSink = computed(() => !!sink.value);

  /**
   * Ставит приёмник. Прежний заменяется: одновременно открыта одна комната.
   * @param next Куда отдавать текст.
   */
  function setSink(next: SheetTextSink): void {
    sink.value = next;
  }

  /**
   * Снимает приёмник — комната закрыта, и отправлять снова некуда.
   * @param current Приёмник, который снимают; чужой не трогаем.
   */
  function clearSink(current: SheetTextSink): void {
    if (sink.value === current) {
      sink.value = null;
    }
  }

  /**
   * Отдаёт текст приёмнику, если он есть.
   * @param shared Заголовок и текст.
   */
  function share(shared: SharedSheetText): void {
    sink.value?.(shared);
  }

  return { clearSink, hasSink, setSink, share };
});
