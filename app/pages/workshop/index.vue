<template>
  <AFlex
    :gap="16"
    vertical
  >
    <PageHeader title="Мастерская" />

    <div :class="$style.workshop">
      <WorkshopSectionSpecies />
    </div>
  </AFlex>
</template>

<style module lang="scss">
  .workshop {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
</style>
