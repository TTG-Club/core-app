<script setup lang="ts">
  import { getSlug } from '~~/shared/utils';

  import type { SelectOptionWithShortName } from '~/shared/types';

  const props = withDefaults(
    defineProps<{
      engName: string;
      sourceUrl?: string | undefined;
      prefix?: string | undefined;
    }>(),
    {
      sourceUrl: '',
      prefix: '',
    },
  );

  const { data: sources } =
    useNuxtData<Array<SelectOptionWithShortName>>('sources');

  const model = defineModel<string>();

  const acronym = computed(() => {
    if (!props.sourceUrl || !sources.value?.length) {
      return undefined;
    }

    const index = sources.value.findIndex((el) => el.value === props.sourceUrl);

    if (index < 0) {
      return undefined;
    }

    return sources.value[index]?.shortName;
  });

  function handleUrlChange(url: string | undefined) {
    model.value = url ? getSlug(url) : undefined;
  }

  function setUrl() {
    if (!props.engName) {
      return;
    }

    const prefix = props.prefix ? `${props.prefix}-` : '';
    const sourcePostfix = acronym.value ? `-${acronym.value}` : '';

    handleUrlChange(`${prefix}${props.engName}${sourcePostfix}`);
  }

  watch(model, handleUrlChange);

  watch(acronym, setUrl, {
    immediate: true,
  });

  watch(
    () => props.prefix,
    () => setUrl(),
  );

  watch(
    () => props.engName,
    () => setUrl(),
  );
</script>

<template>
  <UInput
    :model-value="model"
    placeholder="Сгенерированный URL"
  />
</template>
