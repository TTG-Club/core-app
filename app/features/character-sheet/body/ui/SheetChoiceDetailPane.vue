<script setup lang="ts">
  import type { ClassDetailResponse } from '~classes/model';
  import type { FeatDetailResponse } from '~feats/model';
  import type { ItemDetailResponse } from '~items/model';
  import type { SpellDetailResponse } from '~spells/model';

  import type { SheetChoiceOption } from '../../model';

  import { ClassBody } from '~classes/body';
  import { FeatBody } from '~feats/body';
  import { ItemBody } from '~items/body';
  import { SpellBody } from '~spells/body';
  import { MarkupRender } from '~ui/markup';
  import { UiResult } from '~ui/result';

  import {
    CLASSES_DETAIL_BASE_PATH,
    FEATS_DETAIL_BASE_PATH,
    getSpellLevelLabel,
    ITEMS_DETAIL_BASE_PATH,
    SHEET_CHOICE_PICKER_LABELS,
    SPELLS_DETAIL_BASE_PATH,
  } from '../../model';

  /**
   * Запись каталога, загруженная для панели: тело каждого раздела рисует его
   * собственный компонент, поэтому вид записи хранится вместе с ней.
   */
  type CatalogDetail =
    | { kind: 'spell'; spell: SpellDetailResponse }
    | { kind: 'feat'; feat: FeatDetailResponse }
    | { kind: 'item'; item: ItemDetailResponse }
    | { kind: 'class'; detail: ClassDetailResponse };

  /**
   * Панель описания варианта рядом со списком единого пикера. Запись каталога
   * догружается по url и рисуется телом своего раздела — тем же, что в дровере;
   * вариант умения приходит готовой разметкой из записи класса.
   */
  const { option = null } = defineProps<{
    /** Вариант, чьё описание показано; null — вариант ещё не выбран. */
    option?: SheetChoiceOption | null;
  }>();

  const detail = computed(() => option?.detail ?? null);

  const markupDetail = computed(() =>
    detail.value?.kind === 'markup' ? detail.value : null,
  );

  /** Заклинания, которые вариант выдаёт без выбора, с подписью круга. */
  const grantedSpells = computed(() =>
    (markupDetail.value?.grantedSpells ?? []).map((spell) => ({
      ...spell,
      levelLabel: getSpellLevelLabel(spell.level),
    })),
  );

  const catalogDetail = computed(() =>
    detail.value && detail.value.kind !== 'markup' ? detail.value : null,
  );

  /**
   * Url класса, к которому перешли по ссылке внутри описания подкласса: тело
   * класса умеет ходить по своим ссылкам на месте, и панель идёт за ним, а не
   * уводит со страницы листа.
   */
  const navigatedClassUrl = ref<string | null>(null);

  // Переход по ссылке относится к одному варианту: новый вариант — новая запись
  watch(catalogDetail, () => {
    navigatedClassUrl.value = null;
  });

  const requestTarget = computed(() => {
    const target = catalogDetail.value;

    if (!target) {
      return null;
    }

    if (target.kind === 'class' && navigatedClassUrl.value) {
      return { kind: target.kind, url: navigatedClassUrl.value };
    }

    return target;
  });

  const requestKey = computed(() =>
    requestTarget.value
      ? `sheet-choice-detail:${requestTarget.value.kind}:${requestTarget.value.url}`
      : 'sheet-choice-detail:none',
  );

  /**
   * Загружает запись каталога для активного варианта.
   *
   * @returns запись со своим видом; null — варианту описание не нужно.
   */
  async function fetchCatalogDetail(): Promise<CatalogDetail | null> {
    const target = requestTarget.value;

    if (!target) {
      return null;
    }

    switch (target.kind) {
      case 'spell':
        return {
          kind: 'spell',
          spell: await $fetch<SpellDetailResponse>(
            `${SPELLS_DETAIL_BASE_PATH}/${target.url}`,
          ),
        };
      case 'feat':
        return {
          kind: 'feat',
          feat: await $fetch<FeatDetailResponse>(
            `${FEATS_DETAIL_BASE_PATH}/${target.url}`,
          ),
        };
      case 'item':
        return {
          kind: 'item',
          item: await $fetch<ItemDetailResponse>(
            `${ITEMS_DETAIL_BASE_PATH}/${target.url}`,
          ),
        };
      case 'class':
        return {
          kind: 'class',
          detail: await $fetch<ClassDetailResponse>(
            `${CLASSES_DETAIL_BASE_PATH}/${target.url}`,
          ),
        };
      default:
        return null;
    }
  }

  const { data: loaded, status } = useAsyncData(
    requestKey,
    fetchCatalogDetail,
    {
      server: false,
      watch: [requestKey],
      default: () => null,
    },
  );

  const isLoading = computed(
    () => catalogDetail.value !== null && status.value === 'pending',
  );

  const isError = computed(
    () => catalogDetail.value !== null && status.value === 'error',
  );

  /** Запись загружена и относится к активному варианту, а не к прежнему. */
  const catalog = computed<CatalogDetail | null>(() => {
    const target = requestTarget.value;

    const value = loaded.value;

    if (!target || !value || value.kind !== target.kind) {
      return null;
    }

    return isLoading.value ? null : value;
  });

  const isNoDetail = computed(() => option !== null && detail.value === null);

  /**
   * Переход по ссылке внутри описания класса.
   *
   * @param classUrl url класса или подкласса.
   */
  function handleNavigate(classUrl: string) {
    navigatedClassUrl.value = classUrl;
  }
