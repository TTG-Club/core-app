<script setup lang="ts">
  import type { Character } from '../../model';

  import {
    getClassDisplayName,
    getSpeciesDisplayName,
    getVisionRows,
    SHEET_EMPTY_LABELS,
    VISION_LABELS,
  } from '../../model';

  const props = defineProps<{
    character: Character;
    locked: boolean;
  }>();

  const emit = defineEmits<{
    'edit-class': [];
    'edit-name': [];
    'edit-progress': [];
    'edit-size': [];
    'edit-species': [];
    'edit-vision': [];
    'toggle-inspiration': [];
    'toggle-lock': [];
  }>();

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
    () => props.character.background ?? SHEET_EMPTY_LABELS.background,
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
  <header class="flex items-start gap-6">
    <div class="relative shrink-0">
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

    <div class="flex min-w-0 grow flex-col gap-1">
      <button
        type="button"
        class="max-w-fit cursor-pointer truncate text-left text-3xl font-bold tracking-wide text-highlighted transition-colors hover:text-warning"
        aria-label="Изменить имя персонажа"
        @click.left.exact.prevent="emit('edit-name')"
      >
        {{ character.name }}
      </button>

      <span
        class="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted italic"
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

        <span class="truncate">— {{ backgroundLabel }}</span>
      </span>

      <button
        type="button"
        class="mt-2 flex max-w-lg cursor-pointer flex-col gap-1 rounded p-1 transition-colors hover:bg-elevated/40"
        aria-label="Настроить опыт и уровень"
        @click.left.exact.prevent="emit('edit-progress')"
      >
        <span class="flex w-full items-center gap-3 text-xs text-toned">
          <span class="shrink-0">Уровень {{ character.level }}</span>

          <UProgress
            :model-value="character.experience.current"
            :max="character.experience.nextLevel"
            size="sm"
            color="warning"
            class="grow"
          />

          <span class="shrink-0">Уровень {{ character.level + 1 }}</span>
        </span>

        <span class="w-full text-center text-[10px] text-muted">
          {{ character.experience.current }} /
          {{ character.experience.nextLevel }} XP
        </span>
      </button>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-4 self-stretch">
      <div class="flex gap-1">
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
        />

        <UButton
          icon="tabler:x"
          color="neutral"
          variant="ghost"
          square
        />
      </div>

      <div class="flex items-center gap-2">
        <UTooltip :text="inspirationTooltip">
          <UButton
            icon="tabler:sparkles"
            label="Вдохновение"
            color="warning"
            :variant="inspirationVariant"
            :class="inspirationClass"
            :aria-pressed="character.inspiration"
            @click.left.exact.prevent="emit('toggle-inspiration')"
          />
        </UTooltip>

        <UButton
          icon="tabler:campfire"
          color="neutral"
          variant="ghost"
          square
        />

        <UButton
          icon="tabler:moon"
          color="neutral"
          variant="ghost"
          square
        />
      </div>
    </div>
  </header>
</template>
