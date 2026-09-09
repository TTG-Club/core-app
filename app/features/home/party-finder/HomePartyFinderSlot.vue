<script setup lang="ts">
  import { HomePanel } from '~home/ui-kit';

  import {
    PARTY_FINDER_ICON,
    PARTY_FINDER_LABEL,
    PARTY_FINDER_SKELETON_ROWS,
  } from './model';
</script>

<template>
  <!--
    `fill` + `p-0`: содержимое вынуто из потока и растягивается под ряд, высоту
    которого задают статьи. Отступы переехали внутрь — у вынутого из потока
    слоя они бы не работали.
  -->
  <HomePanel
    fill
    :label="PARTY_FINDER_LABEL"
    :icon="PARTY_FINDER_ICON"
    body-class="p-0"
  >
    <!--
      Не пустая коробка, а каркас будущей карточки игры: аватар мастера,
      название, строка условий. Так по макету видно, сколько места блок займёт
      на самом деле, а не «сколько-нибудь».
    -->
    <div class="h-full p-3">
      <div
        class="flex h-full flex-col gap-3 rounded-xl border border-dashed border-default p-3"
      >
        <div class="flex items-center gap-3">
          <div
            class="size-10 shrink-0 rounded-full border border-dashed border-default"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="h-2.5 w-2/3 rounded-full bg-elevated" />

            <div class="h-2 w-1/3 rounded-full bg-elevated" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div
            v-for="index in PARTY_FINDER_SKELETON_ROWS"
            :key="index"
            class="h-2 rounded-full bg-elevated"
            :class="index === PARTY_FINDER_SKELETON_ROWS ? 'w-1/2' : 'w-full'"
          />
        </div>

        <div class="flex flex-wrap gap-1.5">
          <div
            v-for="index in 3"
            :key="index"
            class="h-5 w-16 rounded-md border border-dashed border-default"
          />
        </div>
      </div>
    </div>
  </HomePanel>
</template>
