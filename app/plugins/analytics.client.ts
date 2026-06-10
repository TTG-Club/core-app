/**
 * Подключение веб-аналитики (Яндекс.Метрика + Google Analytics) на клиенте.
 *
 * ID счётчиков берутся из runtimeConfig.public.analytics. Если ID не задан —
 * счётчик не подключается. На dev метрика отключена полностью, чтобы не засорять
 * боевую статистику.
 *
 * Google Analytics грузится через реестр @nuxt/scripts. Для Яндекс.Метрики в
 * реестре хелпера нет, поэтому загрузчик tag.js подключаем через useScript (он
 * получает CSP nonce от nuxt-security, а 'strict-dynamic' пропускает скрипты,
 * которые tag.js грузит дальше).
 */

const YANDEX_METRIKA_SRC = 'https://mc.yandex.ru/metrika/tag.js';

const YANDEX_METRIKA_INIT_OPTIONS = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
};

interface YandexMetrikaFn {
  (id: number, action: string, ...args: unknown[]): void;
  a?: unknown[];
  l?: number;
}

declare global {
  interface Window {
    ym?: YandexMetrikaFn;
  }
}

/**
 * Создаёт (или возвращает существующую) заглушку `window.ym`, которая буферизует
 * вызовы счётчика до загрузки tag.js. Повторяет официальный бутстрап Метрики.
 */
function ensureYandexMetrikaStub(): YandexMetrikaFn {
  if (window.ym) {
    return window.ym;
  }

  const queueCall: YandexMetrikaFn = (...args) => {
    (queueCall.a ||= []).push(args);
  };

  queueCall.l = Date.now();
  window.ym = queueCall;

  return queueCall;
}

export default defineNuxtPlugin(() => {
  // На dev метрику не подключаем, чтобы не засорять боевую статистику.
  if (import.meta.dev) {
    return;
  }

  const {
    public: { analytics },
  } = useRuntimeConfig();

  const router = useRouter();

  const yandexMetrikaId = analytics.yandexMetrikaId
    ? Number(analytics.yandexMetrikaId)
    : null;

  // --- Яндекс.Метрика ---
  if (yandexMetrikaId) {
    const yandexMetrika = ensureYandexMetrikaStub();

    useScript(YANDEX_METRIKA_SRC, { tagPosition: 'head' });
    yandexMetrika(yandexMetrikaId, 'init', YANDEX_METRIKA_INIT_OPTIONS);
  }

  // --- Google Analytics (GA4) ---
  const googleAnalytics = analytics.googleAnalyticsId
    ? useScriptGoogleAnalytics({ id: analytics.googleAnalyticsId })
    : null;

  if (!yandexMetrikaId && !googleAnalytics) {
    return;
  }

  // Первый хит счётчики отправляют сами при инициализации, поэтому самую первую
  // навигацию (гидратация SSR-страницы) в afterEach пропускаем, чтобы не задвоить.
  let skipFirstHit = true;

  router.afterEach((to) => {
    if (skipFirstHit) {
      skipFirstHit = false;

      return;
    }

    if (yandexMetrikaId) {
      window.ym?.(yandexMetrikaId, 'hit', to.fullPath);
    }

    // gtag требует snake_case-параметры
    /* eslint-disable camelcase */
    googleAnalytics?.proxy.gtag('event', 'page_view', {
      page_path: to.fullPath,
      page_location: window.location.href,
      page_title: document.title,
    });
    /* eslint-enable camelcase */
  });
});
