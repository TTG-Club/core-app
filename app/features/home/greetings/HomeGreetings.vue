<script setup lang="ts">
  import type { HomeGreeting } from './model';

  import { v4 as createUuid } from 'uuid';

  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { MarkupRender, toMarkupSource } from '~ui/markup';

  import {
    GUEST_ID_HEADER,
    GUEST_ID_STORAGE_KEY,
    HOME_GREETING_API_URL,
    parseHomeGreeting,
  } from './model';

  const { isLoggedIn } = useUser();
  const userTokenCookie = useCookie<string | null>(USER_TOKEN_COOKIE);

  const guestId = useLocalStorage(GUEST_ID_STORAGE_KEY, '', {
    initOnMounted: true,
    writeDefaults: false,
  });

  const greeting = shallowRef<HomeGreeting | null>(null);
  const isGuest = computed(() => !isLoggedIn.value && !userTokenCookie.value);

  const guestHeaders = computed<Record<string, string> | undefined>(() => {
    if (!isGuest.value || !guestId.value) {
      return undefined;
    }

    return {
      [GUEST_ID_HEADER]: guestId.value,
    };
  });

  /**
   * Загружает приветствие и валидирует ответ API перед отрисовкой.
   */
  async function fetchHomeGreeting(): Promise<void> {
    const response = await $fetch<unknown>(HOME_GREETING_API_URL, {
      headers: guestHeaders.value,
    });

    greeting.value = parseHomeGreeting(response);
  }

  onMounted(() => {
    if (isGuest.value && !guestId.value) {
      guestId.value = createUuid();
    }

    void fetchHomeGreeting();
  });

  // --- UI-состояние (не влияет на загрузку данных) ---

  /** Флаг сломанной/недоступной картинки персонажа. */
  const isImageBroken = ref(false);

  /** Показывать фигуру персонажа, только если есть ссылка и картинка цела. */
  const hasImage = computed<boolean>(
    () => Boolean(greeting.value?.image) && !isImageBroken.value,
  );

  /** Имя персонажа для `alt` картинки (может быть пустым). */
  const personaName = computed<string>(
    () => greeting.value?.persona.trim() ?? '',
  );

  /**
   * Текст реплики строкой-исходником: новый редактор хранит поле как JSON-строку
   * AST (`["..."]`), поэтому разворачиваем её обратно в разметку — иначе в превью
   * протекают скобки и кавычки. Обычную строку `toMarkupSource` вернёт как есть.
   */
  const greetingText = computed<string>(() =>
    toMarkupSource(greeting.value?.text ?? ''),
  );

  // Новое приветствие (новая картинка) сбрасывает флаг ошибки загрузки.
  watch(
    () => greeting.value?.image,
    () => {
      isImageBroken.value = false;
    },
  );

  /**
   * Помечает картинку как недоступную, чтобы скрыть сломанную фигуру.
   */
  function handleImageError(): void {
    isImageBroken.value = true;
  }
</script>

<template>
  <div
    v-if="greeting"
    :class="[
      $style.root,
      'mx-auto flex w-fit max-w-full items-end justify-center gap-2 px-2 sm:max-w-3xl sm:gap-3',
    ]"
  >
    <!-- Реплика: текучая ширина, перенос текста, мягкий предел высоты -->
    <div
      :class="[
        $style.panel,
        'relative mb-4 flex max-w-md min-w-0 items-start gap-2 rounded-2xl border border-default bg-elevated',
        'px-4 py-3 shadow-lg ring-1 ring-primary/15 sm:mb-6 sm:gap-2.5 sm:px-5 sm:py-4',
      ]"
    >
      <!-- Открывающая кавычка-маркер слева: не занимает отдельную строку -->
      <UIcon
        name="tabler:quote"
        class="mt-0.5 size-6 shrink-0 text-primary/60 sm:size-7"
      />

      <div
        :class="[
          $style.scroll,
          'max-h-40 min-w-0 flex-1 overflow-y-auto pr-1 text-start text-sm leading-relaxed wrap-break-word text-toned sm:max-h-56 sm:text-base',
        ]"
      >
        <MarkupRender :render-node="greetingText" />
      </div>
    </div>

    <!-- Фигура персонажа: без рамки, прижата к низу — «выглядывает» из-за поиска -->
    <img
      v-if="hasImage"
      :src="greeting.image"
      :alt="personaName"
      draggable="false"
      class="h-[180px] w-[150px] shrink-0 translate-y-2 self-end object-contain object-bottom select-none sm:translate-y-6"
      @error="handleImageError"
    />
  </div>
</template>

<style module lang="scss">
  /* Мягкое появление: проявление + лёгкий подъём, без «пугающего» скачка */
  .root {
    animation: greeting-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes greeting-enter {
    from {
      transform: translateY(0.5rem);
      opacity: 0;
    }

    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Хвостик реплики, направленный вправо на персонажа (рамка + заливка) */
  .panel {
    &::before,
    &::after {
      content: '';

      position: absolute;
      top: 50%;
      transform: translateY(-50%);

      width: 0;
      height: 0;
      border-style: solid;
    }

    /* Внешний треугольник — цвет границы */
    &::before {
      right: -9px;
      border-color: transparent transparent transparent var(--ui-border);
      border-width: 8px 0 8px 9px;
    }

    /* Внутренний треугольник — заливка панели */
    &::after {
      right: -8px;
      border-color: transparent transparent transparent var(--ui-bg-elevated);
      border-width: 7px 0 7px 8px;
    }
  }

  /* MarkupRender добавляет каждому блоку mb-2 — убираем лишний нижний отступ */
  .panel :global(.mb-2:last-child) {
    margin-bottom: 0;
  }

  /* Тонкий ненавязчивый скролл: длинный текст читается прокруткой, а не обрезкой */
  .scroll {
    scrollbar-color: var(--ui-border-accented) transparent;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 9999px;
      background: var(--ui-border-accented);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .root {
      animation: none;
    }
  }
</style>
