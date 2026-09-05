<script setup lang="ts">
  import type {
    Character,
    CharacterCustomBonus,
    FeatSpeedGrantNote,
    SpeedTypeKey,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    getEffectiveSpeed,
    getFeatSpeedGrantNotes,
    NEW_CUSTOM_BONUS,
    SHEET_SPEED_LABELS,
    SPEED_BONUS_MAX,
    SPEED_BONUS_MIN,
    SPEED_MODAL_ORDER,
    SPEED_TYPE_LABELS,
    SPEED_UNIT_OPTIONS,
    SPEED_UNIT_SHORT_LABELS,
    SPEED_VALUE_MAX,
    SPEED_VALUE_MIN,
    toManualSpeedBonuses,
    toStoredSpeed,
    withFeatSpeedBonuses,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /** Строка способа передвижения: всё, что рисуется рядом с его полем. */
  interface SpeedSettingsRow {
    key: SpeedTypeKey;
    label: string;

    /** Итог с прибавками черт, бонусами, предметами и истощением. */
    formattedTotal: string;

    /** Пояснения к скоростям, выданным чертами этому способу передвижения. */
    notes: FeatSpeedGrantNote[];

    /** Скорость отличается от своего значения: есть бонусы или выдача чертой. */
    isChanged: boolean;

    /** Рамка карточки: изменённый способ передвижения подсвечивается. */
    frameClass: string;
  }

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setSpeed } = useCharacterSheet();

  const draftSpeed = ref({
    ...character.value.speed,
    values: { ...character.value.speed.values },
  });

  // Строки от черт лежат в черновике наравне со своими — так их показывает
  // общий компонент бонусов, — а при записи отсеиваются: лист их не хранит, а
  // собирает от черт заново.
  const draftBonuses = ref<Record<SpeedTypeKey, CharacterCustomBonus[]>>(
    withFeatSpeedBonuses(
      character.value.settings.customSpeedBonuses,
      character.value.features,
      character.value.speed.unit,
    ),
  );

  const manualBonuses = computed(() =>
    toManualSpeedBonuses(draftBonuses.value),
  );

  // Скорости черновика чистятся тут же: очищенное поле ввода отдаёт не число, и
  // без чистки итог показал бы «NaN» прямо во время правки.
  const storedSpeed = computed(() => toStoredSpeed(draftSpeed.value));

  // Итоги считаются от черновика, а не от листа: числа в окне меняются сразу,
  // ещё до «Применить». Бонусы идут без строк от черт — прибавку черты лист
  // считает сам, и в записи она пошла бы в счёт дважды.
  const draftCharacter = computed<Character>(() => ({
    ...character.value,
    speed: storedSpeed.value,
    settings: {
      ...character.value.settings,
      customSpeedBonuses: manualBonuses.value,
    },
  }));

  const effectiveSpeed = computed(() =>
    getEffectiveSpeed(draftCharacter.value),
  );

  const grantNotes = computed(() =>
    getFeatSpeedGrantNotes(character.value.features, draftSpeed.value),
  );

  const speedRows = computed<SpeedSettingsRow[]>(() =>
    SPEED_MODAL_ORDER.map((key) => {
      const total = effectiveSpeed.value.values[key];

      const notes = grantNotes.value.filter((note) => note.key === key);

      const isChanged =
        total !== storedSpeed.value.values[key]
        || notes.length > 0
        || draftBonuses.value[key].length > 0;

      return {
        key,
        label: SPEED_TYPE_LABELS[key],
        formattedTotal: `${total} ${SPEED_UNIT_SHORT_LABELS[draftSpeed.value.unit]}`,
        notes,
        isChanged,
        frameClass: isChanged ? 'border-primary/40' : 'border-default/50',
      };
    }),
  );

  // Прибавка черты записана в футах, а показана в единицах листа, поэтому при
  // смене единиц строки от черт собираются заново: иначе «+5 фт» так и осталось
  // бы пятёркой после перехода в метры. Цикла нет — обработчик правит только
  // бонусы, а следит за единицами.
  watch(
    () => draftSpeed.value.unit,
    (unit) => {
      draftBonuses.value = withFeatSpeedBonuses(
        manualBonuses.value,
        character.value.features,
        unit,
      );
    },
  );

  /** Добавление бонуса способу передвижения: заготовка «+1» правится в строке. */
  function handleBonusAdd(key: SpeedTypeKey): void {
    draftBonuses.value = {
      ...draftBonuses.value,
      [key]: [
        ...draftBonuses.value[key],
        { ...NEW_CUSTOM_BONUS, id: crypto.randomUUID() },
      ],
    };
  }

  function handleApply() {
    setSpeed(draftSpeed.value, manualBonuses.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="SHEET_SPEED_LABELS.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <p class="text-xs text-dimmed">
          {{ SHEET_SPEED_LABELS.hint }}
        </p>

        <div
          v-for="row in speedRows"
          :key="row.key"
          class="flex flex-col gap-2 rounded-lg border bg-elevated/20 p-2 transition-colors"
          :class="row.frameClass"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="min-w-0 grow truncate text-sm text-toned">
              {{ row.label }}
            </span>

            <!-- Парение слева от поля: справа оно уводило бы поле полёта из
              общей колонки, и числа перестали бы стоять друг под другом -->
            <UCheckbox
              v-if="row.key === 'fly'"
              v-model="draftSpeed.hover"
              :label="SHEET_SPEED_LABELS.hover"
              class="shrink-0"
            />

            <UTooltip :text="SHEET_SPEED_LABELS.total">
              <span
                class="w-16 shrink-0 text-right text-sm font-bold text-highlighted tabular-nums"
              >
                {{ row.formattedTotal }}
              </span>
            </UTooltip>

            <UInputNumber
              v-model="draftSpeed.values[row.key]"
              :min="SPEED_VALUE_MIN"
              :max="SPEED_VALUE_MAX"
              class="w-32 shrink-0"
              :aria-label="`${SHEET_SPEED_LABELS.ownValue}: ${row.label}`"
            />

            <UTooltip :text="SHEET_SPEED_LABELS.addBonus">
              <UButton
                icon="tabler:plus"
                color="neutral"
                variant="subtle"
                size="xs"
                square
                class="shrink-0"
                :aria-label="`${SHEET_SPEED_LABELS.addBonus}: ${row.label}`"
                @click.left.exact.prevent="handleBonusAdd(row.key)"
              />
            </UTooltip>
          </div>

          <!-- Выданную чертой скорость строкой бонуса не показать: это само
            значение, а не прибавка к своему — поэтому она объяснена подписью -->
          <p
            v-for="note in row.notes"
            :key="note.id"
            class="text-xs text-dimmed"
          >
            {{ note.text }}
          </p>

          <!-- Строки бонусов — общий компонент настроек листа; без бонусов он
            не рендерится вовсе, а первый заводит плюс в шапке строки -->
          <SheetCustomBonusRows
            v-if="draftBonuses[row.key].length"
            v-model="draftBonuses[row.key]"
            :character="draftCharacter"
            :with-add="false"
            :min="SPEED_BONUS_MIN"
            :max="SPEED_BONUS_MAX"
            class="border-l-2 border-primary/40 pl-2"
          />
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ SHEET_SPEED_LABELS.unitTitle }}
          </span>

          <USelect
            v-model="draftSpeed.unit"
            :items="SPEED_UNIT_OPTIONS"
            class="w-40"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
