<script setup lang="ts">
  import { GLOSSARY_CATEGORY_LABEL } from '../../model';

  const { category } = defineProps<{
    /** Категория термина, выводится строкой под текстом */
    category: string;
  }>();
</script>

<template>
  <p class="mt-4 text-sm text-muted">
    <span class="font-semibold">{{ GLOSSARY_CATEGORY_LABEL }}</span>
    {{ category }}
  </p>
</template>
