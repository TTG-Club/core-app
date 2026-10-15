<script setup lang="ts">
  import type {
    BastionOrderCode,
    FacilityOrderOptionDetail,
    MenagerieRecruit,
    MenagerieSizeCode,
    PlayerBastion,
    PlayerBastionFacility,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';
  import { UiModalActions } from '~ui/modal-actions';

  import { useBastionAction } from '../../composables';
  import {
    ACTIVITY_LABELS,
    fetchFacilityOrderOptions,
    formatMenagerieSpace,
    getOptionTermsText,
    getTurnsFor,
    giveBastionOrder,
    isBastionOrderCode,
    MENAGERIE_LARGE_SPACE,
    MENAGERIE_SIZES,
  } from '../../model';

  /**
   * Приказ сооружению: приказ из тех, что сооружение принимает, вариант из
   * справочника со сроком и ценой, предмет для изготовления в мастерской,
   * существо для зверинца и пояснение. Цена списывается из казны сразу.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion, facility, characterLevel } = defineProps<{
    bastion: PlayerBastion;
    facility: PlayerBastionFacility;
    characterLevel: number;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const order = ref<BastionOrderCode>();
  const optionName = ref<string>();
  const itemUrl = ref<string>();
  const beastValue = ref<string>();
  const customName = ref('');
  const customSize = ref<MenagerieSizeCode>('MEDIUM');
  const customChallenge = ref<string>();
  const note = ref('');
  const options = ref<Array<FacilityOrderOptionDetail>>([]);

  const orderItems = computed(() =>
    facility.orders.flatMap((item) =>
      isBastionOrderCode(item.value)
        ? [{ label: item.name, value: item.value }]
        : [],
    ),
  );

  /** Вербовка в бараке: защитники нанимаются бесплатно, пока есть место. */
  const isBarrackRecruit = computed(
    () => order.value === 'RECRUIT' && !!facility.defenderCapacity,
  );

  const isBarrackFull = computed(
    () =>
      isBarrackRecruit.value
      && (facility.defenders ?? 0) >= (facility.defenderCapacity ?? 0),
  );

  const barrackText = computed(() => {
    if (!isBarrackRecruit.value) {
      return '';
    }

    return fillTemplate(
      isBarrackFull.value
        ? ACTIVITY_LABELS.barrackFull
        : ACTIVITY_LABELS.barrackRecruit,
      {
        count: facility.defenders ?? 0,
        capacity: facility.defenderCapacity ?? 0,
      },
    );
  });

  const barrackTextClass = computed(() =>
    isBarrackFull.value ? 'text-warning' : 'text-muted',
  );

  /**
   * Условия варианта для подписи. В бараке защитники вербуются бесплатно,
   * какую бы цену ни указал справочник, — так же считает сервер.
   *
   * @param option Вариант приказа.
   * @returns Подпись «7 дн. · бесплатно».
   */
  function getTermsText(option: FacilityOrderOptionDetail): string {
    return getOptionTermsText(
      isBarrackRecruit.value ? { ...option, cost: 0, costNote: null } : option,
    );
  }

  /** Значение пункта «Другое существо» в списке существ зверинца. */
  const CUSTOM_CREATURE = 'CUSTOM';

  /** Вербовка в зверинце: существо из таблицы, у мастера — любое другое. */
  const isMenagerieRecruit = computed(
    () => order.value === 'RECRUIT' && !!facility.menagerie,
  );

  /** Свободное место в вольерах, четвертей большого существа. */
  const menagerieFree = computed(() =>
    facility.menagerie
      ? facility.menagerie.capacity - facility.menagerie.occupied
      : 0,
  );

  const beastItems = computed(() => {
    if (!isMenagerieRecruit.value || !facility.menagerie) {
      return [];
    }

    const beasts = facility.menagerie.beasts.map((beast) => ({
      label: fillTemplate(ACTIVITY_LABELS.creatureTerms, {
        name: beast.name,
        size: beast.size?.name.toLowerCase() ?? '',
        cost: beast.cost,
      }),
      value: beast.value,
      disabled: beast.space > menagerieFree.value,
    }));

    // Существо не из таблицы добавляется с согласия Мастера: приказ отдаёт он
    return bastion.canManage
      ? [
          ...beasts,
          {
            label: ACTIVITY_LABELS.creatureCustom,
            value: CUSTOM_CREATURE,
            disabled: false,
          },
        ]
      : beasts;
  });

  const isCustomCreature = computed(() => beastValue.value === CUSTOM_CREATURE);

  const sizeItems = MENAGERIE_SIZES.map((size) => ({
    label: size.label,
    value: size.value,
  }));

  const challengeItems = computed(() =>
    (facility.menagerie?.challengeCosts ?? []).map((item) => ({
      label: fillTemplate(ACTIVITY_LABELS.creatureChallengeTerms, item),
      value: item.challenge,
    })),
  );

  const isCustomNoRoom = computed(
    () =>
      isCustomCreature.value
      && (customSize.value === 'LARGE' ? MENAGERIE_LARGE_SPACE : 1)
        > menagerieFree.value,
  );

  /** Существо для запроса; undefined — ещё не выбрано или не заполнено. */
  const creatureRequest = computed<MenagerieRecruit | undefined>(() => {
    if (!isMenagerieRecruit.value || !beastValue.value) {
      return undefined;
    }

    if (!isCustomCreature.value) {
      return { beast: beastValue.value };
    }

    const name = customName.value.trim();

    return name && customChallenge.value
      ? { name, size: customSize.value, challenge: customChallenge.value }
      : undefined;
  });

  const isCreatureMissing = computed(
    () => isMenagerieRecruit.value && !creatureRequest.value,
  );

  const menagerieText = computed(() => {
    if (!isMenagerieRecruit.value || !facility.menagerie) {
      return '';
    }

    return isCustomNoRoom.value
      ? ACTIVITY_LABELS.menagerieNoRoom
      : fillTemplate(ACTIVITY_LABELS.menagerieRecruit, {
          free: formatMenagerieSpace(menagerieFree.value),
          capacity: formatMenagerieSpace(facility.menagerie.capacity),
        });
  });

  const menagerieTextClass = computed(() =>
    isCustomNoRoom.value ? 'text-warning' : 'text-muted',
  );

  const isSubmitDisabled = computed(
    () =>
      !order.value
      || isBarrackFull.value
      || isCreatureMissing.value
      || isCustomNoRoom.value,
  );

  // У зверинца цену и срок задаёт таблица существ, варианты справочника не нужны
  const optionItems = computed(() =>
    isMenagerieRecruit.value
      ? []
      : options.value
          .filter(
            (option) =>
              option.order === order.value
              && !!option.name
              && (option.minLevel ?? 0) <= characterLevel,
          )
          .map((option) => ({
            label: `${option.name} — ${getTermsText(option)}`,
            value: option.name ?? '',
          })),
  );

  /**
   * «Изготовить» в мастерской: предмет выбирается из тех, что создаются
   * выбранными в ней инструментами. У сооружений без выбора инструментов
   * списка нет вовсе.
   */
  const isCraftWithTools = computed(
    () => order.value === 'CRAFT' && !!facility.craftableItems,
  );

  const craftItems = computed(() =>
    isCraftWithTools.value
      ? (facility.craftableItems ?? []).map((item) => ({
          label: item.days
            ? fillTemplate(ACTIVITY_LABELS.craftItemTerms, {
                name: item.name ?? item.url,
                days: item.days,
              })
            : (item.name ?? item.url),
          value: item.url,
        }))
      : [],
  );

  const selectedCraft = computed(() =>
    facility.craftableItems?.find((item) => item.url === itemUrl.value),
  );

  /**
   * Срок изготовления выбранного предмета: цена в зм делится на 10 зм за
   * 8-часовой день, наёмники мастерской работают одновременно. Так же
   * считает сервер.
   */
  const craftDaysText = computed(() => {
    const item = selectedCraft.value;

    if (!item) {
      return '';
    }

    if (!item.days || item.priceGp == null) {
      return ACTIVITY_LABELS.craftDaysUnknown;
    }

    return fillTemplate(ACTIVITY_LABELS.craftDays, {
      price: item.priceGp,
      hirelings: facility.hirelings ?? 1,
      days: item.days,
      turns: getTurnsFor(item.days),
    });
  });

  const isCraftEmpty = computed(
    () => isCraftWithTools.value && !craftItems.value.length,
  );

  const selectedOption = computed(() =>
    options.value.find(
      (option) =>
        option.order === order.value && option.name === optionName.value,
    ),
  );

  // При открытии — первый приказ сооружения и свежие варианты из справочника.
  // Окно монтируется уже открытым (по выбору сооружения), поэтому первое
  // открытие ловим сразу, а не только по смене флага.
  watch(
    isOpen,
    async (opened) => {
      if (!opened) {
        return;
      }

      order.value = orderItems.value[0]?.value;
      optionName.value = undefined;
      resetSubjects();
      note.value = '';

      options.value = await fetchFacilityOrderOptions(
        facility.facilityUrl,
      ).catch(() => []);
    },
    { immediate: true },
  );

  /** Сбрасывает выбранные предмет и существо — они зависят от приказа. */
  function resetSubjects(): void {
    itemUrl.value = undefined;
    beastValue.value = undefined;
    customName.value = '';
    customSize.value = 'MEDIUM';
    customChallenge.value = undefined;
  }

  watch(order, () => {
    optionName.value = undefined;
    resetSubjects();
  });

  /** Отдаёт приказ. */
  async function submit(): Promise<void> {
    const code = order.value;

    if (!code) {
      return;
    }

    const updated = await run(
      () =>
        giveBastionOrder(bastion.id, {
          facilityId: facility.id,
          order: code,
          optionName: optionName.value,
          itemUrl: isCraftWithTools.value ? itemUrl.value : undefined,
          creature: creatureRequest.value,
          note: note.value.trim() || undefined,
        }),
      ACTIVITY_LABELS.orderGiven,
    );

    if (updated) {
      emit('updated', updated);
      isOpen.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ACTIVITY_LABELS.giveOrderTitle"
    :description="facility.name"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField :label="ACTIVITY_LABELS.order">
          <USelect
            id="bastion-order-code"
            v-model="order"
            :items="orderItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="optionItems.length"
          :label="ACTIVITY_LABELS.option"
        >
          <USelect
            id="bastion-order-option"
            v-model="optionName"
            :items="optionItems"
            value-key="value"
            :placeholder="ACTIVITY_LABELS.optionPlaceholder"
            class="w-full"
          />
        </UFormField>

        <p
          v-if="selectedOption?.description"
          class="text-sm text-muted"
        >
          {{ selectedOption.description }}
        </p>

        <UFormField
          v-if="craftItems.length"
          :label="ACTIVITY_LABELS.craftItem"
        >
          <USelectMenu
            id="bastion-order-item"
            v-model="itemUrl"
            :items="craftItems"
            value-key="value"
            :placeholder="ACTIVITY_LABELS.craftItemPlaceholder"
            class="w-full"
          />
        </UFormField>

        <p
          v-else-if="isCraftEmpty"
          class="text-sm text-warning"
        >
          {{ ACTIVITY_LABELS.craftItemEmpty }}
        </p>

        <p
          v-if="craftDaysText"
          class="text-sm text-muted"
        >
          {{ craftDaysText }}
        </p>

        <template v-if="isMenagerieRecruit">
          <UFormField :label="ACTIVITY_LABELS.creature">
            <USelectMenu
              id="bastion-order-creature"
              v-model="beastValue"
              :items="beastItems"
              value-key="value"
              :placeholder="ACTIVITY_LABELS.creaturePlaceholder"
              class="w-full"
            />
          </UFormField>

          <div
            v-if="isCustomCreature"
            class="grid gap-3 sm:grid-cols-3"
          >
            <UFormField :label="ACTIVITY_LABELS.creatureName">
              <UInput
                id="bastion-order-creature-name"
                v-model="customName"
                class="w-full"
              />
            </UFormField>

            <UFormField :label="ACTIVITY_LABELS.creatureSize">
              <USelect
                v-model="customSize"
                :items="sizeItems"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField :label="ACTIVITY_LABELS.creatureChallenge">
              <USelect
                id="bastion-order-creature-challenge"
                v-model="customChallenge"
                :items="challengeItems"
                value-key="value"
                class="w-full"
              />
            </UFormField>
          </div>

          <p
            class="text-sm"
            :class="menagerieTextClass"
          >
            {{ menagerieText }}
          </p>
        </template>

        <p
          v-if="barrackText"
          class="text-sm"
          :class="barrackTextClass"
        >
          {{ barrackText }}
        </p>

        <UFormField :label="ACTIVITY_LABELS.note">
          <UTextarea
            id="bastion-order-note"
            v-model="note"
            :rows="2"
            autoresize
            :placeholder="ACTIVITY_LABELS.notePlaceholder"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        :submit-label="ACTIVITY_LABELS.submitOrder"
        submit-icon="tabler:check"
        :loading="isRunning"
        :disabled="isSubmitDisabled"
        @cancel="isOpen = false"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
