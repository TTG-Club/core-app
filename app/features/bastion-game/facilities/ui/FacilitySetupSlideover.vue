<script setup lang="ts">
  import type {
    FacilitySetupDraft,
    PlayerBastion,
    PlayerBastionMember,
  } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import { useFacilityCatalog } from '../../composables';
  import {
    createSetupDraft,
    FACILITY_SETUP_LABELS,
    getAvailableSpecialFacilities,
    getBasicFacilities,
    getBastionErrorMessage,
    STARTING_BASIC_SPACE_LABELS,
    STARTING_BASIC_SPACES,
    toSetupRequest,
    updateMemberFacilities,
  } from '../../model';
  import SpecialFacilityPicker from './SpecialFacilityPicker.vue';

  /**
   * Стартовый выбор сооружений персонажа: два базовых (тесное и вместительное)
   * и специализированные по уровню. Правила повторяют проверку сервера, чтобы
   * кнопки не обещали того, что core-api отвергнет.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion, member } = defineProps<{
    bastion: PlayerBastion;
    member: PlayerBastionMember;
  }>();

  const emit = defineEmits<{
    saved: [bastion: PlayerBastion];
  }>();

  const toast = useToast();
  const { catalog, status: catalogStatus } = useFacilityCatalog();

  const draft = ref<FacilitySetupDraft>(createSetupDraft(member));
  const isSaving = ref(false);

  const basicItems = computed(() =>
    getBasicFacilities(catalog.value).map((facility) => ({
      label: facility.name.rus,
      value: facility.url,
    })),
  );

  const specialFacilities = computed(() =>
    getAvailableSpecialFacilities(catalog.value, member.characterLevel),
  );

  // Панель живёт вместе со страницей: при каждом открытии черновик собирается
  // заново из сохранённого выбора, иначе после отмены остались бы правки.
  watch(isOpen, (opened) => {
    if (opened) {
      draft.value = createSetupDraft(member);
    }
  });

  /** Сохраняет выбор и отдаёт обновлённый бастион родителю. */
  async function save(): Promise<void> {
    isSaving.value = true;

    try {
      const saved = await updateMemberFacilities(
        bastion.id,
        member.id,
        toSetupRequest(draft.value, bastion.version),
      );

      toast.add({ title: FACILITY_SETUP_LABELS.saved, color: 'success' });
      emit('saved', saved);
      isOpen.value = false;
    } catch (error) {
      toast.add({
        title: FACILITY_SETUP_LABELS.saveError,
        description: getBastionErrorMessage(
          error,
          FACILITY_SETUP_LABELS.saveError,
        ),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="FACILITY_SETUP_LABELS.title"
    :description="member.characterName"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div
        v-if="catalogStatus === 'pending' || catalogStatus === 'idle'"
        class="flex flex-col gap-3"
      >
        <USkeleton
          v-for="index in 4"
          :key="index"
          class="h-16"
        />
      </div>

      <p
        v-else-if="catalogStatus === 'error'"
        class="text-sm text-error"
      >
        {{ FACILITY_SETUP_LABELS.catalogError }}
      </p>

      <div
        v-else
        class="flex flex-col gap-8"
      >
        <section class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <h3 class="text-base font-semibold text-highlighted">
              {{ FACILITY_SETUP_LABELS.basicTitle }}
            </h3>

            <p class="text-sm text-muted">
              {{ FACILITY_SETUP_LABELS.basicHint }}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField
              v-for="space in STARTING_BASIC_SPACES"
              :key="space"
              :label="STARTING_BASIC_SPACE_LABELS[space]"
            >
              <USelect
                :id="`facility-basic-${member.id}-${space}`"
                v-model="draft.basic[space]"
                :items="basicItems"
                value-key="value"
                :placeholder="FACILITY_SETUP_LABELS.basicPlaceholder"
                class="w-full"
              />
            </UFormField>
          </div>
        </section>

        <section class="flex flex-col gap-3">
          <h3 class="text-base font-semibold text-highlighted">
            {{ FACILITY_SETUP_LABELS.specialTitle }}
          </h3>

          <p
            v-if="!member.specialFacilityLimit"
            class="text-sm text-muted"
          >
            {{ FACILITY_SETUP_LABELS.specialNone }}
          </p>

          <SpecialFacilityPicker
            v-else
            v-model="draft"
            :facilities="specialFacilities"
            :limit="member.specialFacilityLimit"
          />
        </section>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        class="w-full"
        :cancel-label="FACILITY_SETUP_LABELS.cancel"
        :submit-label="FACILITY_SETUP_LABELS.save"
        submit-icon="tabler:check"
        :loading="isSaving"
        @cancel="isOpen = false"
        @submit="save"
      />
    </template>
  </USlideover>
</template>
