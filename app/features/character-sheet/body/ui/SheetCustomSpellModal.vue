<script setup lang="ts">
  import type { CustomSpellDraft, CustomSpellFieldKey } from '../../model';

  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import {
    CUSTOM_SPELL_FIELDS,
    getSpellLevelLabel,
    parseStoredMarkupNodes,
    SPELL_LEVELS,
    SPELL_SCHOOL_OPTIONS,
  } from '../../model';

  // URL редактируемого заклинания; null — форма создаёт новое. Само заклинание
  // модалка достаёт из состояния листа (как `SheetFeatureEditModal`).
  const { spellUrl = null } = defineProps<{
    spellUrl?: string | null;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, addCustomSpell, updateCustomSpell } = useCharacterSheet();

  // Круги для селекта: подписи те же, что у разделителей списка заклинаний.
  const levelOptions = SPELL_LEVELS.map((level) => ({
    label: getSpellLevelLabel(level),
    value: level,
  }));

  // Снимок редактируемого заклинания на момент открытия: модалка размонтируется
  // при закрытии, поэтому setup выполняется заново на каждое открытие — снимок
  // всегда свежий, а реактивность здесь не нужна (правки применяются по кнопке).
  const editedSpell = spellUrl
    ? (character.value.spells.find((spell) => spell.url === spellUrl) ?? null)
    : null;

  const draftName = ref(editedSpell?.name ?? '');

  const draftLevel = ref(editedSpell?.level ?? 0);

  // undefined вместо '' — пустая строка в качестве значения селекта запрещена,
  // а незаполненная школа должна показывать подсказку поля.
  const draftSchool = ref<string | undefined>(editedSpell?.school || undefined);

  const draftFields = ref<Record<CustomSpellFieldKey, string>>({
    castingTime: editedSpell?.castingTime ?? '',
    range: editedSpell?.range ?? '',
    components: editedSpell?.components ?? '',
    duration: editedSpell?.duration ?? '',
  });

  const draftConcentration = ref(editedSpell?.concentration ?? false);

  const draftRitual = ref(editedSpell?.ritual ?? false);

  // Описание сидируем хранимой формой (JSON-массив узлов) — редактор развернёт
  // её в исходник через `toMarkupSource`. Пустое описание — пустой редактор.
  const draftDescription = ref(
    editedSpell?.description?.length
      ? JSON.stringify(editedSpell.description)
      : '',
  );

  // Режим модалки задаётся при открытии и больше не меняется — реактивность
  // заголовку и подписи кнопки не нужна.
  const isEditing = Boolean(editedSpell);

  const modalTitle = isEditing
    ? 'Редактирование заклинания'
    : 'Своё заклинание';

  const applyLabel = isEditing ? 'Сохранить' : 'Добавить';

  const isApplyDisabled = computed(() => !draftName.value.trim());

  /**
   * Значения формы для экшена листа: обрезкой и разбором разметки занимается
   * модель, форма отдаёт введённое как есть.
   *
   * @returns черновик своего заклинания.
   */
  function getDraft(): CustomSpellDraft {
    return {
      name: draftName.value,
      level: draftLevel.value,
      school: draftSchool.value ?? '',
      castingTime: draftFields.value.castingTime,
      range: draftFields.value.range,
      components: draftFields.value.components,
      duration: draftFields.value.duration,
      concentration: draftConcentration.value,
      ritual: draftRitual.value,
      description: parseStoredMarkupNodes(draftDescription.value),
    };
  }

  function handleApply() {
    if (isApplyDisabled.value) {
      return;
    }

    if (editedSpell) {
      updateCustomSpell(editedSpell.url, getDraft());
    } else {
      addCustomSpell(getDraft());
    }

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="modalTitle"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <!-- Круг уезжает на вторую строку, пока форма узкая: рядом с ним
          названию заклинания остаётся слишком мало места -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_10rem]">
          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Название
            </span>

            <UInput
              v-model="draftName"
              placeholder="Название заклинания"
            />
          </div>

          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Круг
            </span>

            <USelect
              v-model="draftLevel"
              :items="levelOptions"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex min-w-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              Школа магии
            </span>

            <USelect
              v-model="draftSchool"
              :items="SPELL_SCHOOL_OPTIONS"
              placeholder="Не выбрана"
            />
          </div>

          <div
            v-for="field in CUSTOM_SPELL_FIELDS"
            :key="field.key"
            class="flex min-w-0 flex-col gap-1"
          >
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ field.label }}
            </span>

            <UInput
              v-model="draftFields[field.key]"
              :placeholder="field.placeholder"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <UCheckbox
            v-model="draftConcentration"
            label="Концентрация"
          />

          <UCheckbox
            v-model="draftRitual"
            label="Ритуал"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            Описание
          </span>

          <MarkupEditor
            v-model="draftDescription"
            placeholder="Опиши заклинание"
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
          :label="applyLabel"
          color="primary"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
