<script setup lang="ts">
  import {
    type Entry,
    type EntryList,
    MarkupRender,
    MarkupRowRender,
  } from '~ui/markup';
  import { isArray } from 'lodash-es';

  defineProps<{
    text: EntryList | Entry;
    label?: string;
  }>();
</script>

<template>
  <div class="">
    <h5
      :class="[
        'float-left mr-1 font-bold italic',
        // '[&:before]:content-[attr(data-icon)]',
      ]"
    >
      <slot v-if="$slots.default" />

      <template v-else> {{ label }}. </template>
    </h5>

    <MarkupRender
      v-if="isArray(text)"
      :entries="text"
    />

    <p v-else>
      <MarkupRowRender :entry="text" />
    </p>
  </div>
</template>
