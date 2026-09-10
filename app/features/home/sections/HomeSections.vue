<script setup lang="ts">
  import { LinkTo5e14 } from '../link-to-5e14';
  import { CARD_LINKS } from './model';

  const { user } = useUser();

  const sections = computed(() =>
    CARD_LINKS.map((link) => {
      if (!Array.isArray(link.roles)) {
        return link;
      }

      const available = link.roles.some((role) =>
        user.value?.roles.includes(role),
      );

      return {
        ...link,
        disabled: link.disabled || !available,
      };
    }),
  );
</script>

<template>
  <div class="grid w-full grid-cols-1 gap-3 xl:grid-cols-6">
    <!--
      Разделы — одна плита, разбитая волосяными линиями, а не россыпь отдельных
      карточек: десять самостоятельных картинок спорили друг с другом и
      перетягивали внимание с ленты. Внутри плитку опознают иконка и подпись,
      а картинка обесцвечена и работает фактурой — цвет она набирает только
      под курсором.
    -->
    <div
      class="overflow-hidden rounded-xl border border-default bg-muted/55 backdrop-blur-sm xl:col-span-5 xl:row-span-2"
    >
      <!--
        Линии рисуют сами плитки верхней и левой гранью, а сетка сдвинута на
        пиксель вверх и влево — так грани первого ряда и первой колонки уходят
        под рамку плиты. Приём не зависит от того, заполнен ли последний ряд:
        при любом числе колонок висящих линий не остаётся.
      -->
      <div
        :class="$style.grid"
        class="-mt-px -ml-px grid h-full grid-cols-2 max-2xs:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <NuxtLink
          v-for="link in sections"
          :key="link.url"
          :to="link.url"
          :class="[$style.cell, { [$style.disabled]: link.disabled }]"
          class="border-t border-l border-default"
        >
          <!-- alt пуст намеренно: картинка декоративная, раздел называет подпись -->
          <img
            :class="$style.img"
            :src="link.img"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />

          <span :class="$style.badge">
            <UIcon
              :name="link.icon"
              class="size-4.5"
            />
          </span>

          <span :class="$style.name">{{ link.name }}</span>

          <UIcon
            name="tabler:arrow-right"
            :class="$style.arrow"
          />
        </NuxtLink>
      </div>
    </div>

    <div
      class="order-last xl:order-0 xl:col-start-6 xl:row-span-2 xl:row-start-1"
    >
      <LinkTo5e14 class="h-full" />
    </div>
  </div>
</template>

<style lang="scss" module>
  .grid {
    @media (min-width: 1280px) {
      /* Две строки плиток задают высоту карточки D&D 2014 справа */
      grid-auto-rows: 1fr;
    }
  }

  .cell {
    position: relative;

    overflow: hidden;
    display: flex;
    gap: 10px;
    align-items: center;

    min-height: 64px;
    padding: 0 12px;

    text-decoration: none;

    transition: background-color 200ms ease;

    &:hover {
      background-color: var(--color-hover);

      .img {
        transform: scale(1.06);
        opacity: 0.5;
        filter: grayscale(0) brightness(1);
      }

      .badge {
        border-color: color-mix(in oklch, var(--ui-primary) 55%, transparent);
        color: var(--ui-text-highlighted);
        background-color: color-mix(
          in oklch,
          var(--ui-primary) 22%,
          transparent
        );
      }

      .name {
        color: var(--ui-text-highlighted);
      }

      .arrow {
        transform: translateX(0);
        opacity: 1;
      }
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.4;
    }
  }

  /* Картинка — фактура, а не иллюстрация: обесцвечена, приглушена и растворена
     слева, чтобы не лезть под подпись. Цвет набирает только под курсором. */
  .img {
    pointer-events: none;

    position: absolute;
    top: 0;
    right: 0;

    display: block;

    width: 100%;
    height: 100%;

    /* brightness сбивает пересветы: обесцвеченный огненный шар «Заклинаний»
       иначе превращается в белое пятно и перетягивает всю плиту на себя */
    opacity: 0.24;
    object-fit: cover;
    filter: grayscale(1) brightness(0.85);

    mask-image: linear-gradient(to right, transparent 0%, #000 60%, #000 100%);

    transition:
      opacity 250ms ease,
      filter 250ms ease,
      transform 250ms ease;
  }

  .badge {
    position: relative;
    z-index: 10;

    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;
    border: 1px solid var(--ui-border);
    border-radius: 8px;

    color: var(--ui-primary);

    background-color: color-mix(in oklch, var(--ui-bg) 55%, transparent);

    transition:
      border-color 200ms ease,
      color 200ms ease,
      background-color 200ms ease;
  }

  .name {
    position: relative;
    z-index: 10;

    flex: 1 1 auto;

    min-width: 0;

    font-size: 14px;
    font-weight: 600;
    line-height: 1.15;
    color: var(--ui-text);

    transition: color 200ms ease;
  }

  .arrow {
    position: relative;
    z-index: 10;
    transform: translateX(-4px);

    flex-shrink: 0;

    width: 16px;
    height: 16px;

    color: var(--ui-primary);

    opacity: 0;

    transition:
      opacity 200ms ease,
      transform 200ms ease;
  }
</style>
