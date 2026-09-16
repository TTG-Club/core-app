<script setup lang="ts">
  import type {
    BugReportDiagnostics,
    BugReportDiagnosticsSpan,
  } from '../../model';

  import {
    BUG_REPORT_DIAGNOSTICS_APP_VERSION_LABEL,
    BUG_REPORT_DIAGNOSTICS_BROWSER_LABEL,
    BUG_REPORT_DIAGNOSTICS_CHECKS_LABEL,
    BUG_REPORT_DIAGNOSTICS_CLIENT_TITLE,
    BUG_REPORT_DIAGNOSTICS_CLIENTS_LABEL,
    BUG_REPORT_DIAGNOSTICS_COPY_LABEL,
    BUG_REPORT_DIAGNOSTICS_CPU_LABEL,
    BUG_REPORT_DIAGNOSTICS_DEVICE_TITLE,
    BUG_REPORT_DIAGNOSTICS_ELECTRON_LABEL,
    BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE,
    BUG_REPORT_DIAGNOSTICS_EVENT_NAME_LABEL,
    BUG_REPORT_DIAGNOSTICS_EVENTS_TITLE,
    BUG_REPORT_DIAGNOSTICS_FPS_LABEL,
    BUG_REPORT_DIAGNOSTICS_FPS_WARN,
    BUG_REPORT_DIAGNOSTICS_GPU_LABEL,
    BUG_REPORT_DIAGNOSTICS_HEAP_LABEL,
    BUG_REPORT_DIAGNOSTICS_LIGHT_CACHE_LABEL,
    BUG_REPORT_DIAGNOSTICS_LOOP_LAG_LABEL,
    BUG_REPORT_DIAGNOSTICS_LOOP_LAG_WARN_MS,
    BUG_REPORT_DIAGNOSTICS_MEMORY_LABEL,
    BUG_REPORT_DIAGNOSTICS_NO_LABEL,
    BUG_REPORT_DIAGNOSTICS_PING_LABEL,
    BUG_REPORT_DIAGNOSTICS_PLATFORM_LABEL,
    BUG_REPORT_DIAGNOSTICS_QUADTREE_LABEL,
    BUG_REPORT_DIAGNOSTICS_RAW_LABEL,
    BUG_REPORT_DIAGNOSTICS_RAYCAST_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_AREAS_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_DARKNESS_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_DRAWINGS_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_FOG_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_KIND_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_LIGHTS_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_SIZE_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_TEMPLATES_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCENE_TITLE,
    BUG_REPORT_DIAGNOSTICS_SCENE_TOKENS_LABEL,
    BUG_REPORT_DIAGNOSTICS_SCREEN_LABEL,
    BUG_REPORT_DIAGNOSTICS_SERVER_TITLE,
    BUG_REPORT_DIAGNOSTICS_SPAN_COUNT_LABEL,
    BUG_REPORT_DIAGNOSTICS_SPAN_MAX_LABEL,
    BUG_REPORT_DIAGNOSTICS_SPAN_MAX_WARN_MS,
    BUG_REPORT_DIAGNOSTICS_SPAN_NAME_LABEL,
    BUG_REPORT_DIAGNOSTICS_SPAN_TOTAL_LABEL,
    BUG_REPORT_DIAGNOSTICS_SPAN_TOTAL_WARN_MS,
    BUG_REPORT_DIAGNOSTICS_SPANS_TITLE,
    BUG_REPORT_DIAGNOSTICS_USER_AGENT_LABEL,
    BUG_REPORT_DIAGNOSTICS_VIEWPORT_LABEL,
    BUG_REPORT_DIAGNOSTICS_WALLS_LABEL,
    BUG_REPORT_DIAGNOSTICS_YES_LABEL,
  } from '../../model';

  /**
   * Снимок метрик производительности, приложенный к баг-репорту.
   *
   * Повторяет панель «Монитор производительности» из VTTG, включая её цветовые
   * пороги: админ смотрит на репорт теми же глазами, что и на живую панель.
   * Секции, которых в снимке нет (репорт из панели управления, старый формат),
   * не рисуются.
   */
  const { diagnostics } = defineProps<{
    /** Разобранный снимок метрик */
    diagnostics: BugReportDiagnostics;
  }>();

  const { copy } = useCopyAndShare();

  /** Сырой JSON снимка — для выгрузки в задачу или в чат разработчиков */
  const rawJson = computed(() => JSON.stringify(diagnostics, null, 2));

  /** Версия приложения и то, откуда оно запущено */
  const appVersionLabel = computed(() => {
    const version =
      diagnostics.device?.appVersion || BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE;

    const runtime = diagnostics.device?.isElectron
      ? BUG_REPORT_DIAGNOSTICS_ELECTRON_LABEL
      : BUG_REPORT_DIAGNOSTICS_BROWSER_LABEL;

    return `${version} · ${runtime}`;
  });

  /** Цвет частоты кадров: ниже порога жалоба на тормоза обоснована */
  const fpsClass = computed(() =>
    (diagnostics.client?.fps ?? 0) >= BUG_REPORT_DIAGNOSTICS_FPS_WARN
      ? 'text-success'
      : 'text-warning',
  );

  /** Цвет p99 задержки event-loop сервера */
  const loopLagP99Class = computed(() =>
    (diagnostics.server?.loopLag.p99Ms ?? 0)
    < BUG_REPORT_DIAGNOSTICS_LOOP_LAG_WARN_MS
      ? 'text-success'
      : 'text-warning',
  );

  /** Туман войны словами */
  const fogOfWarLabel = computed(() =>
    diagnostics.scene?.fogOfWar
      ? BUG_REPORT_DIAGNOSTICS_YES_LABEL
      : BUG_REPORT_DIAGNOSTICS_NO_LABEL,
  );

  /** Видеокарта; прочерк — WebGL её не назвал */
  const gpuLabel = computed(
    () => diagnostics.device?.gpu || BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE,
  );

  /** Память устройства; прочерк — браузер её не сообщает */
  const deviceMemoryLabel = computed(() => {
    const memory = diagnostics.device?.deviceMemoryGb ?? 0;

    return memory ? `${memory} ГБ` : BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE;
  });

  /** Куча JS; прочерк — размеры кучи есть только в Chromium */
  const jsHeapLabel = computed(() => {
    const device = diagnostics.device;

    if (!device?.jsHeapLimitMb) {
      return BUG_REPORT_DIAGNOSTICS_EMPTY_VALUE;
    }

    return `${device.jsHeapUsedMb} / ${device.jsHeapLimitMb} МБ`;
  });

  /**
   * Цвет суммарного времени участка: столько миллисекунд из каждого окна
   * измерения уходит именно сюда.
   *
   * @param span Замер участка кадра или обработчика события.
   */
  function getSpanTotalClass(span: BugReportDiagnosticsSpan): string {
    return span.totalMs < BUG_REPORT_DIAGNOSTICS_SPAN_TOTAL_WARN_MS
      ? 'text-success'
      : 'text-error';
  }

  /**
   * Цвет самого долгого одиночного выполнения участка.
   *
   * @param span Замер участка кадра или обработчика события.
   */
  function getSpanMaxClass(span: BugReportDiagnosticsSpan): string {
    return span.maxMs < BUG_REPORT_DIAGNOSTICS_SPAN_MAX_WARN_MS
      ? 'text-success'
      : 'text-warning';
  }

  /**
   * Округляет миллисекунды до одного знака — снимок хранит сырые числа.
   *
   * @param value Время в миллисекундах.
   */
  function formatMs(value: number): string {
    return value.toFixed(1);
  }
