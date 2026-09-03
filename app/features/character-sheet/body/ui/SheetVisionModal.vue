<script setup lang="ts">
  import type { VisionGrant, VisionKey } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    getVisionGrants,
    SPEED_UNIT_OPTIONS,
    SPEED_UNIT_SHORT_LABELS,
    VISION_DISTANCE_MAX,
    VISION_DISTANCE_MIN,
    VISION_EDITOR_LABELS,
    VISION_LABELS,
    VISION_ORDER,
  } from '../../model';

  /** Строка редактора: своё значение и то, кем чувство выдано сверх него. */
  interface VisionField {
    key: VisionKey;
    label: string;

    /** Чувства этого типа, выданные особенностями; пусто — их нет. */
    grants: VisionGrant[];
  }

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setVision } = useCharacterSheet();

  const draftVision = ref({ ...character.value.vision });

  /** Единица измерения черновика: в ней же подписаны дистанции особенностей. */
  const unitLabel = computed<string>(
    () => SPEED_UNIT_SHORT_LABELS[draftVision.value.unit],
  );

  /**
   * Чувства, выданные особенностями, по типу зрения.
   *
   * Считаются от черновика, а не от листа: игрок мог сменить единицы прямо
   * здесь, и выданная дистанция должна показываться в них же.
   */
  const grantsByKey = computed<Map<VisionKey, VisionGrant[]>>(() => {
    const grouped = new Map<VisionKey, VisionGrant[]>();

    const grants = getVisionGrants({
      ...character.value,
      vision: draftVision.value,
    });

    for (const grant of grants) {
      grouped.set(grant.key, [...(grouped.get(grant.key) ?? []), grant]);
    }

    return grouped;
  });

  /**
   * Строки редактора. На листе дистанция — большее из своего значения и
   * выданного особенностями, поэтому у поля со своим нулём подписывается, чем
   * чувство выдано: иначе редактор выглядел бы расходящимся с подсказкой у
   * аватара, где дистанция есть.
   */
  const visionFields = computed<VisionField[]>(() =>
    VISION_ORDER.map((key) => ({
      key,
      label: VISION_LABELS[key],
      grants: grantsByKey.value.get(key) ?? [],
    })),
  );

  /** Хоть одно чувство выдано особенностями — только тогда нужна сноска. */
  const hasVisionGrants = computed<boolean>(() =>
    visionFields.value.some((field) => field.grants.length > 0),
  );

  function handleApply() {
    setVision({ ...draftVision.value });
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Зрение">
    <template #body>
      <div class="flex flex-col gap-3">
        <div
          v-for="field in visionFields"
          :key="field.key"
          class="flex flex-col gap-1"
        >
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">{{ field.label }}</span>

            <UInputNumber
              v-model="draftVision[field.key]"
              :min="VISION_DISTANCE_MIN"
              :max="VISION_DISTANCE_MAX"
              class="w-40"
            />
          </div>

          <!-- Ноль у обычного зрения — не отсутствие, а «видит без предела» -->
          <span
            v-if="field.key === 'normal'"
            class="text-xs text-dimmed"
          >
            {{ VISION_EDITOR_LABELS.normalHint }}
          </span>

          <!-- В поле правится только своё значение, а чувство может прийти от
            черты или умения вида: без подписи ноль в поле выглядел бы ошибкой,
            ведь в подсказке у аватара дистанция есть -->
          <div
            v-if="field.grants.length"
            class="flex flex-col gap-0.5 text-xs text-muted"
          >
            <span>{{ VISION_EDITOR_LABELS.grantsTitle }}</span>

            <span
              v-for="grant in field.grants"
              :key="grant.source"
              class="text-toned"
            >
              «{{ grant.source }}» — {{ grant.distance }} {{ unitLabel }}
            </span>
          </div>
        </div>

        <!-- Правило одно на все типы зрения, поэтому объясняется один раз, а не
          повторяется у каждой строки -->
        <span
          v-if="hasVisionGrants"
          class="text-xs text-dimmed"
        >
          {{ VISION_EDITOR_LABELS.effectiveHint }}
        </span>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ VISION_EDITOR_LABELS.unit }}
          </span>

          <USelect
            v-model="draftVision.unit"
            :items="SPEED_UNIT_OPTIONS"
            class="w-40"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
