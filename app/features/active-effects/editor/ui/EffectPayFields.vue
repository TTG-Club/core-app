<script setup lang="ts">
  import type {
    EffectPay,
    EffectPrice,
    EffectPriceAmount,
    EffectPriceKind,
    EffectSpellSlotPrice,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    createEffectPrice,
    DEFAULT_EFFECT_PRICE_KIND,
    EFFECT_PAY_FIELD_LABELS,
    EFFECT_PAY_ROW_ICONS,
    EFFECT_PRICE_KIND_NOTES,
    EFFECT_PRICE_KIND_OPTIONS,
    MAX_EFFECT_PRICES,
    MAX_PRICE_TEXT_LENGTH,
    MAX_SPELL_SLOT_LEVEL,
    MIN_SPELL_SLOT_LEVEL,
    priceHasAmount,
    toDraftEffectPay,
    toDraftPriceFormula,
  } from '../../model';

  /**
   * Цена ресурсом: чем платят за применение, включение, каст или срабатывание
   * — счётчик листа, кости хитов, ячейка заклинания, заряды предмета,
   * вдохновение. Платежей может быть несколько: платятся все. Один блок на
   * эффект и на строку срабатывания — поля у цены везде одни.
   */
  defineProps<{
    /** Пояснение к блоку: кто платит и какие токены доступны. */
    hint: string;
  }>();

  /** Подсказки пустых границ круга ячейки: без границы — от первого до девятого. */
  const SLOT_LEVEL_PLACEHOLDERS = {
    min: String(MIN_SPELL_SLOT_LEVEL),
    max: String(MAX_SPELL_SLOT_LEVEL),
  } as const;

  /** Цена; нет — платить не за что. */
  const pay = defineModel<EffectPay | undefined>({ required: true });

  const prices = computed(() => pay.value ?? []);

  const canAddPrice = computed(() => prices.value.length < MAX_EFFECT_PRICES);

  /** Строки платежей с готовыми значениями полей. */
  const priceRows = computed(() =>
    prices.value.map((price, index) => {
      const hasAmount = priceHasAmount(price);
      const isSpellSlot = price.kind === 'spellSlot';

      return {
        key: `${index}-${price.kind}`,
        kind: price.kind,
        isCounter: price.kind === 'counter',
        counter: price.kind === 'counter' ? price.counter : '',
        hasAmount,
        amount: hasAmount ? (price.amount ?? '') : '',
        max: hasAmount ? (price.max ?? '') : '',
        isSpellSlot,
        minLevel: isSpellSlot ? price.minLevel : undefined,
        maxLevel: isSpellSlot ? price.maxLevel : undefined,
        pact: isSpellSlot && price.pact === true,
        note: EFFECT_PRICE_KIND_NOTES[price.kind],
      };
    }),
  );

  /**
   * Записывает платежи: пустой список — отсутствием цены.
   *
   * @param nextPrices платежи.
   */
  function writePrices(nextPrices: EffectPrice[]): void {
    pay.value = toDraftEffectPay(nextPrices);
  }

  /** Добавляет платёж вида по умолчанию. */
  function addPrice(): void {
    writePrices([
      ...prices.value,
      createEffectPrice(DEFAULT_EFFECT_PRICE_KIND),
    ]);
  }

  /**
   * Убирает платёж.
   *
   * @param index номер платежа.
   */
  function removePrice(index: number): void {
    writePrices(prices.value.filter((_, priceIndex) => priceIndex !== index));
  }

  /**
   * Заменяет платёж.
   *
   * @param index номер платежа.
   * @param nextPrice новый платёж.
   */
  function replacePrice(index: number, nextPrice: EffectPrice): void {
    writePrices(
      prices.value.map((price, priceIndex) =>
        priceIndex === index ? nextPrice : price,
      ),
    );
  }

  /**
   * Меняет вид платежа: поля прежнего вида не переносятся — у каждого свои.
   *
   * @param index номер платежа.
   * @param kind выбранный вид.
   */
  function selectKind(index: number, kind: EffectPriceKind): void {
    if (prices.value[index]?.kind !== kind) {
      replacePrice(index, createEffectPrice(kind));
    }
  }

  /**
   * Меняет ключ счётчика листа.
   *
   * @param index номер платежа.
   * @param enteredCounter введённый ключ.
   */
  function updateCounter(index: number, enteredCounter: string): void {
    const price = prices.value[index];

    if (price?.kind === 'counter') {
      replacePrice(index, { ...price, counter: enteredCounter });
    }
  }

  /**
   * Меняет поля количества платежа: «сколько» и верхнюю границу выбора.
   *
   * @param index номер платежа.
   * @param patch новые формулы количества.
   */
  function updatePriceAmount(index: number, patch: EffectPriceAmount): void {
    const price = prices.value[index];

    if (price && priceHasAmount(price)) {
      replacePrice(index, { ...price, ...patch });
    }
  }

  /**
   * Меняет «сколько»: пустая формула — отсутствием поля (одна единица).
   *
   * @param index номер платежа.
   * @param enteredFormula введённая формула.
   */
  function updateAmount(index: number, enteredFormula: string): void {
    updatePriceAmount(index, { amount: toDraftPriceFormula(enteredFormula) });
  }

  /**
   * Меняет верхнюю границу выбора: пустая — ровно «сколько».
   *
   * @param index номер платежа.
   * @param enteredFormula введённая формула.
   */
  function updateAmountLimit(index: number, enteredFormula: string): void {
    updatePriceAmount(index, { max: toDraftPriceFormula(enteredFormula) });
  }

  /**
   * Меняет границы круга ячейки.
   *
   * @param index номер платежа.
   * @param patch новые границы круга.
   */
  function updateSlotLevels(
    index: number,
    patch: Pick<EffectSpellSlotPrice, 'minLevel' | 'maxLevel'>,
  ): void {
    const price = prices.value[index];

    if (price?.kind === 'spellSlot') {
      replacePrice(index, { ...price, ...patch });
    }
  }

  /**
   * Меняет наименьший круг ячейки: пустое поле — без границы.
   *
   * @param index номер платежа.
   * @param slotLevel круг; очищенное поле числа отдаёт `undefined`.
   */
  function updateMinSlotLevel(
    index: number,
    slotLevel: number | null | undefined,
  ): void {
    updateSlotLevels(index, { minLevel: slotLevel ?? undefined });
  }

  /**
   * Меняет наибольший круг ячейки: пустое поле — без границы.
   *
   * @param index номер платежа.
   * @param slotLevel круг; очищенное поле числа отдаёт `undefined`.
   */
  function updateMaxSlotLevel(
    index: number,
    slotLevel: number | null | undefined,
  ): void {
    updateSlotLevels(index, { maxLevel: slotLevel ?? undefined });
  }

  /**
   * Включает «только ячейка договора»: снятая отметка не пишется вовсе.
   *
   * @param index номер платежа.
   * @param enabled включено ли.
   */
  function updatePact(index: number, enabled: boolean): void {
    const price = prices.value[index];

    if (price?.kind === 'spellSlot') {
      replacePrice(index, { ...price, pact: enabled ? true : undefined });
    }
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <InfoTooltip
      :text="hint"
      icon="tabler:info-circle-filled"
    >
      <span class="text-xs font-medium text-default">
        {{ EFFECT_PAY_FIELD_LABELS.title }}
      </span>
    </InfoTooltip>

    <div
      v-for="(priceRow, index) in priceRows"
      :key="priceRow.key"
      class="flex flex-col gap-1"
    >
      <div class="flex flex-wrap items-end gap-2">
        <UFormField
          :label="EFFECT_PAY_FIELD_LABELS.kind"
          class="w-full sm:w-56"
        >
          <USelect
            :model-value="priceRow.kind"
            :items="EFFECT_PRICE_KIND_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
            @update:model-value="selectKind(index, $event)"
          />
        </UFormField>

        <UFormField
          v-if="priceRow.isCounter"
          :label="EFFECT_PAY_FIELD_LABELS.counter"
          class="w-full sm:w-56"
        >
          <UInput
            :model-value="priceRow.counter"
            :placeholder="EFFECT_PAY_FIELD_LABELS.counterPlaceholder"
            :maxlength="MAX_PRICE_TEXT_LENGTH"
            size="sm"
            class="w-full font-mono"
            @update:model-value="updateCounter(index, $event)"
          />
        </UFormField>

        <template v-if="priceRow.hasAmount">
          <UFormField class="w-full sm:w-40">
            <template #label>
              <InfoTooltip
                :text="EFFECT_PAY_FIELD_LABELS.amountHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ EFFECT_PAY_FIELD_LABELS.amount }}</span>
              </InfoTooltip>
            </template>

            <UInput
              :model-value="priceRow.amount"
              :placeholder="EFFECT_PAY_FIELD_LABELS.amountPlaceholder"
              :maxlength="MAX_PRICE_TEXT_LENGTH"
              size="sm"
              class="w-full font-mono"
              @update:model-value="updateAmount(index, $event)"
            />
          </UFormField>

          <UFormField class="w-full sm:w-40">
            <template #label>
              <InfoTooltip
                :text="EFFECT_PAY_FIELD_LABELS.maxHint"
                icon="tabler:info-circle-filled"
              >
                <span>{{ EFFECT_PAY_FIELD_LABELS.max }}</span>
              </InfoTooltip>
            </template>

            <UInput
              :model-value="priceRow.max"
              :maxlength="MAX_PRICE_TEXT_LENGTH"
              size="sm"
              class="w-full font-mono"
              @update:model-value="updateAmountLimit(index, $event)"
            />
          </UFormField>
        </template>

        <template v-if="priceRow.isSpellSlot">
          <UFormField
            :label="EFFECT_PAY_FIELD_LABELS.minLevel"
            class="w-28"
          >
            <UInputNumber
              :model-value="priceRow.minLevel"
              :min="MIN_SPELL_SLOT_LEVEL"
              :max="MAX_SPELL_SLOT_LEVEL"
              :placeholder="SLOT_LEVEL_PLACEHOLDERS.min"
              size="sm"
              class="w-full"
              @update:model-value="updateMinSlotLevel(index, $event)"
            />
          </UFormField>

          <UFormField
            :label="EFFECT_PAY_FIELD_LABELS.maxLevel"
            class="w-28"
          >
            <UInputNumber
              :model-value="priceRow.maxLevel"
              :min="MIN_SPELL_SLOT_LEVEL"
              :max="MAX_SPELL_SLOT_LEVEL"
              :placeholder="SLOT_LEVEL_PLACEHOLDERS.max"
              size="sm"
              class="w-full"
              @update:model-value="updateMaxSlotLevel(index, $event)"
            />
          </UFormField>

          <USwitch
            :model-value="priceRow.pact"
            class="mb-2"
            :label="EFFECT_PAY_FIELD_LABELS.pact"
            @update:model-value="updatePact(index, $event)"
          />
        </template>

        <UButton
          :icon="EFFECT_PAY_ROW_ICONS.remove"
          :aria-label="EFFECT_PAY_FIELD_LABELS.remove"
          :title="EFFECT_PAY_FIELD_LABELS.remove"
          color="error"
          variant="ghost"
          size="xs"
          class="mb-1"
          @click.left.exact.prevent="removePrice(index)"
        />
      </div>

      <p
        v-if="priceRow.note"
        class="text-xs text-muted"
      >
        {{ priceRow.note }}
      </p>
    </div>

    <UButton
      v-if="canAddPrice"
      :icon="EFFECT_PAY_ROW_ICONS.add"
      :label="EFFECT_PAY_FIELD_LABELS.add"
      color="primary"
      variant="soft"
      size="xs"
      class="w-fit"
      @click.left.exact.prevent="addPrice"
    />
  </div>
</template>
