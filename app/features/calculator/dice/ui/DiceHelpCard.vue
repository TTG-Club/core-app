<script setup lang="ts">
  import { useDiceCalculator } from '../composables';
  import { DICE_HELP_ROWS } from '../model';

  const { setFormula } = useDiceCalculator();
</script>

<template>
  <section class="rounded-xl border border-default bg-muted p-4">
    <UCollapsible class="flex flex-col gap-2">
      <UButton
        label="Как записывать формулы"
        icon="tabler:help-circle"
        trailing-icon="tabler:chevron-down"
        color="neutral"
        variant="ghost"
        size="sm"
        block
        class="group justify-between"
        :ui="{
          trailingIcon:
            'transition-transform duration-200 group-data-[state=open]:rotate-180',
        }"
      />

      <template #content>
        <dl class="flex flex-col">
          <div
            v-for="row in DICE_HELP_ROWS"
            :key="row.syntax"
            class="flex flex-col gap-1 border-t border-default py-2 sm:flex-row sm:gap-4"
          >
            <dt class="sm:w-64 sm:shrink-0">
              <UButton
                color="primary"
                variant="soft"
                size="xs"
                class="font-mono"
                :label="row.syntax"
                title="Подставить формулу в поле"
                @click.left.exact.prevent="setFormula(row.syntax)"
              />
            </dt>

            <dd class="text-sm text-muted">{{ row.description }}</dd>
          </div>
        </dl>
      </template>
    </UCollapsible>
  </section>
</template>
