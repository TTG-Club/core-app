<script setup lang="ts">
  import { useFavoriteGames } from '../composables';
  import {
    GAME_FAVORITE_ADD_LABEL,
    GAME_FAVORITE_ICON,
    GAME_FAVORITE_ICON_ACTIVE,
    GAME_FAVORITE_REMOVE_LABEL,
  } from '../model';

  const { gameId, onCover = false } = defineProps<{
    gameId: string;
    /**
     * Звёздочка стоит поверх обложки, а не на светлом фоне. Там ей нужна
     * собственная заливка: на картинке кнопка без фона теряется, а рядом с
     * залитым значком стоимости выглядит выпавшей из ряда.
     */
    onCover?: boolean;
  }>();

  const { isLoggedIn } = useUser();
  const { busyGameId, isFavorite, toggleFavorite } = useFavoriteGames();

  const isMarked = computed(() => isFavorite(gameId));

  const label = computed(() =>
    isMarked.value ? GAME_FAVORITE_REMOVE_LABEL : GAME_FAVORITE_ADD_LABEL,
  );

  const icon = computed(() =>
    isMarked.value ? GAME_FAVORITE_ICON_ACTIVE : GAME_FAVORITE_ICON,
  );

  /** Отмеченная звезда выделена цветом, пустая остаётся спокойной. */
  const color = computed(() => (isMarked.value ? 'warning' : 'neutral'));

  /**
   * Подложка звёздочки на обложке. Заливка `solid` там не годится: у
   * нейтрального цвета фон инвертированный, то есть в тёмных схемах светлый, —
   * кнопка выпадала из ряда значков белым пятном. Тёмная полупрозрачная
   * подложка читается одинаково во всех схемах и на любой картинке.
   */
  const coverClass = computed(() => {
    if (!onCover) {
      return undefined;
    }

    const backdrop = 'bg-black/45 backdrop-blur-sm hover:bg-black/65';

    // Отмеченной звезде цвет задаёт `color`, и белый текст перекрыл бы его.
    return isMarked.value ? backdrop : `${backdrop} text-white`;
  });

  const isBusy = computed(() => busyGameId.value === gameId);

  /** Ставит или снимает отметку; исход показывает уведомление. */
  function handleToggle(): void {
    void toggleFavorite(gameId);
  }
</script>

<!--
  Гостю звёздочки нет вовсе: список избранного личный, и хранить его негде —
  кнопка, ведущая только к отказу сервиса, в карточке лишняя.
-->
<template>
  <UTooltip
    v-if="isLoggedIn"
    :text="label"
  >
    <UButton
      size="sm"
      :color="color"
      variant="ghost"
      :class="coverClass"
      :icon="icon"
      :loading="isBusy"
      :aria-label="label"
      :aria-pressed="isMarked"
      @click.left.exact.prevent.stop="handleToggle"
    />
  </UTooltip>
</template>
