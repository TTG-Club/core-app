<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type {
    CalculatorAbilityOption,
    CalculatorFeatOption,
  } from '../../model';

  const { options, abilityOptions, loading, disabled, hasMultipleAbilities } =
    defineProps<{
      options: CalculatorFeatOption[];
      abilityOptions: CalculatorAbilityOption[];
      loading: boolean;
      disabled: boolean;
      hasMultipleAbilities: boolean;
    }>();

  const model = defineModel<string>();
  const abilityChoice = defineModel<AbilityKey>('ability-choice');
</script>

<template>
  <div
    class="flex flex-col gap-2 transition-opacity"
    :class="{ 'opacity-50 grayscale': disabled }"
  >
    <div class="text-sm font-semibold">Эпический дар</div>

    <div class="flex flex-col gap-2">
      <UFieldGroup>
        <USelectMenu
          v-model="model"
          :items="options"
          :loading="loading"
          placeholder="Выберите эпический дар"
          searchable
          class="w-full"
          label-key="label"
          value-key="value"
          :disabled="disabled"
        >
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
                class="w-full truncate text-dimmed"
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
          @click="model = undefined"
        />
      </UFieldGroup>

      <!-- Epic Ability Choice -->
      <div v-if="model">
        <UFieldGroup
          v-if="hasMultipleAbilities"
          class="w-full"
        >
          <USelect
            v-model="abilityChoice"
            :items="abilityOptions"
            placeholder="Выберите характеристику"
            class="w-full"
            :class="{
              'ring-error': !disabled && !abilityChoice,
            }"
            :disabled="disabled"
          />

          <UButton
            v-if="abilityChoice && !disabled"
            icon="i-fluent-dismiss-24-regular"
            color="neutral"
            variant="subtle"
            @click="abilityChoice = undefined"
          />
        </UFieldGroup>

        <!-- Single Ability Display -->
        <template v-else>
          <span
            v-if="abilityOptions[0]?.label"
            class="text-xs text-secondary"
          >
            Бонус: {{ abilityOptions[0]?.label }}
          </span>

          <span
            v-else
            class="text-xs text-secondary"
          >
            Нет бонуса
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
