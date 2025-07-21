<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { SpellsEditor } from '~spells/editor';

  import type { SpellCreate } from '~/shared/types';

  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof SpellsEditor>>('editor');

  const form = ref<SpellCreate>({
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
    upper: undefined,
    level: 0,
    school: undefined,
    range: [],
    duration: [],
    castingTime: [],
    components: {
      v: false,
      s: false,
      m: undefined,
    },
    affiliations: {
      classes: [],
      subclasses: [],
      species: [],
      lineages: [],
    },
    tags: [],
    savingThrow: [],
    healingType: [],
    damageType: [],
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  async function submit() {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/spells', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            title: 'Ошибка создания заклинания',
            description: error.response._data.message,
            color: 'error',
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        title: 'Заклинание успешно создано',
        description: getLink,
        color: 'success',
        // onClose: () => navigateTo({ name: 'workshop-spells' }), // TODO: вернуть в будущем
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
            name: 'spells-url',
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
    title="Создание нового заклинания"
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
          @click.left.exact.prevent="navigateTo('/workshop/spells')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <SpellsEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
