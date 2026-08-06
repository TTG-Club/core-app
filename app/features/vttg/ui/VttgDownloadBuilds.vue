<script setup lang="ts">
  import { useVttgBuilds } from '../composables';
  import {
    formatBuildFileLabel,
    formatBuildSummary,
    formatFileSize,
    VTTG_BUILD_GROUPS,
    VTTG_BUILDS,
    VTTG_BUILDS_TEXT,
  } from '../model';

  /** Кнопка скачивания одного файла сборки. */
  interface BuildFileAction {
    fileName: string;
    /** «Скачать» у единственного файла, иначе формат — «AppImage», «Пакет DEB». */
    label: string;
    /** Вес рядом с подписью — только когда файлов несколько и в строке его уже не показать. */
    size: string;
    downloadUrl: string;
  }

  /** Строка списка: описание платформы плюс то, что нашлось в канале. */
  interface BuildRow {
    id: string;
    name: string;
    icon: string;
    /** `Версия 0.9.327 · 219,2 МБ` — у каждой платформы своя. */
    summary: string | null;
    /** Сборки в канале ещё нет — вместо кнопок бейдж «Скоро». */
    isComingSoon: boolean;
    /** Приглушать ли строку: во время загрузки пустые строки ещё ничего не значат. */
    isDimmed: boolean;
    actions: BuildFileAction[];
  }

  const { buildsById, status, error, load, refresh } = useVttgBuilds();

  // `idle` наравне с `pending`: до onMounted запрос ещё не ушёл, но список уже
  // рисуется — на сервере и на клиенте это должен быть один и тот же скелетон,
  // иначе гидратация ругается на несовпадение разметки.
  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const groups = computed(() =>
    VTTG_BUILD_GROUPS.map((group) => ({
      ...group,
      rows: VTTG_BUILDS.filter(
        (descriptor) => descriptor.group === group.id,
      ).map<BuildRow>((descriptor) => {
        const build = buildsById.value.get(descriptor.id);
        const files = build?.files ?? [];
        const isSingleFile = files.length === 1;

        return {
          id: descriptor.id,
          name: descriptor.name,
          icon: descriptor.icon,
          summary: formatBuildSummary(build),
          isComingSoon: !files.length,
          isDimmed: !isLoading.value && !files.length,
          actions: files.map((file) => ({
            fileName: file.fileName,
            label: formatBuildFileLabel(file, isSingleFile),
            size: !isSingleFile && file.size ? formatFileSize(file.size) : '',
            downloadUrl: file.downloadUrl,
          })),
        };
      }),
    })),
  );

  onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="error"
      class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-default px-3 py-2"
    >
      <p class="text-xs text-muted">{{ VTTG_BUILDS_TEXT.loadError }}</p>

      <UButton
        icon="tabler:refresh"
        size="xs"
        color="neutral"
        variant="soft"
        :loading="isLoading"
        @click.left.exact.prevent="refresh()"
      >
        {{ VTTG_BUILDS_TEXT.retry }}
      </UButton>
    </div>

    <template v-else>
      <div
        v-for="group in groups"
        :key="group.id"
        class="space-y-2"
      >
        <div>
          <p class="text-xs font-medium tracking-wide text-dimmed uppercase">
            {{ group.label }}
          </p>

          <p class="text-xs text-muted">
            {{ group.hint }}
          </p>
        </div>

        <ul class="space-y-1.5">
          <li
            v-for="row in group.rows"
            :key="row.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-default bg-default/40 px-3 py-2"
            :class="{ 'opacity-70': row.isDimmed }"
          >
            <UIcon
              :name="row.icon"
              class="size-4 shrink-0 text-muted"
              aria-hidden="true"
            />

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-highlighted">
                {{ row.name }}
              </p>

              <USkeleton
                v-if="isLoading"
                class="mt-1 h-3 w-32 bg-elevated"
              />

              <p
                v-else-if="row.summary"
                class="truncate text-xs text-muted"
              >
                {{ row.summary }}
              </p>
            </div>

            <!-- Без `shrink-0`: на узком экране пара кнопок форматов должна
                 переноситься внутри блока, а не вылезать за край строки. -->
            <div class="flex flex-wrap items-center justify-end gap-1.5">
              <USkeleton
                v-if="isLoading"
                class="h-6 w-24 rounded-md bg-elevated"
              />

              <UBadge
                v-else-if="row.isComingSoon"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ VTTG_BUILDS_TEXT.comingSoon }}
              </UBadge>

              <template v-else>
                <UButton
                  v-for="action in row.actions"
                  :key="action.fileName"
                  :to="action.downloadUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon="tabler:download"
                  size="xs"
                  color="primary"
                  variant="soft"
                >
                  {{ action.label }}

                  <span
                    v-if="action.size"
                    class="opacity-70"
                  >
                    {{ action.size }}
                  </span>
                </UButton>
              </template>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
