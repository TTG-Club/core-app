<script setup lang="ts">
  import type { CreateAction } from '~bestiary/model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectRecharge } from '~ui/select';

  import {
    CREATURE_ACTION_LABELS,
    CREATURE_ACTION_SECTIONS,
    CREATURE_FORMULA_ERROR,
    CREATURE_FORMULA_FORBIDDEN_TOKENS,
  } from '../../constants';
  import CreatureActionCombat from './CreatureActionCombat.vue';

  defineProps<{
    /**
     * Путь записи в состоянии формы существа, например `actions.0`. По нему
     * вложенная форма берёт свой кусок состояния у родителя — только с ним
     * родительское сохранение прогоняет схему записи.
     */
    path: string;
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  const model = defineModel<CreateAction>({ required: true });

  /**
   * Схема записи: формулы существа не знают @-токенов листа персонажа.
   *
   * Проверка стоит на списке частей, а не на каждой формуле: путь ошибки
   * `effect.damageParts` совпадает с именем поля вокруг списка, и сообщение
   * встаёт прямо под ним. Имена полей внутри записи считаются от пути записи.
   */
  const schema = z.object({
    effect: z.object({
      damageParts: z
        .array(z.object({ formula: z.string() }))
        .refine(
          (parts) =>
            parts.every(
              (part) => !CREATURE_FORMULA_FORBIDDEN_TOKENS.test(part.formula),
            ),
          { message: CREATURE_FORMULA_ERROR },
        ),
    }),
  });
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    nested
    :name="path"
    :schema
  >
    <UFormField
      class="col-span-full md:col-span-8"
      :label="CREATURE_ACTION_LABELS.nameRus"
      name="name.rus"
    >
      <UInput
        v-model="model.name.rus"
        :placeholder="CREATURE_ACTION_LABELS.nameRusPlaceholder"
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-8"
      :label="CREATURE_ACTION_LABELS.nameEng"
      name="name.eng"
    >
      <UInput
        v-model="model.name.eng"
        :placeholder="CREATURE_ACTION_LABELS.nameEngPlaceholder"
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-6"
      :label="CREATURE_ACTION_LABELS.recharge"
      name="recharge"
    >
      <SelectRecharge v-model="model.recharge" />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-2"
      :label="CREATURE_ACTION_LABELS.controls"
    >
      <UButton
        icon="tabler:trash"
        color="error"
        variant="soft"
        :aria-label="CREATURE_ACTION_LABELS.remove"
        @click.left.exact.prevent="emit('remove')"
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      :label="CREATURE_ACTION_LABELS.description"
      name="description"
      :ui="{ root: 'w-full', container: 'w-full' }"
    >
      <MarkupEditor
        v-model="model.description"
        :placeholder="CREATURE_ACTION_LABELS.descriptionPlaceholder"
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      name="effect.damageParts"
      :ui="{ root: 'w-full', container: 'w-full' }"
    >
      <CreatureActionCombat
        v-model="model.effect"
        field-name-prefix="effect"
      />
    </UFormField>

    <ActiveEffects
      v-model="model.effect.activeEffects"
      nested
      default-target="target"
      :origin="EFFECT_ORIGIN.feature"
      :title="CREATURE_ACTION_SECTIONS.effects"
    />
  </UForm>
</template>
