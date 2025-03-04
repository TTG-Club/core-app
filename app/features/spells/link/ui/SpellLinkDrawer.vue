<script setup lang="ts">
  import {
    Breakpoint,
    BREAKPOINTS,
    useBreakpoints,
  } from '~/shared/composables';
  import type { SpellDetailResponse } from '~/shared/types';
  import { SpellBody } from '../../body';
  import {
    DrawerActions,
    DrawerBody,
    DrawerTitle,
    SourceTag,
  } from '~/shared/ui';

  const props = defineProps<{
    url: string;
  }>();

  const model = defineModel<boolean>();

  const { greaterOrEqual } = useBreakpoints();

  const {
    data: spell,
    execute,
    status,
  } = await useAsyncData(
    `spell-${props.url}`,
    () => $fetch<SpellDetailResponse>(`/api/v2/spells/${props.url}`),
    {
      server: false,
      immediate: false,
      lazy: true,
    },
  );

  const urlForCopy = computed(
    () => `${window.location.origin}/spells/${props.url}`,
  );

  const isTabletOrGreater = greaterOrEqual(Breakpoint.MD);

  watch(
    model,
    (value) => {
      if (!value) {
        return;
      }

      execute();
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <ClientOnly>
    <ADrawer
      v-model:open="model"
      :content-wrapper-style="{
        minWidth: '320px',
        maxWidth: `${BREAKPOINTS[Breakpoint.MD]}px`,
      }"
      width="100%"
      destroy-on-close
    >
      <template #title>
        <DrawerTitle :name="spell?.name" />
      </template>

      <template
        v-if="spell?.source"
        #extra
      >
        <AFlex :gap="8">
          <DrawerActions
            v-if="isTabletOrGreater"
            :url="urlForCopy"
          />

          <SourceTag :source="spell.source" />
        </AFlex>
      </template>

      <template #default>
        <DrawerBody :is-loading="status === 'pending'">
          <template
            v-if="spell"
            #body
          >
            <SpellBody :spell />
          </template>
        </DrawerBody>
      </template>

      <template
        v-if="!isTabletOrGreater"
        #footer
      >
        <DrawerActions :url="urlForCopy" />
      </template>
    </ADrawer>
  </ClientOnly>
</template>
