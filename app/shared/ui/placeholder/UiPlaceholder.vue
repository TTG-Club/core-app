<template>
  <div
    class="relative overflow-hidden rounded-lg border border-dashed border-default"
  >
    <svg
      class="absolute inset-0 h-full w-full stroke-inverted/10"
      fill="none"
    >
      <defs>
        <pattern
          id="ui-placeholder-pattern"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
        </pattern>
      </defs>

      <rect
        :fill="`url(#ui-placeholder-pattern)`"
        stroke="none"
        width="100%"
        height="100%"
      ></rect>
    </svg>
  </div>
</template>
