<script setup lang="ts">
  import type { ClassFeatureScalingCreate } from '../../../model';

  import { EditorNestedSection } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectLevel } from '~ui/select';

  import {
    CLASS_FEATURE_SCALING_EDITOR,
    CLASS_FEATURES_EDITOR,
    CLASS_LEVEL_BOUNDS,
  } from '../../../model';

  /**
   * Рост умения по уровням: одна строка — один уровень, на котором умение
   * повторяется или усиливается.
   */
  const { isSubclass = false } = defineProps<{
    isSubclass?: boolean;
  }>();

  const model = defineModel<Array<ClassFeatureScalingCreate>>({
    required: true,
  });

  /**
   * Заводит уровень роста: следующий начинается уровнем позже последнего —
   * ряд «8, 12, 16» набирается без возврата к первому уровню.
   */
  function addRow() {
    const last = model.value.at(-1);

    model.value = [
      ...model.value,
      {
        level: Math.min(
          CLASS_LEVEL_BOUNDS.max,
          (last?.level ?? CLASS_LEVEL_BOUNDS.min) + 1,
        ),
        name: '',
        description: '',
        additional: '',
        hideInSubclasses: false,
      },
    ];
  }

  /**
   * Убирает уровень роста.
   *
   * @param index номер строки в списке.
   */
  function removeRow(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <EditorNestedSection
    :title="CLASS_FEATURES_EDITOR.scalingTitle"
    :hint="CLASS_FEATURES_EDITOR.scalingHint"
    :count="model.length"
    :add-label="CLASS_FEATURES_EDITOR.addScaling"
    @add="addRow"
  >
    <div class="flex flex-col gap-2">
      <UForm
        v-for="(row, index) in model"
        :key="index"
        class="grid grid-cols-1 gap-3 rounded-lg border border-default bg-elevated/40 p-3 md:grid-cols-24"
        attach
        :state="row"
      >
        <UFormField
          class="md:col-span-4"
          :label="CLASS_FEATURE_SCALING_EDITOR.level"
          name="level"
        >
          <SelectLevel v-model="row.level" />
        </UFormField>

        <UFormField
          class="md:col-span-12"
          :label="CLASS_FEATURE_SCALING_EDITOR.name"
          name="name"
        >
          <UInput
            v-model="row.name"
            :placeholder="CLASS_FEATURE_SCALING_EDITOR.namePlaceholder"
          />
        </UFormField>

        <div
          class="flex items-center justify-between gap-2 md:col-span-8 md:self-end md:pb-2"
        >
          <UCheckbox
            v-if="!isSubclass"
            v-model="row.hideInSubclasses"
            :label="CLASS_FEATURE_SCALING_EDITOR.hideInSubclasses"
          />

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            class="ml-auto"
            :aria-label="CLASS_FEATURES_EDITOR.removeScaling"
            @click.left.exact.prevent="removeRow(index)"
          />
        </div>

        <UFormField
          class="col-span-full"
          :label="CLASS_FEATURE_SCALING_EDITOR.additional"
          name="additional"
        >
          <UInput
            v-model="row.additional"
            :placeholder="CLASS_FEATURE_SCALING_EDITOR.additionalPlaceholder"
          />
        </UFormField>

        <UFormField
          class="col-span-full"
          :label="CLASS_FEATURE_SCALING_EDITOR.description"
          name="description"
        >
          <MarkupEditor
            v-model="row.description"
            :placeholder="CLASS_FEATURE_SCALING_EDITOR.descriptionPlaceholder"
          />
        </UFormField>
      </UForm>
    </div>
  </EditorNestedSection>
</template>
