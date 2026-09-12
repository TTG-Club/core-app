<script setup lang="ts">
  import {
    COOKIE_POLICY_BULLET_ICON,
    COOKIE_POLICY_INTRO,
    COOKIE_POLICY_SECTIONS,
    COOKIE_POLICY_UPDATED_AT,
    COOKIE_POLICY_UPDATED_DATE_FORMAT,
    COOKIE_POLICY_UPDATED_ICON,
    COOKIE_POLICY_UPDATED_PREFIX,
  } from '../model';

  const { format } = useDayjs();

  const updatedAtLabel = `${COOKIE_POLICY_UPDATED_PREFIX} ${format(COOKIE_POLICY_UPDATED_AT, COOKIE_POLICY_UPDATED_DATE_FORMAT)}`;
</script>

<template>
  <!-- Ширина колонки с текстом ограничена: строка в 1000px не читается -->
  <div class="flex min-w-0 flex-col gap-6 lg:max-w-3xl">
    <div class="flex flex-col items-start gap-3">
      <p
        v-for="paragraph in COOKIE_POLICY_INTRO"
        :key="paragraph"
        class="text-sm leading-6 text-toned"
      >
        {{ paragraph }}
      </p>

      <!-- size="lg" — единственный размер плашки с текстом 14px, как в абзацах -->
      <UBadge
        :label="updatedAtLabel"
        :icon="COOKIE_POLICY_UPDATED_ICON"
        color="neutral"
        variant="subtle"
        size="lg"
        :ui="{ leadingIcon: 'size-4' }"
      />
    </div>

    <section
      v-for="section in COOKIE_POLICY_SECTIONS"
      :id="section.id"
      :key="section.id"
      class="flex scroll-mt-4 flex-col gap-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UIcon
          :name="section.icon"
          class="size-5 shrink-0 text-primary"
        />

        <h2 class="text-lg font-medium text-highlighted">
          {{ section.title }}
        </h2>

        <UBadge
          v-if="section.badge"
          :label="section.badge"
          color="primary"
          variant="subtle"
          size="sm"
        />
      </div>

      <p
        v-for="paragraph in section.paragraphs"
        :key="paragraph"
        class="text-sm leading-6 text-toned"
      >
        {{ paragraph }}
      </p>

      <div
        v-if="section.bullets"
        class="flex flex-col gap-2"
      >
        <div
          v-for="bullet in section.bullets"
          :key="bullet"
          class="flex items-start gap-2"
        >
          <UIcon
            :name="COOKIE_POLICY_BULLET_ICON"
            class="mt-1.5 size-3 shrink-0 text-dimmed"
          />

          <p class="text-sm leading-6 text-muted">
            {{ bullet }}
          </p>
        </div>
      </div>

      <div
        v-if="section.links"
        class="flex flex-col items-start gap-1"
      >
        <ULink
          v-for="link in section.links"
          :key="link.url"
          :to="link.url"
          class="flex items-center gap-1.5 text-sm leading-6 text-primary hover:underline"
        >
          <UIcon
            :name="link.icon"
            class="size-4 shrink-0"
          />

          {{ link.label }}
        </ULink>
      </div>
    </section>
  </div>
</template>
