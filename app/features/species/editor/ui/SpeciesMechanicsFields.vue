<script setup lang="ts">
  import type { FeatEditorRows } from '~feats/model';

  import { FeatGrantRows, FeatModifierRows } from '~feats/editor/ui';
  import { createFeatEditorRows } from '~feats/model';

  import { SPECIES_MECHANICS_EDITOR } from '../../model';

  /**
   * Механика влияния на лист персонажа — строками редактора черт.
   *
   * Компоненты и модель строк берутся у черт целиком, а не пишутся заново: в
   * core-api механика лежит в общем пакете (`common/model/mechanics`), лист
   * применяет её одинаково, и своя форма для вида означала бы вторую редакцию
   * тех же полей, которая расходится с первой при каждой правке.
   *
   * Блок стоит и у самой записи вида, и у каждого её умения — модель одна.
   * Строк заклинаний, ресурсов и предусловия здесь нет: заклинания вида живут в
   * `innateSpells` со своими уровнями, а ресурсов и предусловий у вида не бывает.
   */
  const model = defineModel<FeatEditorRows | undefined>({ required: true });

  /**
   * Строки с подстановкой пустых: в типе формы они необязательны — перед
   * отправкой их выбрасывают из тела запроса, — а компонентам нужен объект.
   */
  const rows = computed({
    get: () => model.value ?? createFeatEditorRows(),
    set: (value) => {
      model.value = value;
    },
  });
</script>

<template>
  <div class="col-span-full flex flex-col gap-4">
    <p class="text-sm text-muted">
      {{ SPECIES_MECHANICS_EDITOR.hint }}
    </p>

    <FeatGrantRows
      v-model="rows.grants"
      :rows
    />

    <FeatModifierRows v-model="rows.modifiers" />
  </div>
</template>
