<script setup lang="ts">
  import { isAbilityKey } from '~/shared/types';

  import type { AbilityKey } from '~/shared/types';

  import type {
    CalculatorAbilityOption,
    CalculatorFeatOption,
  } from '../../model';

  const {
    options,
    abilityOptions,
    loading,
    label,
    placeholder,
    disabled,
    hasMultipleAbilities,
  } = defineProps<{
    options: CalculatorFeatOption[];
    abilityOptions: CalculatorAbilityOption[];
    loading: boolean;
    label: string;
    placeholder: string;
    disabled: boolean;
    hasMultipleAbilities: boolean;
  }>();

  const model = defineModel<string>();
  const abilityChoice = defineModel<AbilityKey[]>('ability-choice');

  const selectedFeat = computed(() =>
    options.find((option) => option.value === model.value),
  );

  const increaseCount = computed(
    () => selectedFeat.value?.abilityScoreIncreaseOptions ?? 1,
  );

  function getChoice(index: number) {
    return abilityChoice.value?.[index];
  }

  function handleChoiceUpdate(index: number, value: unknown) {
    const current: (AbilityKey | undefined)[] = [
      ...(abilityChoice.value || []),
    ];

    while (current.length <= index) {
      current.push(undefined);
    }

    if (isAbilityKey(value)) {
      current[index] = value;
    } else {
      current.splice(index, 1);
    }

    abilityChoice.value = current.filter(isAbilityKey);
  }
</script>

<template>
  <div
    class="bg-card flex h-full flex-col gap-2 rounded-lg border border-default p-4"
    :class="{
      'opacity-50 grayscale': disabled && !model,
    }"
  >
    <div class="text-xs font-medium text-secondary">
      {{ label }}
    </div>

    <UFieldGroup>
      <USelectMenu
        v-model="model"
        :items="options"
        :loading="loading"
        searchable
        :placeholder="placeholder"
        class="w-full"
        label-key="label"
        value-key="value"
        :disabled="disabled"
      >
        <template #item-label="{ item }">
          <span class="flex items-center gap-1">
            <span class="truncate">
              {{ item.label }}
            </span>

            <UIcon
              v-if="item.repeatability"
              name="i-fluent-arrow-repeat-all-24-regular"
              class="text-muted"
              size="16"
              title="Повторяемая черта"
            />
          </span>
        </template>

        <template #item-trailing="{ item }">
          <UBadge
            variant="subtle"
            color="neutral"
          >
            {{ item.source }}
          </UBadge>
        </template>

        <template #item-description="{ item }">
          <div class="grid w-full">
            <div
              class="w-full truncate"
              :title="item.description"
            >
              {{ item.description }}
            </div>

            <div
              v-if="item.prerequisite"
              class="w-full truncate"
              :title="item.prerequisite"
            >
              {{ item.prerequisite }}
            </div>
          </div>
        </template>
      </USelectMenu>

      <UButton
        v-if="model && !disabled"
        icon="i-fluent-dismiss-24-regular"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="model = undefined"
      />
    </UFieldGroup>

    <template v-if="model">
      <div
        v-if="hasMultipleAbilities"
        class="flex w-full flex-col gap-2 pt-1 lg:flex-row"
      >
        <UFieldGroup
          v-for="i in increaseCount"
          :key="i"
          class="w-full min-w-0"
        >
          <USelect
            :model-value="getChoice(i - 1)"
            :items="abilityOptions"
            placeholder="Выберите характеристику"
            class="w-full"
            :class="{
              'ring-error': !getChoice(i - 1),
            }"
            option-attribute="label"
            value-attribute="value"
            @update:model-value="handleChoiceUpdate(i - 1, $event)"
          />

          <UButton
            v-if="getChoice(i - 1)"
            icon="i-fluent-dismiss-24-regular"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="handleChoiceUpdate(i - 1, '')"
          />
        </UFieldGroup>
      </div>

      <div
        v-else
        class="mt-auto text-xs text-secondary"
      >
        <span v-if="abilityOptions[0]?.label">
          Бонус: {{ abilityOptions[0]?.label }}
        </span>

        <span v-else>Нет бонуса</span>
      </div>
    </template>
  </div>
</template>
