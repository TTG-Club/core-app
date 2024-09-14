<template>
  <AFlex
    vertical
    :gap="24"
    :class="$style.oneColumn"
  >
    <AFlex
      :gap="12"
      :class="$style.header"
    >
      <h1 :class="$style.title">
        <slot name="title" />
      </h1>

      <AFlex :gap="8">
        <slot name="controls" />
      </AFlex>
    </AFlex>

    <div :class="$style.content">
      <slot />
    </div>
  </AFlex>
</template>

<style lang="scss" module>
  .oneColumn {
    min-height: 100%;
  }

  .header {
    //margin-bottom: 16px;
    //padding: 32px 0 16px 0;
    //
    //@media (max-width: 600px) {
    //  padding: 16px 0 16px 0;
    //}
  }

  .title {
    margin: 0;
    line-height: 38px;
    font: {
      size: 30px;
    }
  }

  .content {
    flex: 1 1 auto;
    padding-bottom: 24px;
  }
</style>
