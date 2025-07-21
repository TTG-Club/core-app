<script setup lang="ts">
  import { getSlug } from '~~/shared/utils';

  import type { SelectOptionWithShortName } from '~/shared/types';

  const props = withDefaults(
    defineProps<{
      engName: string;
      sourceUrl?: string | undefined;
      leading?: string;
    }>(),
    {
      sourceUrl: '',
      leading: '',
    },
  );

  const { data: books } =
    useNuxtData<Array<SelectOptionWithShortName>>('books');

  const model = defineModel<string>();

  const acronym = computed(() => {
    if (!props.sourceUrl || !books.value?.length) {
      return undefined;
    }

    const index = books.value.findIndex((el) => el.value === props.sourceUrl);

    if (index < 0) {
      return undefined;
    }

    return books.value[index]?.shortName;
  });

  function handleUrlChange(url: string | undefined) {
    model.value = url ? getSlug(url) : undefined;
  }

  function setUrlWithAcronym() {
    if (!props.engName) {
      return;
    }

    const sourcePostfix = acronym.value ? `-${acronym.value}` : '';

    handleUrlChange(`${props.engName}${sourcePostfix}`);
  }

  watch(model, handleUrlChange);

  watch(acronym, setUrlWithAcronym, {
    immediate: true,
  });

  watch(
    () => props.engName,
    () => {
      setUrlWithAcronym();
    },
  );
</script>

<template>
  <UInput
    :model-value="model"
    placeholder="Сгенерированный URL"
  >
    <template
      v-if="leading"
      #leading
    >
      {{ leading }}
    </template>
  </UInput>
</template>
