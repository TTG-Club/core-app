<script setup lang="ts">
  import type { SpellDetailResponse } from '~spells/model';

  import { SpellBody } from '~spells/body';
  import { getSpellMarkdown } from '~spells/model';
  import { UiDrawer } from '~ui/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `spell-${url}`),
    () => $fetch<SpellDetailResponse>(`/api/v2/spells/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/spells/${url}`);
  const editUrl = computed(() => `/workshop/spells/${url}`);

  // Геттер, а не готовая строка: сборка Markdown разбирает всю
  // разметку сущности, поэтому откладывается до клика по кнопке.
  const markdown = computed(() => {
    const entity = detail.value;

    return entity ? () => getSpellMarkdown(entity) : undefined;
  });
</script>

<template>
  <UiDrawer
    :title="detail?.name"
    :source="detail?.source"
    :date-time="detail?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :markdown
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <SpellBody
      v-if="detail"
      :spell="detail"
    />
  </UiDrawer>
</template>
