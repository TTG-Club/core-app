<script setup lang="ts">
  import HomeEyebrow from './HomeEyebrow.vue';

  const props = defineProps<{
    /** Моно-подпись в шапке панели; без неё шапка не рисуется */
    label?: string;
    /** Иконка рядом с подписью */
    icon?: string;
    /** Маршрут кнопки-подвала «смотреть всё» */
    to?: string;
    /** Подпись кнопки-подвала; без неё подвал не рисуется */
    linkLabel?: string;
    /** Классы содержимого — панели с картинкой во всю ширину просят `p-0` */
    bodyClass?: string;
    /** Классы шапки — своя шапка во всю ширину просит `p-0` */
    headerClass?: string;
    /**
     * Растянуть панель на всю высоту ряда — только с xl, где ряд и существует.
     * Ниже панель живёт по содержимому, а лента внутри ограничена своей
     * `max-h`, иначе на мобильном она вытянулась бы на весь экран.
     */
    fill?: boolean;
  }>();

  /** Отступы содержимого по умолчанию — как у прежних карточек главной */
  const DEFAULT_BODY_CLASS = 'p-3';

  /** Отступы шапки по умолчанию */
  const DEFAULT_HEADER_CLASS = 'px-3 py-2.5';

  const hasFooter = computed(() => Boolean(props.to && props.linkLabel));

  // Явную высоту `fill`-панели НЕ задаём: `height: 100%` отменяет растягивание
  // по ряду (`align-self: stretch` работает только при `height: auto`) и, если
  // высота ряда не задана числом, схлопывается обратно в высоту содержимого.
  const contentClass = computed(() => [
    props.bodyClass ?? DEFAULT_BODY_CLASS,
    props.fill ? 'xl:relative xl:min-h-0 xl:flex-1' : undefined,
  ]);

  // Содержимое `fill`-панели вынуто из потока: у растянутой ячейки нулевая
  // базовая высота, поэтому лента НЕ участвует в расчёте высоты ряда — её
  // задаёт сосед, а лента занимает ровно то, что осталось. Без этого длинная
  // лента сама раздувала бы ряд и растягивала соседей.
  const innerClass = computed(() =>
    props.fill ? 'xl:absolute xl:inset-0 xl:overflow-hidden' : undefined,
  );
</script>

<template>
  <section
    :class="[
      'group/panel relative flex min-w-0 flex-col overflow-hidden',
      // Матовое стекло: фоновая анимация частиц просвечивает сквозь панель, но
      // размыто — так она читается как глубина под содержимым, а не как рябь
      // под текстом
      'rounded-xl border border-default bg-muted/55 backdrop-blur-sm',
      'transition-colors duration-200 hover:border-accented',
    ]"
  >
    <!-- Слот `header` целиком заменяет строку «подпись + действия»: он нужен
      панелям, у которых шапка сама по себе управление (например, переключатель
      вкладок), а не заголовок -->
    <header
      v-if="label || $slots.header"
      class="flex shrink-0 items-center justify-between gap-2 border-b border-default"
      :class="headerClass ?? DEFAULT_HEADER_CLASS"
    >
      <slot name="header">
        <HomeEyebrow
          v-if="label"
          :label
          :icon
        />

        <div class="flex shrink-0 items-center gap-1">
          <slot name="actions" />
        </div>
      </slot>
    </header>

    <div :class="contentClass">
      <!-- Обёртка только у `fill`: у остальных панелей `bodyClass` часто сам
        задаёт сетку, и лишний слой схлопнул бы её в один элемент -->
      <div
        v-if="fill"
        :class="innerClass"
      >
        <slot />
      </div>

      <slot v-else />
    </div>

    <NuxtLink
      v-if="hasFooter"
      :to
      class="mt-auto flex shrink-0 items-center justify-between gap-2 border-t border-default px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase no-underline transition-colors hover:bg-elevated hover:text-primary"
    >
      {{ linkLabel }}

      <UIcon
        name="tabler:arrow-right"
        class="size-4 transition-transform duration-200 group-hover/panel:translate-x-0.5"
      />
    </NuxtLink>
  </section>
</template>
