<script setup lang="ts">
  import { InfoTooltip } from '~ui/tooltip';

  /**
   * Раздел внутри записи формы: заголовок и содержимое на «дорожке» — линии,
   * идущей от значка свёртки вниз вдоль всего содержимого.
   *
   * Дорожка вместо рамки, потому что рамок в форме класса набиралось до семи
   * подряд (умение → варианты → вариант → механика → дары → строка дара), все
   * одинаковые, и на глубине было не понять, чему принадлежит блок. Теперь в
   * форме два языка: КОРОБКА — объект списка (умение, вариант, дар, эффект),
   * ДОРОЖКА — раздел внутри объекта. Глубина читается по числу дорожек слева, а
   * взгляд ведёт по линии вверх, к хозяину.
   *
   * Пока курсор внутри, дорожка подсвечена — и вместе с ней дорожки всех
   * разделов выше: получается живой путь «где я сейчас», собранный из настоящих
   * заголовков, а не из отдельной хлебной крошки.
   */
  const {
    title,
    hint = undefined,
    count = 0,
    addLabel = undefined,
    collapsible = true,
  } = defineProps<{
    title: string;

    /** Пояснение к разделу по наведению на значок в шапке. */
    hint?: string;

    /** Сколько записей в разделе; ноль — бейдж не показывается. */
    count?: number;

    /** Подпись кнопки добавления в шапке; пусто — кнопки нет. */
    addLabel?: string;

    /**
     * Раздел сворачивается. Выключено — содержимое всегда на виду: так живут
     * блоки механики, где свёртка прятала бы уже заполненное.
     */
    collapsible?: boolean;
  }>();

  const emit = defineEmits<{ add: [] }>();

  /**
   * Подпись раздела одна на обе шапки — сворачиваемую (кнопкой) и обычную.
   * Через переиспользуемый шаблон, а не копией: разошедшись, копии перестали бы
   * выглядеть одним и тем же заголовком.
   */
  const [DefineTitle, ReuseTitle] = createReusableTemplate();

  /**
   * Дорожка раздела: линия слева и отступ содержимого от неё. Отступ на
   * телефоне меньше — вложенных дорожек бывает три подряд, и на широком отступе
   * полям не осталось бы ширины.
   */
  const RAIL_CLASS =
    'ml-2 flex flex-col gap-2 border-l-2 border-default pl-2 transition-colors group-focus-within/section:border-primary/60 sm:pl-3';

  /** Общая раскладка шапки: подпись занимает строку, кнопки жмутся вправо. */
  const HEADING_CLASS = 'flex min-w-0 flex-1 items-center gap-2 text-left';

  /**
   * Шапка сворачиваемого раздела — она же кнопка свёртки: нажатие ловит
   * накладка во всю строку, а не один значок.
   */
  const TRIGGER_CLASS = `${HEADING_CLASS} cursor-pointer before:absolute before:inset-0`;

  const isOpen = ref(false);

  /** Значок свёртки: указывает, куда уедет содержимое раздела. */
  const toggleIcon = computed(() =>
    isOpen.value ? 'tabler:chevron-down' : 'tabler:chevron-right',
  );

  /** Разворачивает или сворачивает раздел. */
  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  /** Добавление раскрывает раздел: иначе новая запись легла бы в свёрнутый. */
  function add(): void {
    isOpen.value = true;

    emit('add');
  }
</script>

<template>
  <section class="group/section col-span-full flex flex-col gap-2">
    <DefineTitle>
      <!-- Значок стоит перед подписью, а не в конце строки: от него вниз уходит
        дорожка, и вместе они читаются как одна ветка. У несворачиваемого раздела
        на его месте пустота — подписи разделов стоят в столбик -->
      <UIcon
        v-if="collapsible"
        :name="toggleIcon"
        class="size-4 shrink-0 text-dimmed transition-colors group-focus-within/section:text-primary"
      />

      <span
        v-else
        class="size-4 shrink-0"
        aria-hidden="true"
      />

      <span
        class="min-w-0 truncate text-sm font-medium text-muted transition-colors group-focus-within/section:text-highlighted"
      >
        {{ title }}
      </span>

      <UBadge
        v-if="count"
        size="sm"
        color="primary"
        variant="subtle"
        class="shrink-0 tabular-nums"
      >
        {{ count }}
      </UBadge>
    </DefineTitle>

    <div class="relative flex min-h-7 items-center gap-2">
      <!-- Нажатие по всей шапке ловит накладка — псевдоэлемент кнопки во всю
        строку: попадать в один значок приходилось прицельно. Кнопки справа
        подняты над накладкой `relative` -->
      <button
        v-if="collapsible"
        type="button"
        :class="TRIGGER_CLASS"
        :aria-expanded="isOpen"
        @click.left.exact.prevent="toggle"
      >
        <ReuseTitle />
      </button>

      <div
        v-else
        :class="HEADING_CLASS"
      >
        <ReuseTitle />
      </div>

      <InfoTooltip
        v-if="hint"
        :text="hint"
        icon="tabler:info-circle-filled"
        class="relative shrink-0 text-dimmed"
      />

      <!-- Своя кнопка добавления, когда обычной не хватает: у модификаторов
        вид выбирают меню, а не одним нажатием -->
      <slot name="actions">
        <UButton
          v-if="addLabel"
          icon="tabler:plus"
          :label="addLabel"
          color="primary"
          variant="soft"
          size="xs"
          class="relative shrink-0"
          @click.left.exact.prevent="add"
        />
      </slot>
    </div>

    <UCollapsible
      v-if="collapsible"
      v-model:open="isOpen"
    >
      <template #content>
        <div :class="RAIL_CLASS">
          <slot />
        </div>
      </template>
    </UCollapsible>

    <div
      v-else
      :class="RAIL_CLASS"
    >
      <slot />
    </div>
  </section>
</template>
