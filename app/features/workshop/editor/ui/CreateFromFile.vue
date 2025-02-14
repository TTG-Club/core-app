<script setup lang="ts" generic="T">
  import { SvgIcon } from '~/shared/ui';
  import type { ZodType } from 'zod';

  const props = defineProps<{
    schema: ZodType;
  }>();

  const emit = defineEmits<{
    (e: 'upload', v: unknown): void;
  }>();

  const { open, onChange } = useFileDialog({
    accept: 'application/json',
    multiple: false,
  });

  onChange(async (files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    const json = JSON.parse(await file.text());

    try {
      emit('upload', await props.schema.parseAsync(json));
    } catch (error) {
      console.error(error);
    }
  });
</script>

<template>
  <ATooltip title="Создать из .json файла">
    <AButton
      type="text"
      @click.left.exact.prevent="open({ reset: true })"
    >
      <template #icon>
        <SvgIcon icon="doc/add" />
      </template>

      <template #default> Создать из файла </template>
    </AButton>
  </ATooltip>
</template>
