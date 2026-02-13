<script setup lang="ts">
  import { EditorArrayControls } from '~ui/editor';
  import { SelectLanguage } from '~ui/select';

  import type { CreateLanguage, CreatureLanguages } from '~bestiary/model';

  const model = defineModel<CreatureLanguages>({ required: true });

  function getEmpty(): CreateLanguage {
    return {
      language: undefined,
      text: undefined,
    };
  }
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Языки</h2>
    </template>

    <div class="grid gap-4">
      <UForm
        v-for="(item, index) in model.values"
        :key="index"
        class="col-span-full grid grid-cols-24 gap-4"
        attach
        :state="item"
      >
        <UFormField
          class="col-span-6"
          label="Язык"
          name="language"
        >
          <SelectLanguage v-model="item.language" />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Пояснение"
          name="text"
        >
          <UInput
            v-model="item.text"
            placeholder="Например, только понимает или древний диалект"
          />
        </UFormField>

        <EditorArrayControls
          v-model="model.values"
          :empty-object="getEmpty()"
          :index
          :item
          only-remove
        />
      </UForm>

      <div
        v-if="!model.values?.length"
        class="col-span-full flex justify-center"
      >
        <UButton @click.left.exact.prevent="model.values.push(getEmpty())">
          Добавить первый
        </UButton>
      </div>

      <UForm
        class="col-span-full grid grid-cols-24 gap-4"
        attach
        :state="model"
      >
        <UFormField
          class="col-span-6"
          label="Телепатия"
          name="telepathy"
        >
          <UInput
            v-model="model.telepathy"
            placeholder="Например, 60 футов"
          />
        </UFormField>

        <UFormField
          class="col-span-18"
          label="Доп. описание"
          name="text"
        >
          <UInput
            v-model="model.text"
            placeholder="Например, понимает язык природы"
          />
        </UFormField>
      </UForm>
    </div>
  </UCard>
</template>
