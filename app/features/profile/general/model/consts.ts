export const ProfileCardUI = {
  header: 'px-6 py-4',
  body: 'p-6',
} as const;

export const DISPLAY_NAME_API_PATH = '/api/user/profile/display-name';

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 24;

export const PERSONAL_DATA_CARD_TITLE = 'Личные данные';

export const DISPLAY_NAME_LABEL = 'Отображаемое имя';
export const DISPLAY_NAME_DESCRIPTION = 'Показывается на сайте вместо логина';
export const DISPLAY_NAME_PLACEHOLDER = 'Например, Отважный Странник';
export const DISPLAY_NAME_SUBMIT_LABEL = 'Сохранить';

export const LOGIN_LABEL = 'Логин';
export const LOGIN_DESCRIPTION = 'Уникальный идентификатор, скрыт от других';
export const EMAIL_LABEL = 'Email';
export const EMAIL_DESCRIPTION = 'Адрес электронной почты';

export const DISPLAY_NAME_SUCCESS_TOAST_TITLE = 'Имя обновлено';
export const DISPLAY_NAME_SUCCESS_TOAST_DESCRIPTION =
  'Теперь оно отображается на сайте вместо логина';
export const DISPLAY_NAME_SUCCESS_TOAST_COLOR = 'success';

export const DISPLAY_NAME_ERROR_TOAST_TITLE = 'Не удалось сменить имя';
export const DISPLAY_NAME_ERROR_TOAST_DESCRIPTION = 'Попробуйте ещё раз';
export const DISPLAY_NAME_ERROR_TOAST_COLOR = 'error';
