<script setup lang="ts">
  import type { VttgGuideStep } from '../model';

  import { VTTG_GUIDE_WARNING_ICON } from '../model';
  import VttgGuideCode from './VttgGuideCode.vue';
  import VttgGuideCopyButton from './VttgGuideCopyButton.vue';

  /** Нумерованные шаги инструкции: пояснения, пути по системам, команды и предупреждения. */
  const { steps } = defineProps<{
    steps: Array<VttgGuideStep>;
  }>();
</script>

<template>
  <ol class="flex flex-col gap-8">
    <li
      v-for="(step, stepIndex) in steps"
      :key="step.title"
      class="flex gap-4"
    >
      <span
        class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring ring-primary/30"
      >
        {{ stepIndex + 1 }}
      </span>

      <div class="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
        <h3 class="text-base font-medium text-highlighted">
          {{ step.title }}
        </h3>

        <p
          v-for="paragraph in step.paragraphs"
          :key="paragraph"
          class="text-sm leading-6 text-toned"
        >
          {{ paragraph }}
        </p>

        <dl
          v-if="step.locations"
          class="flex flex-col divide-y divide-default rounded-md border border-default"
        >
          <div
            v-for="platformLocation in step.locations"
            :key="platformLocation.label"
            class="flex flex-col gap-1 py-2 pr-1 pl-3 sm:grid sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-3"
          >
            <dt
              class="flex items-center gap-2 text-sm font-medium text-highlighted"
            >
              <UIcon
                :name="platformLocation.icon"
                class="size-4 shrink-0 text-muted"
              />

              {{ platformLocation.label }}
            </dt>

            <dd class="flex min-w-0 items-center justify-between gap-2">
              <code class="font-mono text-sm break-all text-toned">
                {{ platformLocation.path }}
              </code>

              <VttgGuideCopyButton :text="platformLocation.path" />
            </dd>
          </div>
        </dl>

        <VttgGuideCode
          v-for="code in step.codes"
          :key="code.caption"
          :code="code"
        />

        <UAlert
          v-if="step.warning"
          :description="step.warning"
          :icon="VTTG_GUIDE_WARNING_ICON"
          color="warning"
          variant="subtle"
        />
      </div>
    </li>
  </ol>
</template>
