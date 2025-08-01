<script setup lang="ts">
  import { NuxtLink } from '#components';
  import type { ItemEditor } from '~items/editor';

  import type { ItemCreate } from '~items/types';

  const $toast = useToast();

  const editor = useTemplateRef<InstanceType<typeof ItemEditor>>('editor');

  const form = ref<ItemCreate>({
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
    category: 'ITEM',
    types: [],
    cost: 0,
    coin: '',
    weight: '',
    image: '',
    tags: [],
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/item', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            color: 'error',
            title: 'Ошибка создания предмета',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        color: 'success',
        title: 'Предмет успешно создан',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-magic-items' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  };

  function getLink() {
    return h('span', [
      'Можешь перейти на него ',
      h(
        NuxtLink,
        {
          to: {
            name: 'items-url',
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
    title="Создание нового предмета"
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
          @click.left.exact.prevent="navigateTo('/workshop/magic-items')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <ItemEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
