<script setup lang="ts">
  import { useDiceCalculator } from '../composables';
  import { DICE_HELP_LABELS, DICE_HELP_ROWS, DICE_ICONS } from '../model';
  import DiceToolPanel from './DiceToolPanel.vue';

  const { setFormula } = useDiceCalculator();
</script>

<template>
  <!-- Ширину строк справки решает сама панель (`@container`): в колонке она
    узкая, на планшете — во всю ширину, и окно браузера тут ни о чём не говорит -->
  <DiceToolPanel class="@container">
    <UCollapsible class="flex flex-col gap-2">
      <UButton
        :label="DICE_HELP_LABELS.title"
        :icon="DICE_ICONS.help"
        :trailing-icon="DICE_ICONS.expand"
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
            class="flex flex-col gap-1 border-t border-default py-2 @2xl:flex-row @2xl:gap-4"
          >
            <dt class="@2xl:w-64 @2xl:shrink-0">
              <UButton
                color="primary"
                variant="soft"
                size="xs"
                class="max-w-full font-mono break-all"
                :label="row.syntax"
                :title="DICE_HELP_LABELS.insert"
                @click.left.exact.prevent="setFormula(row.syntax)"
              />
            </dt>

            <dd class="text-sm text-muted">{{ row.description }}</dd>
          </div>
        </dl>
      </template>
    </UCollapsible>
  </DiceToolPanel>
</template>
