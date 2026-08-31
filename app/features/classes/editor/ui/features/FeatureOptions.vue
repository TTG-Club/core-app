<script setup lang="ts">
  import type {
    ClassFeatureOptionCreate,
    ClassFeatureOptionsChoiceCreate,
  } from '../../../model';

  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectLevel } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import {
    CLASS_FEATURE_OPTIONS_CHOICE_EDITOR,
    CLASS_FEATURE_OPTIONS_EDITOR,
    CLASS_FEATURES_EDITOR,
    CLASS_LEVEL_BOUNDS,
    CLASS_OPTIONS_CHOICE_COUNT_BOUNDS,
    CLASS_OPTIONS_CHOICE_DEFAULTS,
    getClassFeatureOptionLevelBadge,
  } from '../../../model';
  import FeatureSection from './FeatureSection.vue';

  /**
   * Варианты умения: манёвры, воззвания, метамагия — список, из которого
   * выбирают по ходу игры. Одна строка — один вариант.
   *
   * Список бывает справочным и выбираемым. Справочный только показывается на
   * странице класса, выбираемый ещё и спрашивается листом персонажа: настройка
   * выбора лежит рядом со списком, потому что без вариантов выбирать нечего.
   */
  const { isSubclass = false } = defineProps<{
    isSubclass?: boolean;
  }>();

  const model = defineModel<Array<ClassFeatureOptionCreate>>({
    required: true,
  });

  const choice = defineModel<ClassFeatureOptionsChoiceCreate | undefined>(
    'choice',
  );

  const {
    isExpanded,
    toggle: toggleOption,
    expand,
    dropRow,
    getToggleIcon,
  } = useExpandedRows();

  /**
   * Подпись кнопки свёртки для скринридера.
   *
   * @param index позиция варианта в списке.
   * @returns подпись действия.
   */
  function getToggleLabel(index: number): string {
    return isExpanded(index)
      ? CLASS_FEATURE_OPTIONS_EDITOR.collapse
      : CLASS_FEATURE_OPTIONS_EDITOR.expand;
  }

  /** Выбираемый ли список: настройка выбора у умения есть — значит, да. */
  const isSelectable = computed(() => choice.value !== undefined);

  /** Ступени количества по уровням; их правят только у выбираемого списка. */
  const scaling = computed(() => choice.value?.scaling ?? []);

  /**
   * Есть ли у варианта галочки. Повторяемость спрашивается только у выбираемого
   * списка — справочный лист персонажа не предлагает, и повторять там нечего, —
   * а скрытие в подклассе задаёт только сам класс.
   */
  const hasOptionFlags = computed(() => isSelectable.value || !isSubclass);

  /**
   * Включает и выключает выбор. Настройка снимается целиком: по её наличию
   * потребители и отличают выбираемый список от справочного, и оставленный
   * рядом с выключенной галочкой счёт спросил бы игрока в листе.
   *
   * @param enabled состояние галочки.
   */
  function toggleSelectable(enabled: boolean | 'indeterminate') {
    choice.value =
      enabled === true
        ? {
            label: undefined,
            count: CLASS_OPTIONS_CHOICE_DEFAULTS.count,
            scaling: [],
          }
        : undefined;
  }

  /**
   * Заводит ступень роста: следующая начинается уровнем позже последней и даёт
   * на один вариант больше.
   */
  function addScaling() {
    const current = choice.value;

    if (!current) {
      return;
    }

    const last = current.scaling.at(-1);

    choice.value = {
      ...current,
      scaling: [
        ...current.scaling,
        {
          level: Math.min(CLASS_LEVEL_BOUNDS.max, (last?.level ?? 0) + 1),
          count: Math.min(
            CLASS_OPTIONS_CHOICE_COUNT_BOUNDS.max,
            (last?.count ?? current.count ?? 0) + 1,
          ),
        },
      ],
    };
  }

  /**
   * Убирает ступень роста.
   *
   * @param index номер ступени.
   */
  function removeScaling(index: number) {
    const current = choice.value;

    if (!current) {
      return;
    }

    choice.value = {
      ...current,
      scaling: current.scaling.filter((_, position) => position !== index),
    };
  }

  /** Заводит пустой вариант в конце списка и сразу раскрывает его. */
  function addRow() {
    // Индекс считается ДО записи: `model.value` после присваивания ещё отдаёт
    // прежний массив — проп доедет только следующим тиком.
    const addedIndex = model.value.length;

    model.value = [
      ...model.value,
      {
        name: {
          rus: '',
          eng: '',
        },
        description: '',
        additional: undefined,
        prerequisite: undefined,
        requiredClassLevel: undefined,
        hideInSubclasses: false,
        repeatable: false,
      },
    ];

    expand(addedIndex);
  }

  /**
   * Убирает вариант.
   *
   * @param index номер строки в списке.
   */
  function removeRow(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
    dropRow(index);
  }
