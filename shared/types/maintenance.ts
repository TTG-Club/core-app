/**
 * Режим «сайт закрыт на обновление» одного сайта. Пока он включён, всем,
 * кроме администраторов, вместо страниц показывается заглушка.
 */
export interface MaintenanceSiteSettings {
  enabled: boolean;
  /** Заголовок заглушки. */
  title: string;
  /** Текст заглушки — обычный текст, переносы строк сохраняются. */
  message: string;
  /** Когда настройку сохранили (ISO); `null` — не сохраняли, действует умолчание. */
  updatedAt: string | null;
  /** Кто сохранил настройку; `null` — не сохраняли. */
  updatedBy: string | null;
}

/** То, что администратор меняет в форме режима обновления. */
export type MaintenanceSettingsUpdate = Pick<
  MaintenanceSiteSettings,
  'enabled' | 'title' | 'message'
>;

/**
 * Решение по конкретному запросу: показывать ли заглушку. У открытого сайта
 * заголовок и текст пустые — посетителю они не нужны.
 */
export interface MaintenanceGate {
  /** Показать заглушку вместо страницы. */
  blocked: boolean;
  /** Посетитель вошёл, но он не администратор — форма входа ему не нужна. */
  signedIn: boolean;
  title: string;
  message: string;
}
