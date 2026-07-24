<script setup lang="ts">
  import type { Character, SheetSaveStatus } from '../../model';

  import {
    getClassDisplayName,
    getSpeciesDisplayName,
    getVisionRows,
    SHEET_EMPTY_LABELS,
    SHEET_SAVE_STATUS_META,
    VISION_LABELS,
  } from '../../model';

  const props = defineProps<{
    character: Character;
    locked: boolean;
    /** Показать кнопку «открыть на отдельной странице» (панель). */
    canExpand?: boolean;
    /** Показать кнопку закрытия. Скрывается, когда закрытие даёт контейнер. */
    canClose?: boolean;
    /** Статус автосохранения листа; null — индикатор скрыт. */
    saveStatus?: SheetSaveStatus | null;
  }>();

  const emit = defineEmits<{
    'close': [];
    'expand': [];
    'edit-background': [];
    'edit-class': [];
    'edit-name': [];
    'edit-progress': [];
    'edit-size': [];
    'edit-species': [];
    'edit-vision': [];
    'toggle-inspiration': [];
    'toggle-lock': [];
  }>();

  const saveStatusMeta = computed(() =>
    props.saveStatus ? SHEET_SAVE_STATUS_META[props.saveStatus] : null,
  );

  const saveStatusIconClass = computed(() => {
    if (props.saveStatus === 'error') {
      return 'text-error';
    }

    if (props.saveStatus === 'saving') {
      return 'animate-spin text-muted';
    }

    return 'text-muted';
  });

  const lockIcon = computed(() =>
    props.locked ? 'tabler:lock' : 'tabler:lock-open',
  );

  const lockColor = computed(() => (props.locked ? 'warning' : 'neutral'));

  const lockTooltip = computed(() =>
    props.locked
      ? 'Редактирование заблокировано'
      : 'Заблокировать редактирование',
  );

  const speciesLabel = computed(() =>
    props.character.species
      ? getSpeciesDisplayName(props.character.species)
      : SHEET_EMPTY_LABELS.species,
  );

  const classLabel = computed(() =>
    props.character.characterClass
      ? `${getClassDisplayName(props.character.characterClass)} ${props.character.level}`
      : SHEET_EMPTY_LABELS.className,
  );

  const backgroundLabel = computed(
    () =>
      props.character.characterBackground?.name
      ?? SHEET_EMPTY_LABELS.background,
  );

  const sizeLetter = computed(() => props.character.size?.charAt(0) ?? null);

  const sizeTooltip = computed(() =>
    props.character.size
      ? `Размер: ${props.character.size}`
      : 'Размер не указан',
  );

  const inspirationVariant = computed(() =>
    props.character.inspiration ? 'soft' : 'outline',
  );

  const inspirationClass = computed(() =>
    props.character.inspiration
      ? 'rounded-full'
      : 'rounded-full opacity-50 grayscale-50',
  );

  const inspirationTooltip = computed(() =>
    props.character.inspiration ? 'Вдохновение есть' : 'Вдохновения нет',
  );

  const visionRows = computed(() => getVisionRows(props.character.vision));

  const hasVisionDetails = computed(() =>
    visionRows.value.some((row) => row.formattedValue !== null),
  );
</script>

