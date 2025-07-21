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

  async function submit() {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/glossary', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            title: 'Ошибка создания глоссария',
            description: error.response._data.message,
            color: 'error',
          });
        },
      });

      $toast.add({
        title: 'Запись глоссария успешно создана',
        description: getLink,
        color: 'success',
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false;
    }
  }

  function getLink() {
    return h('span', [
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
    ]);
  }
</script>

<template>
  <NuxtLayout
    title="Создание новой записи глоссария"
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
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
