<script setup lang="ts">
  import type { CreatureOption } from '~initiative/model';

  import type { EncounterCreature } from '../model';

  import {
    useCreatureDrawer,
    useCreatureSearch,
  } from '~initiative/composables';

  import {
    BESTIARY_PAGE_PREFIX,
    CREATURE_SEARCH_HINT_LABEL,
    CREATURE_SEARCH_NOT_FOUND_LABEL,
    formatExperience,
    getCreatureExperience,
    MAX_ROW_COUNT,
    MIN_ROW_COUNT,
    TRANSFER_LABELS,
  } from '../model';
  import EncounterNumberInput from './EncounterNumberInput.vue';

  const { creatures, canAdd = true } = defineProps<{
    creatures: Array<EncounterCreature>;
    canAdd?: boolean;
  }>();

  const emit = defineEmits<{
    add: [option: CreatureOption, count: number];
    update: [
      id: string,
      patch: Partial<Pick<EncounterCreature, 'count' | 'inLair'>>,
    ];
    remove: [id: string];
    clear: [];
    transfer: [];
  }>();

  const { searchTerm, options, isLoading } = useCreatureSearch();
  const { openCreature } = useCreatureDrawer();

  const selected = ref<CreatureOption | undefined>(undefined);
  const batchCount = ref(MIN_ROW_COUNT);

  const emptyLabel = computed(() =>
    searchTerm.value.trim()
      ? CREATURE_SEARCH_NOT_FOUND_LABEL
      : CREATURE_SEARCH_HINT_LABEL,
  );

  const rows = computed(() =>
    creatures.map((creature) => {
      const experience = getCreatureExperience(creature);

      return {
        ...creature,
        href: `${BESTIARY_PAGE_PREFIX}${creature.url}`,
        hasLair: creature.experienceInLair !== undefined,
        experienceText: formatExperience(experience),
        totalText: formatExperience(experience * creature.count),
      };
    }),
  );

  /** Добавляет выбранное существо в столкновение и очищает форму поиска. */
  function submit(): void {
    if (!selected.value || !canAdd) {
      return;
    }

    emit('add', selected.value, batchCount.value);

    selected.value = undefined;
    searchTerm.value = '';
    batchCount.value = MIN_ROW_COUNT;
  }
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:paw"
        class="size-5 text-primary"
      />
      Существа

      <UButton
        v-if="creatures.length"
        size="xs"
        variant="soft"
        icon="tabler:swords"
        class="ml-auto"
        :aria-label="TRANSFER_LABELS.buttonAria"
        @click.left.exact.prevent="emit('transfer')"
      >
        {{ TRANSFER_LABELS.button }}
      </UButton>

      <UButton
        v-if="creatures.length"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="tabler:eraser"
        @click.left.exact.prevent="emit('clear')"
      >
        Очистить
      </UButton>
    </div>

    <form
      class="flex flex-wrap items-end gap-2"
      @submit.prevent="submit"
    >
      <UFormField
        label="Существо из бестиария"
        class="min-w-48 flex-1"
      >
        <UInputMenu
          v-model="selected"
          v-model:search-term="searchTerm"
          :items="options"
          :loading="isLoading"
          ignore-filter
          by="url"
          label-key="label"
          placeholder="Найти существо…"
          icon="tabler:search"
          class="w-full"
          :disabled="!canAdd"
        >
          <template #item-trailing="{ item: option }">
            <UBadge
              v-if="option.challengeRating"
              size="sm"
              color="neutral"
              variant="subtle"
            >
              ПО {{ option.challengeRating }}
            </UBadge>
          </template>

          <template #empty>
            <span class="text-sm text-secondary">
              {{ emptyLabel }}
            </span>
          </template>
        </UInputMenu>
      </UFormField>

      <UFormField
        label="Количество"
        class="shrink-0"
      >
        <UInputNumber
          v-model="batchCount"
          :min="MIN_ROW_COUNT"
          :max="MAX_ROW_COUNT"
          :disabled="!canAdd"
          class="w-24"
        />
      </UFormField>

      <UButton
        type="submit"
        icon="tabler:plus"
        class="shrink-0 max-sm:grow max-sm:justify-center"
        :disabled="!selected || !canAdd"
        aria-label="Добавить существо"
      />
    </form>

    <p
      v-if="!rows.length"
      class="text-sm text-secondary"
    >
      Найдите существ в бестиарии и добавьте их в столкновение.
    </p>

    <ul
      v-else
      class="flex flex-col divide-y divide-default"
    >
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 py-2"
      >
        <div class="flex min-w-40 flex-1 flex-col">
          <ULink
            :to="row.href"
            class="font-medium text-highlighted hover:text-primary"
            @click.left.exact.prevent="openCreature(row.url)"
          >
            {{ row.name }}
          </ULink>

          <span class="text-xs text-muted tabular-nums">
            ПО {{ row.challengeRating }} · опыт {{ row.experienceText }} · всего
            {{ row.totalText }}
          </span>
        </div>

        <USwitch
          v-if="row.hasLair"
          :model-value="row.inLair"
          label="В логове"
          @update:model-value="emit('update', row.id, { inLair: $event })"
        />

        <EncounterNumberInput
          :model-value="row.count"
          :min="MIN_ROW_COUNT"
          :max="MAX_ROW_COUNT"
          class="w-24"
          aria-label="Количество существ"
          @update:model-value="emit('update', row.id, { count: $event })"
        />

        <UButton
          icon="tabler:trash"
          color="neutral"
          variant="ghost"
          aria-label="Убрать существо"
          @click.left.exact.prevent="emit('remove', row.id)"
        />
      </li>
    </ul>
  </section>
</template>
