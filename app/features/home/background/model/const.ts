/**
 * Минимальное количество частиц на экране
 */
export const PARTICLES_MIN_COUNT = 20;

/**
 * Делитель для расчёта количества частиц на основе площади экрана
 * Формула: (ширина * высота) / PARTICLES_DENSITY_DIVIDER
 */
export const PARTICLES_DENSITY_DIVIDER = 15000;

/**
 * Минимальный размер частицы в пикселях
 */
export const PARTICLE_SIZE_MIN = 0.5;

/**
 * Максимальный размер частицы в пикселях
 */
export const PARTICLE_SIZE_MAX = 1.5;

/**
 * Минимальная скорость движения частицы по оси Y
 */
export const PARTICLE_SPEED_MIN = 0.2;

/**
 * Максимальная скорость движения частицы по оси Y
 */
export const PARTICLE_SPEED_MAX = 0.7;

/**
 * Минимальная прозрачность частицы (0-1)
 */
export const PARTICLE_OPACITY_MIN = 0.3;

/**
 * Максимальная прозрачность частицы (0-1)
 */
export const PARTICLE_OPACITY_MAX = 0.8;
