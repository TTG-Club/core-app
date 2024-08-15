<script setup lang="ts">
  import 'virtual:svg-icons-register';
  import ruRU from 'ant-design-vue/locale/ru_RU';
</script>

<template>
  <AConfigProvider
    :locale="ruRU"
    :wave="{ disabled: true }"
  >
    <AStyleProvider>
      <AApp>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </AApp>
    </AStyleProvider>
  </AConfigProvider>
</template>
