<script setup lang="ts">
  import type { LevelUpRailItem } from '../../model';

  import { LEVEL_UP_WIZARD_LABELS } from '../../model';

  /** Пункт рельсы с готовыми классами и иконкой состояния. */
  interface RailEntry extends LevelUpRailItem {
    icon: string;
    iconClass: string;
    itemClass: string;
    nestedClass: string;
    chipClass: string;
    pendingLabel: string;
    ariaLabel: string;
    ariaCurrent: 'step' | undefined;
  }

  /**
   * Рельса шагов мастера повышения уровня. На широком экране — вертикальный
   * список слева: каждый шаг подписан классом и уровнем, под ним — что внутри,
   * рядом — сколько выборов ещё не сделано. На узком экране та же рельса
   * складывается в горизонтальную ленту чипов над содержимым: подписи целиком,
   * ряд прокручивается, а не ужимается.
   */
  /**
   * Оформление пункта вертикальной рельсы: текущий залит, пройденные
   * подсвечиваются на наведении, недостижимые приглушены.
   *
   * @param isCurrent пункт — текущий шаг.
   * @param reachable на пункт можно перейти.
   * @returns классы пункта.
   */
  function getItemClass(isCurrent: boolean, reachable: boolean): string {
    if (isCurrent) {
      return 'bg-elevated text-highlighted';
    }

    return reachable ? 'text-toned hover:bg-elevated/60' : 'text-dimmed';
  }

  const { items } = defineProps<{
    items: LevelUpRailItem[];
  }>();

  const model = defineModel<number>({ required: true });

  const entries = computed<RailEntry[]>(() =>
    items.map((item) => {
      const isCurrent = item.state === 'current';
      const isDone = item.state === 'done';

      const pendingLabel = item.pending
        ? `${LEVEL_UP_WIZARD_LABELS.pendingBadgeAriaLabel}: ${item.pending}`
        : '';

      return {
        ...item,
        icon: isDone ? 'tabler:circle-check-filled' : 'tabler:circle',
        iconClass: isDone || isCurrent ? 'text-primary' : 'text-dimmed',
        itemClass: getItemClass(isCurrent, item.reachable),
        nestedClass: item.nested ? 'ml-4 border-l border-default pl-2' : '',
        chipClass: isCurrent
          ? 'border-primary bg-primary/10'
          : 'border-default',
        pendingLabel,
        ariaLabel: [item.title, item.subtitle, pendingLabel]
          .filter(Boolean)
          .join('. '),
        ariaCurrent: isCurrent ? 'step' : undefined,
      };
    }),
  );

  const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');

  const { arrivedState } = useScroll(scrollContainer, {
    offset: { right: 8 },
  });

  const canScrollLeft = computed(() => !arrivedState.left);
  const canScrollRight = computed(() => !arrivedState.right);

  const fadeMask = computed(() => {
    if (canScrollLeft.value && canScrollRight.value) {
      return 'linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)';
    }

    if (canScrollRight.value) {
      return 'linear-gradient(to right, black calc(100% - 48px), transparent)';
    }

    if (canScrollLeft.value) {
      return 'linear-gradient(to right, transparent, black 48px)';
    }

    return 'none';
  });

  /**
   * Переход на шаг из рельсы: доступны только уже пройденные шаги, вперёд ведёт
   * кнопка «Далее» с проверкой шага.
   *
   * @param entry пункт рельсы.
   */
  function handleSelect(entry: RailEntry) {
    if (entry.reachable && entry.value !== model.value) {
      model.value = entry.value;
    }
  }

  // Текущий чип ленты докручивается в видимую область: шаг сменился кнопкой
  // «Далее», а лента об этом сама не узнаёт
  watch(
    model,
    async () => {
      await nextTick();

      scrollContainer.value
        ?.querySelector<HTMLElement>('[aria-current="step"]')
        ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    },
    { flush: 'post' },
  );
</script>

<template>
  <nav :aria-label="LEVEL_UP_WIZARD_LABELS.railAriaLabel">
    <!-- Широкий экран: вертикальная рельса -->
    <ol class="hidden flex-col gap-1 md:flex">
      <li
        v-for="entry in entries"
        :key="entry.value"
        :class="entry.nestedClass"
      >
        <button
          type="button"
          class="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
          :class="entry.itemClass"
          :disabled="!entry.reachable"
          :aria-current="entry.ariaCurrent"
          :aria-label="entry.ariaLabel"
          @click.left.exact.prevent="handleSelect(entry)"
        >
          <UIcon
            :name="entry.icon"
            class="mt-0.5 size-4 shrink-0"
            :class="entry.iconClass"
          />

          <span class="flex min-w-0 grow flex-col">
            <span class="text-sm font-medium">{{ entry.title }}</span>

            <span
              v-if="entry.subtitle"
              class="text-xs text-dimmed"
            >
              {{ entry.subtitle }}
            </span>
          </span>

          <UBadge
            v-if="entry.pending"
            size="sm"
            color="warning"
            variant="subtle"
            class="shrink-0"
            :aria-label="entry.pendingLabel"
          >
            {{ entry.pending }}
          </UBadge>
        </button>
      </li>
    </ol>

    <!-- Узкий экран: лента чипов с прокруткой -->
    <div class="relative flex items-center md:hidden">
      <Transition name="fade">
        <div
          v-if="canScrollLeft"
          class="pointer-events-none absolute top-1/2 left-0 z-10 -translate-y-1/2"
        >
          <UIcon
            name="tabler:chevron-left"
            class="size-5 animate-pulse text-dimmed"
          />
        </div>
      </Transition>

      <ol
        ref="scrollContainer"
        class="hidden-scrollbar flex gap-2 overflow-x-auto py-1"
        :style="{ maskImage: fadeMask, WebkitMaskImage: fadeMask }"
      >
        <li
          v-for="entry in entries"
          :key="entry.value"
          class="shrink-0"
        >
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors"
            :class="entry.chipClass"
            :disabled="!entry.reachable"
            :aria-current="entry.ariaCurrent"
            :aria-label="entry.ariaLabel"
            @click.left.exact.prevent="handleSelect(entry)"
          >
            <UIcon
              :name="entry.icon"
              class="size-4 shrink-0"
              :class="entry.iconClass"
            />

            <span>{{ entry.title }}</span>

            <UBadge
              v-if="entry.pending"
              size="sm"
              color="warning"
              variant="subtle"
            >
              {{ entry.pending }}
            </UBadge>
          </button>
        </li>
      </ol>

      <Transition name="fade">
        <div
          v-if="canScrollRight"
          class="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2"
        >
          <UIcon
            name="tabler:chevron-right"
            class="size-5 animate-pulse text-dimmed"
          />
        </div>
      </Transition>
    </div>
  </nav>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
