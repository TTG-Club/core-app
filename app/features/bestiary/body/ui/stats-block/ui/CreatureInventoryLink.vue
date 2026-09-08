<script setup lang="ts">
  import type { CreatureInventorySection } from '../../../../model';

  import { ULink } from '#components';

  /**
   * Позиция инвентаря ссылкой: нажатие открывает карточку предмета дровером.
   *
   * Так же ведут себя ссылки разметки: описание существа читают целиком, и уход
   * на страницу предмета ради одной строки терял бы место в карточке. Адрес у
   * ссылки настоящий — по средней кнопке и «открыть в новой вкладке» она
   * по-прежнему ведёт на страницу раздела.
   */
  const { section, url } = defineProps<{
    /** Раздел карточки: он же первый сегмент адреса. */
    section: CreatureInventorySection;

    /** Слаг карточки предмета. */
    url: string;

    /** Подпись позиции с количеством: «Верёвка ×2». */
    label: string;
  }>();

  const { openPreview } = useCatalogPreview();

  const to = computed(() => `/${section}/${url}`);

  /** Показывает карточку предмета дровером вместо перехода на её страницу. */
  function handleClick(): void {
    openPreview(section, url);
  }
</script>

<template>
  <ULink
    :to
    target="_self"
    @click.left.exact.prevent.stop="handleClick"
  >
    {{ label }}
  </ULink>
</template>
