/**
 * Типы для страницы профиля пользователя
 */

/**
 * Элемент статистики пользователя
 */
export interface UserStatistic {
  key: string;
  label: string;
  value: number;
  isPublic: boolean;
  icon: string;
}

/**
 * Подключенная социальная сеть
 */
export interface ConnectedSocial {
  id: string;
  name: string;
  username?: string;
  isConnected: boolean;
  icon: string;
  color: string;
}

/**
 * Данные формы смены пароля
 */
export interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Состояние загрузки
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
