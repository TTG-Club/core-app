<script setup lang="ts">
  import type { CharacterSpell } from '../../model';

  import { SpellDrawer } from '~spells/drawer';

  import {
    getSpellGroups,
    getSpellLevelLabel,
    SHEET_TAB_EMPTY_LABELS,
  } from '../../model';

  const props = defineProps<{
    spells: CharacterSpell[];
  }>();

  const emit = defineEmits<{
    'add-spell': [];
    'remove-spell': [spellUrl: string];
  }>();

  const overlay = useOverlay();

  // Дровер описания заклинания; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const spellPreviewDrawer = overlay.create(SpellDrawer, {
    props: {
      url: '',
      onClose: () => spellPreviewDrawer.close(),
    },
  });

  function handlePreview(url: string) {
    spellPreviewDrawer.open({ url });
  }

  const displayGroups = computed(() =>
    getSpellGroups(props.spells).map((group) => ({
      ...group,
      spells: group.spells.map((spell) => ({
        ...spell,
        levelLabel: getSpellLevelLabel(spell.level),
      })),
    })),
  );
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <div class="flex justify-end">
      <UButton
        icon="tabler:plus"
        label="Добавить заклинание"
        color="neutral"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="emit('add-spell')"
      />
    </div>

    <template v-if="displayGroups.length">
      <div
        v-for="group in displayGroups"
        :key="group.level"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <span
            class="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ group.label }}
          </span>

          <div class="h-px grow bg-default/50" />
        </div>

        <div
          v-for="spell in group.spells"
          :key="spell.url"
          class="group/spell relative flex items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3 transition-colors hover:border-warning/60"
        >
          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer items-center gap-3 text-left after:absolute after:inset-0 after:cursor-pointer"
            :aria-label="`Открыть заклинание: ${spell.name}`"
            @click.left.exact.prevent="handlePreview(spell.url)"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default/50 bg-default/40"
            >
              <UIcon
                name="tabler:wand"
                class="size-5 text-muted"
              />
            </span>

            <span class="flex min-w-0 grow flex-col">
              <span class="truncate text-sm font-medium text-highlighted">
                {{ spell.name }}
              </span>

              <span
                v-if="spell.school"
                class="truncate text-xs text-dimmed"
              >
                {{ spell.school }}
              </span>
            </span>
          </button>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/spell:opacity-100 focus-visible:opacity-100"
            :aria-label="`Убрать заклинание: ${spell.name}`"
            @click.left.exact.prevent="emit('remove-spell', spell.url)"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_TAB_EMPTY_LABELS.spells }}
    </div>
  </div>
</template>
