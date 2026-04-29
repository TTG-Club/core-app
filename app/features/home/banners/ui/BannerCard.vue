<script setup lang="ts">
  const props = defineProps<{
    to?: string;
    title: string;
    description: string;
    backgroundUrl: string;
  }>();

  const emit = defineEmits<{
    click: [];
  }>();

  const tag = computed(() =>
    props.to ? resolveComponent('NuxtLink') : 'button',
  );

  function handleClick() {
    if (!props.to) {
      emit('click');
    }
  }
</script>

<template>
  <component
    :is="tag"
    :class="[
      'relative flex flex-col gap-2 bg-muted px-6 py-4',
      'rounded-lg border border-default shadow-lg',
      'group overflow-hidden',
      to ? 'no-underline' : 'cursor-pointer text-left',
    ]"
    :to
    @click.left.exact="handleClick"
  >
    <img
      :class="[
        'absolute inset-0 block size-full object-cover object-center opacity-40',
        'transition-transform duration-200 group-hover:scale-115',
      ]"
      :src="backgroundUrl"
      :alt="title"
    />

    <span class="text-accent relative z-10 text-xl">{{ title }}</span>

    <p class="relative z-10 text-muted">{{ description }}</p>
  </component>
</template>
