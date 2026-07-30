<script setup lang="ts">
  import type { CharacterClassResource } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    CLASS_RESOURCE_MODAL_TITLES,
    getResourceRecoveryBadges,
    NEW_CLASS_RESOURCE,
    SHEET_EMPTY_LABELS,
    toClassResourceDraft,
  } from '../../model';
  import SheetClassResourceModal from './SheetClassResourceModal.vue';

  const emit = defineEmits<{
    close: [];
  }>();

  const overlay = useOverlay();

  const { character, setClassResources } = useCharacterSheet();

  // Ресурс правится в своём окне поверх списка: оно возвращает сохранённую
  // запись, а список остаётся черновиком до «Применить».
  const resourceModal = overlay.create(SheetClassResourceModal);

  const draftResources = ref<CharacterClassResource[]>(
    character.value.classResources.map(toClassResourceDraft),
  );

  const countLabel = computed(() => `${draftResources.value.length} шт.`);

  const displayRows = computed(() =>
    draftResources.value.map((resource) => ({
      ...resource,
      recoveryBadges: getResourceRecoveryBadges(resource),
    })),
  );

  /** Добавление ресурса: окно формы открывается с заготовкой нового счётчика. */
  async function handleAddResource() {
    const created = await resourceModal.open({
      title: CLASS_RESOURCE_MODAL_TITLES.add,
      resource: toClassResourceDraft({
        id: crypto.randomUUID(),
        ...NEW_CLASS_RESOURCE,
      }),
    }).result;

    if (!created) {
      return;
    }

    draftResources.value = [...draftResources.value, created];
  }

  /**
   * Правка ресурса в своём окне. В форму уходит запись черновика, а не строка
   * списка: у строки есть пометки восстановления, которым в документе листа
   * не место.
   *
   * @param resourceId идентификатор правимого ресурса.
   */
  async function handleEditResource(resourceId: string) {
    const resource = draftResources.value.find(
      (draft) => draft.id === resourceId,
    );

    if (!resource) {
      return;
    }

    const saved = await resourceModal.open({
      title: CLASS_RESOURCE_MODAL_TITLES.edit,
      resource,
    }).result;

    if (!saved) {
      return;
    }

    draftResources.value = draftResources.value.map((draft) =>
      draft.id === saved.id ? saved : draft,
    );
  }

  /**
   * Удаление ресурса из черновика.
   *
   * @param resourceId идентификатор удаляемого ресурса.
   */
  function handleRemoveResource(resourceId: string) {
    draftResources.value = draftResources.value.filter(
      (resource) => resource.id !== resourceId,
    );
  }

  /** Применение черновика к листу и закрытие окна. */
  function handleApply() {
    setClassResources(draftResources.value);
    emit('close');
  }

  /** Закрытие без правок: черновик пропадает вместе с окном. */
  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Ресурсы класса">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">{{ countLabel }}</span>

          <UButton
            icon="tabler:plus"
            label="Добавить"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="handleAddResource"
          />
        </div>

        <div
          v-for="row in displayRows"
          :key="row.id"
          class="flex items-center gap-2 rounded-lg border border-default/50 bg-elevated/20 p-2"
        >
          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 text-left"
            :aria-label="`Изменить ресурс: ${row.name}`"
            @click.left.exact.prevent="handleEditResource(row.id)"
          >
            <span
              class="w-9 shrink-0 truncate text-sm font-bold text-highlighted uppercase"
            >
              {{ row.shortLabel }}
            </span>

            <span class="min-w-0 grow truncate text-sm text-toned">
              {{ row.name }}
            </span>

            <span class="shrink-0 text-sm text-muted tabular-nums">
              <span class="font-bold text-highlighted">{{ row.current }}</span>
              /{{ row.max }}
            </span>

            <span
              v-for="badge in row.recoveryBadges"
              :key="badge.rest"
              class="flex shrink-0 items-center gap-0.5 text-muted"
              :title="badge.hint"
            >
              <UIcon
                :name="badge.icon"
                class="size-4 shrink-0"
              />

              <span class="text-[10px] leading-none font-bold">
                {{ badge.text }}
              </span>
            </span>

            <UIcon
              name="tabler:pencil"
              class="size-4 shrink-0 text-dimmed"
            />
          </button>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            :aria-label="`Удалить ресурс: ${row.name}`"
            @click.left.exact.prevent="handleRemoveResource(row.id)"
          />
        </div>

        <span
          v-if="!draftResources.length"
          class="text-sm text-dimmed italic"
        >
          {{ SHEET_EMPTY_LABELS.classResources }}
        </span>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
