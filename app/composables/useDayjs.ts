import type { ConfigType } from 'dayjs';

export function useDayjs() {
  const { $dayjs } = useNuxtApp();

  const format = (date: ConfigType, formatStr = 'LLL') => {
    const d = $dayjs(date);

    if (d.isValid()) {
      return d.local().format(formatStr);
    }

    if (typeof date === 'string') {
      return date;
    }

    return '';
  };

  return { $dayjs, format };
}
