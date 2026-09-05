<script setup lang="ts">
  import {
    ABILITY_ORDER,
    EXHAUSTION_LEVELS,
    SHEET_SKELETON_COUNTS,
    SHEET_SKELETON_LOADING_LABEL,
  } from '../model';
  import { SheetSkeletonPanel } from './ui';

  // Подложка листа на время загрузки документа. Повторяет раскладку
  // `CharacterSheetBody`: шапка с аватаром, ряд характеристик, сводка и вкладки.
  // Раскладку переключаем container-запросами по тем же порогам, что и сам лист
  // (@2xl — шапка в строку, @5xl — две колонки), поэтому подложка одинаково
  // ложится и на страницу, и в узкий drawer, и на телефон — без JS-измерений.
  const [DefineSummary, ReuseSummary] = createReusableTemplate();
</script>

<template>
  <div
    role="status"
    aria-busy="true"
    class="@container mx-auto flex w-full max-w-350 flex-col gap-4"
  >
    <span class="sr-only">{{ SHEET_SKELETON_LOADING_LABEL }}</span>

    <header
      class="flex flex-col items-center gap-4 @2xl:flex-row @2xl:items-start @2xl:gap-6"
    >
      <div class="relative mb-2 shrink-0 @2xl:mb-0">
        <USkeleton class="size-24 rounded-full" />

        <!-- Кнопки зрения и размера на нижней грани аватара -->
        <div
          class="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1"
        >
          <USkeleton class="size-6 rounded-full" />

          <USkeleton class="size-6 rounded-full" />
        </div>
      </div>

      <div
        class="flex w-full min-w-0 grow flex-col items-center gap-2 @2xl:w-auto @2xl:items-start"
      >
        <USkeleton class="h-8 w-56 max-w-full rounded-md" />

        <USkeleton class="h-4 w-64 max-w-full rounded-sm" />

        <!-- Полоса опыта между подписями уровней -->
        <div class="mt-2 flex w-full items-center gap-3 @5xl:max-w-lg">
          <USkeleton class="h-3 w-6 shrink-0 rounded-sm" />

          <USkeleton class="h-2 grow rounded-full" />

          <USkeleton class="h-3 w-6 shrink-0 rounded-sm" />
        </div>
      </div>

      <div
        class="order-first flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-3 @2xl:order-0 @2xl:w-auto @2xl:flex-col @2xl:flex-nowrap @2xl:items-end @2xl:justify-start @2xl:gap-4"
      >
        <div class="flex items-center gap-1">
          <USkeleton
            v-for="index in SHEET_SKELETON_COUNTS.headerStatusControls"
            :key="index"
            class="size-8 rounded-md"
          />
        </div>

        <div class="flex items-center gap-2 @max-2xl:order-first">
          <USkeleton
            v-for="index in SHEET_SKELETON_COUNTS.headerGameControls"
            :key="index"
            class="size-8 rounded-md"
          />
        </div>
      </div>
    </header>

    <!-- Разделитель листа рисуем как есть: он не зависит от данных -->
    <div class="relative flex items-center justify-center py-1">
      <div
        class="h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent"
      />

      <div class="absolute size-2 rotate-45 border border-primary bg-default" />
    </div>

    <DefineSummary>
      <!--
        На мобильном (< sm) колонки-обёртки и пары плиток схлопываются в
        display:contents — блоки идут в том же порядке order-*, что и в сводке
        самого листа: плитки → здоровье → истощение → ресурсы класса → навыки →
        спасброски → владения. На sm колонки восстанавливаются.
      -->
      <div class="grid grid-cols-2 gap-4 max-sm:@md:grid-cols-4">
        <div class="flex flex-col gap-4 max-sm:contents">
          <div class="grid grid-cols-2 gap-4 max-sm:contents">
            <SheetSkeletonPanel
              v-for="index in SHEET_SKELETON_COUNTS.summaryTiles"
              :key="index"
              center-title
              title-class="w-14"
            >
              <div class="flex items-center justify-center pt-1">
                <USkeleton class="h-6 w-10 rounded-md" />
              </div>
            </SheetSkeletonPanel>
          </div>

          <!-- Здоровье: три значения и строка костей хитов под чертой -->
          <SheetSkeletonPanel
            title-class="w-20"
            class="max-sm:order-1 max-sm:col-span-full"
          >
            <div class="grid grid-cols-3 items-end gap-2 pt-1">
              <div class="flex flex-col items-start gap-1.5">
                <USkeleton class="h-2 w-10 rounded-sm" />

                <USkeleton class="h-6 w-10 rounded-md" />
              </div>

              <div class="flex flex-col items-center gap-1.5">
                <USkeleton class="h-2 w-10 rounded-sm" />

                <USkeleton class="h-5 w-10 rounded-md" />
              </div>

              <div class="flex flex-col items-end gap-1.5">
                <USkeleton class="h-2 w-10 rounded-sm" />

                <USkeleton class="h-5 w-8 rounded-md" />
              </div>
            </div>

            <div
              class="mt-3 flex items-center justify-between border-t border-default/50 pt-3"
            >
              <USkeleton class="h-2.5 w-24 rounded-sm" />

              <USkeleton class="h-3.5 w-10 rounded-sm" />
            </div>
          </SheetSkeletonPanel>

          <!-- Истощение: шесть делений уровня и строка эффектов под чертой -->
          <SheetSkeletonPanel
            title-class="w-20"
            class="max-sm:order-2 max-sm:col-span-full"
          >
            <div class="grid grid-cols-6 gap-1 pt-1">
              <USkeleton
                v-for="level in EXHAUSTION_LEVELS"
                :key="level"
                class="h-7 rounded-md"
              />
            </div>

            <div class="mt-2 border-t border-default/50 pt-2">
              <USkeleton class="h-3 w-32 rounded-sm" />
            </div>
          </SheetSkeletonPanel>

          <SheetSkeletonPanel
            title-class="w-24"
            class="max-sm:order-5 max-sm:col-span-full"
          >
            <div class="grid grid-flow-col grid-cols-2 grid-rows-3 gap-2">
              <div
                v-for="abilityKey in ABILITY_ORDER"
                :key="abilityKey"
                class="flex items-center gap-2 rounded border border-transparent bg-default/30 px-2 py-1.5"
              >
                <USkeleton class="size-3 shrink-0 rounded-full" />

                <USkeleton class="h-2.5 w-14 rounded-sm" />

                <USkeleton class="ml-auto h-4 w-7 rounded-sm" />
              </div>
            </div>
          </SheetSkeletonPanel>

          <!-- Владения: плашка группы и чипы под ней -->
          <SheetSkeletonPanel
            title-class="w-20"
            class="max-sm:order-6 max-sm:col-span-full"
          >
            <div class="flex flex-col gap-4 pt-2">
              <div
                v-for="index in SHEET_SKELETON_COUNTS.proficiencyGroups"
                :key="index"
                class="flex flex-col gap-2"
              >
                <USkeleton class="h-6 w-full rounded-md" />

                <div class="flex flex-wrap gap-1.5">
                  <USkeleton
                    v-for="chipIndex in SHEET_SKELETON_COUNTS.proficiencyChips"
                    :key="chipIndex"
                    class="h-5 w-20 rounded"
                  />
                </div>
              </div>
            </div>
          </SheetSkeletonPanel>
        </div>

        <div class="flex flex-col gap-4 max-sm:contents">
          <div class="grid grid-cols-2 gap-4 max-sm:contents">
            <SheetSkeletonPanel
              v-for="index in SHEET_SKELETON_COUNTS.summaryTiles"
              :key="index"
              center-title
              title-class="w-14"
            >
              <div class="flex items-center justify-center pt-1">
                <USkeleton class="h-6 w-10 rounded-md" />
              </div>
            </SheetSkeletonPanel>
          </div>

          <SheetSkeletonPanel
            title-class="w-28"
            class="max-sm:order-3 max-sm:col-span-full"
          >
            <div class="flex flex-col gap-2">
              <div
                v-for="index in SHEET_SKELETON_COUNTS.classResources"
                :key="index"
                class="flex items-center gap-1.5 rounded bg-default/30 px-2 py-1.5"
              >
                <USkeleton class="h-4 w-9 shrink-0 rounded-sm" />

                <USkeleton class="h-4 w-16 rounded-sm" />

                <USkeleton class="ml-auto size-4 rounded-sm" />
              </div>
            </div>
          </SheetSkeletonPanel>

          <SheetSkeletonPanel
            title-class="w-16"
            class="grow max-sm:order-4 max-sm:col-span-full"
          >
            <div class="flex flex-col gap-0.5">
              <div
                v-for="index in SHEET_SKELETON_COUNTS.skills"
                :key="index"
                class="flex items-center gap-3 px-2 py-1.5"
              >
                <USkeleton class="size-3.5 shrink-0 rounded-full" />

                <USkeleton class="h-2.5 w-8 shrink-0 rounded-sm" />

                <USkeleton class="h-3 grow rounded-sm" />

                <USkeleton class="h-3 w-6 shrink-0 rounded-sm" />
              </div>
            </div>
          </SheetSkeletonPanel>
        </div>
      </div>
    </DefineSummary>

    <div
      class="grid grid-cols-1 gap-4 @5xl:grid-cols-12 @5xl:grid-rows-[min-content_1fr]"
    >
      <div class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-1">
        <!-- Свой @container, как у ряда характеристик в листе: шесть плиток
          встают в строку по ширине ряда, а не вьюпорта -->
        <div class="@container">
          <div class="grid grid-cols-3 gap-3 pb-2 @xl:grid-cols-6">
            <SheetSkeletonPanel
              v-for="abilityKey in ABILITY_ORDER"
              :key="abilityKey"
              center-title
              title-class="w-8"
            >
              <div class="flex items-center justify-center pt-1 pb-2">
                <USkeleton class="h-7 w-10 rounded-md" />
              </div>
            </SheetSkeletonPanel>
          </div>
        </div>
      </div>

      <!-- Сводка слева — только в широкой раскладке; в узкой она внутри
        вкладки «Основное», как и в самом листе -->
      <div
        class="hidden @5xl:col-span-6 @5xl:col-start-1 @5xl:row-span-2 @5xl:row-start-1 @5xl:block @5xl:self-start"
      >
        <ReuseSummary />
      </div>

      <div class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-2">
        <div class="flex items-center gap-6 overflow-hidden">
          <!-- «Основное» есть только в узкой ленте вкладок -->
          <USkeleton class="h-4 w-24 shrink-0 rounded-sm @5xl:hidden" />

          <USkeleton class="h-4 w-28 shrink-0 rounded-sm" />

          <USkeleton class="h-4 w-32 shrink-0 rounded-sm" />

          <USkeleton class="h-4 w-32 shrink-0 rounded-sm" />

          <USkeleton class="h-4 w-20 shrink-0 rounded-sm" />
        </div>

        <div class="mt-3 border-t border-default" />

        <div class="pt-4 @5xl:hidden">
          <ReuseSummary />
        </div>

        <div class="hidden flex-col gap-2 pt-4 @5xl:flex">
          <div
            v-for="index in SHEET_SKELETON_COUNTS.tabRows"
            :key="index"
            class="flex items-center gap-3 rounded-lg border border-default bg-default/30 p-2.5"
          >
            <USkeleton class="size-5 shrink-0 rounded-md" />

            <div class="flex min-w-0 grow flex-col gap-1.5">
              <USkeleton class="h-3.5 w-1/2 rounded-sm" />

              <USkeleton class="h-2.5 w-1/3 rounded-sm" />
            </div>

            <USkeleton class="h-4 w-10 shrink-0 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
