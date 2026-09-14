/** Ручка сайта, через которую профиль ставит и убирает аватарку. */
export const PROFILE_AVATAR_API_PATH = '/api/user/profile/avatar';

/** Поле multipart-формы с файлом: сервер читает только его. */
export const PROFILE_AVATAR_FORM_FIELD = 'file';

/** Подписи аватарки в профиле: меню, тосты и подсказки для скринридера. */
export const PROFILE_AVATAR_LABELS = {
  menuAria: 'Действия с аватаркой',
  upload: 'Загрузить аватарку',
  replace: 'Заменить аватарку',
  remove: 'Удалить аватарку',
  uploaded: 'Аватарка обновлена',
  removed: 'Аватарка удалена',
  error: 'Не удалось изменить аватарку',
} as const;