<template>
  <header
    class="flex flex-col items-center gap-4 @2xl:flex-row @2xl:items-start @2xl:gap-6"
  >
    <div class="relative mb-2 shrink-0 @2xl:mb-0">
      <div
        class="flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-warning/70 bg-elevated"
      >
        <img
          v-if="character.avatarUrl"
          :src="character.avatarUrl"
          :alt="character.name"
          class="size-full object-cover"
        />

        <UIcon
          v-else
          name="tabler:user"
          class="size-10 text-muted"
        />
      </div>

      <div
        class="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1"
      >
        <UTooltip :text="VISION_LABELS.normal">
          <!-- Непрозрачная подложка: soft-вариант кнопки полупрозрачный,
            без неё сквозь кнопку просвечивает край аватара -->
          <span class="rounded-full bg-default">
            <UButton
              icon="tabler:eye"
              color="warning"
              variant="soft"
              size="xs"
              square
              class="rounded-full"
              aria-label="Настроить зрение"
              @click.left.exact.prevent="emit('edit-vision')"
            />
          </span>

          <!-- Строки с дистанциями — только когда есть особые чувства,
            иначе обычный текстовый тултип, как у соседней кнопки размера -->
          <template
            v-if="hasVisionDetails"
            #content
          >
            <div class="flex flex-col gap-1 p-1">
              <div
                v-for="row in visionRows"
                :key="row.key"
                class="flex items-baseline gap-2 text-xs"
              >
                <span class="text-muted">{{ row.label }}</span>

                <span
                  v-if="row.formattedValue"
                  class="font-bold text-highlighted"
                >
                  {{ row.formattedValue }}
                </span>
              </div>
            </div>
          </template>
        </UTooltip>

        <UTooltip :text="sizeTooltip">
          <span class="rounded-full bg-default">
            <UButton
              color="warning"
              variant="soft"
              size="xs"
              square
              class="rounded-full"
              :aria-label="sizeTooltip"
              @click.left.exact.prevent="emit('edit-size')"
            >
              <span
                v-if="sizeLetter"
                class="w-4 text-center text-xs font-bold"
              >
                {{ sizeLetter }}
              </span>

              <UIcon
                v-else
                name="tabler:ruler-2"
                class="size-4"
              />
            </UButton>
          </span>
        </UTooltip>
      </div>
    </div>

    <div class="flex w-full min-w-0 grow flex-col gap-1 @2xl:w-auto">
      <button
        type="button"
        class="max-w-full cursor-pointer truncate text-center text-3xl font-bold tracking-wide text-highlighted transition-colors hover:text-warning @2xl:max-w-fit @2xl:text-left"
        aria-label="Изменить имя персонажа"
        @click.left.exact.prevent="emit('edit-name')"
      >
        {{ character.name }}
      </button>

      <span
        class="flex min-w-0 flex-wrap items-center justify-center gap-1 text-sm text-muted italic @2xl:justify-start"
      >
        <button
          type="button"
          class="cursor-pointer rounded px-1 transition-colors hover:bg-elevated/60 hover:text-warning"
          aria-label="Выбрать вид персонажа"
          @click.left.exact.prevent="emit('edit-species')"
        >
          {{ speciesLabel }}
        </button>

        <span>—</span>

        <button
          type="button"
          class="cursor-pointer rounded px-1 transition-colors hover:bg-elevated/60 hover:text-warning"
          aria-label="Выбрать класс персонажа"
          @click.left.exact.prevent="emit('edit-class')"
        >
          {{ classLabel }}
        </button>

        <span>—</span>

        <button
          type="button"
          class="cursor-pointer truncate rounded px-1 transition-colors hover:bg-elevated/60 hover:text-warning"
          aria-label="Выбрать предысторию персонажа"
          @click.left.exact.prevent="emit('edit-background')"
        >
          {{ backgroundLabel }}
        </button>
      </span>

      <button
        type="button"
        class="mt-2 flex w-full cursor-pointer items-center gap-3 rounded p-1 text-xs text-toned transition-colors hover:bg-elevated/40 @5xl:max-w-lg"
        aria-label="Настроить опыт и уровень"
        @click.left.exact.prevent="emit('edit-progress')"
      >
        <span class="shrink-0"
          ><span class="hidden @5xl:inline">Уровень </span
          >{{ character.level }}</span
        >

        <span class="relative grow">
          <UProgress
            :model-value="character.experience.current"
            :max="character.experience.nextLevel"
            size="sm"
            color="warning"
            class="w-full"
          />

          <span
            class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-default/60 px-2 py-0.5 text-[10px] leading-none font-medium text-toned backdrop-blur-md"
          >
            {{ character.experience.current }} /
            {{ character.experience.nextLevel }} XP
          </span>
        </span>

        <span class="shrink-0"
          ><span class="hidden @5xl:inline">Уровень </span
          >{{ character.level + 1 }}</span
        >
      </button>
    </div>

    <div
      class="order-first flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-3 @2xl:order-0 @2xl:w-auto @2xl:flex-col @2xl:flex-nowrap @2xl:items-end @2xl:justify-start @2xl:gap-4 @2xl:self-stretch"
    >
      <div class="flex items-center gap-1">
        <UTooltip
          v-if="saveStatusMeta"
          :text="saveStatusMeta.label"
        >
          <span
            role="status"
            class="grid size-8 place-items-center"
            :aria-label="saveStatusMeta.label"
          >
            <UIcon
              :name="saveStatusMeta.icon"
              class="size-5"
              :class="saveStatusIconClass"
            />
          </span>
        </UTooltip>

        <UTooltip :text="lockTooltip">
          <UButton
            :icon="lockIcon"
            :color="lockColor"
            variant="ghost"
            square
            :aria-label="lockTooltip"
            @click.left.exact.prevent="emit('toggle-lock')"
          />
        </UTooltip>

        <UButton
          icon="tabler:settings"
          color="neutral"
          variant="ghost"
          square
          disabled
        />

        <UTooltip
          v-if="canExpand"
          text="Открыть на отдельной странице"
        >
          <UButton
            icon="tabler:arrow-up-right"
            color="neutral"
            variant="ghost"
            square
            aria-label="Открыть на отдельной странице"
            @click.left.exact.prevent="emit('expand')"
          />
        </UTooltip>

        <UTooltip
          v-if="canClose"
          text="Закрыть"
        >
          <UButton
            icon="tabler:x"
            color="neutral"
            variant="ghost"
            square
            aria-label="Закрыть"
            @click.left.exact.prevent="emit('close')"
          />
        </UTooltip>
      </div>

      <div class="flex items-center gap-2 @max-2xl:order-first">
        <UTooltip :text="inspirationTooltip">
          <UButton
            icon="tabler:sparkles"
            label="Вдохновение"
            color="warning"
            :variant="inspirationVariant"
            class="@max-5xl:hidden"
            :class="inspirationClass"
            :aria-pressed="character.inspiration"
            @click.left.exact.prevent="emit('toggle-inspiration')"
          />
        </UTooltip>

        <UTooltip :text="inspirationTooltip">
          <UButton
            icon="tabler:sparkles"
            color="warning"
            :variant="inspirationVariant"
            square
            class="@5xl:hidden"
            :class="inspirationClass"
            :aria-pressed="character.inspiration"
            aria-label="Вдохновение"
            @click.left.exact.prevent="emit('toggle-inspiration')"
          />
        </UTooltip>

        <UButton
          icon="tabler:campfire"
          color="neutral"
          variant="ghost"
          square
          disabled
        />

        <UButton
          icon="tabler:moon"
          color="neutral"
          variant="ghost"
          square
          disabled
        />
      </div>
    </div>
  </header>
</template>
