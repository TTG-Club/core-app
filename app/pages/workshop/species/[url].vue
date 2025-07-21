<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { SpeciesEditor } from '~species/editor';

  import type { SpeciesCreate } from '~/shared/types';
  import { UiResult } from '~ui/result';

  const route = useRoute();
  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof SpeciesEditor>>('editor');

  const form = useState<SpeciesCreate>(getInitialState);
  const backup = useState<SpeciesCreate>(getInitialState);

  const { status } = await useAsyncData(
    `species-${route.params.url}-raw`,
    () =>
      $fetch<SpeciesCreate>(`/api/v2/species/${route.params.url}/raw`, {
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
        color: 'error',
        title: !backup.value?.parent
          ? 'Ошибка сохранения вида'
          : 'Ошибка сохранения происхождения',
        description: 'Измени хотя бы одно поле, чтобы сохранить',
      });

      throw new Error('Form is equal with initial state');
    }

    if (!editor.value?.validate) {
      $toast.add({
        color: 'error',
        title: !backup.value?.parent
          ? 'Ошибка сохранения вида'
          : 'Ошибка сохранения происхождения',
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

      await $fetch<string>(`/api/v2/species/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            color: 'error',
            title: !backup.value?.parent
              ? 'Ошибка сохранения вида'
              : 'Ошибка сохранения происхождения',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        color: 'success',
        title: !backup.value?.parent
          ? 'Вид успешно сохранен'
          : 'Происхождение успешно сохранено',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-species' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  }

  function getInitialState() {
    return {
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
    };
  }

  function checkIsEdited() {
    return !isEqual(toRaw(backup.value), toRaw(form.value));
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
    :title="`Редактирование ${!backup?.parent ? 'вида' : 'происхождения'}`"
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
          @click.left.exact.prevent="navigateTo('/species')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <UiResult
          v-if="rawIncorrect"
          status="error"
          title="Некорректные данные"
          sub-title="Не найден вид или происхождение для редактирования"
        />

        <SpeciesEditor
          v-else
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
