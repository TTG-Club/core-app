<script setup lang="ts">
  import type { Nexus, NexusTracker } from '../model';

  import { INITIATIVE_TOOL_ROUTE } from '~initiative/model';
  import { UiResult } from '~ui/result';

  import {
    NEXUS_TRACKER_CREATE_HINT,
    NEXUS_TRACKER_CREATE_LABEL,
    NEXUS_TRACKER_CREATE_TITLE,
    NEXUS_TRACKER_OPEN_LABEL,
    NEXUS_TRACKER_REMOVE_LABEL,
    NEXUS_TRACKER_TITLE_LABEL,
    NEXUS_TRACKER_TITLE_MAX_LENGTH,
    NEXUS_TRACKER_TITLE_PLACEHOLDER,
    NEXUS_TRACKERS_EMPTY_DESCRIPTION,
    NEXUS_TRACKERS_EMPTY_TITLE,
  } from '../model';

  /**
   * Бои комнаты.
   *
   * Сам бой ведётся в разделе трекеров: комната только показывает, какие бои
   * у группы идут, и уводит в нужный.
   */
  const { nexus } = defineProps<{
    nexus: Nexus;
    trackers: ReadonlyArray<NexusTracker>;
    loading?: boolean;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    create: [title: string];
    remove: [id: string];
  }>();

  const isCreateOpen = ref(false);
  const title = ref('');

  const isValid = computed(() => !!title.value.trim());

  // Окно живёт вместе со страницей: чистим поле на каждом открытии, иначе
  // прошлое название подставится в следующий бой.
  watch(isCreateOpen, (opened) => {
    if (opened) {
      title.value = '';
    }
  });

  /**
   * Адрес боя в разделе трекеров.
   * @param trackerId Идентификатор трекера.
   */
  function trackerRoute(trackerId: string): string {
    // Комната остаётся в ссылке: по ней страница боя понимает, куда
    // пересказывать ходы — сам трекер про комнаты ничего не знает.
    return `${INITIATIVE_TOOL_ROUTE}/${trackerId}?nexus=${nexus.id}`;
  }

  /** Ставит бой и закрывает окно. */
  function create(): void {
    if (isValid.value) {
      emit('create', title.value.trim());
      isCreateOpen.value = false;
    }
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <!-- Бой ставит тот, кто ведёт игру -->
    <UButton
      v-if="nexus.owner"
      size="sm"
      icon="tabler:swords"
      class="self-start"
      :disabled="busy"
      :label="NEXUS_TRACKER_CREATE_LABEL"
      @click.left.exact.prevent="isCreateOpen = true"
    />

    <div
      v-if="loading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 2"
        :key="index"
        class="h-14 w-full rounded-md"
      />
    </div>

    <UiResult
      v-else-if="!trackers.length"
      status="info"
      :title="NEXUS_TRACKERS_EMPTY_TITLE"
      :sub-title="NEXUS_TRACKERS_EMPTY_DESCRIPTION"
    />

    <div
      v-else
      class="flex flex-col gap-2"
    >
      <div
        v-for="tracker in trackers"
        :key="tracker.id"
        class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-default p-3"
      >
        <span class="min-w-0 font-medium text-highlighted">
          {{ tracker.title }}
        </span>

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            :to="trackerRoute(tracker.trackerId)"
            size="sm"
            color="neutral"
            variant="subtle"
            icon="tabler:swords"
            :label="NEXUS_TRACKER_OPEN_LABEL"
          />

          <UButton
            v-if="tracker.canRemove"
            size="sm"
            color="error"
            variant="subtle"
            icon="tabler:x"
            :disabled="busy"
            :label="NEXUS_TRACKER_REMOVE_LABEL"
            @click.left.exact.prevent="emit('remove', tracker.id)"
          />
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isCreateOpen"
      :title="NEXUS_TRACKER_CREATE_TITLE"
      :description="NEXUS_TRACKER_CREATE_HINT"
    >
      <template #body>
        <UFormField
          :label="NEXUS_TRACKER_TITLE_LABEL"
          required
        >
          <UInput
            v-model="title"
            autofocus
            :maxlength="NEXUS_TRACKER_TITLE_MAX_LENGTH"
            :placeholder="NEXUS_TRACKER_TITLE_PLACEHOLDER"
            class="w-full"
            @keyup.enter="create"
          />
        </UFormField>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            :disabled="busy"
            label="Отмена"
            @click.left.exact.prevent="isCreateOpen = false"
          />

          <UButton
            icon="tabler:swords"
            :loading="busy"
            :disabled="!isValid"
            :label="NEXUS_TRACKER_CREATE_LABEL"
            @click.left.exact.prevent="create"
          />
        </div>
      </template>
    </UModal>
  </section>
</template>
