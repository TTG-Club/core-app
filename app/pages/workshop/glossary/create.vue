<script setup lang="ts">
  import { NuxtLink } from '#components';
  import { GlossaryEditor } from '~glossary/editor';
  import { SvgIcon } from '~ui/icon';
  import { PageContainer, PageHeader } from '~ui/page';
  import { useToast } from '~ui/toast';

  import type { GlossaryCreate } from '~/shared/types';

  const $toast = useToast();
  const editor = useTemplateRef<InstanceType<typeof GlossaryEditor>>('editor');

  const form = ref<GlossaryCreate>({
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
  });

  const isCreating = ref(false);
  const isCreated = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await editor.value?.validate?.();

      await $fetch<string>('/api/v2/glossary', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: 'Ошибка создания глоссария',
            description: error.response._data.message,
          });
        },
      });

      $toast.success({
        title: 'Запись глоссария успешно создана',
        description: getLink,
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false;
    }
  };

  function getLink() {
    return h('span', [
      'Можешь перейти на нее ',
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
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Создание новой записи глоссария">
        <template #actions>
          <AButton
            type="primary"
            :disabled="isCreated"
            :loading="isCreating"
            @click.left.exact.prevent="submit"
          >
            <template #icon>
              <SvgIcon icon="check" />
            </template>

            <template #default> Создать </template>
          </AButton>

          <ATooltip
            title="Закрыть"
            :mouse-enter-delay="0.7"
            destroy-tooltip-on-hide
          >
            <AButton
              type="text"
              @click.left.exact.prevent="navigateTo('/workshop/glossary')"
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
        <GlossaryEditor
          ref="editor"
          v-model="form"
          :is-creating="isCreating"
        />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
