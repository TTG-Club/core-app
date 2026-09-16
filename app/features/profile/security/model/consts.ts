export const ProfileCardUI = {
  header: 'px-6 py-4',
  body: 'p-6',
};

export const PASSWORD_CHANGE_API_PATH = '/api/auth/password/change';

export const PASSWORD_CHANGE_SUCCESS_TOAST_TITLE = 'Пароль изменен';
export const PASSWORD_CHANGE_SUCCESS_TOAST_DESCRIPTION =
  'Ваш пароль успешно обновлен';
export const PASSWORD_CHANGE_SUCCESS_TOAST_COLOR = 'success';

export const PASSWORD_CHANGE_ERROR_TOAST_TITLE = 'Ошибка смены пароля';
export const PASSWORD_CHANGE_ERROR_TOAST_DESCRIPTION =
  'Не удалось изменить пароль';
export const PASSWORD_CHANGE_ERROR_TOAST_COLOR = 'error';

export const PASSWORD_CHANGE_CARD_TITLE = 'Смена пароля';
export const PASSWORD_CHANGE_CURRENT_PASSWORD_LABEL = 'Текущий пароль';
export const PASSWORD_CHANGE_CURRENT_PASSWORD_PLACEHOLDER =
  'Введите текущий пароль';
export const PASSWORD_CHANGE_NEW_PASSWORD_LABEL = 'Новый пароль';
export const PASSWORD_CHANGE_NEW_PASSWORD_HINT =
  'Минимум 8 символов, включая заглавные и строчные буквы, цифры';
export const PASSWORD_CHANGE_NEW_PASSWORD_PLACEHOLDER = 'Введите новый пароль';
export const PASSWORD_CHANGE_CONFIRM_PASSWORD_LABEL =
  'Подтвердите новый пароль';
export const PASSWORD_CHANGE_CONFIRM_PASSWORD_PLACEHOLDER =
  'Повторите новый пароль';
export const PASSWORD_CHANGE_SUBMIT_LABEL = 'Изменить пароль';
export const PASSWORD_CHANGE_SHOW_PASSWORD_LABEL = 'Показать пароль';
export const PASSWORD_CHANGE_HIDE_PASSWORD_LABEL = 'Скрыть пароль';

export const EMAIL_VERIFICATION_RESEND_API_PATH =
  '/api/auth/confirm/email/resend';

/** Пауза между письмами подтверждения — совпадает с лимитом auth-service. */
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = 300;

/** Префикс ключа хранилища: к нему добавляется идентификатор пользователя. */
export const EMAIL_VERIFICATION_RESEND_STORAGE_KEY_PREFIX =
  'profile-security:email-verification-resend-until';

export const EMAIL_VERIFICATION_CARD_TITLE = 'Подтверждение почты';

export const EMAIL_VERIFICATION_VERIFIED_TITLE = 'Почта подтверждена';
export const EMAIL_VERIFICATION_VERIFIED_DESCRIPTION =
  'Все возможности сайта доступны без ограничений';

export const EMAIL_VERIFICATION_PENDING_TITLE = 'Почта не подтверждена';
export const EMAIL_VERIFICATION_PENDING_DESCRIPTION =
  'Часть действий (например, создание встречи) доступна только после перехода по ссылке из письма';

export const EMAIL_VERIFICATION_RESEND_LABEL = 'Отправить письмо ещё раз';
export const EMAIL_VERIFICATION_RESEND_HINT =
  'Письмо приходит в течение нескольких минут. Проверьте папку «Спам»';
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_PREFIX = 'Повторно через';

export const EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_TITLE =
  'Письмо отправлено';
export const EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_DESCRIPTION =
  'Перейдите по ссылке из письма, чтобы подтвердить почту';
export const EMAIL_VERIFICATION_RESEND_SUCCESS_TOAST_COLOR = 'success';

export const EMAIL_VERIFICATION_RESEND_ERROR_TOAST_TITLE =
  'Не удалось отправить письмо';
export const EMAIL_VERIFICATION_RESEND_ERROR_TOAST_DESCRIPTION =
  'Попробуйте ещё раз позже';
export const EMAIL_VERIFICATION_RESEND_ERROR_TOAST_COLOR = 'error';
