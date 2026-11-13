<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import { UiVideoModal, VIDEO_PLAY_ICON, VIDEO_PLAY_LABEL } from '~ui/video';

  import { NEWS_COVER_SIZE_CLASS } from './constants';

  /**
   * Обложка записи во всю панель: картинка, поверх неё подпись, заголовок и
   * анонс. Общая для новостей сайта и новостей сообщества на главной.
   */
  const {
    to,
    title,
    image,
    meta = undefined,
    preview = undefined,
    videoUrl = undefined,
    compact = false,
  } = defineProps<{
    /** Страница записи: открывается по ctrl+click и средней кнопке */
    to: RouteLocationRaw;
    title: string;
    /** Адрес картинки обложки */
    image: string;
    /** Моно-подпись над заголовком: тип, автор, дата */
    meta?: string;
    /** Анонс под заголовком; у малой обложки не показывается */
    preview?: string;
    /** Ролик записи: по центру обложки появляется кнопка «Смотреть» */
    videoUrl?: string | null;
    /** Малая обложка — для узкой панели */
    compact?: boolean;
  }>();

  const emit = defineEmits<{
    /** Обычный клик по обложке */
    open: [];
    /** Ролик записи открыли или закрыли */
    video: [isOpen: boolean];
  }>();

  defineSlots<{
    /** Кнопки в правом верхнем углу обложки */
    actions?: () => unknown;
  }>();

  const sizeClass = computed(() =>
    compact ? NEWS_COVER_SIZE_CLASS.compact : NEWS_COVER_SIZE_CLASS.regular,
  );

  const hasPreview = computed(() => !compact && Boolean(preview));

  const playLabel = computed(() => `${VIDEO_PLAY_LABEL}: ${title}`);

  // Ролик смотрят прямо с главной, в окне поверх страницы: кнопка «Смотреть»
  // по центру обложки. Клик мимо неё по-прежнему открывает саму запись.
  const overlay = useOverlay();

  const videoModal = overlay.create(UiVideoModal, { destroyOnClose: true });

  /**
   * Открывает ролик в окне поверх страницы. Тот, кто листает записи сам,
   * должен знать, что ролик смотрят: смена записи закрыла бы окно посреди
   * просмотра.
   */
  async function playVideo(): Promise<void> {
    if (!videoUrl) {
      return;
    }

    emit('video', true);

    try {
      await videoModal.open({ url: videoUrl, title });
    } finally {
      emit('video', false);
    }
  }
</script>

<template>
  <!--
    Кнопки лежат рядом со ссылкой-обложкой, а не внутри неё: ссылка внутри
    ссылки — невалидная разметка, и клик по кнопке пришлось бы глушить.
  -->
  <div class="group relative flex flex-auto flex-col overflow-hidden">
    <!--
      Обычный клик открывает запись в панели, ctrl+click и средняя кнопка —
      её страницу (за это отвечает `.exact`). `custom` обязателен: у обычного
      NuxtLink собственный переход RouterLink срабатывает раньше нашего
      `.prevent`, и вместо панели открывалась страница.
    -->
    <NuxtLink
      v-slot="{ href }"
      custom
      :to
    >
      <a
        :href="href ?? undefined"
        class="relative flex flex-auto flex-col text-white no-underline"
        @click.left.exact.prevent="$emit('open')"
      >
        <img
          decoding="async"
          :src="image"
          :alt="title"
          class="min-h-0 w-full flex-auto object-cover transition-transform duration-500 group-hover:scale-105"
          :class="sizeClass.image"
        />

        <span
          aria-hidden="true"
          class="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/5"
        />

        <span
          class="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2"
          :class="sizeClass.caption"
        >
          <span
            v-if="meta"
            class="font-mono text-[11px] leading-none tracking-[0.16em] text-white/70 uppercase"
          >
            {{ meta }}
          </span>

          <span
            class="line-clamp-2 leading-tight font-semibold text-balance [text-shadow:0_2px_8px_#000000a0]"
            :class="sizeClass.title"
          >
            {{ title }}
          </span>

          <span
            v-if="hasPreview"
            class="line-clamp-2 max-w-3xl text-sm leading-snug text-white/80 [text-shadow:0_2px_6px_#00000090] sm:text-base"
          >
            {{ preview }}
          </span>
        </span>
      </a>
    </NuxtLink>

    <button
      v-if="videoUrl"
      type="button"
      class="absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-[75%] cursor-pointer items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/30 backdrop-blur-sm transition-transform hover:scale-110"
      :class="sizeClass.playButton"
      :aria-label="playLabel"
      @click.left.exact.prevent="playVideo"
    >
      <UIcon
        :name="VIDEO_PLAY_ICON"
        :class="sizeClass.playIcon"
      />
    </button>

    <div
      v-if="$slots.actions"
      class="absolute top-2 right-2 z-20 flex items-center gap-1"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
