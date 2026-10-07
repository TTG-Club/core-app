<script setup lang="ts">
  import type { MenuItem } from '../model';

  import { MENU_EXTERNAL_ICON, MENU_SOON_LABEL } from '../model';

  const { items } = defineProps<{
    label: string;
    items: Array<MenuItem>;
  }>();

  const emit = defineEmits<{
    action: [actionId: string];
  }>();

  const { user } = useUser();

  // Пункты с ролями видны только пользователям с подходящей ролью
  const links = computed(() =>
    items
      .filter((link) => {
        if (!Array.isArray(link.roles)) {
          return true;
        }

        return link.roles.some((role) => user.value?.roles.includes(role));
      })
      .map((link) => ({
        ...link,
        key: link.action || link.href,
        // У пункта-действия адреса нет: он остаётся кнопкой. Закрытый раздел
        // тоже без адреса, иначе его заглушка «/» подсвечивалась бы на главной.
        to: link.action || link.disabled ? undefined : link.href,
        trailingIcon: link.external ? MENU_EXTERNAL_ICON : undefined,
      })),
  );

  function handleItemClick(link: MenuItem) {
    if (link.action) {
      emit('action', link.action);
    }
  }
</script>

<template>
  <section :class="$style.section">
    <h3
      class="mb-1 px-2.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase"
    >
      {{ label }}
    </h3>

    <ul class="flex flex-col gap-0.5">
      <li
        v-for="link in links"
        :key="link.key"
      >
        <!--
          Обычный @click без .prevent: у пункта-ссылки отменённый клик
          не дал бы NuxtLink перейти в раздел.
        -->
        <UButton
          :to="link.to"
          :icon="link.icon"
          :trailing-icon="link.trailingIcon"
          :disabled="link.disabled"
          variant="ghost"
          color="neutral"
          active-variant="soft"
          active-color="primary"
          block
          :ui="{
            base: 'justify-start gap-2.5 px-2.5 py-2 text-left font-normal',
            leadingIcon: 'size-4.5 text-dimmed',
            trailingIcon: 'size-3.5 text-dimmed',
            label: 'whitespace-normal',
          }"
          :class="$style.item"
          :active-class="$style.active"
          @click="handleItemClick(link)"
        >
          {{ link.label }}

          <UBadge
            v-if="link.disabled"
            :label="MENU_SOON_LABEL"
            size="sm"
            variant="subtle"
            color="neutral"
            class="ml-auto"
          />
        </UButton>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" module>
  // Раздел не рвётся между колонками меню (см. .content в AppMenu)
  .section {
    break-inside: avoid;
    padding-bottom: 32px;
  }

  // Иконка пункта подхватывает цвет текста при наведении и на текущем разделе
  .item {
    &:hover,
    &.active {
      :global(.iconify) {
        color: currentcolor;
      }
    }
  }
</style>
