<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { SpeciesEditor } from '~species/editor';

  import type { SpeciesCreate } from '~/shared/types';

  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof SpeciesEditor>>('editor');

  const form = ref<SpeciesCreate>({
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    description: '',
    image: undefined,
    linkImage: undefined,
    gallery: [],
    parent: undefined,
    source: {
      url: undefined,
      page: undefined,
    },
    properties: {
      sizes: [],
      type: undefined,
      speed: {
        base: 30,
        fly: undefined,
        climb: undefined,
        swim: undefined,
        hover: false,
      },
    },
    features: [],
    tags: [],
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  async function submit() {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/species', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            color: 'error',
            title: 'Ошибка создания вида',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        color: 'success',
        title: h('span', () =>
          !form.value.parent
            ? 'Вид успешно создан'
            : 'Происхождение успешно создано',
        ),
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-species' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  }

  function getLink() {
    return h('span', [
      'Можешь перейти на его ',
      h(
        NuxtLink,
        {
          to: {
            name: 'species-url',
            params: {
              url: form.value.url,
            },
          },
          target: '_blank',
        },
        () => 'страницу',
      ),
    ]);
  }
</script>

<template>
  <NuxtLayout
    title="Создание нового вида"
    name="detail"
  >
    <template #actions>
      <UButton
        :disabled="isCreated"
        :loading="isCreating"
        icon="i-ttg-check"
        variant="ghost"
        color="neutral"
        @click.left.exact.prevent="submit"
      >
        Создать
      </UButton>

      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/workshop/species')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <SpeciesEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
