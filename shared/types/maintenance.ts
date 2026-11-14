/**
 * Сайт, у которого свой режим «сайт закрыт на обновление»: `5e24` — этот,
 * `5e14` — сайт D&D 2014 (ttg-club-frontend), он берёт настройку отсюда.
 */
export type MaintenanceSiteId = '5e24' | '5e14';

/**
 * Режим «сайт закрыт на обновление» одного сайта. Пока он включён, всем,
 * кроме администраторов и ролей из `allowedRoles`, вместо страниц
 * показывается заглушка.
 */
export interface MaintenanceSiteSettings {
  enabled: boolean;
  /**
   * Роли, которых пускают на закрытый сайт, помимо администраторов (те проходят
   * всегда). Строки, а не `Role`: роль, заведённая в core-api позже, чем
   * обновился сайт, тоже должна сохраняться и работать.
   */
  allowedRoles: string[];
  /** Заголовок заглушки. */
  title: string;
  /** Текст заглушки — обычный текст, переносы строк сохраняются. */
  message: string;
  /** Когда настройку сохранили (ISO); `null` — не сохраняли, действует умолчание. */
  updatedAt: string | null;
  /** Кто сохранил настройку; `null` — не сохраняли. */
  updatedBy: string | null;
}

/**
 * Настройка сайта для его сервера: без того, кто и когда её сохранил.
 * Публичный роут отдаёт её серверу сайта D&D 2014.
 */
export type MaintenancePublicSiteSettings = Pick<
  MaintenanceSiteSettings,
  'enabled' | 'allowedRoles' | 'title' | 'message'
>;

/** То, что администратор меняет в форме режима обновления. */
export type MaintenanceSettingsUpdate = Pick<
  MaintenanceSiteSettings,
  'enabled' | 'allowedRoles' | 'title' | 'message'
>;

/**
 * Решение по конкретному запросу: показывать ли заглушку. У открытого сайта
 * заголовок и текст пустые — посетителю они не нужны.
 */
export interface MaintenanceGate {
  /** Показать заглушку вместо страницы. */
  blocked: boolean;
  /** Посетитель вошёл, но его роль не пускают — форма входа ему не нужна. */
  signedIn: boolean;
  title: string;
  message: string;
}
