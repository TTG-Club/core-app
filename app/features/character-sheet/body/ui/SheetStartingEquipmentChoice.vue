<script setup lang="ts">
  import type { StartingEquipmentOption } from '../../model';

  import { ItemDrawer } from '~items/drawer';

  import {
    getStartingEquipmentCoinsLabel,
    getStartingEquipmentItemLabel,
    STARTING_EQUIPMENT_LABELS,
    STARTING_EQUIPMENT_SKIP_VALUE,
  } from '../../model';

  /**
   * Позиция варианта в карточке. Позиция из каталога открывает описание в
   * дровере: игрок выбирает набор, зная, что такое «Сфера (фокусировка)», а не
   * по одному названию.
   */
  interface EquipmentCardItem {
    key: string;
    label: string;

    /** Слаг раздела «Предметы»; пусто — позиции в каталоге нет. */
    url: string;
  }

  /** Карточка варианта: заголовок, содержимое и вид по состоянию выбора. */
  interface EquipmentCard {
    /** Метка варианта или `STARTING_EQUIPMENT_SKIP_VALUE`. */
    value: string;

    label: string;
    items: EquipmentCardItem[];

    /** Подпись монет варианта; пусто — монет он не даёт. */
    coinsLabel: string;

    /** Текст вместо содержимого: вариант без предметов и монет. */
    note: string;

    isSelected: boolean;
    icon: string;
    iconClass: string;
    class: string;
  }

  const { options } = defineProps<{
    options: StartingEquipmentOption[];
  }>();

  /** Метка выбранного варианта; `STARTING_EQUIPMENT_SKIP_VALUE` — не добавлять. */
  const model = defineModel<string>({
    default: STARTING_EQUIPMENT_SKIP_VALUE,
  });

  const overlay = useOverlay();

  // Дровер описания предмета; без destroyOnClose — повторный open() после
  // закрытия иначе падает («Overlay not found»).
  const itemPreviewDrawer = overlay.create(ItemDrawer, {
    props: {
      url: '',
      onClose: () => itemPreviewDrawer.close(),
    },
  });

  const CARD_BASE_CLASS =
    'relative flex min-w-56 flex-1 basis-56 cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-colors';

  const SELECTED_CARD_CLASS = 'border-primary bg-primary/5';

  const CARD_CLASS = 'border-default bg-elevated/20 hover:border-primary/50';

  const cards = computed<EquipmentCard[]>(() => {
    const entries = [
      ...options.map((option) => ({
        value: option.label,
        label: option.label,
        items: option.items.map((item, index) => ({
          key: `${option.label}-${index}`,
          label: getStartingEquipmentItemLabel(item),
          url: item.url,
        })),
        coinsLabel: getStartingEquipmentCoinsLabel(option),
      })),
      {
        value: STARTING_EQUIPMENT_SKIP_VALUE,
        label: STARTING_EQUIPMENT_LABELS.skipLabel,
        items: [],
        coinsLabel: '',
      },
    ];

    return entries.map((entry) => {
      const isSelected = model.value === entry.value;

      const isSkip = entry.value === STARTING_EQUIPMENT_SKIP_VALUE;

      const isEmpty = entry.items.length === 0 && !entry.coinsLabel;

      return {
        ...entry,
        note: isSkip
          ? STARTING_EQUIPMENT_LABELS.skipDescription
          : (isEmpty && STARTING_EQUIPMENT_LABELS.emptyOptionDescription) || '',
        isSelected,
        icon: isSelected ? 'tabler:circle-check-filled' : 'tabler:circle',
        iconClass: isSelected ? 'text-primary' : 'text-muted',
        class: `${CARD_BASE_CLASS} ${isSelected ? SELECTED_CARD_CLASS : CARD_CLASS}`,
      };
    });
  });

  /**
   * Выбирает вариант снаряжения.
   *
   * @param card карточка варианта.
   */
  function selectCard(card: EquipmentCard) {
    model.value = card.value;
  }

  /**
   * Открывает описание позиции из каталога сайта.
   *
   * @param url слаг предмета в разделе «Предметы».
   */
  function openItemPreview(url: string) {
    itemPreviewDrawer.open({ url });
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
      {{ STARTING_EQUIPMENT_LABELS.title }}
    </span>

    <!-- Варианты идут в ряд, а на узком экране переносятся по одному: у
    каждого свой заголовок и своё содержимое, и сравнивать их проще рядом -->
    <div
      class="flex flex-wrap gap-3"
      role="radiogroup"
      :aria-label="STARTING_EQUIPMENT_LABELS.title"
    >
      <div
        v-for="card in cards"
        :key="card.value"
        role="radio"
        tabindex="0"
        :aria-checked="card.isSelected"
        :aria-label="`${STARTING_EQUIPMENT_LABELS.selectOption} ${card.label}`"
        :class="card.class"
        @click.left.exact.prevent="selectCard(card)"
        @keydown.enter.prevent="selectCard(card)"
        @keydown.space.prevent="selectCard(card)"
      >
        <div class="flex items-center gap-2">
          <UIcon
            :name="card.icon"
            class="size-4 shrink-0"
            :class="card.iconClass"
          />

          <span class="text-sm font-bold text-highlighted">
            {{ card.label }}
          </span>
        </div>

        <div
          v-if="card.items.length || card.coinsLabel"
          class="flex flex-wrap gap-1.5"
        >
          <template
            v-for="item in card.items"
            :key="item.key"
          >
            <!-- Позиция из каталога открывает своё описание, а не выбирает
            вариант, поэтому нажатие до карточки не доходит (`stop`) -->
            <UTooltip
              v-if="item.url"
              :text="STARTING_EQUIPMENT_LABELS.itemPreview"
            >
              <UBadge
                as="button"
                type="button"
                size="md"
                color="neutral"
                variant="subtle"
                class="cursor-pointer transition-colors hover:text-primary"
                @click.left.exact.stop.prevent="openItemPreview(item.url)"
              >
                {{ item.label }}
              </UBadge>
            </UTooltip>

            <UBadge
              v-else
              size="md"
              color="neutral"
              variant="outline"
              class="text-muted"
            >
              {{ item.label }}
            </UBadge>
          </template>

          <UBadge
            v-if="card.coinsLabel"
            size="md"
            color="neutral"
            variant="subtle"
            icon="tabler:coins"
          >
            {{ card.coinsLabel }}
          </UBadge>
        </div>

        <span
          v-if="card.note"
          class="text-xs text-muted"
        >
          {{ card.note }}
        </span>
      </div>
    </div>

    <span class="text-xs text-muted">{{ STARTING_EQUIPMENT_LABELS.hint }}</span>
  </div>
</template>
