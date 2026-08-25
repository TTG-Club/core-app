<script setup lang="ts">
  import type {
    SpellProjectileDistribution,
    SpellProjectiles,
  } from '../../model';

  import {
    createEmptySpellProjectiles,
    SPELL_PROJECTILE_DISTRIBUTION_OPTIONS,
    SPELL_PROJECTILE_LABELS,
  } from '../../model';

  const { level, hint } = defineProps<{
    level: number; // круг заклинания (0 — заговор)
    hint: string; // подсказка про бросок атаки/автопопадание
  }>();

  const model = defineModel<SpellProjectiles | undefined>();

  const isCantrip = computed(() => level === 0);

  const enabled = computed<boolean>({
    get: () => model.value !== undefined,
    set: (value) => {
      model.value = value ? createEmptySpellProjectiles() : undefined;
    },
  });

  const distribution = computed<SpellProjectileDistribution>({
    get: () => model.value?.targetDistribution ?? 'any',
    set: (value) => {
      if (!model.value) {
        return;
      }

      model.value.targetDistribution = value === 'any' ? undefined : value;
    },
  });

  const tiers = computed(() => model.value?.countByCharacterLevel ?? []);

  function addTier() {
    if (!model.value) {
      return;
    }

    const lastTier = tiers.value[tiers.value.length - 1];

    model.value.countByCharacterLevel = [
      ...tiers.value,
      {
        level: lastTier?.level !== undefined ? lastTier.level + 6 : 5,
        count: lastTier?.count !== undefined ? lastTier.count + 1 : 2,
      },
    ];
  }

  function removeTier(index: number) {
    if (!model.value?.countByCharacterLevel) {
      return;
    }

    model.value.countByCharacterLevel =
      model.value.countByCharacterLevel.filter(
        (_, position) => position !== index,
      );
  }
</script>

<template>
  <div class="col-span-full flex flex-col gap-3">
    <UCheckbox
      v-model="enabled"
      :label="SPELL_PROJECTILE_LABELS.enable"
      :ui="{ label: 'text-sm font-semibold text-highlighted' }"
    />

    <div
      v-if="enabled"
      class="flex flex-col gap-3"
    >
      <p class="text-xs text-dimmed">
        {{ hint }}
      </p>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-full md:col-span-12"
          :label="SPELL_PROJECTILE_LABELS.count"
        >
          <UInput
            v-model.number="model!.count"
            type="number"
            :min="1"
            :placeholder="SPELL_PROJECTILE_LABELS.countPlaceholder"
          />
        </UFormField>

        <UFormField
          v-if="!isCantrip"
          class="col-span-full md:col-span-12"
          :label="SPELL_PROJECTILE_LABELS.perSlotLevel"
        >
          <UInput
            v-model.number="model!.perSlotLevel"
            type="number"
            :min="0"
            :placeholder="SPELL_PROJECTILE_LABELS.perSlotLevelPlaceholder"
          />
        </UFormField>
      </div>

      <UFormField :label="SPELL_PROJECTILE_LABELS.distribution">
        <URadioGroup
          v-model="distribution"
          :items="[...SPELL_PROJECTILE_DISTRIBUTION_OPTIONS]"
          value-key="value"
        />
      </UFormField>

      <!-- Пороги уровня персонажа (только для заговоров) -->
      <template v-if="isCantrip">
        <p class="text-xs text-dimmed">
          {{ SPELL_PROJECTILE_LABELS.tiersHint }}
        </p>

        <div
          v-for="(tier, index) in tiers"
          :key="index"
          class="grid grid-cols-24 items-end gap-4"
        >
          <UFormField
            class="col-span-full md:col-span-11"
            :label="SPELL_PROJECTILE_LABELS.tierLevel"
          >
            <UInput
              v-model.number="tier.level"
              type="number"
              :min="1"
              :max="20"
              :placeholder="SPELL_PROJECTILE_LABELS.tierLevelPlaceholder"
            />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-11"
            :label="SPELL_PROJECTILE_LABELS.tierCount"
          >
            <UInput
              v-model.number="tier.count"
              type="number"
              :min="1"
              :placeholder="SPELL_PROJECTILE_LABELS.countPlaceholder"
            />
          </UFormField>

          <UFormField class="col-span-full flex md:col-span-2">
            <UButton
              icon="tabler:trash"
              color="error"
              variant="soft"
              :aria-label="SPELL_PROJECTILE_LABELS.tierRemove"
              @click.left.exact.prevent="removeTier(index)"
            />
          </UFormField>
        </div>

        <UButton
          icon="tabler:plus"
          variant="soft"
          size="sm"
          class="self-start"
          @click.left.exact.prevent="addTier"
        >
          {{ SPELL_PROJECTILE_LABELS.tierAdd }}
        </UButton>
      </template>
    </div>
  </div>
</template>
