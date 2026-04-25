<script setup lang="ts">
  definePageMeta({
    layout: 'vttg',
  });

  useSeoMeta({
    title: 'Virtual TTG World — Виртуальный стол для D&D 5e',
    description:
      'VTTG — онлайн-платформа для игры в D&D 5e прямо в браузере. Карты, броски кубиков, интеграция с ttg.club.',
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
      img: 'https://picsum.photos/seed/vttg-map/800/450',
      icon: 'tabler:map',
    },
    {
      title: 'Автоматизация бросков',
      description:
        'Кубики бросаются мгновенно с учётом модификаторов, преимуществ и помех. Результаты видят все игроки.',
      img: 'https://picsum.photos/seed/vttg-dice/800/450',
      icon: 'tabler:dice-d20',
    },
    {
      title: 'Интеграция с ttg.club',
      description:
        'Все заклинания, существа и предметы из базы ttg.club доступны прямо во время игры — без переключения вкладок.',
      img: 'https://picsum.photos/seed/vttg-spells/800/450',
      icon: 'tabler:book-2',
    },
    {
      title: 'Управление персонажами',
      description:
        'Листы персонажей синхронизируются в реальном времени. HP, ресурсы, инвентарь — всё обновляется автоматически.',
      img: 'https://picsum.photos/seed/vttg-char/800/450',
      icon: 'tabler:user-shield',
    },
    {
      title: 'Голос и видео',
      description:
        'Встроенный голосовой чат без сторонних приложений. Играйте с друзьями из любой точки мира.',
      img: 'https://picsum.photos/seed/vttg-voice/800/450',
      icon: 'tabler:microphone',
    },
  ];

  const featureItems: FeatureItem[] = [
    {
      badge: 'Новинка',
      badgeVariant: 'new',
      title: 'Редактор карт нового поколения',
      description:
        'Мощный тайловый редактор с библиотекой из тысяч ассетов. Рисуйте стены, расставляйте мебель, добавляйте освещение и атмосферные эффекты. Карты сохраняются в облаке и доступны на любом устройстве.',
      img: 'https://picsum.photos/seed/vttg-editor/720/480',
      icon: 'tabler:pencil-plus',
    },
    {
      badge: 'Бета',
      badgeVariant: 'beta',
      title: 'ИИ-помощник Мастера',
      description:
        'Генерируйте описания локаций, NPC и случайные встречи одним кликом. ИИ знает правила D&D 5e и предлагает контент, соответствующий уровню партии и тону кампании.',
      img: 'https://picsum.photos/seed/vttg-ai/720/480',
      icon: 'tabler:sparkles',
    },
    {
      badge: 'Скоро',
      badgeVariant: 'soon',
      title: 'Маркетплейс модулей',
      description:
        'Готовые приключения, наборы карт и пакеты ассетов от сообщества. Покупайте, продавайте и делитесь своими творениями с тысячами Мастеров по всему миру.',
      img: 'https://picsum.photos/seed/vttg-market/720/480',
      icon: 'tabler:shopping-bag',
    },
  ];

  const faqItems: FaqItem[] = [
    {
      label: 'Нужно ли устанавливать что-то на компьютер?',
      content:
        'Нет. VTTG работает полностью в браузере — Chrome, Firefox, Safari или Edge. Никаких плагинов, никаких установок. Просто откройте ссылку и начните игру.',
    },
    {
      label: 'Сколько игроков может участвовать в одной сессии?',
      content:
        'В базовом плане — до 6 игроков включая Мастера. В Pro-плане ограничений нет. Все участники видят карту и броски в реальном времени.',
    },
    {
      label: 'Как работает интеграция с ttg.club?',
      content:
        'VTTG напрямую подключается к базе данных ttg.club. Вы можете перетаскивать заклинания, существ и предметы прямо на стол — карточки открываются во всплывающем окне без потери фокуса на игре.',
    },
    {
      label: 'Можно ли использовать свои изображения для карт?',
      content:
        'Да. Загружайте PNG, JPG или WebP до 20 МБ. Изображение автоматически разбивается на тайловую сетку. Поддерживается также импорт карт из Universal VTT формата.',
    },
    {
      label: 'Есть ли мобильная версия?',
      content:
        'Игроки могут подключаться с планшетов и смартфонов — интерфейс адаптирован для тач-управления. Мастеру для комфортной работы с редактором карт рекомендуется десктоп.',
    },
  ];

  const badgeColorMap: Record<
    FeatureItem['badgeVariant'],
    'success' | 'warning' | 'neutral'
  > = {
    new: 'success',
    beta: 'warning',
    soon: 'neutral',
  };
</script>

