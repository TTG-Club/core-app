<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type {
    CalculatorAbilityOption,
    CalculatorFeatOption,
  } from '../../model';

  defineProps<{
    options: CalculatorFeatOption[];
    abilityOptions: CalculatorAbilityOption[];
    loading: boolean;
    label: string;
    placeholder: string;
    disabled: boolean;
    hasMultipleAbilities: boolean;
    showAbilityChoice: boolean;
  }>();

  const modelValue = defineModel<string | undefined>('modelValue');
  const abilityChoice = defineModel<AbilityKey | undefined>('abilityChoice');
</script>

<template>
  <div
    class="bg-card flex h-full flex-col gap-2 rounded-lg border border-default p-4"
    :class="{
      'opacity-50 grayscale': disabled && !modelValue,
    }"
  >
    <div class="text-xs font-medium text-secondary">
      {{ label }}
    </div>

    <UFieldGroup>
      <USelectMenu
        v-model="modelValue"
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
        v-if="modelValue && !disabled"
        icon="i-fluent-dismiss-24-regular"
        color="neutral"
        variant="subtle"
        @click="modelValue = undefined"
      />
    </UFieldGroup>

    <!-- Ability Choice Inline -->
    <template v-if="modelValue">
      <UFieldGroup
        v-if="hasMultipleAbilities"
        class="mt-auto w-full pt-1"
      >
        <USelect
          v-model="abilityChoice"
          :items="abilityOptions"
          placeholder="Выберите характеристику"
          class="w-full"
          :class="{
            'ring-error': !abilityChoice,
          }"
          option-attribute="label"
          value-attribute="value"
        />

        <UButton
          v-if="abilityChoice"
          icon="i-fluent-dismiss-24-regular"
          color="neutral"
          variant="subtle"
          @click="abilityChoice = undefined"
        />
      </UFieldGroup>

      <!-- Single Ability Display -->
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
