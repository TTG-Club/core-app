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

  const form = ref<SpeciesCreate>({
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
  });

  const backup = useState<SpeciesCreate>(() => ({
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
  }));

  await useAsyncData(`species-${route.params.url}-raw`, () =>
    $fetch<SpeciesCreate>(`/api/v2/species/${route.params.url}/raw`, {
      onResponse: (ctx) => {
        const merged = merge(form.value, ctx.response._data);

        form.value = cloneDeep(merged);
        backup.value = cloneDeep(merged);
      },
    }),
  );

  const isCreating = ref(false);
  const isCreated = ref(false);

  const isEdited = computed(() => !isEqual(backup.value, form.value));

  async function submit() {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>(`/api/v2/species/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: !backup.value.parent
              ? 'Ошибка сохранения вида'
              : 'Ошибка сохранения происхождения',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
        title: !backup.value.parent
          ? 'Вид успешно сохранен'
          : 'Происхождение успешно сохранено',
        description: getLink,
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
  <PageContainer fixed-header>
    <template #header>
      <PageHeader
        :title="`Редактирование ${!backup.parent ? 'вида' : 'происхождения'}`"
      >
        <template #actions>
          <AButton
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
              @click.left.exact.prevent="navigateTo('/workshop/species')"
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
        <SpeciesEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
