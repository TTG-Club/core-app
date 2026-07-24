<script setup lang="ts">
  import type { Character } from '~character-sheet/model';

  import { CharacterSheetDrawer } from '~character-sheet/drawer';
  import {
    CHARACTER_SHEET_ROUTE,
    getClassDisplayName,
    getSpeciesDisplayName,
    SHEET_EMPTY_LABELS,
  } from '~character-sheet/model';

  const { character } = defineProps<{
    character: Character;
  }>();

  const { isDesktop } = useDevice();
  const overlay = useOverlay();

  const to = computed(() => `${CHARACTER_SHEET_ROUTE}/${character.id}`);

  const drawer = overlay.create(CharacterSheetDrawer, {
    props: {
      characterId: character.id,
      onClose: () => drawer.close(),
    },
  });

  const { isOpened, handleOpen } = useSectionLink(character.id, drawer.id, () =>
    drawer.open(),
  );

  const classLabel = computed(() =>
    character.characterClass
      ? getClassDisplayName(character.characterClass)
      : SHEET_EMPTY_LABELS.className,
  );

  const speciesLabel = computed(() =>
    character.species
      ? getSpeciesDisplayName(character.species)
      : SHEET_EMPTY_LABELS.species,
  );

  const backgroundLabel = computed(
    () => character.characterBackground?.name ?? SHEET_EMPTY_LABELS.background,
  );

  const cardClass = computed(() =>
    isOpened.value
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-elevated hover:border-accented hover:bg-accented',
  );

  /**
   * На десктопе клик открывает drawer (стандартный режим) или правую панель
   * (широкий режим); на мобильных — переходит на отдельную страницу листа.
   */
  function handleClick(): void {
    if (!isDesktop) {
      navigateTo(to.value);

      return;
    }

    handleOpen();
  }

  /** Открывает лист на отдельной странице (в обход drawer). */
  function openOnPage(): void {
    navigateTo(to.value);
  }
</script>

<template>
  <div
    class="flex min-h-20 w-full items-center gap-3 rounded-xl border p-3 transition-all"
    :class="cardClass"
  >
    <NuxtLink
      v-slot="{ href }"
      custom
      :to
    >
      <a
        :href="href ?? undefined"
        class="flex min-w-0 flex-auto items-center gap-4"
        @click.left.exact.prevent="handleClick"
      >
        <div
          class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/5 ring-1 ring-primary/15"
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
            class="size-7 text-primary"
          />
        </div>

        <div class="flex min-w-0 flex-auto flex-col gap-0.5">
          <span class="truncate text-base font-semibold text-highlighted">
            {{ character.name }}
          </span>

          <span class="truncate text-sm text-secondary">
            {{ character.level }} уровень · {{ classLabel }}
          </span>

          <span class="truncate text-xs text-muted">
            {{ speciesLabel }} · {{ backgroundLabel }}
          </span>

          <span
            class="mt-0.5 flex items-center gap-1 text-xs text-muted"
            title="Хиты: сейчас / всего"
          >
            <UIcon
              name="tabler:heart"
              class="size-3.5 shrink-0 text-error"
            />

            <span class="truncate">
              Хиты: {{ character.health.current }} / {{ character.health.max }}
            </span>
          </span>
        </div>
      </a>
    </NuxtLink>

    <UTooltip text="Открыть на отдельной странице">
      <UButton
        icon="tabler:arrow-up-right"
        color="neutral"
        variant="soft"
        square
        class="shrink-0"
        aria-label="Открыть на отдельной странице"
        @click.left.exact.prevent="openOnPage"
      />
    </UTooltip>
  </div>
</template>
