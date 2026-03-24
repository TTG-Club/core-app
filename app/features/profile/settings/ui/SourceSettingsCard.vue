<script setup lang="ts">
  import type { SavedFilterResponse } from '../model';

  import { useCloned } from '@vueuse/core';
  import { isEqual } from 'es-toolkit';
  import { FetchError } from 'ofetch';

  import { ProfileCardUI } from '../model';

  const toast = useToast();

  const {
    data: savedFilters,
    status,
    error: fetchError,
    refresh,
  } = useFetch<SavedFilterResponse>('/api/user/profile/saved-filter');

  const isSaving = ref(false);

  const { cloned: localFilters, sync } = useCloned<SavedFilterResponse | null>(
    () => savedFilters.value || null,
  );

  watch(
    savedFilters,
    (newVal) => {
      if (newVal) {
        sync();
      }
    },
    { immediate: true },
  );

  const isDirty = computed(
    () => !isEqual(localFilters.value, savedFilters.value),
  );

  async function handleSave() {
    if (!localFilters.value || !isDirty.value) {
      return;
    }

    isSaving.value = true;

    try {
      await $fetch('/api/user/profile/saved-filter', {
        method: 'PUT',
        body: localFilters.value,
      });

      toast.add({
        title: 'Настройки сохранены',
        description: 'Настройки источников успешно обновлены',
        color: 'success',
      });

      await refresh();
    } catch (err) {
      let errorMessage = 'Произошла ошибка при сохранении';

      if (err instanceof FetchError) {
        errorMessage = err.data?.message || err.message;
      }

      toast.add({
        title: 'Ошибка',
        description: errorMessage,
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }

  function handleCancel() {
    sync();
  }
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:books"
          class="h-5 w-5 text-primary"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">Настройка источников</h3>
      </div>
    </template>

    <div class="space-y-6">
      <div
        v-if="status === 'pending'"
        class="flex justify-center p-4"
      >
        <UIcon
          name="tabler:loader-2"
          class="h-6 w-6 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="fetchError"
        class="text-sm text-error"
      >
        Ошибка при загрузке настроек источников: {{ fetchError.message }}
      </div>

      <div
        v-else-if="localFilters"
        class="space-y-6"
      >
        <div
          v-for="group in localFilters.filter.groups"
          :key="`${group.key}-${group.name}`"
          class="grid gap-3"
        >
          <h4 class="text-foreground text-highlighted">
            {{ group.name }}
          </h4>

          <div class="grid gap-3 text-sm">
            <USwitch
              v-for="filter in group.filters"
              :key="filter.value"
              :model-value="filter.selected ?? false"
              :label="filter.name"
              @update:model-value="filter.selected = $event"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="!isDirty || isSaving"
          @click.left.exact.prevent="handleCancel"
        >
          Отменить
        </UButton>

        <UButton
          color="primary"
          :disabled="!isDirty"
          :loading="isSaving"
          @click.left.exact.prevent="handleSave"
        >
          Сохранить
        </UButton>
      </div>
    </template>
  </UCard>
</template>
