<script setup lang="ts">
  import type { Character } from '../../model';

  import { getVisionRows, SHEET_EMPTY_LABELS } from '../../model';

  const props = defineProps<{
    character: Character;
  }>();

  const emit = defineEmits<{
    'edit-name': [];
    'edit-progress': [];
    'edit-vision': [];
  }>();

  const subtitle = computed(() => {
    const species = props.character.species ?? SHEET_EMPTY_LABELS.species;

    const background =
      props.character.background ?? SHEET_EMPTY_LABELS.background;

    const classWithLevel = `${props.character.className} ${props.character.level}`;

    return `${species} — ${classWithLevel} — ${background}`;
  });

  const inspirationVariant = computed(() =>
    props.character.inspiration ? 'soft' : 'outline',
  );

  const visionRows = computed(() => getVisionRows(props.character.vision));
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

      <UTooltip>
        <UButton
          icon="tabler:eye"
          color="warning"
          variant="soft"
          size="xs"
          square
          class="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full"
          aria-label="Настроить зрение"
          @click.left.exact.prevent="emit('edit-vision')"
        />

        <template #content>
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

      <span class="truncate text-sm text-muted italic">{{ subtitle }}</span>

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
        <UButton
          icon="tabler:sparkles"
          label="Вдохновение"
          color="warning"
          :variant="inspirationVariant"
          class="rounded-full"
        />

        <UButton
          icon="tabler:flask"
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
