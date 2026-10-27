<script setup lang="ts">
  import type {
    FacilitySetupDraft,
    PlayerBastion,
    PlayerBastionMember,
  } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import {
    createSetupDraft,
    FACILITY_SETUP_LABELS,
    getBastionErrorMessage,
    toSetupRequest,
    updateMemberFacilities,
  } from '../../model';
  import FacilitySetupForm from './FacilitySetupForm.vue';

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

  const draft = ref<FacilitySetupDraft>(createSetupDraft(member));
  const isSaving = ref(false);

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
      <FacilitySetupForm
        v-model="draft"
        :character-level="member.characterLevel"
        :limit="member.specialFacilityLimit"
        :id-prefix="`facility-basic-${member.id}`"
      />
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
