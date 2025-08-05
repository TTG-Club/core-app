<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { GlossaryEditor } from '~glossary/editor';

  import type { GlossaryCreate } from '~/shared/types';

  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof GlossaryEditor>>('editor');

  const form = ref<GlossaryCreate>({
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    source: {
      url: undefined,
      page: undefined,
    },
    description: '',
    tags: [],
    tagCategory: '',
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  function submit(body: GlossaryCreate) {
    isCreating.value = true;

    $fetch<string>('/api/v2/glossary', {
      method: 'POST',
      body,
      onResponseError: (error) => {
        $toast.add({
          title: 'Ошибка создания глоссария',
          description: error.response._data.message,
          color: 'error',
        });
      },
    })
      .then(() => {
        showSuccessToast();
        isCreated.value = true;
      })
      .finally(() => {
        isCreating.value = false;
      });
  }

  function showSuccessToast() {
    $toast.add({
      title: 'Запись глоссария успешно создана',
      description: () =>
        h('span', [
          'Можешь перейти на нее ',
          h(
            NuxtLink,
            {
              to: {
                name: 'glossary-url',
                params: {
                  url: form.value.url,
                },
              },
              target: '_blank',
            },
            () => 'страницу',
          ),
        ]),
      color: 'success',
    });
  }
</script>

<template>
  <NuxtLayout
    title="Создание новой записи глоссария"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-ttg-x"
          @click.left.exact.prevent="navigateTo('/workshop/glossary')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <GlossaryEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
          @submit="submit"
          @error="consola.error($event)"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