</script>

<template>
  <div
    class="space-y-5 rounded-xl border border-default bg-default/20 p-4 text-sm"
  >
    <!-- Клиент -->
    <section
      v-if="diagnostics.client"
      class="space-y-2"
    >
      <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">
        {{ BUG_REPORT_DIAGNOSTICS_CLIENT_TITLE }}
      </h3>

      <dl class="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        <div class="flex justify-between gap-2">
          <dt class="text-muted">{{ BUG_REPORT_DIAGNOSTICS_FPS_LABEL }}</dt>

          <dd
            class="font-mono"
            :class="fpsClass"
          >
            {{ diagnostics.client.fps }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">{{ BUG_REPORT_DIAGNOSTICS_PING_LABEL }}</dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.client.pingMs }} мс
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">{{ BUG_REPORT_DIAGNOSTICS_WALLS_LABEL }}</dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.client.walls.total }} /
            {{ diagnostics.client.walls.drawn }} /
            {{ diagnostics.client.walls.cacheHits }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_RAYCAST_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ formatMs(diagnostics.client.raycast.lastMs) }} /
            {{ diagnostics.client.raycast.rays }} /
            {{ diagnostics.client.raycast.walls }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_CHECKS_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.client.raycast.checks }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_LIGHT_CACHE_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            <span class="text-success">
              {{ diagnostics.client.lightCache.hits }}
            </span>
            /
            <span class="text-error">
              {{ diagnostics.client.lightCache.misses }}
            </span>
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_QUADTREE_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.client.quadTreeNodes }}
          </dd>
        </div>
      </dl>

      <!-- Профиль кадра -->
      <div
        v-if="diagnostics.client.frameSpans.length > 0"
        class="space-y-1 pt-1"
      >
        <div class="text-xs text-muted">
          {{ BUG_REPORT_DIAGNOSTICS_SPANS_TITLE }}
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-80 font-mono text-xs">
            <thead class="text-muted">
              <tr>
                <th class="py-1 text-left font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_SPAN_NAME_LABEL }}
                </th>

                <th class="py-1 text-right font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_SPAN_TOTAL_LABEL }}
                </th>

                <th class="py-1 text-right font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_SPAN_COUNT_LABEL }}
                </th>

                <th class="py-1 text-right font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_SPAN_MAX_LABEL }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="span in diagnostics.client.frameSpans"
                :key="span.name"
                class="border-t border-default/50"
              >
                <td class="py-1 pr-2 break-all text-info">{{ span.name }}</td>

                <td
                  class="py-1 text-right"
                  :class="getSpanTotalClass(span)"
                >
                  {{ span.totalMs.toFixed(0) }}
                </td>

                <td class="py-1 text-right text-dimmed">{{ span.count }}</td>

                <td
                  class="py-1 text-right"
                  :class="getSpanMaxClass(span)"
                >
                  {{ formatMs(span.maxMs) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Сервер мира -->
    <section
      v-if="diagnostics.server"
      class="space-y-2 border-t border-default pt-4"
    >
      <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">
        {{ BUG_REPORT_DIAGNOSTICS_SERVER_TITLE }}
      </h3>

      <dl class="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_LOOP_LAG_LABEL }}
          </dt>

          <dd class="font-mono whitespace-nowrap text-highlighted">
            {{ formatMs(diagnostics.server.loopLag.meanMs) }} /
            <span :class="loopLagP99Class">
              {{ formatMs(diagnostics.server.loopLag.p99Ms) }}
            </span>
            / {{ diagnostics.server.loopLag.maxMs.toFixed(0) }} мс
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_CLIENTS_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.server.clients }}
          </dd>
        </div>
      </dl>

      <!-- Топ WS-событий -->
      <div
        v-if="diagnostics.server.topEvents.length > 0"
        class="space-y-1 pt-1"
      >
        <div class="text-xs text-muted">
          {{ BUG_REPORT_DIAGNOSTICS_EVENTS_TITLE }}
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-80 font-mono text-xs">
            <thead class="text-muted">
              <tr>
                <th class="py-1 text-left font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_EVENT_NAME_LABEL }}
                </th>

                <th class="py-1 text-right font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_SPAN_TOTAL_LABEL }}
                </th>

                <th class="py-1 text-right font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_SPAN_COUNT_LABEL }}
                </th>

                <th class="py-1 text-right font-normal">
                  {{ BUG_REPORT_DIAGNOSTICS_SPAN_MAX_LABEL }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="event in diagnostics.server.topEvents"
                :key="event.name"
                class="border-t border-default/50"
              >
                <td class="py-1 pr-2 break-all text-info">
                  {{ event.name }}
                </td>

                <td
                  class="py-1 text-right"
                  :class="getSpanTotalClass(event)"
                >
                  {{ event.totalMs.toFixed(0) }}
                </td>

                <td class="py-1 text-right text-dimmed">{{ event.count }}</td>

                <td
                  class="py-1 text-right"
                  :class="getSpanMaxClass(event)"
                >
                  {{ formatMs(event.maxMs) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Сцена -->
    <section
      v-if="diagnostics.scene"
      class="space-y-2 border-t border-default pt-4"
    >
      <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">
        {{ BUG_REPORT_DIAGNOSTICS_SCENE_TITLE }}
      </h3>

      <dl class="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_KIND_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.kind }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_SIZE_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.width }}×{{ diagnostics.scene.height }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_TOKENS_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.tokens }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_LIGHTS_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.lightSources }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_DRAWINGS_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.drawings }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_AREAS_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.customAreas }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_TEMPLATES_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.measurementTemplates }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_FOG_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ fogOfWarLabel }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCENE_DARKNESS_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.scene.darknessLevel }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Железо и браузер -->
    <section
      v-if="diagnostics.device"
      class="space-y-2 border-t border-default pt-4"
    >
      <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">
        {{ BUG_REPORT_DIAGNOSTICS_DEVICE_TITLE }}
      </h3>

      <dl class="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_APP_VERSION_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ appVersionLabel }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">{{ BUG_REPORT_DIAGNOSTICS_CPU_LABEL }}</dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.device.cpuCores }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_MEMORY_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ deviceMemoryLabel }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">{{ BUG_REPORT_DIAGNOSTICS_HEAP_LABEL }}</dt>

          <dd class="font-mono text-highlighted">
            {{ jsHeapLabel }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_SCREEN_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.device.screen }}
          </dd>
        </div>

        <div class="flex justify-between gap-2">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_VIEWPORT_LABEL }}
          </dt>

          <dd class="font-mono text-highlighted">
            {{ diagnostics.device.viewport }}
          </dd>
        </div>

        <div class="col-span-full flex flex-col gap-0.5">
          <dt class="text-muted">{{ BUG_REPORT_DIAGNOSTICS_GPU_LABEL }}</dt>

          <dd class="font-mono text-xs break-all text-highlighted">
            {{ gpuLabel }}
          </dd>
        </div>

        <div class="col-span-full flex flex-col gap-0.5">
          <dt class="text-muted">
            {{ BUG_REPORT_DIAGNOSTICS_PLATFORM_LABEL }} ·
            {{ BUG_REPORT_DIAGNOSTICS_USER_AGENT_LABEL }}
          </dt>

          <dd class="font-mono text-xs break-all text-highlighted">
            {{ diagnostics.device.platform }} ·
            {{ diagnostics.device.userAgent }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Сырой JSON: в задачу или в чат разработчиков уходит именно он -->
    <UCollapsible class="flex flex-col gap-2 border-t border-default pt-4">
      <UButton
        :label="BUG_REPORT_DIAGNOSTICS_RAW_LABEL"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="tabler:code"
        class="self-start"
      />

      <template #content>
        <div class="space-y-2">
          <UButton
            :label="BUG_REPORT_DIAGNOSTICS_COPY_LABEL"
            color="neutral"
            variant="outline"
            size="xs"
            icon="tabler:copy"
            @click.left.exact.prevent="() => copy(rawJson)"
          />

          <pre
            class="max-h-96 overflow-auto rounded-lg bg-default/40 p-3 font-mono text-xs text-toned"
            >{{ rawJson }}</pre
          >
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
