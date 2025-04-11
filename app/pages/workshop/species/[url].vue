<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { SpeciesEditor } from '~species/editor';
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
  import { useToast } from '~ui/toast';

  import type { SpeciesCreate } from '~/shared/types';

  const route = useRoute();
  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof SpeciesEditor>>('editor');

  const form = useState<SpeciesCreate>(getInitialState);
  const backup = useState<SpeciesCreate>(getInitialState);

  const { status } = await useAsyncData(`species-${route.params.url}-raw`, () =>
    $fetch<SpeciesCreate>(`/api/v2/species/${route.params.url}/raw`, {
      onResponse: (ctx) => {
        const merged = merge(getInitialState(), ctx.response._data);

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

      await $fetch<string>(`/api/v2/species/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: !backup.value?.parent
              ? 'Ошибка сохранения вида'
              : 'Ошибка сохранения происхождения',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
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
  <PageContainer fixed-header>
    <template #header>
      <PageHeader
        :title="`Редактирование ${!backup?.parent ? 'вида' : 'происхождения'}`"
      >
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
              @click.left.exact.prevent="navigateTo('/species')"
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
  </PageContainer>
</template>
