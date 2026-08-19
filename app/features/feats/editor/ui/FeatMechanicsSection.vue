<script setup lang="ts">
  import type { MechanicChoice } from '~/shared/types';

  import type { FeatChoiceDomain } from '../../model';

  import { FEAT_MECHANICS_EDITOR } from '../../model';
  import FeatChoices from './FeatChoices.vue';

  /**
   * Раздел механики: сверху — то, что черта даёт сразу (слот `granted`), снизу —
   * то же по смыслу, но на выбор игрока. Разделение важно для редактора: «черта
   * даёт знать заклинание» и «игрок выбирает заклинание» хранятся в разных
   * блоках механики, но лежат в одном разделе формы, а не в разных её концах.
   */
  const { domain } = defineProps<{
    /** Раздел, чьи выборы показывает нижняя часть. */
    domain: FeatChoiceDomain;
  }>();

  const choices = defineModel<Array<MechanicChoice>>({ default: () => [] });
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Без безвыборной части подписи не нужны: делить в разделе нечего -->
    <template v-if="$slots.granted">
      <USeparator>
        <span class="font-bold text-secondary">
          {{ FEAT_MECHANICS_EDITOR.grantedTitle }}
        </span>
      </USeparator>

      <slot name="granted" />

      <USeparator>
        <span class="font-bold text-secondary">
          {{ FEAT_MECHANICS_EDITOR.chosenTitle }}
        </span>
      </USeparator>
    </template>

    <FeatChoices
      v-model="choices"
      :domain
    />
  </div>
</template>
