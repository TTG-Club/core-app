<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core';

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

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const { width, height } = useWindowSize();
  const { smaller } = useBreakpoints();

  const particles = ref<Particle[]>([]);
  const animationFrameId = ref<number | null>(null);

  const isMobile = smaller(Breakpoint.MD);

  /**
   * Вычисляет отступ слева для canvas (ширина sidebar на десктопе)
   * @returns Отступ в пикселях
   */
  const leftOffset = computed<number>(() => {
    return isMobile.value ? 0 : 64;
  });

  /**
   * Вычисляет эффективную ширину canvas с учётом sidebar
   * @returns Ширина в пикселях
   */
  const effectiveWidth = computed<number>(() => {
    return width.value - leftOffset.value;
  });

  /**
   * Получает цвет из CSS переменной и конвертирует в RGB
   * @param cssVar - Название CSS переменной
   * @returns RGB строка для использования в rgba()
   */
  function getCssVariableColor(cssVar: string): string {
    if (!import.meta.client) {
      return '128, 128, 128';
    }

    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim();

    // Если это oklch формат, используем временный элемент для конвертации
    if (value.startsWith('oklch')) {
      const temp = document.createElement('div');

      temp.style.color = value;
      document.body.appendChild(temp);

      const rgb = getComputedStyle(temp).color;

      document.body.removeChild(temp);

      // Извлекаем RGB значения из строки "rgb(r, g, b)"
      const match = rgb.match(/\d+/g);

      if (match && match.length >= 3) {
        return `${match[0]}, ${match[1]}, ${match[2]}`;
      }
    }

    return '128, 128, 128';
  }

  /**
   * Вычисляет цвет частиц из CSS переменной --ui-text-dimmed
   * @returns RGB строка для цвета частиц
   */
  const particleColor = computed<string>(() => {
    return getCssVariableColor('--ui-color-primary');
  });

  /**
   * Создает новую частицу со случайными параметрами
   * @param isInitial - Флаг первичной инициализации (распределяет по всей высоте)
   * @returns Объект частицы с координатами, размером, скоростью и прозрачностью
   */
  function createParticle(isInitial = false): Particle {
    return {
      x: Math.random() * effectiveWidth.value + leftOffset.value,
      y: isInitial
        ? Math.random() * height.value
        : height.value + Math.random() * 100,
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

  /**
   * Инициализирует массив частиц
   */
  function initParticles(): void {
    const particleCount = Math.max(
      PARTICLES_MIN_COUNT,
      Math.floor(
        (effectiveWidth.value * height.value) / PARTICLES_DENSITY_DIVIDER,
      ),
    );

    particles.value = Array.from({ length: particleCount }, () =>
      createParticle(true),
    );
  }

  /**
   * Обновляет позицию частицы и пересоздает её при выходе за границы
   * @param particle - Частица для обновления
   */
  function updateParticle(particle: Particle): void {
    particle.y -= particle.speedY;

    if (particle.y < -10) {
      particle.y = height.value + 10;
      particle.x = Math.random() * effectiveWidth.value + leftOffset.value;
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
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${particleColor.value}, ${particle.opacity})`;
    ctx.fill();
  }

  /**
   * Основной цикл анимации
   */
  function animate(): void {
    const canvas = canvasRef.value;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width.value, height.value);

    particles.value.forEach((particle) => {
      updateParticle(particle);
      drawParticle(ctx, particle);
    });

    animationFrameId.value = requestAnimationFrame(animate);
  }

  /**
   * Обновляет размеры canvas при изменении размера окна
   */
  function updateCanvasSize(): void {
    const canvas = canvasRef.value;

    if (!canvas) {
      return;
    }

    canvas.width = width.value;
    canvas.height = height.value;
    initParticles();
  }

  onMounted(() => {
    updateCanvasSize();
    animate();
  });

  onUnmounted(() => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value);
    }
  });

  watch([width, height, isMobile], updateCanvasSize);
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none fixed inset-0 z-0 md:left-(--navbar-width)"
    :width="width"
    :height="height"
  />
</template>
