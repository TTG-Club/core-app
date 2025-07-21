<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { GlossaryEditor } from '~glossary/editor';

  import type { GlossaryCreate } from '~/shared/types';
  import { UiResult } from '~ui/result';

  const route = useRoute();
  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof GlossaryEditor>>('editor');

  const form = useState<GlossaryCreate>(getInitialState);
  const backup = useState<GlossaryCreate>(getInitialState);

  const { status } = await useAsyncData(
    `glossary-${route.params.url}-raw`,
    () =>
      $fetch<GlossaryCreate>(`/api/v2/glossary/${route.params.url}/raw`, {
        onResponse: (ctx) => {
          const initialState = getInitialState();

          merge(initialState, ctx.response._data);

          form.value = cloneDeep(initialState);
          backup.value = cloneDeep(initialState);
        },
      }),
    { server: false },
  );

  const rawIncorrect = computed(
    () => status.value === 'error' || !backup.value,
  );

  const isCreating = ref(false);
  const isCreated = ref(false);

  async function submit() {
    if (!checkIsEdited()) {
      $toast.add({
        title: 'Ошибка сохранения записи глоссария',
        description: 'Измени хотя бы одно поле, чтобы сохранить',
        color: 'error',
      });

      throw new Error('Form is equal with initial state');
    }

    if (!editor.value?.validate) {
      $toast.add({
        color: 'error',
        title: 'Ошибка сохранения записи глоссария',
        description: () =>
          h('span', null, [
            'Произошла какая-то ошибка... попробуй еще раз или обратись за помощью на нашем ',
            h(
              'a',
              {
                target: '_blank',
                href: 'https://discord.gg/JqFKMKRtxv',
                rel: 'noreferrer noopener',
              },
              'Discord-канале',
            ),
          ]),
      });

      throw new Error('Validation method was not found');
    }

    isCreating.value = true;

    try {
      const payload = await editor.value.validate();

      await $fetch<string>(`/api/v2/glossary/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            color: 'error',
            title: 'Ошибка сохранения черты',
            description: error.response._data.message,
          });
        },
      });

      $toast.add({
        color: 'success',
        title: 'Запись глоссария успешно сохранена',
        description: getLink,
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false;
    }
  }

  function getInitialState(): GlossaryCreate {
    return {
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
    };
  }

  function checkIsEdited() {
    return !isEqual(toRaw(backup.value), toRaw(form.value));
  }

  function getLink() {
    return h('span', [
      'Можешь перейти на ее ',
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
    title="Редактирование записи глоссария"
    name="detail"
  >
    <template #actions>
      <UButton
        v-if="!rawIncorrect"
        :disabled="isCreated"
        :loading="isCreating"
        icon="i-ttg-check"
        variant="ghost"
        color="neutral"
        @click.left.exact.prevent="submit"
      >
        Сохранить
      </UButton>

      <UTooltip text="Закрыть">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-ttg-x"
          @click.left.exact.prevent="navigateTo('/glossary')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <UiResult
          v-if="rawIncorrect"
          status="error"
          title="Некорректные данные"
          sub-title="Не найдена запись глоссария для редактирования"
        />

        <GlossaryEditor
          v-else
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
