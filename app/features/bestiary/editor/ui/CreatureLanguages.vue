<script setup lang="ts">
  import { isEqual } from 'lodash-es';

  import { SelectLanguage } from '~ui/select';

  import type { CreateLanguage, CreatureLanguages } from '~bestiary/types';

  const model = defineModel<CreatureLanguages>({ required: true });

  function add(index: number) {
    model.value.languages.splice(index + 1, 0, getEmpty());
  }

  function clear(index: number) {
    model.value.languages.splice(index, 1, getEmpty());
  }

  function remove(index: number) {
    model.value.languages.splice(index, 1);
  }

  function getEmpty(): CreateLanguage {
    return {
      language: undefined,
      text: undefined,
    };
  }

  watch(
    model,
    (value) => {
      if (value.languages.length > 0) {
        return;
      }

      model.value.languages.push(getEmpty());
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Языки"
      strong
    />
  </ADivider>

  <ARow
    v-for="(item, index) in model.languages"
    :key="index"
    :gutter="16"
  >
    <ACol :span="6">
      <AFormItem
        label="Язык"
        :name="['languages', 'languages', index, 'language']"
      >
        <SelectLanguage v-model="item.language" />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem
        label="Пояснение"
        :name="['languages', 'languages', index, 'text']"
      >
        <AInput
          v-model:value="item.text"
          :placeholder="`Например, только понимает или древний диалект`"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem label="Управление">
        <AFlex :gap="8">
          <AButton
            block
            @click.left.exact.prevent="add(index)"
          >
            Добавить
          </AButton>

          <AButton
            v-if="index === model.languages.length - 1"
            :disabled="isEqual(item, getEmpty())"
            danger
            block
            @click.left.exact.prevent="clear(index)"
          >
            Очистить
          </AButton>

          <AButton
            v-else
            danger
            block
            @click.left.exact.prevent="remove(index)"
          >
            Удалить
          </AButton>
        </AFlex>
      </AFormItem>
    </ACol>
  </ARow>

  <ARow :gutter="16">
    <ACol :span="12">
      <AFormItem
        label="Телепатия"
        :name="['languages', 'telepathy']"
      >
        <AInput
          v-model:value="model.telepathy"
          placeholder="Например, 60 футов"
        />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem
        label="Доп. описание"
        :name="['languages', 'text']"
      >
        <AInput
          v-model:value="model.text"
          placeholder="Например, понимает язык природы"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
