import dayjs from 'dayjs';
import ru from 'dayjs/locale/ru';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.locale('ru', ru);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);

export default defineNuxtPlugin(() => {
  return {
    provide: {
      dayjs,
    },
  };
});
