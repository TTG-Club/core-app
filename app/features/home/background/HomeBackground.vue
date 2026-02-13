<script setup lang="ts">
  import { useElementBounding, useRafFn } from '@vueuse/core';
  import Color from 'colorjs.io';

  import {
    PARTICLE_OPACITY_MAX,
    PARTICLE_OPACITY_MIN,
    PARTICLE_SIZE_MAX,
    PARTICLE_SIZE_MIN,
    PARTICLE_SPEED_MAX,
    PARTICLE_SPEED_MIN,
    PARTICLES_DENSITY_DIVIDER,
    PARTICLES_MIN_COUNT,
  } from './model';

  import type { Particle } from './model';

  const containerRef = useTemplateRef<HTMLDivElement>('container');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const { width, height } = useElementBounding(containerRef);
  const { name } = useTheme();

  const uiColor = ref(getCurrentColor());

  function getCurrentColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--ui-text')
      .trim();
  }

  watch(
    name,
    () => {
      uiColor.value = getCurrentColor();
    },
    {
      immediate: true,
    },
  );

  function getColor(): Color {
    if (!uiColor.value) {
      return new Color('oklch(0.60, 0.00, 0)');
    }

    return new Color(uiColor.value);
  }

  /**
   * Создает новую частицу со случайными параметрами
   * @returns Объект частицы с координатами, размером, скоростью и прозрачностью
   */
  function createParticle(): Particle {
    return {
      x: Math.random() * width.value,
      y: Math.random() * height.value,
      size:
        Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) +
        PARTICLE_SIZE_MIN,
      speedY:
        Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN) +
        PARTICLE_SPEED_MIN,
      opacity:
        Math.random() * (PARTICLE_OPACITY_MAX - PARTICLE_OPACITY_MIN) +
        PARTICLE_OPACITY_MIN,
    };
  }

  const count = computed(() =>
    Math.max(
      PARTICLES_MIN_COUNT,
      Math.floor((width.value * height.value) / PARTICLES_DENSITY_DIVIDER),
    ),
  );

  const particles = computed<Array<Particle>>(() =>
    Array.from({ length: count.value }, createParticle),
  );

  /**
   * Обновляет позицию частицы и пересоздает её при выходе за границы
   * @param particle - Частица для обновления
   */
  function updateParticle(particle: Particle): void {
    particle.y -= particle.speedY;

    if (particle.y < -10) {
      particle.y = height.value + 10;
      particle.x = Math.random() * width.value;
    }
  }

  /**
   * Отрисовывает частицу на canvas
   * @param ctx - Контекст canvas для рисования
   * @param particle - Частица для отрисовки
   */
  function drawParticle(
    ctx: CanvasRenderingContext2D,
    particle: Particle,
  ): void {
    const color = getColor();

    color.alpha = particle.opacity;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = color.toString({ format: 'oklch' });
    ctx.fill();
  }

  useRafFn(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width.value, height.value);

    for (const particle of particles.value) {
      updateParticle(particle);
      drawParticle(ctx, particle);
    }
  });
</script>

<template>
  <div
    ref="container"
    class="pointer-events-none absolute inset-0 -z-1 size-full"
  >
    <canvas
      ref="canvas"
      :width
      :height
    />
  </div>
</template>
