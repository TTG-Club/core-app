<script setup lang="ts">
  import type {
    PersonalityFieldKey,
    PersonalityTextFieldKey,
  } from '../../model';

  import { DictionaryService } from '~/shared/api';
  import { SelectAlignment } from '~ui/select';

  import { useCharacterSheet } from '../../composables';
  import {
    PERSONALITY_FIELD_MAX_LENGTH,
    PERSONALITY_TEXT_FIELDS,
    SHEET_PERSONALITY_LABELS,
  } from '../../model';

  // Поле, с которого начали правку (нажатием по плитке); null — карандаш на
  // рамке: тогда курсор никуда не ставится.
  const { field } = defineProps<{
    field: PersonalityFieldKey | null;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setPersonality } = useCharacterSheet();

  // Тот же ключ, что и внутри SelectAlignment: запрос словаря не дублируется,
  // а список нужен здесь для соответствия значение ↔ русская подпись — лист
  // хранит подпись, а выбор работает со значением словаря.
  const { data: alignmentOptions } = await useAsyncData(
    'dictionaries-alignments',
    () => DictionaryService.alignments(),
    { dedupe: 'defer' },
  );

  // Снимок личности на момент открытия: модалка размонтируется при закрытии,
  // поэтому setup выполняется заново на каждое открытие. Правки применяются по
  // кнопке, поэтому реактивная связь с листом здесь не нужна.
  const personality = character.value.personality;

  const matchedAlignment = alignmentOptions.value?.find(
    (option) => option.label === personality.alignment,
  );

  const draftAlignment = ref<string | undefined>(matchedAlignment?.value);

  /**
   * Записанное мировоззрение, которого в словаре нет: так приходит импорт
   * чужого листа (LSS хранит мировоззрение свободным текстом) и так выглядит
   * лист, когда словарь не ответил. Выбор такое значение не представляет,
   * поэтому держим его отдельно — иначе «Применить» стёрло бы мировоззрение,
   * которого игрок даже не трогал.
   */
  const unknownAlignment = ref(matchedAlignment ? '' : personality.alignment);

  /** Подсказка под выбором: что записано сейчас, если словарь этого не знает. */
  const alignmentHelp = computed(() =>
    !draftAlignment.value && unknownAlignment.value
      ? `${SHEET_PERSONALITY_LABELS.alignmentUnknown} ${unknownAlignment.value}`
      : undefined,
  );

  const draftFields = ref<Record<PersonalityTextFieldKey, string>>({
    age: personality.age,
    height: personality.height,
    weight: personality.weight,
    eyes: personality.eyes,
    hair: personality.hair,
    skin: personality.skin,
  });

  function handleApply() {
    const selectedAlignment = alignmentOptions.value?.find(
      (option) => option.value === draftAlignment.value,
    );

    setPersonality({
      ...personality,
      ...draftFields.value,
      // Выбор из словаря перекрывает записанное значение; ничего не выбрано —
      // остаётся то, что словарю неизвестно (пустая строка, если известно).
      alignment: selectedAlignment?.label ?? unknownAlignment.value,
    });

    emit('close');
  }

  /** Сброс формы: приметы очищаются целиком, лист меняется по «Применить». */
  function handleReset() {
    draftAlignment.value = undefined;
    unknownAlignment.value = '';

    for (const textField of PERSONALITY_TEXT_FIELDS) {
      draftFields.value[textField.key] = '';
    }
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="SHEET_PERSONALITY_LABELS.appearanceModalTitle"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <UFormField
          :label="SHEET_PERSONALITY_LABELS.alignmentField"
          :help="alignmentHelp"
        >
          <SelectAlignment
            v-model="draftAlignment"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UFormField
            v-for="textField in PERSONALITY_TEXT_FIELDS"
            :key="textField.key"
            :label="textField.label"
          >
            <UInput
              v-model="draftFields[textField.key]"
              :placeholder="textField.placeholder"
              :maxlength="PERSONALITY_FIELD_MAX_LENGTH"
              :autofocus="textField.key === field"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          :label="SHEET_PERSONALITY_LABELS.reset"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleReset"
        />

        <div class="flex gap-2">
          <UButton
            :label="SHEET_PERSONALITY_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            :label="SHEET_PERSONALITY_LABELS.apply"
            color="primary"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
