<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { FeatsEditor } from '~feats/editor';
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
  import { useToast } from '~ui/toast';

  import type { FeatCreate } from '~/shared/types';

  const route = useRoute();
  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof FeatsEditor>>('editor');

  const form = useState<FeatCreate>(getInitialState);
  const backup = useState<FeatCreate>(getInitialState);

  const { status } = await useAsyncData(`feat-${route.params.url}-raw`, () =>
    $fetch<FeatCreate>(`/api/v2/feats/${route.params.url}/raw`, {
      onResponse: (ctx) => {
        const merged = merge(form.value, ctx.response._data);

        form.value = cloneDeep(merged);
        backup.value = cloneDeep(merged);
      },
    }),
  );

  const rawIncorrect = computed(
    () => status.value === 'error' || !backup.value,
  );

  const isCreating = ref(false);
  const isCreated = ref(false);

  const isEdited = computed(() => !isEqual(backup.value, form.value));

  async function submit() {
    isCreating.value = true;

    if (!editor.value?.validate) {
      $toast.error({
        title: 'Ошибка сохранения заклинания',
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

    try {
      const payload = await editor.value.validate();

      await $fetch<string>(`/api/v2/feats/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: 'Ошибка сохранения черты',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
        title: 'Черта успешно сохранена',
        description: getLink,
        // onClose: () => navigateTo({ name: 'workshop-feats' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  }

  function getInitialState(): FeatCreate {
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
      prerequisite: '',
      description: '',
      category: undefined,
      repeatability: false,
      tags: [],
    };
  }

  function getLink() {
    return h('span', [
      'Можешь перейти на ее ',
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
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Редактирование черты">
        <template #actions>
          <AButton
            v-if="!rawIncorrect"
            type="primary"
            :disabled="isCreated || !isEdited"
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
              @click.left.exact.prevent="navigateTo('/feats')"
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
          sub-title="Не найдена черта для редактирования"
        />

        <FeatsEditor
          v-else
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
