<script setup lang="ts">
  definePageMeta({
    layout: 'vttg',
  });

  useSeoMeta({
    title: 'Virtual TTG Club — Виртуальный стол для D&D 5e',
    description:
      'VTTG — онлайн-платформа для игры в D&D 5e. Карты, броски кубиков, интеграция с ttg.club.',
  });

  interface CarouselCard {
    title: string;
    description: string;
    img: string;
    icon: string;
  }

  interface FeatureItem {
    badge: string;
    badgeVariant: 'new' | 'beta' | 'soon';
    title: string;
    description: string;
    img: string;
    icon: string;
  }

  interface FaqItem {
    label: string;
    content: string;
  }

  const carouselCards: CarouselCard[] = [
    {
      title: 'Интерактивные карты',
      description:
        'Создавайте подземелья, города и дикие земли прямо в браузере. Слои, туман войны, маркеры — всё под рукой.',
      img: '/s3/vttgw/slides/image-1.png',
      icon: 'tabler:map',
    },
    {
      title: 'Интеграция с ttg.club',
      description:
        'Все заклинания, существа и предметы из базы ttg.club доступны прямо во время игры — без переключения вкладок.',
      img: '/s3/vttgw/slides/image-2.png',
      icon: 'tabler:book-2',
    },
    {
      title: 'Управление персонажами',
      description:
        'Листы персонажей синхронизируются в реальном времени. HP, ресурсы, инвентарь — всё обновляется автоматически.',
      img: '/s3/vttgw/slides/image-3.png',
      icon: 'tabler:user-shield',
    },
  ];

  const featureItems: FeatureItem[] = [
    {
      badge: 'Мощно',
      badgeVariant: 'new',
      title: 'Редактор стен',
      description:
        'Удобный инструмент для создания геометрии комнат, настройки дверей и невидимых препятствий.',
      img: 'https://picsum.photos/seed/vttg-walls/720/480',
      icon: 'tabler:wall',
    },
    {
      badge: 'Атмосферно',
      badgeVariant: 'new',
      title: 'Система освещения',
      description:
        'Динамические источники света, направленное освещение и учёт радиуса видимости.',
      img: 'https://picsum.photos/seed/vttg-light/720/480',
      icon: 'tabler:bulb',
    },
    {
      badge: 'Тактика',
      badgeVariant: 'new',
      title: 'Туман войны',
      description:
        'Автоматическое скрытие неизведанных областей. Игроки видят только то, что видят их персонажи.',
      img: 'https://picsum.photos/seed/vttg-fog/720/480',
      icon: 'tabler:cloud-fog',
    },
    {
      badge: 'Удобно',
      badgeVariant: 'new',
      title: 'Токены',
      description:
        'Свободное размещение, масштабирование, привязка к сетке, статусы и отслеживание здоровья.',
      img: 'https://picsum.photos/seed/vttg-tokens/720/480',
      icon: 'tabler:chess-knight',
    },
    {
      badge: 'Синхронизация',
      badgeVariant: 'new',
      title: 'Лист персонажа',
      description:
        'Полная интеграция с базой ttg.club, автоматический подсчет характеристик и броски навыков.',
      img: 'https://picsum.photos/seed/vttg-sheet/720/480',
      icon: 'tabler:file-user',
    },
    {
      badge: 'Автоматизация',
      badgeVariant: 'new',
      title: 'Трекер инициативы',
      description:
        'Быстрое управление порядком ходов, эффектами, концентрацией и состояниями в бою.',
      img: 'https://picsum.photos/seed/vttg-initiative/720/480',
      icon: 'tabler:list-numbers',
    },
    {
      badge: 'Рандом',
      badgeVariant: 'new',
      title: 'Кубики',
      description:
        '3D-кубики с физикой, история бросков, скрытые броски Мастера и поддержка сложных формул.',
      img: 'https://picsum.photos/seed/vttg-dice/720/480',
      icon: 'tabler:dice-5',
    },
    {
      badge: 'Масштаб',
      badgeVariant: 'new',
      title: 'Карта и сцены',
      description:
        'Бесшовный переход между локациями, поддержка анимации, слоев и видео-фонов.',
      img: 'https://picsum.photos/seed/vttg-maps/720/480',
      icon: 'tabler:map-2',
    },
    {
      badge: 'Погружение',
      badgeVariant: 'new',
      title: 'Визуальные эффекты',
      description:
        'Добавьте атмосферы вашей сцене с помощью динамической погоды, частиц, заклинаний и фильтров.',
      img: 'https://picsum.photos/seed/vttg-effects/720/480',
      icon: 'tabler:wand',
    },
  ];

  const faqItems: FaqItem[] = [
    {
      label: 'Нужно ли устанавливать что-то на компьютер?',
      content:
        'Да, но только Мастеру игры. Вы устанавливаете приложение на свой компьютер — оно выступает в роли локального сервера и хранит все карты, миры и ассеты, обеспечивая полный контроль над вашими данными. Игрокам же ничего скачивать не нужно: они просто переходят по вашей ссылке-приглашению и играют прямо в браузере.',
    },
    {
      label: 'Сколько это будет стоить?',
      content:
        'Базовая версия со всеми SRD данными по D&D 5.5 будет полностью БЕСПЛАТНОЙ.',
    },
    {
      label: 'Как работает интеграция с ttg.club?',
      content:
        'В дальнейшем появится возможность оформить подписку, благодаря которой вся база данных сайта ttg.club будет доступна вам прямо внутри приложения VTTG.',
    },
    {
      label: 'Можно ли использовать свои изображения для карт?',
      content:
        'Да. Карты поддерживают загрузку файлов в форматах PNG, JPEG, WebP, а также видеоформатов WEBM и MP4. Вы можете использовать в том числе и полностью анимированные карты.',
    },
    {
      label: 'Будет ли возможность делать свои модули?',
      content:
        'Да, это уже реализовано в альфа-режиме. Возможно, пока еще не везде есть полноценное API, но вы уже можете создавать и подключать собственные внешние модули.',
    },
  ];
