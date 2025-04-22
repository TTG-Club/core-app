<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
  import { useToast } from '~ui/toast';

  import type { BackgroundCreate } from '~/shared/types';
  import type { BackgroundEditor } from '~backgrounds/editor';

  const route = useRoute();
  const $toast = useToast();

  const editor =
    useTemplateRef<InstanceType<typeof BackgroundEditor>>('editor');

  const form = useState<BackgroundCreate>(getInitialState);
  const backup = useState<BackgroundCreate>(getInitialState);

  const { status } = await useAsyncData(
    `background-${route.params.url}-raw`,
    () =>
      $fetch<BackgroundCreate>(`/api/v2/backgrounds/${route.params.url}/raw`, {
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
      $toast.error({
        title: 'Ошибка сохранения предыстории',
        description: 'Измени хотя бы одно поле, чтобы сохранить',
      });

      throw new Error('Form is equal with initial state');
    }

    if (!editor.value?.validate) {
      $toast.error({
        title: 'Ошибка сохранения предыстории',
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

      await $fetch<string>(`/api/v2/background/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: 'Ошибка сохранения предыстории',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
        title: 'Предыстория успешно сохранена',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-backgrounds' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  }

  function getInitialState(): BackgroundCreate {
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
      abilityScores: [],
      featUrl: '',
      skillsProficiencies: [],
      toolProficiency: '',
      equipment: '',
      tags: [],
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
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Редактирование предыстории">
        <template #actions>
          <AButton
            v-if="!rawIncorrect"
            type="primary"
            :disabled="isCreated"
            :loading="editor?.isCreating"
            @click.left.exact.prevent="submit"
          >
            <template #icon>
              <SvgIcon icon="check" />
            </template>

            <template #default> Сохранить </template>
          </AButton>

          <ATooltip
            title="Закрыть"
            :mouse-enter-delay="0.7"
            destroy-tooltip-on-hide
          >
            <AButton
              type="text"
              @click.left.exact.prevent="navigateTo('/backgrounds')"
            >
              <template #icon>
                <SvgIcon icon="close" />
              </template>
            </AButton>
          </ATooltip>
        </template>
      </PageHeader>
    </template>

    <template #default>
      <ClientOnly>
        <AResult
          v-if="rawIncorrect"
          status="error"
          title="Некорректные данные"
          sub-title="Не найдена предыстория для редактирования"
        />

        <BackgroundsEditor
          v-else
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
