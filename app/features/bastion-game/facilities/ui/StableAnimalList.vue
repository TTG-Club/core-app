<script setup lang="ts">
  import type { BastionStable, StableAnimal } from '../../model';

  import { fillTemplate } from '~bastions/model';
  import { useCreatureDrawer } from '~initiative/composables';

  import { formatStableSpace, STABLE_LABELS } from '../../model';

  /**
   * Животные конюшни: название открывает статблок из бестиария в дровере,
   * значок отмечает тех, кто прожил в конюшне 14 дней. В режиме редактирования
   * животное можно забрать из конюшни.
   */
  const { stable, canRemove = false } = defineProps<{
    stable: BastionStable;
    /** Можно забрать животное: режим редактирования, игрок персонажа или мастер. */
    canRemove?: boolean;
  }>();

  const emit = defineEmits<{
    remove: [animal: StableAnimal];
  }>();

  const { openCreature } = useCreatureDrawer();

  const occupiedText = computed(() =>
    fillTemplate(STABLE_LABELS.occupied, {
      occupied: formatStableSpace(stable.occupied),
      capacity: formatStableSpace(stable.capacity),
    }),
  );
</script>

<template>
  <section class="flex flex-col gap-1">
    <div class="flex items-baseline justify-between gap-2 text-xs text-muted">
      <span>{{ STABLE_LABELS.title }}</span>

      <span class="tabular-nums">{{ occupiedText }}</span>
    </div>

    <p
      v-if="!stable.animals.length"
      class="text-sm text-muted"
    >
      {{ STABLE_LABELS.empty }}
    </p>

    <ul
      v-else
      class="flex flex-col gap-0.5 text-sm"
    >
      <li
        v-for="animal in stable.animals"
        :key="animal.id"
        class="flex items-center gap-1.5"
      >
        <UIcon
          name="tabler:horse"
          class="size-4 shrink-0 text-muted"
        />

        <ULink
          v-if="animal.bestiaryUrl"
          :to="`/bestiary/${animal.bestiaryUrl}`"
          class="truncate text-highlighted"
          @click.left.exact.prevent="openCreature(animal.bestiaryUrl)"
        >
          {{ animal.name }}
        </ULink>

        <span
          v-else
          class="truncate text-highlighted"
        >
          {{ animal.name }}
        </span>

        <span
          v-if="animal.size"
          class="shrink-0 text-xs text-muted"
        >
          {{ animal.size.name.toLowerCase() }}
        </span>

        <UTooltip
          v-if="animal.bonded"
          :text="STABLE_LABELS.bonded"
        >
          <UIcon
            name="tabler:heart-handshake"
            class="size-4 shrink-0 text-success"
            :aria-label="STABLE_LABELS.bonded"
          />
        </UTooltip>

        <UTooltip
          v-if="canRemove"
          :text="STABLE_LABELS.remove"
        >
          <UButton
            icon="tabler:x"
            color="neutral"
            variant="ghost"
            size="xs"
            class="ml-auto"
            :aria-label="STABLE_LABELS.remove"
            @click.left.exact.prevent="emit('remove', animal)"
          />
        </UTooltip>
      </li>
    </ul>
  </section>
</template>
