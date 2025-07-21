<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { FeatsEditor } from '~feats/editor';

  import type { FeatCreate } from '~/shared/types';

  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof FeatsEditor>>('editor');

  const form = ref<FeatCreate>({
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
    prerequisite: '',
    description: '',
    category: undefined,
    repeatability: false,
    tags: [],
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/feats', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            title: 'Ошибка создания черты',
            description: error.response._data.message,
            color: 'error',
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        title: 'Черта успешно создана',
        description: getLink,
        color: 'success',
        // onClose: () => navigateTo({ name: 'workshop-feats' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  };

  function getLink() {
    return h('span', [
      'Можешь перейти на нее ',
      h(
        NuxtLink,
        {
          to: {
            name: 'feats-url',
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
    title="Создание новой черты"
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
          @click.left.exact.prevent="navigateTo('/workshop/feats')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <FeatsEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
