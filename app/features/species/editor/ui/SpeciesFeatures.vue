<script setup lang="ts">
  import type { SpeciesFeatureCreate } from '../../model';

  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';
  import { MarkupEditor } from '~ui/markup-editor';

  import {
    getFeatureFilledBlocksCount,
    getSpeciesFeatureLevelBadge,
    SPECIES_EDITOR_LABELS,
    SPECIES_FEATURE_LEVEL,
    SPECIES_FEATURES_EDITOR,
  } from '../../model';
  import SpeciesFeatureMechanics from './SpeciesFeatureMechanics.vue';

  /**
   * Пустое умение вида. Механика и строки редактора здесь всегда объекты:
   * загрузка сливает ответ сервера именно с этим состоянием, и недостающие
   * блоки берутся отсюда.
   *
   * @returns новое умение формы.
   */
  function getEmptyFeature(): SpeciesFeatureCreate {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
      level: undefined,
      grantedSpells: [],
      mechanics: createFeatMechanics(),
      activeEffects: [],
      editorRows: createFeatEditorRows(),
    };
  }

  /**
   * Пересдвигает индексы набора после удаления строки: без этого раскрытой
   * оказалась бы соседка удалённой особенности.
   *
   * @param indexes набор индексов строк.
   * @param removed индекс удалённой строки.
   * @returns новый набор со сдвинутыми индексами.
   */
  function shiftIndexes(indexes: Set<number>, removed: number): Set<number> {
    return new Set(
      [...indexes]
        .filter((position) => position !== removed)
        .map((position) => (position > removed ? position - 1 : position)),
    );
  }

  const model = defineModel<Array<SpeciesFeatureCreate>>({
    default: () => [],
  });

  /**
   * Раскрытые особенности — по их индексу. Свой список, а не аккордеон: кнопка
   * удаления обязана лежать РЯДОМ с раскрывающим триггером, а не внутри него,
   * иначе удалить особенность можно только развернув её.
   */
  const expanded = ref<Set<number>>(new Set());

  /**
   * Особенности, которым автор явно добавил поле описания. Пустое поле у
   * особенности без описания не показывается вовсе — редактор появляется по
   * кнопке либо когда описание уже заполнено в записи.
   */
  const withDescription = ref<Set<number>>(new Set());

  /** Индекс особенности, удаление которой ждёт подтверждения. */
  const pendingRemoval = ref<number | undefined>(undefined);

  const isRemovalOpen = computed({
    get: () => pendingRemoval.value !== undefined,
    set: (open) => {
      if (!open) {
        pendingRemoval.value = undefined;
      }
    },
  });

  /**
   * Раскрыта ли особенность.
   *
   * @param index позиция особенности в списке.
   * @returns `true`, когда тело строки развёрнуто.
   */
  function isExpanded(index: number): boolean {
    return expanded.value.has(index);
  }

  /**
   * Значок кнопки свёртки. Функцией, а не вычисляемым свойством: состояние
   * своё у каждой строки списка.
   *
   * @param index позиция особенности в списке.
   * @returns имя значка.
   */
  function getToggleIcon(index: number): string {
    return isExpanded(index) ? 'tabler:chevron-up' : 'tabler:chevron-down';
  }

  /**
   * Подпись кнопки свёртки для скринридера.
   *
   * @param index позиция особенности в списке.
   * @returns подпись действия.
   */
  function getToggleLabel(index: number): string {
    return isExpanded(index)
      ? SPECIES_FEATURES_EDITOR.collapse
      : SPECIES_FEATURES_EDITOR.expand;
  }

  /**
   * Разворачивает или сворачивает особенность.
   *
   * @param index позиция особенности в списке.
   */
  function toggleFeature(index: number): void {
    const next = new Set(expanded.value);

    if (!next.delete(index)) {
      next.add(index);
    }

    expanded.value = next;
  }

  /**
   * Подпись бейджа механики в шапке строки: сколько блоков умения заполнено.
   *
   * @param feature умение строки.
   * @returns подпись либо `undefined`, когда механика пуста.
   */
  function getMechanicsBadge(
    feature: SpeciesFeatureCreate,
  ): string | undefined {
    const filledBlocksCount = getFeatureFilledBlocksCount(feature);

    return filledBlocksCount
      ? `${SPECIES_FEATURES_EDITOR.mechanicsBadge}${filledBlocksCount}`
      : undefined;
  }

  /**
   * Показывать ли поле описания у особенности.
   *
   * @param index позиция особенности в списке.
   * @returns `true`, когда описание заполнено или явно добавлено автором.
   */
  function hasDescription(index: number): boolean {
    return (
      Boolean(model.value[index]?.description)
      || withDescription.value.has(index)
    );
  }

  /**
   * Показывает поле описания у особенности без описания.
   *
   * @param index позиция особенности в списке.
   */
  function showDescription(index: number): void {
    withDescription.value = new Set([...withDescription.value, index]);
  }

  /** Заводит пустую особенность в конце списка и сразу раскрывает её. */
  function addFeature(): void {
    // Индекс считается ДО записи: `model.value` после присваивания ещё отдаёт
    // прежний массив — проп доедет только следующим тиком.
    const addedIndex = model.value.length;

    model.value = [...model.value, getEmptyFeature()];

    // Новая особенность сразу раскрыта: её всё равно тут же заполняют.
    expanded.value = new Set([...expanded.value, addedIndex]);
  }

  /**
   * Запрашивает подтверждение удаления особенности.
   *
   * @param index позиция особенности в списке.
   */
  function askRemoveFeature(index: number): void {
    pendingRemoval.value = index;
  }

  /** Удаляет особенность после подтверждения и пересдвигает раскрытые. */
  function confirmRemoveFeature(): void {
    const index = pendingRemoval.value;

    pendingRemoval.value = undefined;

    if (index === undefined) {
      return;
    }

    model.value = model.value.filter((_, position) => position !== index);

    expanded.value = shiftIndexes(expanded.value, index);
    withDescription.value = shiftIndexes(withDescription.value, index);
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed italic"
    >
      {{ SPECIES_FEATURES_EDITOR.empty }}
    </p>

    <div
      v-for="(feature, featIndex) in model"
      :key="featIndex"
      class="rounded-lg border border-default bg-elevated/20"
    >
      <div class="flex items-center gap-2 px-3 py-2">
        <span class="min-w-0 flex-1 truncate text-base">
          {{ feature.name.rus || SPECIES_FEATURES_EDITOR.unnamed }}
        </span>

        <UBadge
          v-if="getSpeciesFeatureLevelBadge(feature.level)"
          size="sm"
          color="neutral"
          variant="subtle"
        >
          {{ getSpeciesFeatureLevelBadge(feature.level) }}
        </UBadge>

        <UBadge
          v-if="getMechanicsBadge(feature)"
          size="sm"
          color="primary"
          variant="subtle"
        >
          {{ getMechanicsBadge(feature) }}
        </UBadge>

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="SPECIES_FEATURES_EDITOR.remove"
          @click.left.exact.prevent="askRemoveFeature(featIndex)"
        />

        <UButton
          :icon="getToggleIcon(featIndex)"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="getToggleLabel(featIndex)"
          @click.left.exact.prevent="toggleFeature(featIndex)"
        />
      </div>

      <div
        v-if="isExpanded(featIndex)"
        class="border-t border-default p-3"
      >
        <UForm
          class="grid grid-cols-1 gap-4 md:grid-cols-24"
          attach
          :state="feature"
        >
          <UFormField
            class="col-span-full md:col-span-10"
            :label="SPECIES_FEATURES_EDITOR.nameLabel"
            name="name.rus"
          >
            <UInput
              v-model="feature.name.rus"
              :placeholder="SPECIES_FEATURES_EDITOR.namePlaceholder"
            />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-10"
            :label="SPECIES_FEATURES_EDITOR.nameEngLabel"
            name="name.eng"
          >
            <UInput
              v-model="feature.name.eng"
              :placeholder="SPECIES_FEATURES_EDITOR.nameEngPlaceholder"
            />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-4"
            :label="SPECIES_EDITOR_LABELS.featureLevel"
            :help="SPECIES_EDITOR_LABELS.featureLevelHint"
            name="level"
          >
            <UInputNumber
              v-model="feature.level"
              :min="SPECIES_FEATURE_LEVEL.min"
              :max="SPECIES_FEATURE_LEVEL.max"
            />
          </UFormField>

          <UFormField
            v-if="hasDescription(featIndex)"
            class="col-span-full"
            :label="SPECIES_FEATURES_EDITOR.descriptionLabel"
            name="description"
          >
            <MarkupEditor
              v-model="feature.description"
              :placeholder="SPECIES_FEATURES_EDITOR.descriptionPlaceholder"
            />
          </UFormField>

          <div
            v-else
            class="col-span-full"
          >
            <UButton
              icon="tabler:plus"
              color="neutral"
              variant="soft"
              size="sm"
              :label="SPECIES_FEATURES_EDITOR.addDescription"
              @click.left.exact.prevent="showDescription(featIndex)"
            />
          </div>

          <SpeciesFeatureMechanics v-model="model[featIndex]!" />
        </UForm>
      </div>
    </div>

    <UButton
      icon="tabler:plus"
      :label="SPECIES_FEATURES_EDITOR.add"
      color="primary"
      variant="soft"
      block
      @click.left.exact.prevent="addFeature"
    />

    <UModal
      v-model:open="isRemovalOpen"
      :title="SPECIES_FEATURES_EDITOR.removeConfirmTitle"
      :description="SPECIES_FEATURES_EDITOR.removeConfirmText"
    >
      <template #footer>
        <div class="flex w-full items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="isRemovalOpen = false"
          >
            {{ SPECIES_FEATURES_EDITOR.removeConfirmCancel }}
          </UButton>

          <UButton
            color="error"
            icon="tabler:trash"
            @click.left.exact.prevent="confirmRemoveFeature"
          >
            {{ SPECIES_FEATURES_EDITOR.removeConfirmApply }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
