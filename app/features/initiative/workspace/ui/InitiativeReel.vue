<script setup lang="ts">
  import type { TrackerParticipant } from '~initiative/model';

  import { useCreatureImages } from '~initiative/composables';
  import { PARTICIPANT_TYPE_ICON } from '~initiative/model';

  const {
    participants,
    currentParticipantId = undefined,
    round,
  } = defineProps<{
    participants: Array<TrackerParticipant>;
    currentParticipantId?: string;
    round: number;
  }>();

  const { imageFor, dropImage } = useCreatureImages(() => participants);

  /** Шаг между центрами соседних токенов, px. */
  const STEP = 96;

  /** Запас колонок слева/справа от центра (чуть шире любого вьюпорта). */
  const WINDOW = 8;

  interface TokenCell {
    kind: 'token';
    key: string;
    column: number;
    participant: TrackerParticipant;
    isCurrent: boolean;
  }

  interface DividerCell {
    kind: 'divider';
    key: string;
    column: number;
    round: number;
  }

  type ReelCell = TokenCell | DividerCell;

  const size = computed(() => participants.length);

  const currentIndex = computed(() => {
    const index = participants.findIndex(
      (participant) => participant.id === currentParticipantId,
    );

    return index < 0 ? 0 : index;
  });

  const currentName = computed(
    () => participants[currentIndex.value]?.name ?? '',
  );

  // Раунды трекера 1-based; страхуемся от 0/битого значения (в схеме
  // round.catch(0)) — иначе центр ленты уехал бы в несуществующую колонку и
  // ни один токен не получил бы подсветку «текущего».
  const safeRound = computed(() => Math.max(1, round));

  // Абсолютная «временная» координата: раунд * (N + 1) + позиция в порядке.
  // Один слот на раунд зарезервирован под разделитель — отсюда (N + 1). Так
  // координата монотонно растёт от раунда к раунду, и лента всегда едет влево.
  const currentColumn = computed(
    () => safeRound.value * (size.value + 1) + currentIndex.value,
  );

  const cells = computed<Array<ReelCell>>(() => {
    const total = size.value;

    if (total === 0) {
      return [];
    }

    const span = total + 1;
    const result: Array<ReelCell> = [];

    // Диапазон циклов выводим из окна ±WINDOW (с запасом в цикл по краям), а не
    // из фиксированного смещения — иначе при малом составе край ленты пустеет и
    // ломается «бесшовная» петля. Лишние ячейки всё равно отсекает фильтр окна.
    const from = Math.max(
      1,
      Math.floor((currentColumn.value - WINDOW) / span) - 1,
    );

    const to = Math.ceil((currentColumn.value + WINDOW) / span) + 1;

    for (let cycle = from; cycle <= to; cycle += 1) {
      const base = cycle * span;

      // Разделитель — «шапка» раунда: стоит перед его первым бойцом и несёт
      // номер начинающегося раунда. Перед первым раундом его не рисуем — до
      // него нет перехода, и метка «Раунд 1» рядом со стартовым бойцом (мы и
      // так уже в первом раунде) выглядела бы бессмысленно.
      if (cycle > 1) {
        result.push({
          kind: 'divider',
          key: `divider-${cycle}`,
          column: base - 1,
          round: cycle,
        });
      }

      for (const [index, participant] of participants.entries()) {
        result.push({
          kind: 'token',
          key: `${participant.id}-${cycle}`,
          column: base + index,
          participant,
          isCurrent: cycle === safeRound.value && index === currentIndex.value,
        });
      }
    }

    return result.filter(
      (cell) => Math.abs(cell.column - currentColumn.value) <= WINDOW,
    );
  });

  const trackStyle = computed(() => ({
    transform: `translateX(${-currentColumn.value * STEP}px)`,
  }));

  function cellStyle(column: number): Record<string, string> {
    return {
      left: `${column * STEP}px`,
      width: `${STEP}px`,
      marginLeft: `${-STEP / 2}px`,
    };
  }

  function typeIcon(participant: TrackerParticipant): string {
    return PARTICIPANT_TYPE_ICON[participant.type];
  }

  // Классы токена вынесены из шаблона (per-item в v-for, поэтому функции, а не
  // computed): текущий крупнее и подсвечен, поверженный — приглушён.
  function tokenRingClass(cell: TokenCell): Array<string | false> {
    return [
      cell.isCurrent
        ? 'size-20 border-primary bg-primary/10 shadow-lg'
        : 'size-14 border-default bg-elevated',
      cell.participant.dead && 'opacity-40 grayscale',
    ];
  }

  function tokenIconClass(cell: TokenCell): string {
    return cell.isCurrent ? 'size-8 text-primary' : 'size-6 text-secondary';
  }

  function tokenBadgeClass(cell: TokenCell): string {
    return cell.isCurrent
      ? 'bg-primary text-inverted'
      : 'bg-elevated text-muted ring-1 ring-default';
  }

  function tokenNameClass(cell: TokenCell): string {
    return cell.isCurrent ? 'font-semibold text-highlighted' : 'text-secondary';
  }

  // Плавный сдвиг включаем только после первой отрисовки, иначе лента
  // «выезжала» бы из левого края при монтировании боя.
  const ready = ref(false);

  onMounted(async () => {
    await nextTick();
    ready.value = true;
  });
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Лента чисто декоративна: очередь и текущий ход доносят список бойцов
         и подпись aria-live ниже, поэтому прячем её от скринридеров (иначе он
         зачитывал бы каждого по 2–3 раза из-за зациклённых копий). -->
    <!-- Клип только по горизонтали (overflow-x-clip, не overflow-hidden): по
         бокам прячем уезжающие токены, но свечение «текущего» свободно выходит
         вверх за рамку и не срезается. -->
    <div
      class="reel-viewport relative h-44 overflow-x-clip"
      aria-hidden="true"
    >
      <div
        class="pointer-events-none absolute inset-y-0 top-0 left-1/2"
        :class="
          ready
          && 'transition-transform duration-500 ease-out motion-reduce:transition-none'
        "
        :style="trackStyle"
      >
        <TransitionGroup name="reel">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="absolute inset-y-0"
            :style="cellStyle(cell.column)"
          >
            <!-- Разделитель — шапка начинающегося раунда. Пунктир разорван
                 самим лейблом (две линии сверху и снизу), поэтому плашка-фон
                 не нужна — ничего лишнего под текстом не проступает. -->
            <div
              v-if="cell.kind === 'divider'"
              class="flex h-full flex-col items-center justify-center gap-1.5 py-6"
            >
              <div class="w-px flex-1 border-l border-dashed border-default" />

              <span
                class="text-xs font-semibold tracking-widest text-muted uppercase"
              >
                Раунд {{ cell.round }}
              </span>

              <div
                class="size-2.5 rotate-45 border border-primary/60 bg-primary/20"
              />

              <div class="w-px flex-1 border-l border-dashed border-default" />
            </div>

            <!-- Токен участника -->
            <div
              v-else
              class="flex h-full flex-col items-center justify-center gap-2"
            >
              <div class="relative grid size-20 place-items-center">
                <span
                  v-if="cell.isCurrent"
                  class="reel-halo absolute inset-0 m-auto size-24 rounded-full bg-primary/25 blur-xl"
                />

                <div
                  class="relative grid place-items-center rounded-full border-2 transition-all duration-300 motion-reduce:transition-none"
                  :class="tokenRingClass(cell)"
                >
                  <img
                    v-if="imageFor(cell.participant)"
                    :src="imageFor(cell.participant)"
                    alt=""
                    loading="lazy"
                    class="absolute inset-0 size-full rounded-full object-cover"
                    @error="dropImage(cell.participant.creatureUrl)"
                  />

                  <UIcon
                    v-else
                    :name="typeIcon(cell.participant)"
                    :class="tokenIconClass(cell)"
                  />

                  <span
                    v-if="typeof cell.participant.initiativeTotal === 'number'"
                    class="absolute -bottom-2 rounded-full px-1.5 text-xs font-bold tabular-nums"
                    :class="tokenBadgeClass(cell)"
                  >
                    {{ cell.participant.initiativeTotal }}
                  </span>

                  <UIcon
                    v-if="cell.participant.dead"
                    name="tabler:skull"
                    class="absolute size-5 text-error"
                  />
                </div>
              </div>

              <span
                class="max-w-20 truncate text-center text-xs tracking-wide uppercase"
                :class="tokenNameClass(cell)"
              >
                {{ cell.participant.name }}
              </span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Живой регион всегда в DOM (без v-if на контейнере), меняется только
         текст — иначе первое объявление после повторного появления теряется. -->
    <div
      class="flex flex-col items-center gap-0.5"
      aria-live="polite"
    >
      <template v-if="currentName">
        <span class="text-xs tracking-widest text-muted uppercase">
          Сейчас ходит
        </span>

        <span
          class="max-w-full truncate text-center text-lg font-semibold text-highlighted"
        >
          {{ currentName }}
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .reel-enter-active,
  .reel-leave-active {
    transition: opacity 400ms ease;
  }

  .reel-enter-from,
  .reel-leave-to {
    opacity: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    .reel-halo {
      animation: reel-halo-pulse 2400ms ease-in-out infinite;
    }
  }

  @keyframes reel-halo-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.5;
    }

    50% {
      transform: scale(1.08);
      opacity: 1;
    }
  }
</style>
