<script setup lang="ts">
  import type { SpeciesCreate } from '~species/model';

  import { SPECIES_INNATE_SPELL_EDITOR } from '~species/model';
  import { EditorArrayControls } from '~ui/editor';
  import { SelectSpell } from '~ui/select';

  type InnateSpells = SpeciesCreate['innateSpells'];

  const innateSpells = defineModel<InnateSpells>({ default: () => [] });

  const selectedSpellUrls = computed(() =>
    innateSpells.value.map((innateSpell) => innateSpell.spell).filter(Boolean),
  );

  /** Создаёт пустую строку врождённого заклинания первого уровня. */
  function getEmptyInnateSpell(): InnateSpells[number] {
    return {
      spell: '',
      requiredLevel: SPECIES_INNATE_SPELL_EDITOR.defaultCharacterLevel,
    };
  }

  /** Добавляет новую строку выбора врождённого заклинания. */
  function addInnateSpell(): void {
    innateSpells.value = [...innateSpells.value, getEmptyInnateSpell()];
  }

  /** Возвращает уже выбранные URL, кроме значения редактируемой строки. */
  function getExcludedSpellUrls(currentSpellUrl: string): string[] {
    return selectedSpellUrls.value.filter(
      (spellUrl) => spellUrl !== currentSpellUrl,
    );
  }
</script>

<template>
  <USeparator class="col-span-full">
    <span class="font-bold text-secondary">
      {{ SPECIES_INNATE_SPELL_EDITOR.title }}
    </span>
  </USeparator>

  <p class="col-span-full text-sm text-muted">
    {{ SPECIES_INNATE_SPELL_EDITOR.description }}
  </p>

  <div
    v-for="(innateSpell, spellIndex) in innateSpells"
    :key="spellIndex"
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
  >
    <UFormField
      class="col-span-full md:col-span-15"
      :label="SPECIES_INNATE_SPELL_EDITOR.spellLabel"
      :name="`innateSpells.${spellIndex}.spell`"
      required
    >
      <SelectSpell
        v-model="innateSpell.spell"
        :exclude-urls="getExcludedSpellUrls(innateSpell.spell)"
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-5"
      :label="SPECIES_INNATE_SPELL_EDITOR.characterLevelLabel"
      :name="`innateSpells.${spellIndex}.requiredLevel`"
      required
    >
      <UInputNumber
        v-model="innateSpell.requiredLevel"
        :min="SPECIES_INNATE_SPELL_EDITOR.minimumCharacterLevel"
        :max="SPECIES_INNATE_SPELL_EDITOR.maximumCharacterLevel"
      />
    </UFormField>

    <EditorArrayControls
      v-model="innateSpells"
      :item="innateSpell"
      :empty-object="getEmptyInnateSpell()"
      :index="spellIndex"
      cols="4"
      only-remove
    />
  </div>

  <div class="col-span-full flex justify-center">
    <UButton
      icon="tabler:plus"
      color="neutral"
      variant="soft"
      @click.left.exact.prevent="addInnateSpell"
    >
      {{ SPECIES_INNATE_SPELL_EDITOR.addLabel }}
    </UButton>
  </div>
</template>