</script>

<template>
  <div class="flex min-h-0 flex-col gap-3">
    <p
      v-if="!option"
      class="grid grow place-items-center p-6 text-center text-sm text-dimmed"
    >
      {{ SHEET_CHOICE_PICKER_LABELS.detailPlaceholder }}
    </p>

    <template v-else>
      <header class="flex flex-wrap items-start gap-2">
        <div class="min-w-0 flex-1">
          <h4 class="text-base font-semibold text-highlighted">
            {{ option.label }}
          </h4>

          <p
            v-if="option.sublabel"
            class="text-sm text-muted"
          >
            {{ option.sublabel }}
          </p>
        </div>

        <UBadge
          v-for="badge in option.badges"
          :key="badge"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ badge }}
        </UBadge>
      </header>

      <p
        v-if="isNoDetail"
        class="text-sm text-dimmed italic"
      >
        {{ SHEET_CHOICE_PICKER_LABELS.noDetail }}
      </p>

      <template v-else-if="markupDetail">
        <!-- Дары варианта — до описания: «Договор цепи» выдаёт «Поиск
          фамильяра», и это игроку важнее прозы правил -->
        <div
          v-if="grantedSpells.length"
          class="flex flex-col gap-1.5 rounded-md border border-default bg-elevated/40 p-2.5"
        >
          <span class="text-xs font-medium text-muted">
            {{ SHEET_CHOICE_PICKER_LABELS.grantedSpells }}
          </span>

          <ul class="flex flex-col gap-1">
            <li
              v-for="spell in grantedSpells"
              :key="spell.url"
              class="flex items-center gap-2 text-sm text-highlighted"
            >
              <UBadge
                size="sm"
                color="neutral"
                variant="subtle"
              >
                {{ spell.levelLabel }}
              </UBadge>

              <span>{{ spell.name }}</span>
            </li>
          </ul>
        </div>

        <div
          v-if="markupDetail.prerequisite"
          class="border-l-2 border-default pl-3 text-sm text-muted"
        >
          <MarkupRender :render-node="markupDetail.prerequisite" />
        </div>

        <div
          v-if="markupDetail.additional"
          class="text-sm text-muted italic"
        >
          <MarkupRender :render-node="markupDetail.additional" />
        </div>

        <MarkupRender
          :render-node="markupDetail.description"
          class="text-sm"
        />
      </template>

      <div
        v-else-if="isLoading"
        class="grid grow place-items-center p-6"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-6 animate-spin text-dimmed"
        />
      </div>

      <UiResult
        v-else-if="isError"
        :title="SHEET_CHOICE_PICKER_LABELS.detailError"
      />

      <template v-else-if="catalog">
        <SpellBody
          v-if="catalog.kind === 'spell'"
          :spell="catalog.spell"
        />

        <FeatBody
          v-else-if="catalog.kind === 'feat'"
          :feat="catalog.feat"
        />

        <ItemBody
          v-else-if="catalog.kind === 'item'"
          :item="catalog.item"
        />

        <ClassBody
          v-else
          :detail="catalog.detail"
          hide-gallery
          navigate-in-place
          @navigate="handleNavigate"
        />
      </template>
    </template>
  </div>
</template>
