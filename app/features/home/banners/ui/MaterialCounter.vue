<script setup lang="ts">
  import { AnimatedNumber } from '~ui/animated-number';

  const { data: counter } = await useAsyncData('material-counter', () =>
    $fetch<number>('/api/v2/statistics/count-all'),
  );
</script>

<template>
  <div :class="$style.card">
    <h3>Статистика</h3>

    <p>
      В настоящее время на сайте представлено следующее количество материалов:
    </p>

    <AnimatedNumber
      :class="$style.stats"
      :value="counter"
    />
  </div>
</template>

<style lang="scss" module>
  .card {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 1 100%;
    flex-direction: column;

    margin-bottom: 12px;
    padding: 12px 12px;
    border: 1px solid var(--color-border);
    border-radius: 10px;

    color: var(--color-text);
    text-decoration: none;

    background: var(--color-bg-secondary);
    box-shadow: 0 0.625rem 0.75rem 0 var(--color-card-shadow);

    .stats {
      font-size: 32px;
      font-weight: 600;
      line-height: 32px;
      color: var(--color-primary);
    }
  }
</style>
