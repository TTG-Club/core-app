<script setup lang="ts">
  import { cloneDeep, isEqual, merge } from 'lodash-es';

  import { NuxtLink } from '#components';
  import { SpellsEditor } from '~spells/editor';
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
  import { useToast } from '~ui/toast';

  import type { SpellCreate } from '~/shared/types';

  const route = useRoute();
  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof SpellsEditor>>('editor');

  const form = useState<SpellCreate>(() => ({
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
  }));

  const backup = useState<SpellCreate>(() => ({
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
  }));

  await useAsyncData(`spell-${route.params.url}-raw`, () =>
    $fetch<SpellCreate>(`/api/v2/spells/${route.params.url}/raw`, {
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

      await $fetch<string>(`/api/v2/spells/${route.params.url}`, {
        method: 'PUT',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: 'Ошибка сохранения заклинания',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
        title: 'Заклинание успешно сохранено',
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
      <PageHeader title="Редактирование заклинания">
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
              @click.left.exact.prevent="navigateTo('/spells')"
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
        <SpellsEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
