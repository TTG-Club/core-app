<script setup lang="ts">
  import type { CharacterCurrency, CharacterCustomCurrency } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    CURRENCY_AMOUNT_MAX,
    CURRENCY_AMOUNT_MIN,
    CURRENCY_LABELS,
    CURRENCY_NAMES,
    CURRENCY_ORDER,
    CUSTOM_CURRENCY_LABEL_MAX_LENGTH,
    CUSTOM_CURRENCY_NAME_MAX_LENGTH,
    NEW_CUSTOM_CURRENCY,
    SHEET_EMPTY_LABELS,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setCurrency } = useCharacterSheet();

  const draftCurrency = ref<CharacterCurrency>({ ...character.value.currency });

  const draftCustomCurrencies = ref<CharacterCustomCurrency[]>(
    character.value.customCurrencies.map((customCurrency) => ({
      ...customCurrency,
    })),
  );

  // Полное название + сокращение стандартных монет для подписей полей.
  const standardCurrencyFields = computed(() =>
    CURRENCY_ORDER.map((key) => ({
      key,
      name: CURRENCY_NAMES[key],
      label: CURRENCY_LABELS[key],
    })),
  );

  const customCountLabel = computed(
    () => `${draftCustomCurrencies.value.length} шт.`,
  );

  function handleAddCustomCurrency() {
    draftCustomCurrencies.value.push({
      id: crypto.randomUUID(),
      ...NEW_CUSTOM_CURRENCY,
    });
  }

  function handleRemoveCustomCurrency(customCurrencyId: string) {
    draftCustomCurrencies.value = draftCustomCurrencies.value.filter(
      (customCurrency) => customCurrency.id !== customCurrencyId,
    );
  }

  function handleApply() {
    setCurrency(draftCurrency.value, draftCustomCurrencies.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Валюта">
    <template #body>
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <div
            v-for="field in standardCurrencyFields"
            :key="field.key"
            class="flex items-center justify-between gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <div class="flex min-w-0 flex-col">
              <span class="text-sm text-toned">{{ field.name }}</span>

              <span class="text-[10px] font-bold text-muted uppercase">
                {{ field.label }}
              </span>
            </div>

            <UInputNumber
              v-model="draftCurrency[field.key]"
              :min="CURRENCY_AMOUNT_MIN"
              :max="CURRENCY_AMOUNT_MAX"
              class="w-28 shrink-0"
            />
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted"
              >Свои валюты · {{ customCountLabel }}</span
            >

            <UButton
              icon="tabler:plus"
              label="Добавить валюту"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="handleAddCustomCurrency"
            />
          </div>

          <div
            v-for="customCurrency in draftCustomCurrencies"
            :key="customCurrency.id"
            class="flex flex-col gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <div class="flex items-end gap-3">
              <div class="flex min-w-0 grow flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  Название
                </span>

                <UInput
                  v-model="customCurrency.name"
                  placeholder="Например, Драконьи чешуйки"
                  :maxlength="CUSTOM_CURRENCY_NAME_MAX_LENGTH"
                />
              </div>

              <UButton
                icon="tabler:trash"
                color="error"
                variant="ghost"
                size="xs"
                square
                aria-label="Удалить валюту"
                @click.left.exact.prevent="
                  handleRemoveCustomCurrency(customCurrency.id)
                "
              />
            </div>

            <div class="flex items-end gap-3">
              <div class="flex w-24 shrink-0 flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  Сокр.
                </span>

                <UInput
                  v-model="customCurrency.label"
                  placeholder="ДЧ"
                  :maxlength="CUSTOM_CURRENCY_LABEL_MAX_LENGTH"
                />
              </div>

              <div class="flex min-w-0 grow flex-col gap-1">
                <span class="text-[10px] font-bold text-muted uppercase">
                  Количество
                </span>

                <UInputNumber
                  v-model="customCurrency.amount"
                  :min="CURRENCY_AMOUNT_MIN"
                  :max="CURRENCY_AMOUNT_MAX"
                />
              </div>
            </div>
          </div>

          <span
            v-if="!draftCustomCurrencies.length"
            class="text-sm text-dimmed italic"
          >
            {{ SHEET_EMPTY_LABELS.customCurrencies }}
          </span>
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
