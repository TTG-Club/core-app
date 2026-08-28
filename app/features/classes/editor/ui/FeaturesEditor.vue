<script setup lang="ts">
  import type { ClassFeatureCreate } from '../../model';

  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectLevel } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    CLASS_ABILITY_BONUS_MIN_LEVEL,
    CLASS_FEATURES_EDITOR,
    CLASS_LEVEL_BOUNDS,
    getClassFeatureFilledBlocksCount,
    getClassFeatureLevelBadge,
  } from '../../model';
  import {
    FeatureAbilityBonus,
    FeatureMechanics,
    FeatureOptions,
    FeatureScaling,
  } from './features';

  /** Бейдж в шапке свёрнутого умения. */
  interface FeatureBadge {
    key: string;
    label: string;
    color: 'primary' | 'neutral' | 'warning';
  }

  /**
   * Умения класса списком свёрнутых строк — как особенности вида: у класса их
   * до двух десятков, и развёрнутые все разом они не помещались в голове.
   *
   * Всё, что умение даёт листу персонажа, — дары, ресурсы, заклинания,
   * эффекты — лежит у самого умения в свёрнутом блоке «Механика и эффекты».
   * Выбор боевого стиля и черты за повышение характеристик там же, строками
   * даров: отдельных галочек у умения больше нет.
   */
  const { isSubclass = false } = defineProps<{
    isSubclass?: boolean;
  }>();

  const model = defineModel<Array<ClassFeatureCreate>>({ required: true });

  /**
   * Раскрытые умения — по их индексу. Свой список, а не аккордеон: кнопка
   * удаления обязана лежать РЯДОМ с раскрывающим триггером, а не внутри него,
   * иначе удалить умение можно только развернув его.
   */
  const expanded = ref<Set<number>>(new Set());

  /** Индекс умения, удаление которого ждёт подтверждения. */
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
   * Пустое умение. Механика и строки редактора здесь всегда объекты:
   * загрузка сливает ответ сервера именно с этим состоянием, и недостающие
   * блоки берутся отсюда.
   *
   * @returns новое умение формы.
   */
  function getEmptyFeature(): ClassFeatureCreate {
    return {
      level: CLASS_LEVEL_BOUNDS.min,
      name: '',
      optionsName: undefined,
      description: '',
      additional: '',
      hideInSubclasses: false,
      abilityImprovement: false,
      fightingStyleChoice: false,
      scaling: [],
      options: [],
      abilityBonus: undefined,
      informationalOnly: false,
      mechanics: createFeatMechanics(),
      activeEffects: [],
      editorRows: createFeatEditorRows(),
    };
  }

  /**
   * Пересдвигает индексы набора после удаления строки: без этого раскрытым
   * оказалось бы соседнее умение.
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

  /**
   * Раскрыто ли умение.
   *
   * @param index позиция умения в списке.
   * @returns `true`, когда тело строки развёрнуто.
   */
  function isExpanded(index: number): boolean {
    return expanded.value.has(index);
  }

  /**
   * Значок кнопки свёртки. Функцией, а не вычисляемым свойством: состояние
   * своё у каждой строки списка.
   *
   * @param index позиция умения в списке.
   * @returns имя значка.
   */
  function getToggleIcon(index: number): string {
    return isExpanded(index) ? 'tabler:chevron-up' : 'tabler:chevron-down';
  }

  /**
   * Подпись кнопки свёртки для скринридера.
   *
   * @param index позиция умения в списке.
   * @returns подпись действия.
   */
  function getToggleLabel(index: number): string {
    return isExpanded(index)
      ? CLASS_FEATURES_EDITOR.collapse
      : CLASS_FEATURES_EDITOR.expand;
  }

  /**
   * Разворачивает или сворачивает умение.
   *
   * @param index позиция умения в списке.
   */
  function toggleFeature(index: number): void {
    const next = new Set(expanded.value);

    if (!next.delete(index)) {
      next.add(index);
    }

    expanded.value = next;
  }

  /**
   * Бейджи шапки: что у умения заполнено, не разворачивая его.
   *
   * @param feature умение строки.
   * @returns бейджи в порядке показа.
   */
  function getBadges(feature: ClassFeatureCreate): Array<FeatureBadge> {
    const badges: Array<FeatureBadge> = [];
    const filledBlocksCount = getClassFeatureFilledBlocksCount(feature);

    if (filledBlocksCount) {
      badges.push({
        key: 'mechanics',
        label: `${CLASS_FEATURES_EDITOR.mechanicsBadge}${filledBlocksCount}`,
        color: 'primary',
      });
    }

    if (feature.scaling.length) {
      badges.push({
        key: 'scaling',
        label: `${CLASS_FEATURES_EDITOR.scalingBadge}${feature.scaling.length}`,
        color: 'neutral',
      });
    }

    if (feature.options.length) {
      badges.push({
        key: 'options',
        label: `${CLASS_FEATURES_EDITOR.optionsBadge}${feature.options.length}`,
        color: 'neutral',
      });
    }

    if (feature.informationalOnly) {
      badges.push({
        key: 'informational',
        label: CLASS_FEATURES_EDITOR.informationalBadge,
        color: 'neutral',
      });
    }

    if (feature.hideInSubclasses && !isSubclass) {
      badges.push({
        key: 'hidden',
        label: CLASS_FEATURES_EDITOR.hiddenBadge,
        color: 'warning',
      });
    }

    return badges;
  }

  /**
   * Показывать ли блок прибавки характеристик: он бывает только у умений
   * последнего уровня.
   *
   * @param feature умение строки.
   * @returns `true` — умение 20 уровня.
   */
  function hasAbilityBonusSection(feature: ClassFeatureCreate): boolean {
    return feature.level >= CLASS_ABILITY_BONUS_MIN_LEVEL;
  }

  /** Заводит пустое умение в конце списка и сразу раскрывает его. */
  function addFeature(): void {
    // Индекс считается ДО записи: `model.value` после присваивания ещё отдаёт
    // прежний массив — проп доедет только следующим тиком.
    const addedIndex = model.value.length;

    model.value = [...model.value, getEmptyFeature()];

    expanded.value = new Set([...expanded.value, addedIndex]);
  }

  /**
   * Запрашивает подтверждение удаления умения.
   *
   * @param index позиция умения в списке.
   */
  function askRemoveFeature(index: number): void {
    pendingRemoval.value = index;
  }

  /** Удаляет умение после подтверждения и пересдвигает раскрытые. */
  function confirmRemoveFeature(): void {
    const index = pendingRemoval.value;

    pendingRemoval.value = undefined;

    if (index === undefined) {
      return;
    }

    model.value = model.value.filter((_, position) => position !== index);
    expanded.value = shiftIndexes(expanded.value, index);
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <InfoTooltip
          :text="CLASS_FEATURES_EDITOR.hint"
          icon="tabler:info-circle-filled"
          class="min-w-0 text-base text-highlighted"
        >
          <h2 class="truncate">{{ CLASS_FEATURES_EDITOR.title }}</h2>
        </InfoTooltip>

        <UButton
          icon="tabler:plus"
          :label="CLASS_FEATURES_EDITOR.add"
          color="primary"
          variant="soft"
          size="sm"
          class="shrink-0"
          @click.left.exact.prevent="addFeature"
        />
      </div>
    </template>

    <div class="flex flex-col gap-2">
      <p
        v-if="!model.length"
        class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed italic"
      >
        {{ CLASS_FEATURES_EDITOR.empty }}
      </p>

      <div
        v-for="(feature, index) in model"
        :key="index"
        class="rounded-lg border border-default bg-elevated/20"
      >
        <div class="flex items-center gap-2 px-3 py-2">
          <!-- Плашка разворачивает умение целиком: попадать значком в конце
            строки приходилось прицельно. Кнопки лежат рядом с ней, а не
            внутри: кнопка внутри кнопки недопустима -->
          <button
            type="button"
            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
            :aria-expanded="isExpanded(index)"
            @click.left.exact.prevent="toggleFeature(index)"
          >
            <UBadge
              size="sm"
              color="neutral"
              variant="outline"
              class="shrink-0 tabular-nums"
            >
              {{ getClassFeatureLevelBadge(feature.level) }}
            </UBadge>

            <span class="min-w-0 flex-1 truncate text-base">
              {{ feature.name || CLASS_FEATURES_EDITOR.unnamed }}
            </span>

            <UBadge
              v-for="badge in getBadges(feature)"
              :key="badge.key"
              size="sm"
              :color="badge.color"
              variant="subtle"
              class="hidden shrink-0 md:inline-flex"
            >
              {{ badge.label }}
            </UBadge>
          </button>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            :aria-label="CLASS_FEATURES_EDITOR.remove"
            @click.left.exact.prevent="askRemoveFeature(index)"
          />

          <UButton
            :icon="getToggleIcon(index)"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="getToggleLabel(index)"
            @click.left.exact.prevent="toggleFeature(index)"
          />
        </div>

        <div
          v-if="isExpanded(index)"
          class="border-t border-default p-3"
        >
          <UForm
            class="grid grid-cols-1 gap-3 md:grid-cols-24"
            attach
            :state="feature"
          >
            <UFormField
              class="md:col-span-4"
              :label="CLASS_FEATURES_EDITOR.level"
              name="level"
            >
              <SelectLevel v-model="feature.level" />
            </UFormField>

            <UFormField
              class="md:col-span-10"
              :label="CLASS_FEATURES_EDITOR.name"
              name="name"
            >
              <UInput
                v-model="feature.name"
                :placeholder="CLASS_FEATURES_EDITOR.namePlaceholder"
              />
            </UFormField>

            <UFormField
              class="md:col-span-10"
              name="optionsName"
            >
              <template #label>
                <InfoTooltip
                  :text="CLASS_FEATURES_EDITOR.optionsNameHint"
                  icon="tabler:info-circle-filled"
                >
                  <span>{{ CLASS_FEATURES_EDITOR.optionsName }}</span>
                </InfoTooltip>
              </template>

              <UInput
                v-model="feature.optionsName"
                :placeholder="CLASS_FEATURES_EDITOR.optionsNamePlaceholder"
              />
            </UFormField>

            <div class="flex flex-wrap items-center gap-4 md:col-span-full">
              <InfoTooltip
                v-if="!isSubclass"
                :text="CLASS_FEATURES_EDITOR.hideInSubclassesHint"
                icon="tabler:info-circle-filled"
              >
                <UCheckbox
                  v-model="feature.hideInSubclasses"
                  :label="CLASS_FEATURES_EDITOR.hideInSubclasses"
                />
              </InfoTooltip>

              <InfoTooltip
                :text="CLASS_FEATURES_EDITOR.informationalOnlyHint"
                icon="tabler:info-circle-filled"
              >
                <UCheckbox
                  v-model="feature.informationalOnly"
                  :label="CLASS_FEATURES_EDITOR.informationalOnly"
                />
              </InfoTooltip>
            </div>

            <UFormField
              class="col-span-full"
              :label="CLASS_FEATURES_EDITOR.additional"
              name="additional"
            >
              <UInput
                v-model="feature.additional"
                :placeholder="CLASS_FEATURES_EDITOR.additionalPlaceholder"
              />
            </UFormField>

            <UFormField
              class="col-span-full"
              :label="CLASS_FEATURES_EDITOR.description"
              name="description"
            >
              <MarkupEditor
                v-model="feature.description"
                :placeholder="CLASS_FEATURES_EDITOR.descriptionPlaceholder"
              />
            </UFormField>

            <FeatureScaling
              v-model="feature.scaling"
              :is-subclass="isSubclass"
            />

            <FeatureOptions
              v-model="feature.options"
              :is-subclass="isSubclass"
            />

            <FeatureMechanics v-model="model[index]!" />

            <FeatureAbilityBonus
              v-if="hasAbilityBonusSection(feature)"
              v-model="feature.abilityBonus"
            />
          </UForm>
        </div>
      </div>

      <UButton
        v-if="model.length"
        icon="tabler:plus"
        :label="CLASS_FEATURES_EDITOR.add"
        color="primary"
        variant="soft"
        block
        @click.left.exact.prevent="addFeature"
      />
    </div>

    <UModal
      v-model:open="isRemovalOpen"
      :title="CLASS_FEATURES_EDITOR.removeConfirmTitle"
      :description="CLASS_FEATURES_EDITOR.removeConfirmText"
    >
      <template #footer>
        <div class="flex w-full items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="isRemovalOpen = false"
          >
            {{ CLASS_FEATURES_EDITOR.removeConfirmCancel }}
          </UButton>

          <UButton
            color="error"
            icon="tabler:trash"
            @click.left.exact.prevent="confirmRemoveFeature"
          >
            {{ CLASS_FEATURES_EDITOR.removeConfirmApply }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
