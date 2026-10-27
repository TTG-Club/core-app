/**
 * Переводит фокус на первое поле формы, которое не прошло проверку, или на
 * действие, восстанавливающее пустую группу полей (`data-invalid-focus`).
 * Работает только в браузере: вызывается из обработчика `@error` формы.
 *
 * @param formId значение атрибута `id` формы.
 */
export async function focusInvalidFormField(formId: string): Promise<void> {
  await nextTick();

  const form = document.getElementById(formId);

  const target =
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')
    ?? form?.querySelector<HTMLElement>('[data-invalid-focus]');

  target?.focus();
}
