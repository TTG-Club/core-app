<script setup lang="ts">
  import type { LegalDocumentBlock } from './types';

  import { LEGAL_DOCUMENT_BULLET_ICON } from './constants';

  /**
   * Содержимое блока юридического документа: абзацы, карточка сведений,
   * список и ссылки.
   * Заголовок рисует родитель — у раздела и подраздела он разного уровня.
   */
  const { block } = defineProps<{
    /** Блок, содержимое которого выводится */
    block: LegalDocumentBlock;
  }>();
</script>

<template>
  <p
    v-for="paragraph in block.paragraphs"
    :key="paragraph"
    class="text-sm leading-6 text-toned"
  >
    {{ paragraph }}
  </p>

  <dl
    v-if="block.facts"
    class="flex flex-col divide-y divide-default rounded-md border border-default"
  >
    <div
      v-for="fact in block.facts"
      :key="fact.label"
      class="flex flex-col gap-1 px-4 py-3 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4"
    >
      <dt class="text-sm leading-6 font-medium text-highlighted">
        {{ fact.label }}
      </dt>

      <dd class="text-sm leading-6 text-toned">
        {{ fact.value }}
      </dd>
    </div>
  </dl>

  <div
    v-if="block.bullets"
    class="flex flex-col gap-2"
  >
    <div
      v-for="bullet in block.bullets"
      :key="bullet"
      class="flex items-start gap-2"
    >
      <UIcon
        :name="LEGAL_DOCUMENT_BULLET_ICON"
        class="mt-1.5 size-3 shrink-0 text-dimmed"
      />

      <p class="text-sm leading-6 text-muted">
        {{ bullet }}
      </p>
    </div>
  </div>

  <div
    v-if="block.links"
    class="flex flex-col items-start gap-1"
  >
    <ULink
      v-for="link in block.links"
      :key="link.label"
      :to="link.to"
      :href="link.href"
      class="flex items-center gap-1.5 text-sm leading-6 text-primary hover:underline"
    >
      <UIcon
        :name="link.icon"
        class="size-4 shrink-0"
      />

      {{ link.label }}
    </ULink>
  </div>
</template>
