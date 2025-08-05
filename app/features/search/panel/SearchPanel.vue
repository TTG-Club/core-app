<script setup lang="ts">
  import { useGlobalSearch } from '~/features/search/model/composable';

  const { open, isOpen } = useGlobalSearch();
</script>

<template>
  <div class="mt-[3dvw] flex w-1/2 flex-col items-center">
    <UButton
      class="rounded-full"
      :class="$style['glow-button']"
      variant="subtle"
      color="neutral"
      size="xl"
      block
      @click.left.exact.prevent="isOpen = true"
      @click="open"
    >
      <span class="text-sm"
        >Нажмите тут или <UKbd value="\">\</UKbd> для начала поиска</span
      >
    </UButton>
  </div>
</template>

<style module lang="scss">
  .glow-button {
    position: relative;
    border-radius: 9999px;

    &:hover {
      background: var(--ui-bg-accented);
    }
  }

  .glow-button::before {
    content: '';

    position: absolute;
    z-index: -1;
    inset: 0;

    border-radius: inherit;

    background: conic-gradient(
      from var(--gradient-angle),
      #87bfdb,
      #77abc8,
      #6797b5,
      #577f9d,
      #476684,
      #43668a,
      #3e668f,
      #304a66,
      #212e3d,
      #304a66,
      #3e668f,
      #43668a,
      #476684,
      #577f9d,
      #6797b5,
      #77abc8,
      #87bfdb
    );
    filter: blur(4px);

    animation: gradient-rotate 10s linear infinite;
  }

  .glow-button:hover::before {
    background: conic-gradient(
      from var(--gradient-angle),
      #120d0e,
      #321d13,
      #512d19,
      #713d1e,
      #90571d,
      #b0701b,
      #cf8a1a,
      #de9822,
      #eea529,
      #fdb331,
      #eea529,
      #de9822,
      #cf8a1a,
      #b0701b,
      #90571d,
      #713d1e,
      #512d19,
      #321d13,
      #120d0e
    );
  }

  @property --gradient-angle {
    inherits: false;
    initial-value: 0deg;
    syntax: '<angle>';
  }

  @keyframes gradient-rotate {
    0% {
      --gradient-angle: 0deg;
    }
    100% {
      --gradient-angle: 360deg;
    }
  }
</style>
