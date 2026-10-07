<script setup lang="ts">
  import type { CharacterClassResource } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    CLASS_RESOURCE_MODAL_TITLES,
    FEAT_RESOURCE_HINT,
    getFeatResourceBase,
    getResourceMax,
    getResourceRecoveryBadges,
    isEmptyFeatResource,
    isFeatResource,
    NEW_CLASS_RESOURCE,
    RESOURCE_ROW_BADGE_CLASS,
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

  // Ресурс справочника без зарядов ещё не открылся и в список не попадает, но
  // из черновика не уходит: «Применить» вернёт его листу, и строка появится
  // сама, когда персонаж дорастёт
  const displayRows = computed(() =>
    draftResources.value
      .filter((resource) => !isEmptyFeatResource(character.value, resource))
      .map((resource) => {
        const isFromFeat = isFeatResource(resource);

        // Правки ресурса справочника считаются как разница с книжной записью.
        // Справочник мог перестать давать счётчик (механику переписали) — без
        // книжной записи разницу считать не с чем, и строка остаётся только
        // для чтения.
        const bookResource = getFeatResourceBase(character.value, resource);
        const isEditable = !isFromFeat || Boolean(bookResource);
        const isHidden = Boolean(resource.hidden);

        return {
          ...resource,
          max: getResourceMax(character.value, resource),
          recoveryBadges: getResourceRecoveryBadges(resource),
          isFromFeat,
          isEditable,
          isHidden,
          isOverridden: Boolean(resource.overrides),
          tag: isEditable ? 'button' : 'div',
          buttonType: isEditable ? 'button' : undefined,
          cursorClass: isEditable ? 'cursor-pointer' : 'cursor-default',
          // Убранная с листа строка приглушена: в списке настройки она нужна,
          // иначе вернуть её было бы нечем.
          hiddenClass: isHidden ? 'opacity-60' : undefined,
          editLabel: isEditable
            ? `${RESOURCE_ROW_LABELS.edit}: ${resource.name}`
            : undefined,
          removeLabel: `${RESOURCE_ROW_LABELS.remove}: ${resource.name}`,
          visibilityIcon: isHidden ? 'tabler:eye' : 'tabler:eye-off',
          visibilityHint: isHidden
            ? RESOURCE_ROW_LABELS.show
            : RESOURCE_ROW_LABELS.hide,
          visibilityLabel: isHidden
            ? `${RESOURCE_ROW_LABELS.show}: ${resource.name}`
            : `${RESOURCE_ROW_LABELS.hide}: ${resource.name}`,
        };
      }),
  );

  const countLabel = computed(() => `${displayRows.value.length} шт.`);

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
   * не место. Вместе с записью справочника уходит её книжный вид — по нему
   * форма считает правки.
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

    const bookResource = getFeatResourceBase(character.value, resource);

    if (isFeatResource(resource) && !bookResource) {
      return;
    }

    const saved = await resourceModal.open({
      title: CLASS_RESOURCE_MODAL_TITLES.edit,
      resource,
      bookResource,
    }).result;

    if (!saved) {
      return;
    }

    draftResources.value = draftResources.value.map((draft) =>
      draft.id === saved.id ? saved : draft,
    );
  }

  /**
   * Ресурс справочника убирается с листа и возвращается обратно. Удалить его
   * нельзя: черта выдаст его снова на ближайшей пересборке, поэтому строка
   * остаётся в списке настройки с пометкой.
   *
   * @param resourceId идентификатор ресурса.
   */
  function handleToggleVisibility(resourceId: string) {
    draftResources.value = draftResources.value.map((resource) =>
      resource.id === resourceId
        ? { ...resource, hidden: !resource.hidden }
        : resource,
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
            :label="ACTION_LABELS.add"
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
            :class="[row.cursorClass, row.hiddenClass]"
            :aria-label="row.editLabel"
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

            <!-- Пометки записи справочника: что в ней правлено игроком и что
              она убрана с листа. Без них строка со своими числами ничем не
              отличалась бы от книжной -->
            <span
              v-if="row.isOverridden"
              :class="RESOURCE_ROW_BADGE_CLASS"
              :title="RESOURCE_ROW_LABELS.overriddenHint"
            >
              {{ RESOURCE_ROW_LABELS.overridden }}
            </span>

            <span
              v-if="row.isHidden"
              :class="RESOURCE_ROW_BADGE_CLASS"
            >
              {{ RESOURCE_ROW_LABELS.hidden }}
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
              v-if="row.isEditable"
              name="tabler:pencil"
              class="size-4 shrink-0 text-dimmed"
            />
          </component>

          <!-- У записи справочника вместо корзины — глаз: удалить её нельзя,
            черта выдаст ресурс снова, а вот убрать с листа можно. Значок книги
            рядом объясняет, откуда ресурс взялся -->
          <template v-if="row.isFromFeat">
            <UTooltip :text="FEAT_RESOURCE_HINT">
              <UIcon
                name="tabler:book"
                class="size-5 shrink-0 text-dimmed"
                :aria-label="FEAT_RESOURCE_HINT"
              />
            </UTooltip>

            <UTooltip :text="row.visibilityHint">
              <UButton
                :icon="row.visibilityIcon"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                :aria-label="row.visibilityLabel"
                @click.left.exact.prevent="handleToggleVisibility(row.id)"
              />
            </UTooltip>
          </template>

          <UButton
            v-else
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
          v-if="!displayRows.length"
          class="text-sm text-dimmed italic"
        >
          {{ SHEET_EMPTY_LABELS.classResources }}
        </span>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
