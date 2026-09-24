<script setup lang="ts">
  import type { BastionFacilityCreate } from '../model';

  import { z } from 'zod';

  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import { useBastionRules } from '../composable';
  import {
    BASTION_API_PATH,
    BASTION_EDITOR_LABELS,
    BASTION_SECTION,
    normalizeLoadedBastion,
    transformBastionBeforeSubmit,
  } from '../model';
  import { BastionFacilityPreview } from '../preview';
  import {
    ChoiceRows,
    EnlargementFields,
    FeatureRows,
    OrderOptionRows,
  } from './ui';

  const formRef = useTemplateRef('formRef');

  const schema = z.object({
    category: z.enum(['BASIC', 'SPECIAL']),
    space: z.enum(['CRAMPED', 'ROOMY', 'VAST']),
    description: z.string().nonempty(),
  });

  defineExpose({
    submit: () => formRef.value!.submit(),
  });

  /**
   * Пустое сооружение, с которым открывается форма создания.
   *
   * @returns Начальное состояние формы
   */
  function getInitialState(): BastionFacilityCreate {
    return {
      url: '',
      name: {
        rus: '',
        eng: '',
        alt: [],
      },
      source: {
        url: undefined,
        page: undefined,
      },
      srdVersion: undefined,
      tags: [],
      description: '',
      category: 'SPECIAL',
      level: undefined,
      prerequisite: undefined,
      space: undefined,
      hirelings: null,
      repeatable: false,
      orders: [],
      orderOptions: [],
      enlargement: null,
      features: [],
      choices: [],
    };
  }

  const { state, submitState, onSubmit, onError, revisionControl } =
    useWorkshopForm<BastionFacilityCreate>({
      actionUrl: BASTION_API_PATH,
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.BASTION,
      normalizeLoaded: normalizeLoadedBastion,
      transformBeforeSubmit: transformBastionBeforeSubmit,
    });

  const {
    categoryItems,
    spaceItems,
    facilityOrderItems,
    prerequisiteItems,
    levelItems,
  } = await useBastionRules();

  /** Уровень, требование и приказы есть только у специализированных сооружений. */
  const isSpecial = computed(() => state.value.category === 'SPECIAL');

  /** Варианты приказов строятся только из приказов, которые сооружение принимает. */
  const acceptedOrderItems = computed(() =>
    facilityOrderItems.value.filter((order) =>
      state.value.orders.includes(order.value),
    ),
  );
</script>

<template>
  <UForm
    ref="formRef"
    class="grid gap-8 pb-24"
    :schema
    :state
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      v-model="state"
      :section="BASTION_SECTION"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ BASTION_EDITOR_LABELS.detailsTitle }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-8"
          :label="BASTION_EDITOR_LABELS.category"
          name="category"
          required
        >
          <USelect
            v-model="state.category"
            :items="categoryItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="BASTION_EDITOR_LABELS.space"
          name="space"
          required
        >
          <USelect
            v-model="state.space"
            :items="spaceItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="BASTION_EDITOR_LABELS.hirelings"
          name="hirelings"
        >
          <UInputNumber
            v-model="state.hirelings"
            :min="0"
            class="w-full"
          />
        </UFormField>

        <template v-if="isSpecial">
          <UFormField
            class="md:col-span-8"
            :label="BASTION_EDITOR_LABELS.level"
            :help="BASTION_EDITOR_LABELS.levelHelp"
            name="level"
          >
            <USelect
              v-model="state.level"
              :items="levelItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField
            class="md:col-span-16"
            :label="BASTION_EDITOR_LABELS.prerequisite"
            name="prerequisite"
          >
            <USelect
              v-model="state.prerequisite"
              :items="prerequisiteItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField
            class="md:col-span-16"
            :label="BASTION_EDITOR_LABELS.orders"
            :help="BASTION_EDITOR_LABELS.ordersHelp"
            name="orders"
          >
            <USelect
              v-model="state.orders"
              :items="facilityOrderItems"
              value-key="value"
              multiple
              class="w-full"
            />
          </UFormField>
        </template>

        <UFormField
          class="md:col-span-8"
          :label="BASTION_EDITOR_LABELS.repeatable"
          name="repeatable"
        >
          <UCheckbox
            v-model="state.repeatable"
            :label="BASTION_EDITOR_LABELS.repeatableCheckbox"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ BASTION_EDITOR_LABELS.descriptionTitle }}
        </h2>
      </template>

      <UFormField
        :label="BASTION_EDITOR_LABELS.description"
        name="description"
        required
      >
        <MarkupEditor
          v-model="state.description"
          :placeholder="BASTION_EDITOR_LABELS.descriptionPlaceholder"
        />
      </UFormField>
    </UCard>

    <OrderOptionRows
      v-if="isSpecial"
      v-model="state.orderOptions"
      :order-items="acceptedOrderItems"
    />

    <FeatureRows v-model="state.features" />

    <ChoiceRows v-model="state.choices" />

    <EnlargementFields
      v-model="state.enlargement"
      :space-items="spaceItems"
    />

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <BastionFacilityPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