</script>

<template>
  <NuxtLayout>
    <UPage>
      <!-- Общая фоновая картинка для hero + carousel -->
      <div class="relative overflow-hidden">
        <img
          :src="'/s3/vttgw/main-bg.png'"
          alt="Virtual TTG Club"
          class="absolute inset-0 size-full object-cover object-center opacity-20"
        />

        <UPageHero
          class="relative z-10"
          :links="[
            {
              label: 'Поддержать проект',
              icon: 'tabler:heart',
              size: 'xl',
              color: 'primary',
            },
          ]"
        >
          <template #headline>
            <UBadge
              variant="subtle"
              class="rounded-full"
            >
              <UIcon
                name="tabler:sparkles"
                class="mr-2 size-4"
              />
              Открытая demo — уже скора
            </UBadge>
          </template>

          <template #title>
            <span
              class="inline-block text-6xl leading-[1.3] font-black tracking-widest drop-shadow-[8px_8px_8px_rgba(0,0,0,0.4)] md:text-8xl lg:text-[110px]"
            >
              Virtual<br />

              <span class="text-[oklch(0.828_0.189_84.429)]">TTG Club</span>
            </span>
          </template>

          <template #description>
            Полноценный виртуальный стол для D&amp;D 5e. <br />
            Карты, кубики, персонажи — всё в одном месте.
          </template>
        </UPageHero>

        <section class="relative z-10 pb-20">
          <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
            <div class="mb-12 text-center">
              <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
                Всё для идеальной игровой сессии
              </h2>
            </div>

            <UCarousel
              v-slot="{ item }"
              :items="carouselCards"
              arrows
              loop
              class-names
              class="mx-auto w-full pb-2 lg:max-w-330"
              :ui="{
                container: 'items-stretch py-2',
                item: 'flex basis-[90%] md:basis-[80%] lg:basis-[70%] transition-opacity duration-300 [&:not(.is-snapped)]:opacity-40',
              }"
            >
              <UCard
                class="mx-2 flex w-full flex-col md:mx-4"
                :ui="{ body: 'p-0 sm:p-0 flex-1 flex flex-col' }"
              >
                <div
                  class="relative h-64 w-full shrink-0 overflow-hidden rounded-t-xl sm:h-80 lg:h-96"
                >
                  <img
                    :src="item.img"
                    :alt="item.title"
                    class="size-full object-cover"
                  />
                </div>

                <div class="flex flex-1 flex-col gap-4 p-6 md:p-8">
                  <div class="flex items-center gap-3">
                    <UIcon
                      :name="item.icon"
                      class="size-8 shrink-0 text-primary"
                    />

                    <h3 class="text-2xl font-bold text-highlighted">
                      {{ item.title }}
                    </h3>
                  </div>

                  <p class="text-sm leading-relaxed text-toned">
                    {{ item.description }}
                  </p>
                </div>
              </UCard>
            </UCarousel>
          </div>
        </section>
      </div>

      <section class="py-18">
        <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
          <USeparator
            class="mb-16 w-full"
            :ui="{ border: 'border-[oklch(0.828_0.189_84.429)]' }"
          >
            <UIcon
              name="tabler:diamond"
              class="size-5 text-[oklch(0.828_0.189_84.429)]"
            />
          </USeparator>

          <div class="mb-16 text-center">
            <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
              Мощный функционал
            </h2>

            <p class="mt-3 text-toned">
              Созданный для Мастеров, которые ценят своё время
            </p>
          </div>

          <UPageGrid class="gap-8 lg:grid-cols-3 lg:gap-12">
            <UBlogPost
              v-for="(feature, index) in featureItems"
              :key="index"
              :title="feature.title"
              :description="feature.description"
              :image="{ src: feature.img, alt: feature.title }"
            />

            <div
              class="col-span-full mt-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              <UIcon
                name="tabler:apps"
                class="mb-4 size-12 text-primary/80"
              />

              <h3 class="text-3xl font-bold text-highlighted">
                И многое другое
              </h3>

              <p class="mx-auto mt-4 max-w-2xl text-lg text-toned">
                Система плейлистов, готовая система пресетов звуковых эффектов,
                система освещения, система заклинаний, автоматизация и многое
                другое.
              </p>
            </div>
          </UPageGrid>
        </div>
      </section>

      <section class="border-y border-default bg-elevated">
        <div class="mx-auto px-6 py-20 lg:max-w-330 lg:px-8">
          <div class="mb-12 text-center">
            <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
              Частые вопросы
            </h2>

            <p class="mt-3 text-toned">
              Всё, что нужно знать перед первой игрой
            </p>
          </div>

          <UAccordion
            :items="faqItems"
            size="xl"
            class="w-full [&_button]:py-5 [&_button_span]:text-xl [&_button_span]:font-medium [&_p]:text-lg"
          />
        </div>
      </section>

      <section class="py-28">
        <div class="mx-auto px-6 text-center lg:max-w-330 lg:px-8">
          <h2 class="text-3xl font-bold text-highlighted md:text-5xl">
            Поддержите проект
          </h2>

          <p class="mx-auto mt-5 max-w-2xl text-lg text-toned">
            Ваша поддержка поможет нам полностью реализовать продукт и сделать
            его лучше и масштабнее для всех игроков.
          </p>

          <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
            <UButton
              size="xl"
              icon="tabler:heart"
              label="Поддержать проект"
              color="primary"
            />
          </div>
        </div>
      </section>
    </UPage>
  </NuxtLayout>
</template>
