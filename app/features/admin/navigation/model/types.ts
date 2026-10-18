/**
 * Элемент навигации админ-панели
 */
export interface NavigationItem {
  label: string;
  icon: string;
  to: string;
  /** Адрес создания новой записи раздела — у разделов, где это частое действие */
  createRoute?: string;
}

/**
 * Группа разделов админ-панели: на дашборде — отдельная панель со своим заголовком
 */
export interface NavigationGroup {
  title: string;
  icon: string;
  items: ReadonlyArray<NavigationItem>;
}
