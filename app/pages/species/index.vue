<template>
  <NuxtLayout name="section-one-column">
    <template #title>Виды</template>

    <template #default>
      <Head>
        <Title>Виды</Title>
      </Head>

      <NuxtLink to="/species/elf">Elf</NuxtLink>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
  // const { data, status, error } = useProxy('/races', {
  //   method: 'post',
  //   body: {
  //     page: 0,
  //     limit: -1,
  //   },
  // });
</script>
