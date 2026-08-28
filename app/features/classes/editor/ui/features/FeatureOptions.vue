<script setup lang="ts">
  import type { ClassFeatureOptionCreate } from '../../../model';

  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectLevel } from '~ui/select';

  import {
    CLASS_FEATURE_OPTIONS_EDITOR,
    CLASS_FEATURES_EDITOR,
  } from '../../../model';
  import FeatureSection from './FeatureSection.vue';

  /**
   * Варианты умения: манёвры, воззвания, метамагия — список, из которого
   * выбирают по ходу игры. Одна строка — один вариант.
   */
  const { isSubclass = false } = defineProps<{
    isSubclass?: boolean;
  }>();

  const model = defineModel<Array<ClassFeatureOptionCreate>>({
    required: true,
  });

  /** Заводит пустой вариант. */
  function addRow() {
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
      },
    ];
  }

  /**
   * Убирает вариант.
   *
   * @param index номер строки в списке.
   */
  function removeRow(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <FeatureSection
    :title="CLASS_FEATURES_EDITOR.optionsTitle"
    :hint="CLASS_FEATURES_EDITOR.optionsHint"
    :count="model.length"
  >
    <div class="flex flex-col gap-2">
      <p
        v-if="!model.length"
        class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
      >
        {{ CLASS_FEATURES_EDITOR.optionsEmpty }}
      </p>

      <UForm
        v-for="(option, index) in model"
        :key="index"
        class="grid grid-cols-1 gap-3 rounded-lg border border-default bg-elevated/40 p-3 md:grid-cols-24"
        attach
        :state="option"
      >
        <UFormField
          class="md:col-span-8"
          :label="CLASS_FEATURE_OPTIONS_EDITOR.name"
          name="name.rus"
        >
          <UInput
            v-model="option.name.rus"
            :placeholder="CLASS_FEATURE_OPTIONS_EDITOR.namePlaceholder"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
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

        <div
          class="flex items-center justify-between gap-2 md:col-span-4 md:self-end md:pb-2"
        >
          <UCheckbox
            v-if="!isSubclass"
            v-model="option.hideInSubclasses"
            :label="CLASS_FEATURE_OPTIONS_EDITOR.hideInSubclasses"
          />

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            class="ml-auto"
            :aria-label="CLASS_FEATURES_EDITOR.removeOption"
            @click.left.exact.prevent="removeRow(index)"
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
            :placeholder="CLASS_FEATURE_OPTIONS_EDITOR.prerequisitePlaceholder"
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

      <UButton
        icon="tabler:plus"
        :label="CLASS_FEATURES_EDITOR.addOption"
        color="primary"
        variant="soft"
        block
        @click.left.exact.prevent="addRow"
      />
    </div>
  </FeatureSection>
</template>
