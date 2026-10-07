<script setup lang="ts">
  import type { LegalDocumentSection } from './types';

  import {
    LEGAL_DOCUMENT_UPDATED_DATE_FORMAT,
    LEGAL_DOCUMENT_UPDATED_ICON,
  } from './constants';
  import LegalDocumentContent from './LegalDocumentContent.vue';

  /**
   * Юридический документ сайта: вступление, дата редакции и разделы с
   * подразделами. Общая разметка страниц «Файлы cookie» и политики обработки
   * персональных данных — сами тексты лежат в моделях их фич.
   */
  const { intro, sections, updatedAt, updatedPrefix } = defineProps<{
    /** Вводные абзацы перед разделами */
    intro: Array<string>;

    /** Разделы документа */
    sections: Array<LegalDocumentSection>;

    /** Дата редакции в формате ISO: 2026-09-12 */
    updatedAt: string;

    /** Подпись перед датой редакции: «Страница обновлена», «Редакция от» */
    updatedPrefix: string;
  }>();

  const { format } = useDayjs();

  const updatedAtLabel = computed(
    () =>
      `${updatedPrefix} ${format(updatedAt, LEGAL_DOCUMENT_UPDATED_DATE_FORMAT)}`,
  );
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <div class="flex flex-col items-start gap-3">
      <p
        v-for="paragraph in intro"
        :key="paragraph"
        class="text-sm leading-6 text-toned"
      >
        {{ paragraph }}
      </p>

      <!-- size="lg" — единственный размер плашки с текстом 14px, как в абзацах -->
      <UBadge
        :label="updatedAtLabel"
        :icon="LEGAL_DOCUMENT_UPDATED_ICON"
        color="neutral"
        variant="subtle"
        size="lg"
        :ui="{ leadingIcon: 'size-4' }"
      />
    </div>

    <section
      v-for="section in sections"
      :id="section.id"
      :key="section.id"
      class="flex scroll-mt-4 flex-col gap-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UIcon
          v-if="section.icon"
          :name="section.icon"
          class="size-5 shrink-0 text-primary"
        />

        <h2 class="text-lg font-medium text-highlighted">
          {{ section.title }}
        </h2>

        <UBadge
          v-if="section.badge"
          :label="section.badge"
          color="primary"
          variant="subtle"
          size="sm"
        />
      </div>

      <LegalDocumentContent :block="section" />

      <div
        v-for="subsection in section.subsections"
        :id="subsection.id"
        :key="subsection.id"
        class="flex scroll-mt-4 flex-col gap-3 pt-1"
      >
        <h3 class="text-base font-medium text-highlighted">
          {{ subsection.title }}
        </h3>

        <LegalDocumentContent :block="subsection" />
      </div>
    </section>
  </div>
</template>
