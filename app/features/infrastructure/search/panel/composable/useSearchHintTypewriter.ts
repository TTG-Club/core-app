import type { ComputedRef, Ref } from 'vue';

import {
  SEARCH_PANEL_HINT_ERASE_STEP,
  SEARCH_PANEL_HINT_HOLD,
  SEARCH_PANEL_HINT_SWITCH_PAUSE,
  SEARCH_PANEL_HINT_TYPE_STEP,
} from '../model';

/** Что машинка делает прямо сейчас */
type SearchHintPhase = 'hold' | 'erase' | 'switch' | 'type';

/**
 * Задержка до следующего шага — своя у каждой фазы. Таблица, а не условия:
 * новая фаза не соберётся, пока ей не задали темп.
 */
const PHASE_DELAY: Record<SearchHintPhase, number> = {
  hold: SEARCH_PANEL_HINT_HOLD,
  erase: SEARCH_PANEL_HINT_ERASE_STEP,
  switch: SEARCH_PANEL_HINT_SWITCH_PAUSE,
  type: SEARCH_PANEL_HINT_TYPE_STEP,
};

interface SearchHintTypewriter {
  /** Раздел в том виде, в каком он сейчас набран на экране */
  typed: Ref<string>;
  /** Машинка стоит (пауза с целым словом или с пустой строкой) */
  isIdle: ComputedRef<boolean>;
}

/**
 * Набирает разделы в подсказке поиска по кругу: держит слово, стирает его по
 * букве, выдерживает паузу и печатает следующее.
 *
 * Машинка живёт только в браузере и замирает на скрытой вкладке: каждая буква
 * — это перерисовка строки, фоновой вкладке она ни к чему. При системной
 * настройке «меньше движения» набор не стартует вовсе — в подсказке остаётся
 * первый раздел целиком.
 */
export function useSearchHintTypewriter(
  words: Array<string>,
): SearchHintTypewriter {
  const { state: word, next } = useCycleList(words);

  const typed = ref<string>(word.value);
  const phase = ref<SearchHintPhase>('hold');

  const preferredMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();

  const isTyping = computed<boolean>(
    () => preferredMotion.value !== 'reduce' && visibility.value !== 'hidden',
  );

  const isIdle = computed<boolean>(
    () => phase.value === 'hold' || phase.value === 'switch',
  );

  const delay = computed<number>(() => PHASE_DELAY[phase.value]);

  // Таймер заводится раньше шагов: каждый шаг сам ставит следующий, поэтому
  // ссылки на `start` нужны уже внутри обработчика.
  const { start, stop } = useTimeoutFn(handleStep, delay, { immediate: false });

  /** Стирает последнюю букву, а на пустой строке берёт следующий раздел. */
  function eraseLetter(): void {
    typed.value = typed.value.slice(0, -1);

    if (typed.value) {
      return;
    }

    next();
    phase.value = 'switch';
  }

  /** Дописывает очередную букву текущего раздела. */
  function typeLetter(): void {
    typed.value = word.value.slice(0, typed.value.length + 1);

    if (typed.value === word.value) {
      phase.value = 'hold';
    }
  }

  /** Один шаг машинки; следующий заводится сразу же с задержкой своей фазы. */
  function handleStep(): void {
    switch (phase.value) {
      case 'hold':
        phase.value = 'erase';

        break;
      case 'erase':
        eraseLetter();

        break;
      case 'switch':
        phase.value = 'type';

        break;
      case 'type':
        typeLetter();

        break;
    }

    start();
  }

  /** Заводит и останавливает машинку вслед за состоянием вкладки. */
  function syncTyping(typing: boolean): void {
    if (typing) {
      start();

      return;
    }

    stop();
  }

  onMounted(() => {
    watchImmediate(isTyping, syncTyping);
  });

  return { typed, isIdle };
}
