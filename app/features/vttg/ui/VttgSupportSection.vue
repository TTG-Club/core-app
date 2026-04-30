<template>
  <section class="py-28">
    <div class="mx-auto px-6 text-center lg:max-w-330 lg:px-8">
      <h2 class="text-3xl font-bold text-highlighted md:text-5xl">
        Поддержите проект
      </h2>

      <p class="mx-auto mt-5 max-w-2xl text-lg text-toned">
        Ваша поддержка поможет нам полностью реализовать продукт и сделать его
        лучше и масштабнее для всех игроков.
      </p>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <UButton
          size="xl"
          icon="tabler:heart"
          label="Поддержать проект"
          color="primary"
          @click.left.exact.prevent
        />
      </div>
    </div>
  </section>
</template>
