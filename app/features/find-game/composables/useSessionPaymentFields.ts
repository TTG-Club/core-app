import type { MaybeRefOrGetter } from 'vue';

import type { GameCostType, SessionPaymentType } from '../model';

import {
  SESSION_CURRENCY_OPTIONS,
  SESSION_CURRENCY_PATTERN,
  SESSION_DEFAULT_CURRENCY,
  SESSION_DEFAULT_PAYMENT_TYPE,
  SESSION_PAYMENT_TYPE_LABELS,
  SESSION_PAYMENT_TYPES,
  SESSION_PRICE_MIN,
} from '../model';

/** Вариант выбора: значение для сервиса и подпись для мастера. */
interface PaymentOption {
  value: string;
  label: string;
}

/** Платёжная часть тела запроса — общая у одиночной встречи и у серии. */
interface SessionPaymentRequestFields {
  priceAmount?: number;
  priceCurrency?: string;
  paymentType?: SessionPaymentType;
}

const paymentTypeOptions: Array<PaymentOption> = SESSION_PAYMENT_TYPES.map(
  (value) => ({ value, label: SESSION_PAYMENT_TYPE_LABELS[value] }),
);

/**
 * Платёжные поля встречи: цена, валюта и порядок оплаты.
 *
 * Одиночная сессия и серия спрашивают их одинаково и одинаково же проверяют,
 * поэтому поля живут здесь целиком — вместе с правилом «платная игра не
 * обязана быть платной целиком» и сборкой полей в тело запроса.
 *
 * @param costType Платность игры: у бесплатной платёжных полей нет вовсе.
 */
export function useSessionPaymentFields(
  costType: MaybeRefOrGetter<GameCostType>,
) {
  const isFree = ref(false);
  const priceAmount = ref<number | null>(null);
  const priceCurrency = ref(SESSION_DEFAULT_CURRENCY);

  // Порядок оплаты предзаполнен: у большинства столов он один и тот же, а
  // пустое обязательное поле мастер замечает уже по отказу формы.
  const paymentType = ref<SessionPaymentType | null>(
    SESSION_DEFAULT_PAYMENT_TYPE,
  );

  /** Показывать ли платёжные поля: игра платная и встречу не объявили даром. */
  const isPaid = computed(() => toValue(costType) === 'PAID' && !isFree.value);

  // USelect не принимает `null` как «ничего не выбрано», а в состоянии формы
  // именно `null`: платёжные поля появляются только у платной игры.
  const paymentTypeChoice = computed({
    get: () => paymentType.value ?? undefined,
    set: (value: SessionPaymentType | undefined) => {
      paymentType.value = value ?? null;
    },
  });

  const isCurrencyValid = computed(
    () => !isPaid.value || SESSION_CURRENCY_PATTERN.test(priceCurrency.value),
  );

  // Дробную цену форма не принимает: поле шагает целыми, но число можно
  // вписать и с клавиатуры, а «100,01» за стол никто не берёт.
  const isPriceValid = computed(
    () =>
      !isPaid.value
      || (priceAmount.value !== null
        && Number.isInteger(priceAmount.value)
        && priceAmount.value >= SESSION_PRICE_MIN),
  );

  /** Заполнены ли платёжные поля настолько, чтобы сервис принял запрос. */
  const isValid = computed(
    () =>
      isPriceValid.value
      && isCurrencyValid.value
      && (!isPaid.value || !!paymentType.value),
  );

  /**
   * Дописывает платёжные поля в тело запроса. У бесплатной игры они не
   * отправляются вовсе — сервис отвергает запрос, в котором они заданы.
   *
   * @param request Тело запроса на создание встречи или серии.
   */
  function applyTo(request: SessionPaymentRequestFields): void {
    if (!isPaid.value || priceAmount.value === null || !paymentType.value) {
      return;
    }

    request.priceAmount = priceAmount.value;
    request.priceCurrency = priceCurrency.value.toUpperCase();
    request.paymentType = paymentType.value;
  }

  /** Возвращает платёжные поля к пустым значениям. */
  function reset(): void {
    isFree.value = false;
    priceAmount.value = null;
    priceCurrency.value = SESSION_DEFAULT_CURRENCY;
    paymentType.value = SESSION_DEFAULT_PAYMENT_TYPE;
  }

  return {
    isFree,
    priceAmount,
    priceCurrency,
    paymentTypeChoice,

    isPaid,
    isValid,

    currencyOptions: SESSION_CURRENCY_OPTIONS,
    paymentTypeOptions,

    applyTo,
    reset,
  };
}
