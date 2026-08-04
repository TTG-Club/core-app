<script setup lang="ts">
  import type { AccordionItem } from '@nuxt/ui';

  import type { ActiveEffect, EffectOrigin } from '../model';

  import { createEmptyActiveEffect, DEFAULT_EFFECT_ICON } from '../model';
  import ActiveEffectItem from './ui/ActiveEffectItem.vue';

  // Источник задаёт редактор-хозяин: он же и знает, чем эффект выдан.
  const { origin = 'spell' } = defineProps<{ origin?: EffectOrigin }>();

  const model = defineModel<Array<ActiveEffect>>({ default: () => [] });

  const accordionItems = computed<Array<AccordionItem>>(() =>
    model.value.map((effect, index) => ({
      label: effect.name || 'Эффект без названия',
      value: `${index}`,
    })),
  );

  function addEffect() {
    model.value = [...model.value, createEmptyActiveEffect(origin)];
  }

  function removeEffect(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  function updateEffect(index: number, value: ActiveEffect) {
    model.value = model.value.map((effect, position) =>
      position === index ? value : effect,
    );
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            Активные эффекты (VTTG)
          </h2>

          <span class="text-xs text-muted">
            Считаются листом персонажа и экспортируются в виртуальный стол VTTG
          </span>
        </div>

        <UButton
          icon="tabler:plus"
          size="sm"
          variant="subtle"
          @click.left.exact.prevent="addEffect"
        >
          Добавить эффект
        </UButton>
      </div>
    </template>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed italic"
    >
      Нет активных эффектов. Добавь эффект, чтобы запись меняла числа на листе
      персонажа — класс доспеха, спасброски, характеристики — или накладывала
      состояния и ауры в VTTG.
    </p>

    <UAccordion
      v-else
      type="multiple"
      :items="accordionItems"
      :ui="{ trigger: 'text-base', body: 'pb-4' }"
    >
      <template #leading="{ index }">
        <UIcon
          :name="model[index]?.icon || DEFAULT_EFFECT_ICON"
          class="size-5 text-primary"
        />
      </template>

      <template #body="{ index }">
        <div
          v-if="model[index]"
          class="flex flex-col gap-3"
        >
          <ActiveEffectItem
            :model-value="model[index]!"
            @update:model-value="updateEffect(index, $event)"
          />

          <div class="flex justify-end">
            <UButton
              icon="tabler:trash"
              color="error"
              variant="soft"
              size="sm"
              @click.left.exact.prevent="removeEffect(index)"
            >
              Удалить эффект
            </UButton>
          </div>
        </div>
      </template>
    </UAccordion>
  </UCard>
</template>
