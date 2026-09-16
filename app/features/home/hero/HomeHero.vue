<script setup lang="ts">
  import type { HomeHeroMedia } from '#shared/types';

  import { HomeCounters } from '~home/counters';
  import { HomeTools } from '~home/tools';
  import { SearchPanel } from '~infrastructure/search';

  import { useHomeHeroMotion, useHomeHeroSettings } from './composables';
  import HomeHeroMotion from './HomeHeroMotion.vue';
  import {
    HOME_HERO_MOTION_PAUSE_ICON,
    HOME_HERO_MOTION_PAUSE_LABEL,
    HOME_HERO_MOTION_PLAY_ICON,
    HOME_HERO_MOTION_PLAY_LABEL,
    HOME_HERO_SUBTITLE,
    HOME_HERO_TITLE,
  } from './model';

  const { preview = undefined } = defineProps<{
    /**
     * Фон для превью в админке — рисуется вместо сохранённого, пока его не
     * опубликовали.
     */
    preview?: HomeHeroMedia;
  }>();

  const styles = useCssModule();
  const { media: savedMedia } = useHomeHeroSettings();

  const media = computed(() => preview ?? savedMedia.value);

  const imageUrl = computed(() =>
    media.value?.kind === 'image' ? media.value.url : undefined,
  );

  const videoUrl = computed(() =>
    media.value?.kind === 'video' ? media.value.url : undefined,
  );

  const heroRef = useTemplateRef<HTMLElement>('heroRef');

  // Пока шапки не видно, её бесконечные анимации (повозка, дым, свет по
  // рамке поиска) стоят: браузер не считает кадры ради того, что за экраном
  const {
    state: motionState,
    isSupported: isMotionSupported,
    isEnabled: isMotionEnabled,
    isVisible: isHeroVisible,
    toggle: toggleMotion,
  } = useHomeHeroMotion(heroRef);

  const heroClass = computed(() =>
    isHeroVisible.value ? undefined : styles.offscreen,
  );

  // Повозка с дымом живут только на карте: свой фон из админки их не получает
  const isMotionToggleVisible = computed(
    () => isMotionSupported.value && !media.value,
  );

  const motionToggleLabel = computed(() =>
    isMotionEnabled.value
      ? HOME_HERO_MOTION_PAUSE_LABEL
      : HOME_HERO_MOTION_PLAY_LABEL,
  );

  const motionToggleIcon = computed(() =>
    isMotionEnabled.value
      ? HOME_HERO_MOTION_PAUSE_ICON
      : HOME_HERO_MOTION_PLAY_ICON,
  );

  const videoRef = useTemplateRef<HTMLVideoElement>('videoRef');
  const reducedMotion = usePreferredReducedMotion();

  // Видео — только украшение: тем, кто попросил систему убрать движение,
  // оставляем стоп-кадр. Пауза, а не отказ от `autoplay`: сервер не знает
  // настройку, и видео успело бы запуститься до гидратации.
  watch([videoRef, reducedMotion], ([video, motion]) => {
    if (video && motion === 'reduce') {
      video.pause();
    }
  });
</script>

<template>
  <!--
    Шапка главной идёт во всю ширину экрана: колонка контента начинается только
    ниже, в сетке блоков. `isolate` держит декоративные слои — карту и
    свечение — внутри шапки, под её содержимым.
  -->
  <section
    ref="heroRef"
    class="relative isolate w-full overflow-hidden border-b border-default"
    :class="heroClass"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-1"
    >
      <!-- Карта деревни с высоты птичьего полёта: рисунок под каждую тему
        лежит в `public/img/home`, выбирает его токен `--hero-map-image`.
        Фон из админки ложится в тот же слой — с той же прозрачностью и маской -->
      <div :class="$style.map">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :class="$style.media"
          alt=""
          decoding="async"
        />

        <video
          v-else-if="videoUrl"
          ref="videoRef"
          :src="videoUrl"
          :class="$style.media"
          autoplay
          muted
          loop
          playsinline
          disablepictureinpicture
        />

        <!-- Своего фона нет — карта под текущую тему, а поверх неё повозка
          и дым: они анимированы отдельно от рисунка -->
        <template v-else>
          <div :class="$style.mapImage" />

          <HomeHeroMotion
            :state="motionState"
            :class="$style.mapMotion"
          />
        </template>
      </div>

      <!-- Тёплое свечение по центру — «очаг», к которому стягивается взгляд -->
      <div :class="$style.glow" />
    </div>

    <div
      class="mx-auto flex w-full max-w-(--max-content) flex-col items-center gap-5 px-4 pt-6 pb-8 sm:gap-6 lg:pt-10 lg:pb-12 2xl:max-w-(--max-content-wide)"
    >
      <HomeCounters />

      <!-- На 360px и уже заголовок ужат: в полный размер он разбивался на пять
        строк. У подписи межстрочный интервал задан вместе с размером
        (`/tight`): `text-lg` приносит свой интервал, а `leading-tight`
        заголовка в Tailwind не наследуется -->
      <h1
        class="max-w-4xl text-center text-3xl leading-tight font-semibold tracking-tight text-balance max-2xs:text-2xl 3xl:text-5xl sm:text-4xl xl:text-[2.5rem]"
      >
        <span class="block text-highlighted">{{ HOME_HERO_TITLE }}</span>

        <span class="block text-muted max-2xs:text-lg/tight">{{
          HOME_HERO_SUBTITLE
        }}</span>
      </h1>

      <!-- Персонаж с репликой живёт внутри SearchPanel — он выглядывает
        из-за строки поиска, поэтому и стоит в одном блоке с ней -->
      <SearchPanel />

      <HomeTools />
    </div>

    <!-- Пауза и запуск повозки с дымом — в левом нижнем углу, на полях шапки:
      не спорит с поиском и лентой инструментов. На телефонах и планшетах
      анимации нет, и кнопки тоже -->
    <UTooltip
      v-if="isMotionToggleVisible"
      :text="motionToggleLabel"
      :content="{ side: 'right' }"
    >
      <UButton
        :icon="motionToggleIcon"
        :aria-label="motionToggleLabel"
        color="neutral"
        variant="outline"
        size="xs"
        square
        class="absolute bottom-2 left-4 rounded-full xl:left-6"
        @click.left.exact.prevent="toggleMotion"
      />
    </UTooltip>
  </section>