<template>
  <NuxtLayout>
    <!-- Общая фоновая картинка для hero + carousel -->
    <div class="relative overflow-hidden">
      <img
        src="https://picsum.photos/seed/vttg-hero/1920/1080"
        alt="Virtual TTG World"
        class="absolute inset-0 size-full object-cover object-center"
      />

      <section class="relative flex h-[700px] items-center justify-center px-4">
        <div
          class="relative z-10 flex flex-col items-center gap-6 px-4 text-center"
        >
          <div
            class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
          >
            <UIcon
              name="tabler:sparkles"
              class="size-4"
            />
            Открытая бета — играй бесплатно
          </div>

          <h1
            class="m-0 max-w-4xl text-5xl leading-tight font-black tracking-tight text-highlighted md:text-7xl lg:text-8xl"
          >
            Virtual<br />

            <span class="text-primary">TTG World</span>
          </h1>

          <p class="max-w-xl text-lg text-toned md:text-xl">
            Полноценный виртуальный стол для D&amp;D 5e прямо в браузере. Карты,
            кубики, персонажи — всё в одном месте.
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <UButton
              size="xl"
              icon="tabler:sword"
              label="Начать играть"
            />

            <UButton
              size="xl"
              variant="ghost"
              icon="tabler:play"
              label="Смотреть демо"
            />
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           CAROUSEL
      ═══════════════════════════════════════════════ -->
      <section class="relative z-10">
        <div class="mx-auto px-6 py-20 lg:max-w-330 lg:px-8">
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
              container: 'items-stretch',
              item: 'flex basis-[90%] md:basis-[80%] lg:basis-[70%] transition-opacity duration-300 [&:not(.is-snapped)]:opacity-40',
            }"
          >
            <UCard
              class="mx-2 flex w-full flex-col md:mx-4"
              :ui="{ body: 'p-0 sm:p-0 flex-1 flex flex-col' }"
            >
              <div
                class="relative h-48 w-full shrink-0 overflow-hidden rounded-t-xl sm:h-56 lg:h-64"
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

                <p class="text-lg leading-relaxed text-toned">
                  {{ item.description }}
                </p>
              </div>
            </UCard>
          </UCarousel>
        </div>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════
         FEATURE GRID (зигзаг)
    ═══════════════════════════════════════════════ -->
    <section class="py-24">
      <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
        <div class="mb-16 text-center">
          <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
            Мощь профессионального VTT
          </h2>

          <p class="mt-3 text-toned">
            Созданный для Мастеров, которые ценят своё время
          </p>
        </div>

        <div class="flex flex-col gap-20">
          <div
            v-for="(feature, index) in featureItems"
            :key="index"
            :class="[
              'flex flex-col items-center gap-12 lg:flex-row lg:gap-16',
              index % 2 !== 0 && 'lg:flex-row-reverse',
            ]"
          >
            <!-- Картинка -->
            <div class="w-full lg:w-1/2">
              <div
                class="relative overflow-hidden rounded-2xl border border-default shadow-2xl"
              >
                <img
                  :src="feature.img"
                  :alt="feature.title"
                  class="w-full object-cover"
                />

                <div
                  class="absolute inset-0 bg-linear-to-t from-inverted/30 to-transparent"
                />
              </div>
            </div>

            <!-- Текст -->
            <div class="flex w-full flex-col items-start gap-5 lg:w-1/2">
              <UBadge
                :color="badgeColorMap[feature.badgeVariant]"
                variant="subtle"
                size="sm"
                class="font-semibold tracking-widest uppercase shadow-none"
              >
                {{ feature.badge }}
              </UBadge>

              <h3
                class="text-2xl leading-snug font-bold text-highlighted md:text-3xl"
              >
                {{ feature.title }}
              </h3>

              <p class="text-base leading-relaxed text-toned">
                {{ feature.description }}
              </p>

              <UButton
                variant="link"
                color="primary"
                :padded="false"
                class="group mt-2 font-medium"
              >
                <template #leading>
                  <UIcon
                    :name="feature.icon"
                    class="size-5"
                  />
                </template>
                Узнать подробнее
                <template #trailing>
                  <UIcon
                    name="tabler:arrow-right"
                    class="size-4 transition-transform group-hover:translate-x-1"
                  />
                </template>
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         FAQ
    ═══════════════════════════════════════════════ -->
    <section class="border-y border-default bg-elevated">
      <div class="mx-auto px-6 py-20 lg:max-w-330 lg:px-8">
        <div class="mb-12 text-center">
          <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
            Частые вопросы
          </h2>

          <p class="mt-3 text-toned">Всё, что нужно знать перед первой игрой</p>
        </div>

        <UCard
          class="mx-auto w-full max-w-4xl shadow-sm"
          :ui="{ body: 'p-2 sm:p-4' }"
        >
          <UAccordion
            :items="faqItems"
            variant="ghost"
            size="lg"
            class="w-full"
          />
        </UCard>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         CTA FOOTER
    ═══════════════════════════════════════════════ -->
    <section class="py-28">
      <div class="mx-auto px-6 text-center lg:max-w-330 lg:px-8">
        <h2 class="text-3xl font-bold text-highlighted md:text-5xl">
          Готов к приключению?
        </h2>

        <p class="mt-5 text-lg text-toned">
          Присоединяйся к тысячам игроков, которые уже проводят эпические сессии
          в VTTG.
        </p>

        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <UButton
            size="xl"
            icon="tabler:rocket"
            label="Создать бесплатный аккаунт"
          />
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
