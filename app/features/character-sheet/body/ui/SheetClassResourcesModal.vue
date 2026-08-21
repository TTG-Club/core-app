<script setup lang="ts">
  import type { CharacterClassResource } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    CLASS_RESOURCE_MODAL_TITLES,
    FEAT_RESOURCE_HINT,
    getResourceMax,
    getResourceRecoveryBadges,
    isFeatResource,
    NEW_CLASS_RESOURCE,
    RESOURCE_ROW_ICONS,
    RESOURCE_ROW_LABELS,
    RESOURCES_TITLE,
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
    draftResources.value.map((resource) => {
      // Ресурс черты пересобирается из справочника при каждой смене черт:
      // правка и удаление вернулись бы назад, поэтому их и не предлагаем —
      // строка такого ресурса не кнопка, а обычный блок с замком.
      const isFromFeat = isFeatResource(resource);

      return {
        ...resource,
        max: getResourceMax(character.value, resource),
        recoveryBadges: getResourceRecoveryBadges(resource),
        isFromFeat,
        tag: isFromFeat ? 'div' : 'button',
        buttonType: isFromFeat ? undefined : 'button',
        cursorClass: isFromFeat ? 'cursor-default' : 'cursor-pointer',
        editLabel: isFromFeat
          ? undefined
          : `${RESOURCE_ROW_LABELS.edit}: ${resource.name}`,
        hint: isFromFeat ? FEAT_RESOURCE_HINT : undefined,
        icon: isFromFeat
          ? RESOURCE_ROW_ICONS.locked
          : RESOURCE_ROW_ICONS.editable,
        removeLabel: `${RESOURCE_ROW_LABELS.remove}: ${resource.name}`,
      };
    }),
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

    if (!resource || isFeatResource(resource)) {
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
  <UModal :title="RESOURCES_TITLE">
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
          <component
            :is="row.tag"
            :type="row.buttonType"
            class="flex min-w-0 grow flex-wrap items-center gap-x-2 gap-y-1 text-left"
            :class="row.cursorClass"
            :aria-label="row.editLabel"
            :title="row.hint"
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
              :name="row.icon"
              class="size-4 shrink-0 text-dimmed"
            />
          </component>

          <UButton
            v-if="!row.isFromFeat"
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            :aria-label="row.removeLabel"
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
