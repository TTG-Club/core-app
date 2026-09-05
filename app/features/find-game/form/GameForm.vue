<script setup lang="ts">
  import type { CreateGameRequest, Game, GameFormState } from '../model';

  import { StatusCodes } from 'http-status-codes';

  import { MarkupEditor } from '~ui/markup-editor';
  import { UploadImage } from '~ui/upload';

  import { useCityDictionary } from '../composables';
  import {
    CANCEL_LABEL,
    createGame,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_AGE_MAX,
    GAME_AGE_MIN,
    GAME_CITY_MAX_LENGTH,
    GAME_COST_TYPE_LABELS,
    GAME_COST_TYPES,
    GAME_DURATION_TYPE_LABELS,
    GAME_DURATION_TYPES,
    GAME_EDIT_COST_LOCKED_HINT,
    GAME_EDIT_VISIBILITY_HINT,
    GAME_FIELD_AGE_HINT,
    GAME_FIELD_CITY_HINT,
    GAME_FIELD_CITY_LABEL,
    GAME_FIELD_CITY_PLACEHOLDER,
    GAME_FIELD_COST_HINT,
    GAME_FIELD_COST_LABEL,
    GAME_FIELD_CROSSPLAY_LABEL,
    GAME_FIELD_DESCRIPTION_LABEL,
    GAME_FIELD_DESCRIPTION_PLACEHOLDER,
    GAME_FIELD_DURATION_LABEL,
    GAME_FIELD_GAME_CHAT_HINT,
    GAME_FIELD_GAME_CHAT_LABEL,
    GAME_FIELD_GAME_CHAT_PLACEHOLDER,
    GAME_FIELD_GENRE_HINT,
    GAME_FIELD_GENRE_LABEL,
    GAME_FIELD_GENRE_PLACEHOLDER,
    GAME_FIELD_IMAGE_HINT,
    GAME_FIELD_IMAGE_LABEL,
    GAME_FIELD_MASTER_CHAT_HINT,
    GAME_FIELD_MASTER_CHAT_LABEL,
    GAME_FIELD_MASTER_CHAT_PLACEHOLDER,
    GAME_FIELD_MAX_AGE_LABEL,
    GAME_FIELD_MAX_PLAYERS_HINT,
    GAME_FIELD_MAX_PLAYERS_LABEL,
    GAME_FIELD_MIN_AGE_LABEL,
    GAME_FIELD_PLAYERS_TO_START_LABEL,
    GAME_FIELD_REQUIREMENTS_LABEL,
    GAME_FIELD_REQUIREMENTS_PLACEHOLDER,
    GAME_FIELD_STARTING_LEVEL_LABEL,
    GAME_FIELD_SYSTEM_LABEL,
    GAME_FIELD_TITLE_LABEL,
    GAME_FIELD_TITLE_PLACEHOLDER,
    GAME_FIELD_TYPE_LABEL,
    GAME_FIELD_VENUE_HINT,
    GAME_FIELD_VENUE_LABEL,
    GAME_FIELD_VENUE_PLACEHOLDER,
    GAME_FIELD_VIRTUAL_TABLE_LABEL,
    GAME_FIELD_VIRTUAL_TABLE_PLACEHOLDER,
    GAME_FIELD_VISIBILITY_HINT,
    GAME_FIELD_VISIBILITY_LABEL,
    GAME_FORM_AGE_ERROR,
    GAME_FORM_CREATED_TOAST,
    GAME_FORM_FORMAT_SECTION,
    GAME_FORM_LIMIT_HINT,
    GAME_FORM_MAIN_SECTION,
    GAME_FORM_PLAYERS_ERROR,
    GAME_FORM_PLAYERS_SECTION,
    GAME_FORM_SUBMIT_LABEL,
    GAME_FORM_UPDATED_TOAST,
    GAME_GENRE_MAX_LENGTH,
    GAME_GENRE_SUGGESTIONS,
    GAME_IMAGE_MAX_SIZE,
    GAME_IMAGE_SECTION,
    GAME_PLAYERS_MAX,
    GAME_PLAYERS_MIN,
    GAME_REQUIREMENTS_MAX_LENGTH,
    GAME_STARTING_LEVEL_MAX,
    GAME_STARTING_LEVEL_MIN,
    GAME_SYSTEM_LABELS,
    GAME_SYSTEMS,
    GAME_TITLE_MAX_LENGTH,
    GAME_TYPE_LABELS,
    GAME_TYPES,
    GAME_URL_MAX_LENGTH,
    GAME_VENUE_MAX_LENGTH,
    GAME_VISIBILITIES,
    GAME_VISIBILITY_LABELS,
    GAMES_ROUTE,
    getFindGameErrorMessage,
    getFindGameStatus,
    updateGame,
  } from '../model';
  import { GameCover } from '../ui';
  import { GameSourcesField } from './ui';

  /**
   * Форма одна на создание и редактирование: поля и правила у них совпадают,
   * а расходятся только источник начальных значений и запрос при отправке.
   */
  const { game = null, hasSessions = false } = defineProps<{
    /** Редактируемая игра; `null` — создание новой. */
    game?: Game | null;
    /**
     * У игры уже есть сессии. Тогда платность заблокирована: у сессий
     * бесплатной игры нет платёжных полей, а у платной они обязательны,
     * и сервис такую правку отвергает.
     */
    hasSessions?: boolean;
  }>();

  const emit = defineEmits<{
    saved: [game: Game];
  }>();

  const toast = useToast();

  const isEdit = computed(() => !!game);

  /** Пустая форма новой игры с безопасными значениями по умолчанию. */
  function createEmptyForm(): GameFormState {
    return {
      title: '',
      system: 'DND_2024',
      imageUrl: '',
      virtualTableUrl: '',
      masterChatUrl: '',
      gameChatUrl: '',
      genre: '',
      description: '',
      requirements: '',
      allowedSources: [],
      type: 'ONLINE',
      city: '',
      venue: '',
      playersToStart: 3,
      maxPlayers: 5,
      minAge: null,
      maxAge: null,
      startingLevel: 1,
      crossplayAllowed: false,
      durationType: 'CAMPAIGN',
      costType: 'FREE',
      visibility: 'PUBLIC',
    };
  }

  /**
   * Заполняет форму существующей игрой. Пустые поля сервиса приходят как
   * `null`, а форма держит их строками.
   * @param source Редактируемая игра.
   */
  function toFormState(source: Game): GameFormState {
    return {
      title: source.title,
      system: source.system,
      imageUrl: source.imageUrl ?? '',
      virtualTableUrl: source.virtualTableUrl ?? '',
      masterChatUrl: source.masterChatUrl ?? '',
      // Чужой чат игры сервис не отдаёт, но форму открывает только мастер:
      // ему приходит и он.
      gameChatUrl: source.gameChatUrl ?? '',
      genre: source.genre ?? '',
      description: source.description,
      requirements: source.requirements,
      allowedSources: [...source.allowedSources],
      type: source.type,
      city: source.city ?? '',
      venue: source.venue ?? '',
      playersToStart: source.playersToStart,
      maxPlayers: source.maxPlayers,
      minAge: source.minAge,
      maxAge: source.maxAge,
      startingLevel: source.startingLevel,
      crossplayAllowed: source.crossplayAllowed,
      durationType: source.durationType,
      costType: source.costType,
      visibility: source.visibility,
    };
  }

  const form = ref<GameFormState>(game ? toFormState(game) : createEmptyForm());

  const isSaving = ref(false);
  const submitError = ref<string | null>(null);
  const isLimitReached = ref(false);

  // Пока файл жмётся и льётся в S3, публикацию держим закрытой: иначе игра
  // сохранится без «догоняющей» обложки.
  const isCoverUploading = ref(false);

  // Мост undefined ↔ пустая строка: форма хранит адрес обложки строкой,
  // а UploadImage работает со `string | undefined`.
  const coverImage = computed<string | undefined>({
    get: () => form.value.imageUrl || undefined,
    set: (value) => {
      form.value.imageUrl = value ?? '';
    },
  });

  /**
   * Строит варианты выбора из перечисления и карты подписей: значения сервиса
   * пользователю не показываются.
   * @param values Значения перечисления.
   * @param labels Подписи значений.
   */
  function toSelectItems<Value extends string>(
    values: ReadonlyArray<Value>,
    labels: Record<Value, string>,
  ) {
    return values.map((value) => ({ value, label: labels[value] }));
  }

  /** Жанры из «Руководства Мастера» плюс уже выбранный, если он свой. */
  const citySearch = ref('');

  const { cityNames, isLoading: areCitiesLoading } =
    useCityDictionary(citySearch);

  // Выбранный город остаётся в списке, даже когда подсказки уже про другое:
  // иначе выбор пропадал бы из поля при следующем наборе.
  const cityItems = computed(() => [
    ...new Set(
      form.value.city ? [form.value.city, ...cityNames.value] : cityNames.value,
    ),
  ]);

  /**
   * Ставит город, которого не нашлось в справочнике.
   * @param value Название города.
   */
  function addCity(value: string): void {
    form.value.city = value.trim().slice(0, GAME_CITY_MAX_LENGTH);
  }

  const genreItems = computed(() => [
    ...new Set(
      form.value.genre
        ? [...GAME_GENRE_SUGGESTIONS, form.value.genre]
        : GAME_GENRE_SUGGESTIONS,
    ),
  ]);

  /**
   * Ставит вписанный вручную жанр.
   * @param value Название жанра.
   */
  function addGenre(value: string): void {
    form.value.genre = value.trim().slice(0, GAME_GENRE_MAX_LENGTH);
  }

  const systemItems = toSelectItems(GAME_SYSTEMS, GAME_SYSTEM_LABELS);
  const typeItems = toSelectItems(GAME_TYPES, GAME_TYPE_LABELS);

  const durationItems = toSelectItems(
    GAME_DURATION_TYPES,
    GAME_DURATION_TYPE_LABELS,
  );

  const costItems = toSelectItems(GAME_COST_TYPES, GAME_COST_TYPE_LABELS);

  const visibilityItems = toSelectItems(
    GAME_VISIBILITIES,
    GAME_VISIBILITY_LABELS,
  );

  // Город сервис принимает только у офлайн-игры, поэтому поле и появляется
  // только там — иначе форма отправила бы заведомо отвергаемый запрос.
  const isOffline = computed(() => form.value.type === 'OFFLINE');

  // Сервис отвергает смену платности у игры с сессиями, поэтому выбор гаснет
  // заранее и объясняет почему.
  const isCostLocked = computed(() => isEdit.value && hasSessions);

  const playersError = computed(() =>
    form.value.playersToStart > form.value.maxPlayers
      ? GAME_FORM_PLAYERS_ERROR
      : null,
  );

  const ageError = computed(() => {
    const { minAge, maxAge } = form.value;

    return minAge !== null && maxAge !== null && minAge > maxAge
      ? GAME_FORM_AGE_ERROR
      : null;
  });

  const isValid = computed(
    () =>
      !!form.value.title.trim()
      && !!form.value.description.trim()
      && !!form.value.requirements.trim()
      && !playersError.value
      && !ageError.value
      && !isCoverUploading.value,
  );

  /** Собирает тело запроса: пустые необязательные поля не отправляются. */
  function toRequest(): CreateGameRequest {
    const state = form.value;

    const request: CreateGameRequest = {
      title: state.title.trim(),
      system: state.system,
      description: state.description.trim(),
      requirements: state.requirements.trim(),
      type: state.type,
      playersToStart: state.playersToStart,
      maxPlayers: state.maxPlayers,
      startingLevel: state.startingLevel,
      crossplayAllowed: state.crossplayAllowed,
      durationType: state.durationType,
      costType: state.costType,
      visibility: state.visibility,
    };

    if (state.imageUrl.trim()) {
      request.imageUrl = state.imageUrl.trim();
    }

    if (state.virtualTableUrl.trim()) {
      request.virtualTableUrl = state.virtualTableUrl.trim();
    }

    if (state.masterChatUrl.trim()) {
      request.masterChatUrl = state.masterChatUrl.trim();
    }

    if (state.gameChatUrl.trim()) {
      request.gameChatUrl = state.gameChatUrl.trim();
    }

    if (state.genre.trim()) {
      request.genre = state.genre.trim();
    }

    if (state.allowedSources.length) {
      request.allowedSources = state.allowedSources;
    }

    if (isOffline.value && state.city.trim()) {
      request.city = state.city.trim();
    }

    // Место встречи уходит только у офлайна: сервис отвечает 400 на адрес
    // стола в онлайн-игре.
    if (isOffline.value && state.venue.trim()) {
      request.venue = state.venue.trim();
    }

    if (state.minAge !== null) {
      request.minAge = state.minAge;
    }

    if (state.maxAge !== null) {
      request.maxAge = state.maxAge;
    }

    return request;
  }

  /** Публикует новую игру или сохраняет правки существующей. */
  async function submit(): Promise<void> {
    if (!isValid.value) {
      return;
    }

    isSaving.value = true;
    submitError.value = null;
    isLimitReached.value = false;

    try {
      const request = toRequest();

      const saved = game
        ? await updateGame(game.id, request)
        : await createGame(request);

      toast.add({
        title: isEdit.value ? GAME_FORM_UPDATED_TOAST : GAME_FORM_CREATED_TOAST,
        color: 'success',
        icon: 'tabler:check',
      });

      emit('saved', saved);
    } catch (error) {
      // Лимит незавершённых игр сервис отдаёт отдельным 409 — у него своя
      // подсказка, иначе мастеру непонятно, что делать дальше. При правке
      // такого отказа не бывает: лимит проверяется только при создании.
      isLimitReached.value =
        !isEdit.value && getFindGameStatus(error) === StatusCodes.CONFLICT;

      submitError.value = getFindGameErrorMessage(error);

      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: submitError.value,
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <UAlert
      v-if="isLimitReached"
      color="warning"
      variant="subtle"
      icon="tabler:alert-triangle"
      :title="submitError ?? ''"
      :description="GAME_FORM_LIMIT_HINT"
    />

    <section class="flex flex-col gap-4">
      <h3 class="text-lg font-semibold text-highlighted">
        {{ GAME_FORM_MAIN_SECTION }}
      </h3>

      <UFormField
        :label="GAME_FIELD_TITLE_LABEL"
        required
      >
        <UInput
          v-model="form.title"
          :maxlength="GAME_TITLE_MAX_LENGTH"
          :placeholder="GAME_FIELD_TITLE_PLACEHOLDER"
          class="w-full"
        />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          :label="GAME_FIELD_SYSTEM_LABEL"
          required
        >
          <USelect
            v-model="form.system"
            :items="systemItems"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="GAME_FIELD_GENRE_LABEL"
          :hint="GAME_FIELD_GENRE_HINT"
        >
          <USelectMenu
            v-model="form.genre"
            :items="genreItems"
            :placeholder="GAME_FIELD_GENRE_PLACEHOLDER"
            create-item
            class="w-full"
            @create="addGenre"
          />
        </UFormField>
      </div>

      <UFormField
        :label="GAME_FIELD_IMAGE_LABEL"
        :help="GAME_FIELD_IMAGE_HINT"
      >
        <UploadImage
          v-model="coverImage"
          v-model:uploading="isCoverUploading"
          :section="GAME_IMAGE_SECTION"
          :max-size="GAME_IMAGE_MAX_SIZE"
        >
          <template #preview>
            <GameCover
              :image-url="form.imageUrl || null"
              :alt="form.title"
              :game-type="form.type"
              class="max-w-80"
            />
          </template>
        </UploadImage>
      </UFormField>

      <UFormField :label="GAME_FIELD_VIRTUAL_TABLE_LABEL">
        <UInput
          v-model="form.virtualTableUrl"
          type="url"
          :maxlength="GAME_URL_MAX_LENGTH"
          :placeholder="GAME_FIELD_VIRTUAL_TABLE_PLACEHOLDER"
          class="w-full"
        />
      </UFormField>

      <!-- Разговоры группы живут там, где она привыкла: чат с мастером
        открыт всем, чат игры — только принятым -->
      <UFormField
        :label="GAME_FIELD_MASTER_CHAT_LABEL"
        :description="GAME_FIELD_MASTER_CHAT_HINT"
      >
        <UInput
          v-model="form.masterChatUrl"
          type="url"
          :maxlength="GAME_URL_MAX_LENGTH"
          :placeholder="GAME_FIELD_MASTER_CHAT_PLACEHOLDER"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="GAME_FIELD_GAME_CHAT_LABEL"
        :description="GAME_FIELD_GAME_CHAT_HINT"
      >
        <UInput
          v-model="form.gameChatUrl"
          type="url"
          :maxlength="GAME_URL_MAX_LENGTH"
          :placeholder="GAME_FIELD_GAME_CHAT_PLACEHOLDER"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="GAME_FIELD_DESCRIPTION_LABEL"
        required
      >
        <MarkupEditor
          v-model="form.description"
          :placeholder="GAME_FIELD_DESCRIPTION_PLACEHOLDER"
        />
      </UFormField>

      <UFormField
        :label="GAME_FIELD_REQUIREMENTS_LABEL"
        required
      >
        <UTextarea
          v-model="form.requirements"
          :rows="3"
          :maxlength="GAME_REQUIREMENTS_MAX_LENGTH"
          :placeholder="GAME_FIELD_REQUIREMENTS_PLACEHOLDER"
          class="w-full"
        />
      </UFormField>

      <GameSourcesField v-model="form.allowedSources" />
    </section>

    <section class="flex flex-col gap-4">
      <h3 class="text-lg font-semibold text-highlighted">
        {{ GAME_FORM_FORMAT_SECTION }}
      </h3>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          :label="GAME_FIELD_TYPE_LABEL"
          required
        >
          <USelect
            v-model="form.type"
            :items="typeItems"
            class="w-full"
          />
        </UFormField>

        <!-- Город выбирается из справочника: иначе фильтр каталога
          рассыпается на «Санкт-Петербург», «СПб» и «спб». Своего города в
          списке может не оказаться — тогда его вписывают руками -->
        <UFormField
          v-if="isOffline"
          :label="GAME_FIELD_CITY_LABEL"
          :hint="GAME_FIELD_CITY_HINT"
        >
          <USelectMenu
            v-model="form.city"
            v-model:search-term="citySearch"
            :items="cityItems"
            :loading="areCitiesLoading"
            ignore-filter
            create-item
            :placeholder="GAME_FIELD_CITY_PLACEHOLDER"
            class="w-full"
            @create="addCity"
          />
        </UFormField>

        <!-- Города игроку мало: по нему видно, доедет ли он вообще, а по
          месту — как добираться -->
        <UFormField
          v-if="isOffline"
          :label="GAME_FIELD_VENUE_LABEL"
          :hint="GAME_FIELD_VENUE_HINT"
          class="sm:col-span-2"
        >
          <UInput
            v-model="form.venue"
            :maxlength="GAME_VENUE_MAX_LENGTH"
            :placeholder="GAME_FIELD_VENUE_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          :label="GAME_FIELD_DURATION_LABEL"
          required
        >
          <USelect
            v-model="form.durationType"
            :items="durationItems"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="GAME_FIELD_COST_LABEL"
          :hint="
            isCostLocked ? GAME_EDIT_COST_LOCKED_HINT : GAME_FIELD_COST_HINT
          "
          required
        >
          <USelect
            v-model="form.costType"
            :items="costItems"
            :disabled="isCostLocked"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField
        :label="GAME_FIELD_VISIBILITY_LABEL"
        :hint="isEdit ? GAME_EDIT_VISIBILITY_HINT : GAME_FIELD_VISIBILITY_HINT"
        required
      >
        <USelect
          v-model="form.visibility"
          :items="visibilityItems"
          class="w-full"
        />
      </UFormField>
    </section>

    <section class="flex flex-col gap-4">
      <h3 class="text-lg font-semibold text-highlighted">
        {{ GAME_FORM_PLAYERS_SECTION }}
      </h3>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          :label="GAME_FIELD_PLAYERS_TO_START_LABEL"
          :error="playersError ?? undefined"
          required
        >
          <UInputNumber
            v-model="form.playersToStart"
            :min="GAME_PLAYERS_MIN"
            :max="GAME_PLAYERS_MAX"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="GAME_FIELD_MAX_PLAYERS_LABEL"
          :hint="GAME_FIELD_MAX_PLAYERS_HINT"
          required
        >
          <UInputNumber
            v-model="form.maxPlayers"
            :min="GAME_PLAYERS_MIN"
            :max="GAME_PLAYERS_MAX"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField
          :label="GAME_FIELD_MIN_AGE_LABEL"
          :hint="GAME_FIELD_AGE_HINT"
          :error="ageError ?? undefined"
        >
          <UInputNumber
            v-model="form.minAge"
            :min="GAME_AGE_MIN"
            :max="GAME_AGE_MAX"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="GAME_FIELD_MAX_AGE_LABEL">
          <UInputNumber
            v-model="form.maxAge"
            :min="GAME_AGE_MIN"
            :max="GAME_AGE_MAX"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="GAME_FIELD_STARTING_LEVEL_LABEL"
          required
        >
          <UInputNumber
            v-model="form.startingLevel"
            :min="GAME_STARTING_LEVEL_MIN"
            :max="GAME_STARTING_LEVEL_MAX"
            class="w-full"
          />
        </UFormField>
      </div>

      <UCheckbox
        v-model="form.crossplayAllowed"
        :label="GAME_FIELD_CROSSPLAY_LABEL"
      />
    </section>

    <div class="flex flex-wrap justify-end gap-2">
      <UButton
        :to="GAMES_ROUTE"
        color="neutral"
        variant="ghost"
        :label="CANCEL_LABEL"
      />

      <UButton
        icon="tabler:device-floppy"
        :loading="isSaving"
        :disabled="!isValid"
        :label="GAME_FORM_SUBMIT_LABEL"
        @click.left.exact.prevent="submit"
      />
    </div>
  </div>
</template>
