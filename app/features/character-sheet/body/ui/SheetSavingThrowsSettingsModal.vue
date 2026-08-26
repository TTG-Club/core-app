<script setup lang="ts">
  import type {
    Character,
    CharacterCustomBonus,
    CharacterSavingThrow,
  } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_OPTIONS,
    getSavingThrowValue,
    isChangedSavingThrow,
    NEW_CUSTOM_BONUS,
    SAVING_THROW_PROFICIENCY_ICONS,
    SAVING_THROW_PROFICIENCY_LABELS,
    SHEET_SAVING_THROW_SETTINGS_LABELS,
    toDefaultSavingThrow,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /** Строка спасброска в модалке: черновик записи и всё, что рисуется рядом. */
  interface SavingThrowSettingsRow {
    /** Запись черновика: её правят поля строки. */
    savingThrow: CharacterSavingThrow;

    /** Название спасброска целиком («Сила»), а не сокращение блока листа. */
    label: string;

    /** Значок владения: он же его и переключает. */
    proficiencyIcon: string;
    proficiencyLabel: string;
    proficiencyClass: string;

    /** Итог спасброска по черновику. */
    formattedValue: string;

    /** Спасбросок отличается от правил: характеристика подменена или есть бонусы. */
    isChanged: boolean;

    /** Рамка карточки: изменённый спасбросок подсвечивается. */
    frameClass: string;
  }

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setSavingThrows } = useCharacterSheet();

  // Черновик правится до «Применить»: копируются и сами записи, и списки их
  // бонусов — иначе правки уходили бы в лист мимо кнопки.
  const draftSavingThrows = ref<CharacterSavingThrow[]>(
    character.value.savingThrows.map((savingThrow) => ({
      ...savingThrow,
      bonuses: savingThrow.bonuses.map((bonus) => ({ ...bonus })),
    })),
  );

  const draftCommonBonuses = ref<CharacterCustomBonus[]>(
    character.value.commonSavingThrowBonuses.map((bonus) => ({ ...bonus })),
  );

  // Итоги считаются от черновика, а не от листа: числа в модалке меняются
  // сразу, ещё до «Применить».
  const draftCharacter = computed<Character>(() => ({
    ...character.value,
    savingThrows: draftSavingThrows.value,
    commonSavingThrowBonuses: draftCommonBonuses.value,
  }));

  const displayRows = computed<SavingThrowSettingsRow[]>(() =>
    draftSavingThrows.value.map((savingThrow) => {
      const isChanged = isChangedSavingThrow(savingThrow);

      return {
        savingThrow,
        label: ABILITY_LABELS[savingThrow.key],
        proficiencyIcon: savingThrow.proficient
          ? SAVING_THROW_PROFICIENCY_ICONS.proficient
          : SAVING_THROW_PROFICIENCY_ICONS.none,
        proficiencyLabel: savingThrow.proficient
          ? SAVING_THROW_PROFICIENCY_LABELS.proficient
          : SAVING_THROW_PROFICIENCY_LABELS.none,
        proficiencyClass: savingThrow.proficient
          ? 'text-primary'
          : 'text-muted',
        formattedValue: getFormattedBonus(
          getSavingThrowValue(draftCharacter.value, savingThrow),
        ),
        isChanged,
        frameClass: isChanged ? 'border-primary/40' : 'border-default/50',
      };
    }),
  );

  /** Переключение владения спасброском — как кружком в блоке спасбросков. */
  function handleProficiencyToggle(savingThrow: CharacterSavingThrow): void {
    savingThrow.proficient = !savingThrow.proficient;
  }

  /**
   * Возврат спасброска к правилам: своя характеристика и без своих бонусов.
   * Владение остаётся — его даёт класс, а не подсчёт.
   */
  function handleSavingThrowReset(savingThrow: CharacterSavingThrow): void {
    draftSavingThrows.value = draftSavingThrows.value.map((draft) =>
      draft.key === savingThrow.key ? toDefaultSavingThrow(draft) : draft,
    );
  }

  /** Добавление бонуса спасброску: заготовка «+1» правится тут же в строке. */
  function handleBonusAdd(savingThrow: CharacterSavingThrow): void {
    savingThrow.bonuses.push({ id: crypto.randomUUID(), ...NEW_CUSTOM_BONUS });
  }

  function handleApply(): void {
    setSavingThrows(draftSavingThrows.value, draftCommonBonuses.value);
    emit('close');
  }

  /** Закрытие без правок: черновик пропадает вместе с окном. */
  function handleCancel(): void {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="SHEET_SAVING_THROW_SETTINGS_LABELS.title"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <p class="text-xs text-dimmed">
          {{ SHEET_SAVING_THROW_SETTINGS_LABELS.hint }}
        </p>

        <!-- Общие бонусы разделом, а не карточкой: своя пунктирная рамка спорила
          бы с пунктиром кнопки «Добавить бонус» внутри него, а от строк
          спасбросков раздел отбивает разделитель -->
        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_SAVING_THROW_SETTINGS_LABELS.commonTitle }}
          </span>

          <SheetCustomBonusRows
            v-model="draftCommonBonuses"
            :character="draftCharacter"
          />

          <p class="text-xs text-dimmed">
            {{ SHEET_SAVING_THROW_SETTINGS_LABELS.commonHint }}
          </p>
        </div>

        <USeparator />

        <div
          v-for="row in displayRows"
          :key="row.savingThrow.key"
          class="flex flex-col gap-2 rounded-lg border bg-elevated/20 p-2 transition-colors"
          :class="row.frameClass"
        >
          <div class="flex flex-wrap items-center gap-2">
            <UTooltip
              :text="row.proficiencyLabel"
              :content="{ side: 'top' }"
            >
              <button
                type="button"
                class="flex shrink-0 cursor-pointer items-center"
                :aria-label="`${SHEET_SAVING_THROW_SETTINGS_LABELS.proficiency}: ${row.label}`"
                @click.left.exact.prevent="
                  handleProficiencyToggle(row.savingThrow)
                "
              >
                <UIcon
                  :name="row.proficiencyIcon"
                  class="size-4 shrink-0 transition-colors hover:text-primary"
                  :class="row.proficiencyClass"
                />
              </button>
            </UTooltip>

            <span class="min-w-0 grow truncate text-sm text-toned">
              {{ row.label }}
            </span>

            <span
              class="w-8 shrink-0 text-right text-sm font-bold text-highlighted tabular-nums"
            >
              {{ row.formattedValue }}
            </span>

            <!-- Отдельная группа: на узкой модалке она переносится под
              название целой строкой, а не рассыпается по краям -->
            <div class="flex w-full items-center gap-2 sm:w-auto">
              <USelect
                v-model="row.savingThrow.ability"
                :items="ABILITY_OPTIONS"
                size="sm"
                class="min-w-0 grow sm:w-40 sm:grow-0"
                :aria-label="`${SHEET_SAVING_THROW_SETTINGS_LABELS.abilityPlaceholder}: ${row.label}`"
              />

              <UTooltip
                :text="SHEET_SAVING_THROW_SETTINGS_LABELS.resetSavingThrow"
              >
                <UButton
                  icon="tabler:rotate"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  :disabled="!row.isChanged"
                  :aria-label="`${SHEET_SAVING_THROW_SETTINGS_LABELS.resetSavingThrow}: ${row.label}`"
                  @click.left.exact.prevent="
                    handleSavingThrowReset(row.savingThrow)
                  "
                />
              </UTooltip>

              <UTooltip :text="SHEET_SAVING_THROW_SETTINGS_LABELS.addBonus">
                <UButton
                  icon="tabler:plus"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  square
                  :aria-label="`${SHEET_SAVING_THROW_SETTINGS_LABELS.addBonus}: ${row.label}`"
                  @click.left.exact.prevent="handleBonusAdd(row.savingThrow)"
                />
              </UTooltip>
            </div>
          </div>

          <!-- Строки бонусов — общий компонент настроек листа; у спасброска без
            своих бонусов он не рендерится вовсе, а первый бонус заводит плюс в
            шапке строки: своя кнопка «Добавить» в каждой из шести строк только
            шумела бы -->
          <SheetCustomBonusRows
            v-if="row.savingThrow.bonuses.length"
            v-model="row.savingThrow.bonuses"
            :character="draftCharacter"
            :with-add="false"
            class="border-l-2 border-primary/40 pl-2"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
