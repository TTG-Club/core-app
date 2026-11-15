import type { FunctionalComponent } from 'vue';

/**
 * Компонент-пустышка: рисует содержимое слота без собственного элемента. Нужен
 * там, где обёртка появляется по условию, а разметка внутри неё одна и та же
 * (см. MarkupRender).
 *
 * @param _props - Пропсов нет
 * @param context - Контекст с содержимым слота
 * @returns Содержимое слота по умолчанию
 */
export const MarkupPassthrough: FunctionalComponent = (_props, context) =>
  context.slots.default?.();
