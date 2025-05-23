<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { CreatureLanguages } from '~bestiary/types';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<CreatureLanguages>({ required: true });

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-languages',
    () => Dictionaries.languages(),
  );

  // Обновление списка языков по выбору из селектора
  function handleSelect(val: SelectValue) {
    if (!Array.isArray(val)) return;

    const newLanguages = val.map((v) => ({
      language: typeof v === 'string' ? v : (v as any).value,
      text: '',
    }));

    model.value = {
      ...model.value,
      languages: newLanguages,
    };
  }

  // Обновление кастомного текста языка
  function updateText(language: string, text: string | undefined) {
    const lang = model.value.languages.find((l) => l.language === language);

    if (lang) {
      lang.text = text;
    }
  }

  const selectedLanguages = computed(
    () =>
      model.value.languages.map((l) => l.language).filter(Boolean) as string[],
  );

  watch(model, () => {
    context.onFieldChange();
  });
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="24">
      <AFormItem label="Языки">
        <ASelect
          :value="selectedLanguages"
          mode="multiple"
          :loading="status === 'pending'"
          :options="data || []"
          :disabled="disabled"
          placeholder="Выбери языки"
          show-search
          allow-clear
          @update:value="handleSelect"
          @dropdown-visible-change="(open) => open && refresh()"
        />
      </AFormItem>
    </ACol>

    <ACol
      v-for="lang in model.languages"
      :key="lang.language"
      :span="12"
    >
      <AFormItem :label="`Пояснение к «${lang.language}»`">
        <AInput
          v-model:value="lang.text"
          :placeholder="`Например, только понимает или древний диалект`"
          :disabled="disabled"
          @update:value="(val) => updateText(lang.language!, val)"
        />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem label="Телепатия">
        <AInput
          v-model:value="model.telepathy"
          :disabled="disabled"
          placeholder="Например, 60 футов"
        />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem label="Доп. описание">
        <AInput
          v-model:value="model.text"
          :disabled="disabled"
          placeholder="Например, понимает язык природы"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
