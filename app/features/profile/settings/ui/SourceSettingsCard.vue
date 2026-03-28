<script setup lang="ts">
  import type { AccordionItem } from '@nuxt/ui';

  import type { SavedFilterGroup, SavedFilterResponse } from '../model';

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

  const accordionItems = computed<AccordionItem[]>(() => {
    if (!localFilters.value?.filter?.groups) {
      return [];
    }

    return localFilters.value.filter.groups.map((group) => {
      const selectedCount = group.filters.filter(
        (entry) => entry.selected,
      ).length;

      return {
        label: group.name,
        value: `${group.key}-${group.name}`,
        description: `${selectedCount} из ${group.filters.length}`,
      };
    });
  });

  /**
   * Возвращает состояние мастер-чекбокса для группы:
   * true — все выбраны, false — ничего, 'indeterminate' — частично
   */
  function getGroupCheckState(
    group: SavedFilterGroup,
  ): boolean | 'indeterminate' {
    const total = group.filters.length;
    const selected = group.filters.filter((entry) => entry.selected).length;

    if (selected === 0) {
      return false;
    }

    return selected === total ? true : 'indeterminate';
  }

  /** Переключает все источники в категории */
  function toggleGroup(group: SavedFilterGroup) {
    const allSelected = group.filters.every((entry) => entry.selected);
    const newState = !allSelected;

    for (const entry of group.filters) {
      entry.selected = newState;
    }
  }

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

    <div>
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
        class="bg-background/50 divide-y divide-default overflow-hidden rounded-xl border border-default shadow-sm"
      >
        <UAccordion
          type="multiple"
          :items="accordionItems"
          :ui="{
            trigger: 'px-4 py-3.5 hover:bg-hover text-base',
            body: 'px-4 pb-4 pt-1',
          }"
        >
          <template #body="{ index }">
            <div
              v-if="localFilters?.filter?.groups[index]"
              class="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              <div
                v-for="filterItem in localFilters.filter.groups[index].filters"
                :key="filterItem.value"
                class="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg border px-3 py-2 transition-all duration-200 select-none"
                :class="[
                  filterItem.selected
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/50'
                    : 'bg-background border-default hover:border-primary/30 hover:bg-hover',
                ]"
                @click="filterItem.selected = !filterItem.selected"
              >
                <!-- Декоративный градиент при выборе -->
                <div
                  v-if="filterItem.selected"
                  class="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-50"
                />

                <UIcon
                  :name="
                    filterItem.selected
                      ? 'fluent:checkbox-checked-24-filled'
                      : 'fluent:checkbox-unchecked-24-regular'
                  "
                  class="relative z-10 h-4 w-4 shrink-0 transition-colors duration-200"
                  :class="filterItem.selected ? 'text-primary' : 'text-muted'"
                />

                <div
                  class="relative z-10 flex min-w-0 flex-1 items-center justify-between gap-2"
                >
                  <span
                    class="truncate text-sm font-medium transition-colors"
                    :class="
                      filterItem.selected
                        ? 'text-foreground'
                        : 'text-foreground/80'
                    "
                    :title="filterItem.name"
                  >
                    {{ filterItem.name }}
                  </span>

                  <UBadge
                    variant="subtle"
                    size="xs"
                    class="shrink-0 px-1.5 py-0.5 font-mono text-[10px] leading-tight tracking-wider shadow-none"
                    :color="filterItem.selected ? 'primary' : 'neutral'"
                  >
                    {{ filterItem.value }}
                  </UBadge>
                </div>
              </div>
            </div>
          </template>

          <template #leading="{ index }">
            <div
              class="mr-1 flex items-center justify-center"
              @click.stop
            >
              <UTooltip
                :text="
                  getGroupCheckState(localFilters?.filter?.groups[index]!)
                  === true
                    ? 'Снять выделение со всех'
                    : 'Выбрать все'
                "
              >
                <UCheckbox
                  v-if="localFilters?.filter?.groups[index]"
                  :model-value="
                    getGroupCheckState(localFilters.filter.groups[index])
                  "
                  @update:model-value="
                    toggleGroup(localFilters.filter.groups[index])
                  "
                />
              </UTooltip>
            </div>
          </template>
        </UAccordion>
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
