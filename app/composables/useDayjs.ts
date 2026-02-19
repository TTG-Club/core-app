import type { ConfigType } from 'dayjs';

export function useDayjs() {
  const { $dayjs } = useNuxtApp();

  const format = (date: ConfigType, formatStr = 'LLL') => {
    const dateObj = $dayjs(date);

    if (dateObj.isValid()) {
      return dateObj.local().format(formatStr);
    }

    if (typeof date === 'string') {
      return date;
    }

    return '';
  };

  return { $dayjs, format };
}
