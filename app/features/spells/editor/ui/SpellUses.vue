<script setup lang="ts">
  import type { SpellUses, SpellUsesRecovery } from '../../model';

  import {
    createEmptySpellUses,
    SPELL_USES_LABELS,
    SPELL_USES_RECOVERY_OPTIONS,
  } from '../../model';

  const model = defineModel<SpellUses | undefined>();

  // Галочка заводит и убирает сам блок: пустые заряды на сервер не уходят, а
  // «ограничения нет» и «ограничение не заполнено» — разные вещи.
  const hasUses = computed({
    get: () => model.value !== undefined,
    set: (enabled) => {
      model.value = enabled ? createEmptySpellUses() : undefined;
    },
  });

  // У «по желанию» заряды не расходуются — максимум ему не нужен.
  const isAtWill = computed(() => model.value?.recovery === 'atWill');

  const max = computed({
    get: () => model.value?.max,
    set: (value) => {
      if (model.value) {
        model.value = { ...model.value, max: value };
      }
    },
  });

  const recovery = computed({
    get: () => model.value?.recovery,
    set: (value: SpellUsesRecovery) => {
      if (model.value) {
        model.value = { ...model.value, recovery: value };
      }
    },
  });
</script>

<template>
  <div class="grid grid-cols-24 gap-4">
    <UFormField class="col-span-full">
      <UCheckbox
        v-model="hasUses"
        :label="SPELL_USES_LABELS.enable"
      />
    </UFormField>

    <template v-if="hasUses">
      <UFormField
        v-if="!isAtWill"
        class="col-span-full md:col-span-8"
        :label="SPELL_USES_LABELS.max"
        name="effect.uses.max"
      >
        <UInputNumber
          v-model="max"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="SPELL_USES_LABELS.recovery"
        name="effect.uses.recovery"
      >
        <USelect
          v-model="recovery"
          :items="SPELL_USES_RECOVERY_OPTIONS"
          class="w-full"
        />
      </UFormField>

      <p
        v-if="isAtWill"
        class="col-span-full text-xs text-dimmed italic"
      >
        {{ SPELL_USES_LABELS.atWillHint }}
      </p>
    </template>
  </div>
</template>
