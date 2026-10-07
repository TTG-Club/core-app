<script setup lang="ts">
  import type { CharacterClassResource, ResourceMaxSource } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';
  import { InfoTooltip } from '~ui/tooltip';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_OPTIONS,
    FEAT_RESOURCE_EDIT_LABELS,
    getResourceMax,
    RESOURCE_COUNT_MAX,
    RESOURCE_COUNT_MIN,
    RESOURCE_MAX_ABILITY_LABEL,
    RESOURCE_MAX_AMOUNT_LABEL,
    RESOURCE_MAX_COMPUTED_LABEL,
    RESOURCE_MAX_DEFAULT_ABILITY,
    RESOURCE_MAX_MINIMUM_HINT,
    RESOURCE_MAX_MINIMUM_LABEL,
    RESOURCE_MAX_MINIMUM_MAX,
    RESOURCE_MAX_MINIMUM_MIN,
    RESOURCE_MAX_OFFSET_LABEL,
    RESOURCE_MAX_OFFSET_MAX,
    RESOURCE_MAX_OFFSET_MIN,
    RESOURCE_MAX_SOURCE_ARIA_LABEL,
    RESOURCE_MAX_SOURCE_OPTIONS,
    RESOURCE_PLACEHOLDERS,
    RESOURCE_RECOVERY_AMOUNT_MIN,
    RESOURCE_RECOVERY_FIELDS,
    RESOURCE_RECOVERY_ICONS,
    RESOURCE_RECOVERY_LABELS,
    RESOURCE_RECOVERY_MODE_OPTIONS,
    RESOURCE_SHORT_LABEL_MAX_LENGTH,
    SHEET_CLASS_RESOURCE_MODAL_LABELS,
    toClassResourceDraft,
    toEditedFeatResource,
    toSavedClassResource,
  } from '../../model';

  const props = defineProps<{
    /** Заголовок окна: у добавления и правки он разный. */
    title: string;

    /** Ресурс, который правится; форма работает с его копией. */
    resource: CharacterClassResource;

    /**
     * Книжная запись ресурса справочника; нет — правится свой ресурс игрока.
     * По ней считаются правки: в лист уходит только разница со справочником.
     */
    bookResource?: CharacterClassResource;
  }>();

  const emit = defineEmits<{
    /** Закрытие окна; ресурс передаётся только при сохранении. */
    close: [resource?: CharacterClassResource];
  }>();

  const { character } = useCharacterSheet();

  // Форма правит копию: список ресурсов до сохранения меняться не должен.
  // Черновик живёт до закрытия — оверлей размонтирует модалку.
  const draftResource = ref<CharacterClassResource>(
    toClassResourceDraft(props.resource),
  );

  /** Ресурс пришёл из справочника: правки лягут поверх книжной записи. */
  const isFromBook = computed(() => Boolean(props.bookResource));

  // Максимум книжный, пока игрок не задал свой: правка максимума — та самая
  // правка, из-за которой ресурс перестаёт расти вместе с персонажем сам.
  const isBookMax = ref(
    Boolean(props.bookResource) && props.resource.overrides?.max === undefined,
  );

  /** Источник максимума: без правила — своё число. */
  const maxSource = computed<ResourceMaxSource>(
    () => draftResource.value.maxRule?.source ?? 'fixed',
  );

  /** Максимум привязан к растущему значению листа, а не задан числом. */
  const isMaxComputed = computed(() => maxSource.value !== 'fixed');

  /** Модификатор какой характеристики идёт в максимум. */
  const isAbilityMax = computed(() => maxSource.value === 'ability');

  /** Посчитанный максимум: показывается там, где поле ввода скрыто. */
  const computedMax = computed(() =>
    getResourceMax(character.value, draftResource.value),
  );

  /**
   * Нижняя граница максимума. Правило может её не знать — у ресурсов, заведённых
   * до её появления, поля нет, — поэтому пустая читается как «границы нет».
   */
  const minimum = computed({
    get: () => draftResource.value.maxRule?.min ?? RESOURCE_MAX_MINIMUM_MIN,
    set: (value: number) => {
      if (draftResource.value.maxRule) {
        draftResource.value.maxRule.min = value;
      }
    },
  });

  /**
   * Переключение отметки «максимум как в справочнике». Отметка не просто
   * флаг: книжная возвращает в черновик книжный максимум целиком, а снятая
   * переводит ресурс со ступеней на своё число — ступени форма не правит, и
   * без перевода игрок менял бы число, которого расчёт не видит.
   *
   * @param value значение отметки. Промежуточное состояние (`indeterminate`)
   *   форма не задаёт, поэтому читается как снятая.
   */
  function handleBookMaxChange(value: boolean | 'indeterminate') {
    const isPicked = value === true;

    isBookMax.value = isPicked;

    const bookResource = props.bookResource;

    if (!bookResource) {
      return;
    }

    if (isPicked) {
      draftResource.value.max = bookResource.max;

      draftResource.value.maxRule = bookResource.maxRule
        ? { ...bookResource.maxRule }
        : null;

      return;
    }

    if (draftResource.value.maxRule?.scaling?.length) {
      draftResource.value.max = computedMax.value;
      draftResource.value.maxRule = null;
    }
  }

  /**
   * Смена источника максимума. «Своё число» убирает правило целиком — иначе
   * запись хранила бы правило, которое ни на что не влияет.
   *
   * @param source выбранный источник.
   */
  function handleMaxSourceChange(source: ResourceMaxSource) {
    if (source === 'fixed') {
      draftResource.value.maxRule = null;

      return;
    }

    draftResource.value.maxRule = {
      source,
      ability:
        draftResource.value.maxRule?.ability ?? RESOURCE_MAX_DEFAULT_ABILITY,
      offset: draftResource.value.maxRule?.offset ?? 0,
      // Нижняя граница пережидает смену источника: она описывает сам ресурс, а
      // не то, от чего считается его максимум
      min: draftResource.value.maxRule?.min ?? RESOURCE_MAX_MINIMUM_MIN,
    };
  }

  // Остаток не переживает снижение максимума: иначе в списке осталось бы «3/2».
  // Обратной связи нет (максимум от остатка не зависит), поэтому цикла тоже нет.
  watch(computedMax, (max) => {
    draftResource.value.current = Math.min(draftResource.value.current, max);
  });

  /** Ресурс без обеих подписей стал бы на листе пустой строкой. */
  const isSaveDisabled = computed(
    () =>
      !draftResource.value.name.trim()
      && !draftResource.value.shortLabel.trim(),
  );

  /**
   * Возврат ресурса справочника к книжной записи: правки снимаются целиком,
   * потраченные заряды остаются — отдых их и вернёт.
   */
  function handleReset() {
    const bookResource = props.bookResource;

    if (!bookResource) {
      return;
    }

    draftResource.value = {
      ...toClassResourceDraft(bookResource),
      current: Math.min(draftResource.value.current, bookResource.max),
      hidden: draftResource.value.hidden,
    };

    isBookMax.value = true;
  }

  /**
   * Сохранение: ресурс уходит в список, применение к листу — уже там. У записи
   * справочника вместо самой записи считаются правки: лист пересобирает её из
   * справочника на каждой смене черт и уровня, а правки накладывает поверх.
   */
  function handleSave() {
    const draft = draftResource.value;

    if (!props.bookResource) {
      emit('close', toSavedClassResource(draft));

      return;
    }

    emit('close', toEditedFeatResource(props.bookResource, draft));
  }

  /** Закрытие без сохранения: список остаётся как был. */
  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal :title="title">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-end gap-3">
          <div class="flex min-w-0 grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ SHEET_CLASS_RESOURCE_MODAL_LABELS.name }}
            </span>

            <UInput
              v-model="draftResource.name"
              :placeholder="RESOURCE_PLACEHOLDERS.name"
              autofocus
            />
          </div>

          <div class="flex w-24 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ SHEET_CLASS_RESOURCE_MODAL_LABELS.shortLabel }}
            </span>

            <UInput
              v-model="draftResource.shortLabel"
              :placeholder="RESOURCE_PLACEHOLDERS.shortLabel"
              :maxlength="RESOURCE_SHORT_LABEL_MAX_LENGTH"
            />
          </div>

          <!-- Ключ виден, чтобы знать, что вписать в «Тратит ресурс» у эффекта.
            У книжного ресурса он только для чтения: на него ссылаются эффекты
            справочника, и правка оторвала бы ресурс от них -->
          <div class="flex w-28 shrink-0 flex-col gap-1">
            <InfoTooltip
              :text="SHEET_CLASS_RESOURCE_MODAL_LABELS.keyHint"
              icon="tabler:info-circle-filled"
              class="text-[10px] font-bold text-muted uppercase"
            >
              <span>{{ SHEET_CLASS_RESOURCE_MODAL_LABELS.key }}</span>
            </InfoTooltip>

            <UInput
              v-model="draftResource.key"
              :placeholder="RESOURCE_PLACEHOLDERS.key"
              :disabled="isFromBook"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <div class="flex w-28 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ SHEET_CLASS_RESOURCE_MODAL_LABELS.current }}
            </span>

            <UInputNumber
              v-model="draftResource.current"
              :min="RESOURCE_COUNT_MIN"
              :max="computedMax"
            />
          </div>

          <div class="flex min-w-40 grow flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ SHEET_CLASS_RESOURCE_MODAL_LABELS.max }}
            </span>

            <!-- У книжного максимума вместо выбора источника — само число:
              считает его справочник, и менять в форме нечего -->
            <p
              v-if="isBookMax"
              class="flex h-8 items-center text-sm font-bold text-highlighted"
            >
              {{ computedMax }}
            </p>

            <USelect
              v-else
              :model-value="maxSource"
              :items="RESOURCE_MAX_SOURCE_OPTIONS"
              :aria-label="RESOURCE_MAX_SOURCE_ARIA_LABEL"
              @update:model-value="handleMaxSourceChange"
            />
          </div>

          <div
            v-if="!isBookMax && !isMaxComputed"
            class="flex w-28 shrink-0 flex-col gap-1"
          >
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ RESOURCE_MAX_AMOUNT_LABEL }}
            </span>

            <UInputNumber
              v-model="draftResource.max"
              :min="RESOURCE_COUNT_MIN"
              :max="RESOURCE_COUNT_MAX"
            />
          </div>
        </div>

        <UCheckbox
          v-if="isFromBook"
          :model-value="isBookMax"
          :label="FEAT_RESOURCE_EDIT_LABELS.bookMax"
          :description="FEAT_RESOURCE_EDIT_LABELS.bookMaxHint"
          @update:model-value="handleBookMaxChange"
        />

        <div
          v-if="!isBookMax && isMaxComputed && draftResource.maxRule"
          class="flex flex-wrap items-end gap-3 rounded-md bg-elevated/40 p-2"
        >
          <div
            v-if="isAbilityMax"
            class="flex min-w-40 grow flex-col gap-1"
          >
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ RESOURCE_MAX_ABILITY_LABEL }}
            </span>

            <USelect
              v-model="draftResource.maxRule.ability"
              :items="ABILITY_OPTIONS"
              :aria-label="RESOURCE_MAX_ABILITY_LABEL"
            />
          </div>

          <div class="flex w-28 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ RESOURCE_MAX_OFFSET_LABEL }}
            </span>

            <UInputNumber
              v-model="draftResource.maxRule.offset"
              :min="RESOURCE_MAX_OFFSET_MIN"
              :max="RESOURCE_MAX_OFFSET_MAX"
              :aria-label="RESOURCE_MAX_OFFSET_LABEL"
            />
          </div>

          <!-- Нижняя граница подпирает расчёт снизу: вдохновение барда равно
            модификатору Харизмы, но с Харизмой +0 оно всё равно одно -->
          <div class="flex w-28 shrink-0 flex-col gap-1">
            <span class="text-[10px] font-bold text-muted uppercase">
              {{ RESOURCE_MAX_MINIMUM_LABEL }}
            </span>

            <UInputNumber
              v-model="minimum"
              :min="RESOURCE_MAX_MINIMUM_MIN"
              :max="RESOURCE_MAX_MINIMUM_MAX"
              :aria-label="RESOURCE_MAX_MINIMUM_LABEL"
            />
          </div>

          <p class="grow text-xs text-muted">
            {{ RESOURCE_MAX_COMPUTED_LABEL }}: {{ computedMax }}
          </p>

          <p class="w-full text-xs text-dimmed">
            {{ RESOURCE_MAX_MINIMUM_HINT }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[10px] font-bold text-muted uppercase">
            {{ SHEET_CLASS_RESOURCE_MODAL_LABELS.recovery }}
          </span>

          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="field in RESOURCE_RECOVERY_FIELDS"
              :key="field.key"
              class="flex flex-col gap-1.5 rounded-md bg-elevated/40 p-2"
            >
              <span
                class="flex items-center gap-1 text-[10px] font-bold text-muted uppercase"
              >
                <UIcon
                  :name="RESOURCE_RECOVERY_ICONS[field.rest]"
                  class="size-3.5 shrink-0"
                />

                {{ RESOURCE_RECOVERY_LABELS[field.rest] }}
              </span>

              <USelect
                v-model="draftResource[field.key].mode"
                :items="RESOURCE_RECOVERY_MODE_OPTIONS"
                :aria-label="`${SHEET_CLASS_RESOURCE_MODAL_LABELS.recovery}: ${RESOURCE_RECOVERY_LABELS[field.rest]}`"
              />

              <UInputNumber
                v-if="draftResource[field.key].mode === 'amount'"
                v-model="draftResource[field.key].amount"
                :min="RESOURCE_RECOVERY_AMOUNT_MIN"
                :max="RESOURCE_COUNT_MAX"
                :aria-label="`${SHEET_CLASS_RESOURCE_MODAL_LABELS.recoveryAmount}: ${RESOURCE_RECOVERY_LABELS[field.rest]}`"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center gap-2">
        <UButton
          v-if="isFromBook"
          icon="tabler:rotate"
          :label="FEAT_RESOURCE_EDIT_LABELS.reset"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="handleReset"
        />

        <UButton
          class="ml-auto"
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.save"
          color="primary"
          :disabled="isSaveDisabled"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
