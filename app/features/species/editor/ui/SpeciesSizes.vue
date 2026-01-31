<script setup lang="ts">
  import { isString } from 'es-toolkit';
  import { EditorArrayControls } from '~ui/editor';
  import { SelectSize } from '~ui/select';

  import type { SpeciesCreate } from '~/shared/types';

  type Sizes = SpeciesCreate['properties']['sizes'];

  const sizes = defineModel<Sizes>({
    default: () => [],
  });

  const disabledKeys = computed(() =>
    sizes.value.map((size) => size.type).filter((size) => isString(size)),
  );

  function getEmpty(): Sizes[number] {
    return {
      type: undefined,
      from: undefined,
      to: undefined,
    };
  }

  watch(
    sizes,
    (value) => {
      if (!value.length) {
        sizes.value.push(getEmpty());
      }
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <UForm
    v-for="(size, index) in sizes"
    :key="index"
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="size"
  >
    <UFormField
      name="type"
      label="Размер"
      class="col-span-6"
    >
      <SelectSize
        v-model="size.type"
        :disabled-keys="disabledKeys"
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Высота от"
      name="from"
    >
      <UFieldGroup>
        <UInputNumber
          v-model="size.from"
          :min="0"
          placeholder="Введи минимальную высоту"
        />

        <UBadge
          color="neutral"
          variant="subtle"
        >
          фт.
        </UBadge>
      </UFieldGroup>
    </UFormField>

    <UFormField
      label="Высота до"
      name="to"
      class="col-span-6"
    >
      <UFieldGroup>
        <UInputNumber
          v-model="size.to"
          :min="0"
          placeholder="Введи максимальную высоту"
        />

        <UBadge
          color="neutral"
          variant="subtle"
        >
          фт.
        </UBadge>
      </UFieldGroup>
    </UFormField>

    <EditorArrayControls
      v-model="sizes"
      :item="size"
      :empty-object="getEmpty()"
      :index="index"
    />
  </UForm>
</template>
