<script setup lang="ts">
  export interface SvgIconProps {
    icon: string;
    size?: string | number;
    raw?: boolean;
  }

  const props = withDefaults(defineProps<SvgIconProps>(), {
    size: '1em',
    raw: false,
  });

  const iconName = computed(() => (!props.raw ? getIconName(props.icon) : ''));

  const sizeCalculated = computed(() => {
    if (/^\d+$/.test(String(props.size))) {
      return `${props.size}px`;
    }

    if (/^\d+(?:px|em)$/i.test(String(props.size))) {
      return props.size;
    }

    console.error(`[SvgIcon]: size "${String(props.size)}" is incorrect.`);

    return undefined;
  });

  const error = computed(() => {
    if (!iconName.value) {
      return `[SvgIcon]: icon "${String(props.icon)}" not found.`;
    }

    if (!sizeCalculated.value) {
      return `[SvgIcon]: size "${String(props.size)}" is incorrect.`;
    }

    return '';
  });

  const RawSvgIcon = computed(() =>
    props.raw && props.icon
      ? defineComponent({ template: props.icon })
      : undefined,
  );
</script>

<template>
  <span
    v-if="icon && raw && RawSvgIcon"
    :class="$style.svgIcon"
    class="anticon"
  >
    <RawSvgIcon />
  </span>

  <span
    v-else-if="!error && !raw"
    :class="$style.svgIcon"
    class="anticon"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <use :href="iconName" />
    </svg>
  </span>

  <span
    v-else
    :class="$style.error"
  >
    {{ error }}
  </span>
</template>

<style lang="scss" module>
  .svgIcon {
    transform: translateZ(0);

    overflow: hidden;
    display: inline-block;
    flex-shrink: 0;

    width: v-bind(sizeCalculated);
    height: v-bind(sizeCalculated);

    line-height: v-bind(sizeCalculated);
    color: currentColor;
    text-align: center;
    vertical-align: initial;

    fill: currentColor;

    svg {
      width: v-bind(sizeCalculated);
      height: v-bind(sizeCalculated);
    }
  }

  .error {
    overflow: hidden;
    display: none !important;

    width: 0;
    height: 0;

    visibility: hidden;
  }
</style>
