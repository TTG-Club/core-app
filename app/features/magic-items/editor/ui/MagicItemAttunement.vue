<script setup lang="ts">
  import type { Attunement } from '~magic-items/types';

  const attunement = defineModel<Attunement | undefined>({
    required: true,
  });

  function updateAttunement(value: boolean) {
    if (!value) {
      attunement.value = undefined;

      return;
    }

    attunement.value = getEmptyAttunement();
  }

  function getEmptyAttunement(): Attunement {
    return {
      description: undefined,
      requires: false,
    };
  }
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Требуется настройка"
        :name="['attunement', 'requires']"
      >
        <ACheckbox
          v-model="attunement"
          :checked="!!attunement"
          @update:checked="updateAttunement"
        >
          Требуется
        </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol
      v-if="attunement"
      :span="20"
    >
      <AFormItem
        label="Особенности настройки"
        :name="['attunement', 'description']"
      >
        <ATextarea
          v-model:value="attunement.description"
          :auto-size="{ minRows: 1, maxRows: 8 }"
          placeholder="Введи особенности настройки (если есть)"
          allow-clear
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
