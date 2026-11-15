<script setup lang="ts">
  import { HomeEyebrow } from '~home/ui-kit';

  import {
    DICE_CALCULATOR_CLOSE_ROUTE,
    DICE_CALCULATOR_TITLE,
    DICE_HEADER_LABELS,
    DICE_ICONS,
  } from '../model';

  // Предыдущий адрес внутри сайта; у прямой ссылки и внешнего захода его нет.
  const backUrlSchema = z.string().startsWith('/');

  const router = useRouter();

  /**
   * Закрывает калькулятор и возвращает туда, откуда его открыли.
   *
   * Назад по истории — только если предыдущая страница была на сайте: так
   * сохраняются её прокрутка и фильтры. Тому, кто пришёл по прямой ссылке,
   * возвращаться некуда — он попадает на главную.
   */
  function close(): void {
    const backUrl = backUrlSchema.safeParse(window.history.state?.back);

    if (backUrl.success) {
      router.back();

      return;
    }

    navigateTo(DICE_CALCULATOR_CLOSE_ROUTE);
  }
</script>

<template>
  <header class="flex items-start gap-3">
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <HomeEyebrow :label="DICE_HEADER_LABELS.eyebrow" />

      <h1
        class="font-display text-3xl leading-none font-bold text-highlighted lg:text-4xl"
      >
        {{ DICE_CALCULATOR_TITLE }}
      </h1>

      <p class="max-w-2xl text-sm text-pretty text-muted">
        {{ DICE_HEADER_LABELS.lead }}
      </p>
    </div>

    <UTooltip :text="DICE_HEADER_LABELS.close">
      <UButton
        variant="ghost"
        color="neutral"
        :icon="DICE_ICONS.close"
        :aria-label="DICE_HEADER_LABELS.close"
        @click.left.exact.prevent="close"
      />
    </UTooltip>
  </header>
</template>
