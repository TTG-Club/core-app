<script setup lang="ts">
  import type { SpellDamageFormulaPart, SpellEffect } from '../../model';

  import { DictionaryService } from '~/shared/api';

  import {
    applySpellDamageFormulaParts,
    getSpellDamageFormulaParts,
    SPELL_EDITOR_SECTIONS,
    SPELL_PROJECTILE_HINTS,
  } from '../../model';
  import SpellDamageFormulas from './SpellDamageFormulas.vue';
  import SpellProjectiles from './SpellProjectiles.vue';
  import SpellSavingThrow from './SpellSavingThrow.vue';
  import SpellScaling from './SpellScaling.vue';
  import SpellTargeting from './SpellTargeting.vue';

  const { level } = defineProps<{
    level: number; // круг заклинания (нужен снарядному режиму и масштабированию)
  }>();

  const model = defineModel<SpellEffect>({ required: true });

  // Справочник типов урона грузится здесь, один раз на всю вкладку: его просят и
  // базовые части урона, и тиры масштабирования заговора.
  const { data: damageTypes, status: damageTypesStatus } = await useAsyncData(
    'dictionaries-damage-types',
    () => DictionaryService.damageTypes(),
    { dedupe: 'defer' },
  );

  const damageTypeOptions = computed(() => damageTypes.value ?? []);

  const isDamageTypesPending = computed(
    () => damageTypesStatus.value === 'pending',
  );

  // Формулы и их цели хранятся параллельными массивами, но редактируются как
  // один список частей — иначе отдельные обновления модели разъезжаются по
  // индексам.
  const damageFormulaParts = computed<Array<SpellDamageFormulaPart>>({
    get: () => getSpellDamageFormulaParts(model.value),
    set: (value) => {
      model.value = applySpellDamageFormulaParts(model.value, value);
    },
  });

  // Нужен ли бросок атаки на каждый снаряд — выводится из «Тип атаки»/«Авто
  // попадание», поэтому противоречивую комбинацию задать нельзя.
  const projectileHint = computed(() => {
    if (model.value.autoHit) {
      return SPELL_PROJECTILE_HINTS.autoHit;
    }

    if (model.value.attackType) {
      return SPELL_PROJECTILE_HINTS.attackRoll;
    }

    return SPELL_PROJECTILE_HINTS.distributed;
  });

  const cantripScalingTiers = computed({
    get: () => model.value.cantripScalingTiers ?? [],
    set: (tiers) => {
      model.value = { ...model.value, cantripScalingTiers: tiers };
    },
  });

  const scaling = computed({
    get: () => model.value.scaling,
    set: (value) => {
      model.value = { ...model.value, scaling: value };
    },
  });
</script>

<template>
  <!-- Порядок карточек повторяет форму системы: во что целится → чем достаёт →
    что наносит → как растёт → что кидает цель -->
  <div class="grid gap-8">
    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ SPELL_EDITOR_SECTIONS.targeting }}
        </h2>
      </template>

      <SpellTargeting
        v-model="model"
        :level="level"
      />
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ SPELL_EDITOR_SECTIONS.projectiles }}
        </h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <SpellProjectiles
          v-model="model.projectiles"
          :level="level"
          :hint="projectileHint"
        />
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ SPELL_EDITOR_SECTIONS.damage }}
        </h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <SpellDamageFormulas
          v-model="damageFormulaParts"
          :damage-type-options="damageTypeOptions"
          :damage-types-pending="isDamageTypesPending"
        />

        <SpellScaling
          v-model:scaling="scaling"
          v-model:tiers="cantripScalingTiers"
          :level="level"
          :damage-type-options="damageTypeOptions"
          :damage-types-pending="isDamageTypesPending"
        />
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ SPELL_EDITOR_SECTIONS.savingThrow }}
        </h2>
      </template>

      <SpellSavingThrow v-model="model" />
    </UCard>
  </div>
</template>
