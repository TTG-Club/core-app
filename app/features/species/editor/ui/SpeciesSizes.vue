<script setup lang="ts">
  import type { SpeciesCreate } from '../../model';

  import { isString } from 'es-toolkit';

  import { SelectSize } from '~ui/select';

  import { SPECIES_SIZES_EDITOR } from '../../model';

  type Sizes = SpeciesCreate['properties']['sizes'];

  const sizes = defineModel<Sizes>({
    default: () => [],
  });

  const disabledKeys = computed(() =>
    sizes.value.map((size) => size.type).filter((size) => isString(size)),
  );

  /** Заводит пустую строку размера в конце списка. */
  function addSize(): void {
    sizes.value = [
      ...sizes.value,
      {
        type: undefined,
        from: undefined,
        to: undefined,
      },
    ];
  }

  /**
   * Убирает строку размера.
   *
   * @param index номер строки в списке.
   */
  function removeSize(index: number): void {
    sizes.value = sizes.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="col-span-full flex flex-col gap-2">
    <p
      v-if="!sizes.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ SPECIES_SIZES_EDITOR.empty }}
    </p>

    <UForm
      v-for="(size, index) in sizes"
      :key="index"
      class="grid grid-cols-1 gap-4 md:grid-cols-24"
      attach
      :state="size"
    >
      <UFormField
        name="type"
        :label="SPECIES_SIZES_EDITOR.size"
        class="col-span-full md:col-span-6"
      >
        <SelectSize
          v-model="size.type"
          :disabled-keys="disabledKeys"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="SPECIES_SIZES_EDITOR.heightFrom"
        name="from"
      >
        <UFieldGroup>
          <UInputNumber
            v-model="size.from"
            :min="0"
            :placeholder="SPECIES_SIZES_EDITOR.heightFromPlaceholder"
          />

          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ SPECIES_SIZES_EDITOR.feet }}
          </UBadge>
        </UFieldGroup>
      </UFormField>

      <UFormField
        :label="SPECIES_SIZES_EDITOR.heightTo"
        name="to"
        class="col-span-full md:col-span-8"
      >
        <UFieldGroup>
          <UInputNumber
            v-model="size.to"
            :min="0"
            :placeholder="SPECIES_SIZES_EDITOR.heightToPlaceholder"
          />

          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ SPECIES_SIZES_EDITOR.feet }}
          </UBadge>
        </UFieldGroup>
      </UFormField>

      <div class="col-span-full flex items-end pb-1 md:col-span-2">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="SPECIES_SIZES_EDITOR.remove"
          @click.left.exact.prevent="removeSize(index)"
        />
      </div>
    </UForm>

    <UButton
      icon="tabler:plus"
      :label="SPECIES_SIZES_EDITOR.add"
      color="primary"
      variant="soft"
      block
      @click.left.exact.prevent="addSize"
    />
  </div>
</template>
