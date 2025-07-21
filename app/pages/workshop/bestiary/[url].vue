<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { CreatureEditor } from '~bestiary/editor';
  import { CreaturePreview } from '~bestiary/preview';
  import { getInitialState } from '~bestiary/types';
  import type { CreatureCreate } from '~bestiary/types';
  import { UiResult } from '~ui/result';

  const route = useRoute();
  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof CreatureEditor>>('editor');

  const form = useState<CreatureCreate>(getInitialState);
  const backup = useState<CreatureCreate>(getInitialState);
  const preview = ref(false);

  const { status } = await useAsyncData(
    `bestiary-${route.params.url}-raw`,
    () =>
      $fetch<CreatureCreate>(`/api/v2/bestiary/${route.params.url}/raw`, {
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
        title: 'Ошибка сохранения магического предмета',
        description: 'Измени хотя бы одно поле, чтобы сохранить',
      });

      throw new Error('Form is equal with initial state');
    }

    if (!editor.value?.validate) {
      $toast.add({
        color: 'error',
        title: 'Ошибка сохранения магического предмета',
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

      await $fetch<string>(`/api/v2/bestiary/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.add({
            color: 'error',
            title: 'Ошибка сохранения существа',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.add({
        color: 'success',
        title: 'Существо успешно сохранено',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-backgrounds' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  }

  function checkIsEdited() {
    return !isEqual(toRaw(backup.value), toRaw(form.value));
  }

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
    title="Редактирование существа"
    name="detail"
  >
    <template #actions>
      <template v-if="!rawIncorrect">
        <UButton
          :disabled="preview"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="preview = true"
        >
          Предпросмотр
        </UButton>

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
      </template>

      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/bestiary')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <UiResult
          v-if="rawIncorrect"
          status="error"
          title="Некорректные данные"
          sub-title="Не найдено существо для редактирования"
        />

        <template v-else>
          <CreatureEditor
            ref="editor"
            v-model="form"
            :is-creating="isCreating"
          />

          <CreaturePreview
            v-model="preview"
            :form
          />
        </template>
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
