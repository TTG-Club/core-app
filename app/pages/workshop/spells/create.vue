<script setup lang="ts">
  import { SpellsEditor } from '~spells/editor';
  import { PageContainer, PageHeader } from '~ui/page';
  import { SvgIcon } from '~ui/icon';

  const editor = useTemplateRef<InstanceType<typeof SpellsEditor>>('editor');
</script>

<template>
  <PageContainer fixed-header>
    <template #header>
      <PageHeader title="Создание нового заклинания">
        <template #actions>
          <AButton
            type="primary"
            :disabled="editor?.isCreated"
            :loading="editor?.isCreating"
            @click.left.exact.prevent="editor?.submit()"
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
              @click.left.exact.prevent="navigateTo('/workshop/spells')"
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
        <SpellsEditor ref="editor" />
      </ClientOnly>
    </template>
  </PageContainer>
</template>
