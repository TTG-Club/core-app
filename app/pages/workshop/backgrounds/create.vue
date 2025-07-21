<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { BackgroundsEditor } from '~backgrounds/editor';

  import type { BackgroundCreate } from '~/shared/types';

  const $toast = useToast();

  const editor =
    useTemplateRef<InstanceType<typeof BackgroundsEditor>>('editor');

  const form = ref<BackgroundCreate>({
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
    featUrl: undefined,
    abilityScores: [],
    skillsProficiencies: [],
    toolProficiency: '',
    equipment: '',
    tags: [],
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/backgrounds', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            color: 'error',
            title: 'Ошибка создания предыстории',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        color: 'success',
        title: 'Черта успешно создана',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-backgrounds' }), // TODO: вернуть в будущем
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
            name: 'backgrounds-url',
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
    title="Создание новой предыстории"
    name="detail"
  >
    <template #actions>
      <UButton
        :disabled="isCreated"
        :loading="editor?.isCreating"
        icon="i-ttg-check"
        variant="ghost"
        color="neutral"
        @click.left.exact.prevent="submit"
      >
        Сохранить
      </UButton>

      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/workshop/backgrounds')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <BackgroundsEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
