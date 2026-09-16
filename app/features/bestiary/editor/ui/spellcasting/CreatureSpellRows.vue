<script setup lang="ts">
  import type { CreatureSpellRef } from '../../../model';

  import { useFeatRefDirectory } from '~feats/composable';
  import { getFeatSpellLevelLabel } from '~feats/model';
  import { SelectSpell } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import { createEmptyCreatureSpellRef } from '../../../model';
  import {
    CREATURE_SPELL_CAST_LEVEL_MAX,
    CREATURE_SPELL_CAST_LEVEL_MIN,
    CREATURE_SPELLCASTING_EDITOR,
  } from '../../constants';

  /**
   * Заклинания группы: строки с оговорками статблока и выбор новых из
   * справочника сайта.
   *
   * Строка своя, а не общая с чертой (`FeatEntityRefRows`): там строка — одна
   * нераскладываемая линия со ссылкой и бейджами, а здесь у каждого заклинания
   * два своих поля — круг, которым его накладывает существо, и оговорка вроде
   * «только на себя». Раскладывать общую строку пришлось бы во всех формах
   * черты, класса, вида и предыстории разом.
   */
  const model = defineModel<Array<CreatureSpellRef>>({ required: true });

  /** Слаги строк: по ним справочник догружает названия, круги и источники. */
  const urls = computed<Array<string>>(() =>
    model.value.flatMap((spell) => (spell.url ? [spell.url] : [])),
  );

  const { getEntry } = useFeatRefDirectory('SPELL', urls);

  /**
   * Значение поля выбора. Всегда пустое: выбранное сразу уходит строками, и
   * чипы поля дублировали бы их.
   */
  const pickedUrls = ref<Array<string>>([]);

  /**
   * Строки списка: заклинание и подписи, собранные из справочника. Вычисляемым
   * списком, а не вызовами в шаблоне — иначе каждая подпись считалась бы
   * заново на каждой перерисовке строки.
   */
  const rows = computed(() =>
    model.value.map((spell) => {
      const entry = spell.url ? getEntry(spell.url) : undefined;

      // Круг самой записи бейджем, а не подсказкой поля: у заговора он ноль,
      // и в числовом поле «0» читался бы как заданный круг. Бейдж отвечает на
      // вопрос «каким кругом заклинание пойдёт, пока своего не задано»
      const level = entry?.level;

      return {
        spell,
        title: entry?.name ?? spell.name ?? spell.url ?? '',
        route: entry?.route,
        source: entry?.source,
        isMissing: !entry,
        levelLabel: level === undefined ? '' : getFeatSpellLevelLabel(level),
      };
    }),
  );

  /** Сбрасывает выбор поля: строки списка ведёт событие `select`. */
  function resetPickedUrls(): void {
    pickedUrls.value = [];
  }

  /**
   * Дописывает выбранные заклинания строками. Уже перечисленные пропускаются:
   * повтор в группе ничего не меняет.
   *
   * Снимок названия берётся из события выбора, а не из справочника: заклинания
   * догружаются по одному, и у только что выбранного записи в справочнике ещё
   * нет — снимок вышел бы пустым, а имя в JSONB бэкенд не подставляет.
   *
   * @param refs - выбранные карточки со снимком названия
   */
  function addSpells(refs: Array<{ url: string; name: string }>): void {
    const added = refs.filter(
      (reference) => !urls.value.includes(reference.url),
    );

    if (!added.length) {
      return;
    }

    model.value = [
      ...model.value,
      ...added.map((reference) => ({
        ...createEmptyCreatureSpellRef(),
        url: reference.url,
        name: reference.name,
      })),
    ];
  }

  /**
   * Убирает заклинание из группы.
   *
   * @param index - позиция строки в списке
   */
  function removeSpell(index: number): void {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <p
      v-if="!rows.length"
      class="text-sm text-dimmed italic"
    >
      {{ CREATURE_SPELLCASTING_EDITOR.spellsEmpty }}
    </p>

    <div
      v-for="(row, index) in rows"
      :key="row.spell.url ?? index"
      class="flex flex-col gap-2 rounded-lg border border-default bg-elevated/40 p-2 transition-colors focus-within:border-primary/60"
    >
      <div class="flex items-center gap-2">
        <ULink
          v-if="row.route"
          :to="row.route"
          target="_blank"
          class="min-w-0 flex-1 truncate text-sm text-primary"
          :title="CREATURE_SPELLCASTING_EDITOR.spellOpen"
        >
          {{ row.title }}
        </ULink>

        <span
          v-else
          class="min-w-0 flex-1 truncate text-sm"
        >
          {{ row.title }}
        </span>

        <UBadge
          v-if="row.levelLabel"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0"
        >
          {{ row.levelLabel }}
        </UBadge>

        <UBadge
          v-if="row.isMissing"
          color="warning"
          variant="subtle"
          size="sm"
          icon="tabler:alert-triangle"
          class="shrink-0"
          :title="CREATURE_SPELLCASTING_EDITOR.spellMissingHint"
        >
          {{ CREATURE_SPELLCASTING_EDITOR.spellMissing }}
        </UBadge>

        <!-- Источник прячется на телефоне: там ширины хватает либо ему, либо
          названию заклинания, а название важнее -->
        <UBadge
          v-else-if="row.source"
          color="success"
          variant="subtle"
          size="sm"
          icon="tabler:book"
          class="hidden shrink-0 sm:inline-flex"
        >
          {{ row.source }}
        </UBadge>

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          class="shrink-0"
          :aria-label="CREATURE_SPELLCASTING_EDITOR.spellRemove"
          @click.left.exact.prevent="removeSpell(index)"
        />
      </div>

      <div class="flex flex-wrap items-end gap-2">
        <UFormField class="w-28">
          <template #label>
            <InfoTooltip
              :text="CREATURE_SPELLCASTING_EDITOR.spellCastLevelHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ CREATURE_SPELLCASTING_EDITOR.spellCastLevel }}</span>
            </InfoTooltip>
          </template>

          <UInputNumber
            v-model="row.spell.castLevel"
            :min="CREATURE_SPELL_CAST_LEVEL_MIN"
            :max="CREATURE_SPELL_CAST_LEVEL_MAX"
            :aria-label="CREATURE_SPELLCASTING_EDITOR.spellCastLevel"
          />
        </UFormField>

        <UFormField
          class="min-w-40 flex-1"
          :label="CREATURE_SPELLCASTING_EDITOR.spellNote"
        >
          <UInput
            v-model="row.spell.note"
            :placeholder="CREATURE_SPELLCASTING_EDITOR.spellNotePlaceholder"
          />
        </UFormField>
      </div>
    </div>

    <SelectSpell
      :model-value="pickedUrls"
      :exclude-urls="urls"
      multiple
      @update:model-value="resetPickedUrls"
      @select="addSpells"
    />
  </div>
</template>