</script>

<template>
  <FeatureSection
    :title="CLASS_FEATURES_EDITOR.optionsTitle"
    :hint="CLASS_FEATURES_EDITOR.optionsHint"
    :count="model.length"
    :add-label="CLASS_FEATURES_EDITOR.addOption"
    @add="addRow"
  >
    <div class="flex flex-col gap-2">
      <!-- Настройка выбора идёт перед списком: сначала автор решает, выбирают
        из списка или он только справочный, и лишь потом набирает варианты -->
      <div
        class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/40 p-3"
      >
        <InfoTooltip
          :text="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.selectableHint"
          icon="tabler:info-circle-filled"
        >
          <UCheckbox
            :model-value="isSelectable"
            :label="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.selectable"
            @update:model-value="toggleSelectable"
          />
        </InfoTooltip>

        <template v-if="choice">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-24">
            <UFormField
              class="md:col-span-6"
              :label="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.count"
              :help="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.countHint"
            >
              <UInputNumber
                v-model="choice.count"
                :min="CLASS_OPTIONS_CHOICE_COUNT_BOUNDS.min"
                :max="CLASS_OPTIONS_CHOICE_COUNT_BOUNDS.max"
                class="w-full"
              />
            </UFormField>

            <UFormField
              class="md:col-span-18"
              :label="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.label"
            >
              <UInput
                v-model="choice.label"
                :placeholder="
                  CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.labelPlaceholder
                "
              />
            </UFormField>
          </div>

          <!-- Рост количества: ступень называет итог к уровню, а не прибавку —
            мастеру повышения уровня остаётся спросить разницу с предыдущей -->
          <div class="flex flex-col gap-2">
            <InfoTooltip
              :text="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.scalingHint"
              icon="tabler:info-circle-filled"
              class="text-dimmed"
            >
              <span class="text-xs font-medium text-muted">
                {{ CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.scalingTitle }}
              </span>
            </InfoTooltip>

            <p
              v-if="!scaling.length"
              class="text-xs text-dimmed italic"
            >
              {{ CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.scalingEmpty }}
            </p>

            <div
              v-for="(step, stepIndex) in scaling"
              :key="stepIndex"
              class="flex items-end gap-2"
            >
              <UFormField
                class="w-28"
                :label="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.scalingLevel"
              >
                <UInputNumber
                  v-model="step.level"
                  :min="CLASS_LEVEL_BOUNDS.min"
                  :max="CLASS_LEVEL_BOUNDS.max"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                class="w-28"
                :label="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.scalingCount"
              >
                <UInputNumber
                  v-model="step.count"
                  :min="CLASS_OPTIONS_CHOICE_COUNT_BOUNDS.min"
                  :max="CLASS_OPTIONS_CHOICE_COUNT_BOUNDS.max"
                  class="w-full"
                />
              </UFormField>

              <UButton
                icon="tabler:trash"
                color="error"
                variant="ghost"
                size="xs"
                :aria-label="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.removeScaling"
                @click.left.exact.prevent="removeScaling(stepIndex)"
              />
            </div>

            <UButton
              icon="tabler:plus"
              :label="CLASS_FEATURE_OPTIONS_CHOICE_EDITOR.addScaling"
              color="neutral"
              variant="soft"
              size="xs"
              class="self-start"
              @click.left.exact.prevent="addScaling"
            />
          </div>
        </template>
      </div>

      <div
        v-for="(option, index) in model"
        :key="index"
        class="rounded-lg border border-default bg-elevated/40"
      >
        <!-- Плашка разворачивает вариант целиком: списки вариантов длинные —
          у воина два десятка манёвров, — и развёрнутые все разом они заслоняют
          саму настройку выбора. Кнопки лежат рядом с триггером, а не внутри:
          кнопка внутри кнопки недопустима, поэтому нажатие ловит накладка —
          псевдоэлемент кнопки во всю шапку, — а сами кнопки подняты над
          накладкой `relative` -->
        <div class="relative flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left before:absolute before:inset-0"
            :aria-expanded="isExpanded(index)"
            @click.left.exact.prevent="toggleOption(index)"
          >
            <UBadge
              v-if="getClassFeatureOptionLevelBadge(option.requiredClassLevel)"
              size="sm"
              color="neutral"
              variant="outline"
              class="shrink-0 tabular-nums"
            >
              {{ getClassFeatureOptionLevelBadge(option.requiredClassLevel) }}
            </UBadge>

            <span class="min-w-0 flex-1 truncate text-sm">
              {{ option.name.rus || CLASS_FEATURE_OPTIONS_EDITOR.unnamed }}
            </span>

            <UBadge
              v-if="option.repeatable && isSelectable"
              size="sm"
              color="info"
              variant="subtle"
              class="hidden shrink-0 md:inline-flex"
            >
              {{ CLASS_FEATURE_OPTIONS_EDITOR.repeatableBadge }}
            </UBadge>

            <UBadge
              v-if="option.hideInSubclasses && !isSubclass"
              size="sm"
              color="warning"
              variant="subtle"
              class="hidden shrink-0 md:inline-flex"
            >
              {{ CLASS_FEATURE_OPTIONS_EDITOR.hiddenBadge }}
            </UBadge>
          </button>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            class="relative"
            :aria-label="CLASS_FEATURES_EDITOR.removeOption"
            @click.left.exact.prevent="removeRow(index)"
          />

          <UButton
            :icon="getToggleIcon(index)"
            color="neutral"
            variant="ghost"
            size="xs"
            class="relative"
            :aria-label="getToggleLabel(index)"
            @click.left.exact.prevent="toggleOption(index)"
          />
        </div>

        <UForm
          v-if="isExpanded(index)"
          class="grid grid-cols-1 gap-3 border-t border-default p-3 md:grid-cols-24"
          attach
          :state="option"
        >
          <UFormField
            class="md:col-span-10"
            :label="CLASS_FEATURE_OPTIONS_EDITOR.name"
            name="name.rus"
          >
            <UInput
              v-model="option.name.rus"
              :placeholder="CLASS_FEATURE_OPTIONS_EDITOR.namePlaceholder"
            />
          </UFormField>

          <UFormField
            class="md:col-span-10"
            :label="CLASS_FEATURE_OPTIONS_EDITOR.nameEng"
            name="name.eng"
          >
            <UInput
              v-model="option.name.eng"
              :placeholder="CLASS_FEATURE_OPTIONS_EDITOR.nameEngPlaceholder"
            />
          </UFormField>

          <UFormField
            class="md:col-span-4"
            :label="CLASS_FEATURE_OPTIONS_EDITOR.level"
            name="requiredClassLevel"
          >
            <SelectLevel v-model="option.requiredClassLevel" />
          </UFormField>

          <!-- Галочки своим рядом: в колонке рядом с названиями их подписи
            переносились по слогам, а вместе они читаются одним списком -->
          <div
            v-if="hasOptionFlags"
            class="col-span-full flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            <InfoTooltip
              v-if="isSelectable"
              :text="CLASS_FEATURE_OPTIONS_EDITOR.repeatableHint"
              icon="tabler:info-circle-filled"
            >
              <UCheckbox
                v-model="option.repeatable"
                :label="CLASS_FEATURE_OPTIONS_EDITOR.repeatable"
              />
            </InfoTooltip>

            <UCheckbox
              v-if="!isSubclass"
              v-model="option.hideInSubclasses"
              :label="CLASS_FEATURE_OPTIONS_EDITOR.hideInSubclasses"
            />
          </div>

          <UFormField
            class="md:col-span-12"
            :label="CLASS_FEATURE_OPTIONS_EDITOR.additional"
            name="additional"
          >
            <UInput
              v-model="option.additional"
              :placeholder="CLASS_FEATURE_OPTIONS_EDITOR.additionalPlaceholder"
            />
          </UFormField>

          <UFormField
            class="md:col-span-12"
            :label="CLASS_FEATURE_OPTIONS_EDITOR.prerequisite"
            name="prerequisite"
          >
            <UInput
              v-model="option.prerequisite"
              :placeholder="
                CLASS_FEATURE_OPTIONS_EDITOR.prerequisitePlaceholder
              "
            />
          </UFormField>

          <UFormField
            class="col-span-full"
            :label="CLASS_FEATURE_OPTIONS_EDITOR.description"
            name="description"
          >
            <MarkupEditor
              v-model="option.description"
              :placeholder="CLASS_FEATURE_OPTIONS_EDITOR.descriptionPlaceholder"
            />
          </UFormField>
        </UForm>
      </div>
    </div>
  </FeatureSection>
</template>