</template>

<style lang="scss" module>
  /* Уже этой ширины карта не сжимается: края уходят за экран, а дома
     остаются различимыми */
  $mapMinWidth: 1600px;

  /* Середина карты, видная на экране уже 768px (`hero-map-ТЕМА-sm.webp`, её
     ширину задаёт scripts/render-hero-map.mjs) */
  $mapSmallWidth: 768px;

  /* Свет по рамке поиска за экраном стоит (`--home-hero-play-state` читает
     SearchPanel); повозкой и дымом управляет `useHomeHeroMotion` */
  .offscreen {
    --home-hero-play-state: paused;
  }

  .map {
    position: absolute;
    inset: 0;

    opacity: var(--hero-map-opacity);

    /* Под заголовком и поиском карта почти растворяется, по бокам видна
       целиком; сверху и снизу тает, чтобы не упираться в края шапки */
    mask-image:
      linear-gradient(
        to right,
        #000 12%,
        rgb(0 0 0 / 22%) 32%,
        rgb(0 0 0 / 22%) 68%,
        #000 88%
      ),
      linear-gradient(
        to bottom,
        transparent 0%,
        #000 15%,
        #000 85%,
        transparent 100%
      );
    mask-composite: intersect;
  }

  /* Масштаб карты задаёт только ширина шапки, не высота: высота растёт, когда
     подгружается персонаж с репликой, и карта при `cover` прыгала бы. Холст
     с запасом по высоте, поэтому шапку он закрывает и так.

     Карта — готовая растровая копия SVG: сам рисунок с сотнями фигур и
     шумовыми фильтрами браузер разбирал в основном потоке, а видеокарта
     растрировала при первом показе секундами, и всё это время страница на
     телефоне не прокручивалась. Своим слоем (`will-change`) карта не
     перерисовывается, когда меняется что-то над ней: повозка, машинка в
     поиске, наведение на кнопки */
  .mapImage {
    will-change: transform;
    position: absolute;
    inset: 0;
    background: var(--hero-map-image) center / max(100%, $mapMinWidth) auto
      no-repeat;

    /* На узком экране видна только середина карты — её и грузим: та же карта
       шириной $mapMinWidth, но без краёв за экраном */
    @include media-max($md) {
      background-image: var(--hero-map-image-sm);
      background-size: $mapSmallWidth auto;
    }
  }

  /* Холст повозки и дыма — ровно там, где фоновая картинка карты: та же
     ширина, по центру шапки. Пропорции — холст карты `HOME_HERO_MAP_VIEWBOX` */
  .mapMotion {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    aspect-ratio: 3200 / 1100;
    width: max(100%, $mapMinWidth);
    height: auto;
  }

  /* Свой фон масштабируется так же, как карта: по ширине и по центру. Свою
     картинку стоит делать с запасом по высоте — иначе на узкой и высокой
     шапке снизу и сверху останутся полосы */
  .media {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: max(100%, $mapMinWidth);
    max-width: none;
    height: auto;
  }

  .glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        60% 70% at 50% 0%,
        color-mix(in oklch, var(--ui-primary) 16%, transparent) 0%,
        transparent 70%
      ),
      radial-gradient(
        90% 100% at 50% 100%,
        color-mix(in oklch, var(--ui-bg-elevated) 55%, transparent) 0%,
        transparent 75%
      );
  }
</style>
