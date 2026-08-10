/**
 * Заблокирован ли скролл страницы.
 *
 * Библиотеки блокируют его по-разному и на разных элементах: Reka UI ставит инлайновый `overflow: hidden` на `body`, `useScrollLock(window)` из VueUse — на `html`. Завязывать стили на `[style*='overflow:hidden']` значит зашивать чужую реализацию в CSS, поэтому оба случая сводятся здесь к одному ответу.
 *
 * Блокировки бывают вложенными: диалог поверх меню навигации блокирует скролл вторым слоем. Поэтому блокировка считается снятой, только когда `overflow: hidden` пропал у обоих элементов, — иначе отступы вернулись бы раньше времени.
 */
function isScrollLocked(): boolean {
  return [document.documentElement, document.body].some(
    (element) => element.style.overflow === 'hidden',
  );
}

/**
 * Проставляет на `html` признаки блокировки скролла для CSS.
 *
 * `data-scroll-locked` — скролл заблокирован, полосы прокрутки больше нет.
 *
 * `data-scroll-compensated` — ширину полосы уже компенсировали паддингом на `body`; так делает Reka UI (`useBodyScrollLock`). Свой отступ на `html` стал бы в этом случае вторым, и контент сжало бы и сдвинуло влево на ширину полосы. Признак компенсации — сам отступ, а не библиотека, которая его поставила: VueUse не компенсирует ничего, и там отступ остаётся за нами.
 */
function updateScrollLockMarker(): void {
  const isLocked = isScrollLocked();

  document.documentElement.toggleAttribute('data-scroll-locked', isLocked);

  document.documentElement.toggleAttribute(
    'data-scroll-compensated',
    isLocked && document.body.style.paddingRight !== '',
  );
}

/**
 * Отдаёт ширину полосы прокрутки в CSS-переменную `--app-scrollbar-width`, из которой её берут компенсирующие отступы в `global.scss` и `tailwind.css`.
 *
 * Под блокировкой измерять нечего: полосы уже нет, зато `body` сужен компенсирующим отступом. Разница приняла бы его за полосу и накинула бы сверху, а следующий пересчёт — ещё раз: отступ рос бы с каждым срабатыванием watcher'а, утаскивая контент влево.
 *
 * Имя переменной намеренно отличается от `--scrollbar-width`: ту Reka UI заводит на `html` сам при блокировке и удаляет при разблокировке. Под общим именем наше значение стиралось бы после первого же закрытого диалога, а вернуть его плагин не успевал бы — watcher дебаунсится и при возврате размеров к прежним не срабатывает вовсе.
 */
function updateScrollbarWidth([viewportWidth, bodyContentWidth]: [
  number,
  number,
]): void {
  if (isScrollLocked()) {
    return;
  }

  const width = Math.max(viewportWidth - bodyContentWidth, 0);

  document.documentElement.style.setProperty(
    '--app-scrollbar-width',
    `${width}px`,
  );
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return;
  }

  const { width: windowWidth } = useWindowSize({
    type: 'inner',
    includeScrollbar: true,
  });

  const { width: bodyWidth } = useElementSize(document.body);

  watchDebounced([windowWidth, bodyWidth], updateScrollbarWidth, {
    immediate: true,
    debounce: 100,
    maxWait: 500,
  });

  /*
   * Перехватить саму блокировку нельзя: Reka UI выполняет её изнутри Nuxt UI, наружу это не выведено. Поэтому за инлайновыми стилями `html` и `body` следит наблюдатель за мутациями.
   */
  useMutationObserver(
    [document.documentElement, document.body],
    updateScrollLockMarker,
    {
      attributes: true,
      attributeFilter: ['style'],
    },
  );

  updateScrollLockMarker();
});
