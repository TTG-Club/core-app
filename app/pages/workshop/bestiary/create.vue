<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { CreatureEditor } from '~bestiary/editor';
  import { CreaturePreview } from '~bestiary/preview';
  import { getInitialState } from '~bestiary/types';
  import type { CreatureCreate } from '~bestiary/types';

  const $toast = useToast();

  const editor = useTemplateRef<InstanceType<typeof CreatureEditor>>('editor');

  const form = useState<CreatureCreate>(getInitialState);

  const isCreating = ref(false);
  const isCreated = ref(false);
  const preview = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/bestiary', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            color: 'error',
            title: 'Ошибка создания существа',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        title: 'Существо успешно создано',
        description: getLink,
        color: 'success',
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
            name: 'bestiary-url',
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
    title="Создание нового существа"
    name="detail"
  >
    <template #actions>
      <UButton
        :disabled="preview"
        @click.left.exact.prevent="preview = true"
      >
        Предпросмотр
      </UButton>

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
          @click.left.exact.prevent="navigateTo('/workshop/bestiary')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <CreatureEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />

        <CreaturePreview
          v-model="preview"
          :form
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
