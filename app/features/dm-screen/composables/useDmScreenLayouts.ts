import type {
  ScreenLayout,
  ScreenLayoutTarget,
  ScreenPickerPlacement,
  ScreenPoint,
  ScreenRect,
} from '../model';

import {
  DM_SCREEN_LAYOUTS,
  DM_SCREEN_PICKER_DEFAULT,
  DM_SCREEN_PICKER_STORAGE_KEY,
  getScreenEdgeTarget,
  getScreenZoneRect,
  isScreenLayoutFitting,
  isScreenPickerBand,
  screenPickerPlacementSchema,
} from '../model';
import { useDmScreen } from './useDmScreen';

/** Подбор окон в оставшиеся места раскладки. */
interface LayoutAssist {
  layout: ScreenLayout;
  /** Номера свободных мест по порядку; первое заполняется сейчас. */
  pendingZones: ReadonlyArray<number>;
  /** Окна, которые уже стоят в раскладке. */
  placedIds: ReadonlyArray<string>;
}

/**
 * Читает настройку панели раскладок; незнакомое значение — обычное место.
 * @param storedText - строка из localStorage
 */
function readPickerPlacement(storedText: string): ScreenPickerPlacement {
  const placement = screenPickerPlacementSchema.safeParse(storedText);

  return placement.success ? placement.data : DM_SCREEN_PICKER_DEFAULT;
}

/**
 * Раскладки окон ширмы, как у окон в Windows 11. Пока окно тащат, у
 * бокового края холста оно предлагает занять половину, а у верхнего или
 * нижнего — появляется панель раскладок: окно отпускают над местом в ней. Когда окно встало в
 * раскладку, остальные её места по очереди предлагают выбрать окно — пока
 * не кончатся места или окна.
 *
 * Где стоит панель раскладок (сверху, снизу или скрыта), выбирает мастер;
 * выбор хранится в localStorage.
 */
export const useDmScreenLayouts = createSharedComposable(() => {
  const { windows, board, toBoardPoint, restore, update } = useDmScreen();

  /** Окно, которое тащат сейчас. */
  const draggingId = ref<string>();

  /** Указатель в окне браузера, пока окно тащат. */
  const clientPointer = shallowRef<ScreenPoint>();

  /** Место панели раскладок под указателем: его сообщает сама панель. */
  const pickerTarget = shallowRef<ScreenLayoutTarget>();

  const assist = shallowRef<LayoutAssist>();

  const pointer = computed(() =>
    clientPointer.value ? toBoardPoint(clientPointer.value) : undefined,
  );

  const pickerPlacement = useLocalStorage<ScreenPickerPlacement>(
    DM_SCREEN_PICKER_STORAGE_KEY,
    DM_SCREEN_PICKER_DEFAULT,
    {
      serializer: {
        read: readPickerPlacement,
        write: (placement) => placement,
      },
    },
  );

  /**
   * Ставит панель раскладок к другому краю холста или прячет её.
   * @param placement - где показывать панель
   */
  function setPickerPlacement(placement: ScreenPickerPlacement): void {
    pickerPlacement.value = placement;
  }

  /** Высота панели раскладок: её сообщает сама панель, когда видна. */
  const pickerHeight = ref(0);

  /**
   * Запоминает высоту панели раскладок.
   * @param height - высота панели, px
   */
  function setPickerHeight(height: number): void {
    pickerHeight.value = height;
  }

  /** Раскладки, чьи места на этом холсте не меньше наименьшего окна. */
  const fittingLayouts = computed(() =>
    DM_SCREEN_LAYOUTS.filter((layout) =>
      isScreenLayoutFitting(layout, board.value),
    ),
  );

  const isPickerVisible = computed(
    () =>
      draggingId.value !== undefined
      && pointer.value !== undefined
      && fittingLayouts.value.length > 0
      && isScreenPickerBand(
        pointer.value,
        board.value,
        pickerPlacement.value,
        pickerHeight.value,
      ),
  );

  /** Место, которое окно займёт, если его отпустить. */
  const target = computed<ScreenLayoutTarget | undefined>(() => {
    if (!draggingId.value || !pointer.value) {
      return undefined;
    }

    return isPickerVisible.value
      ? pickerTarget.value
      : getScreenEdgeTarget(pointer.value, board.value);
  });

  /**
   * Прямоугольник места раскладки на холсте.
   * @param layout - раскладка
   * @param zoneIndex - номер места в ней
   */
  function getZoneRect(
    layout: ScreenLayout,
    zoneIndex: number,
  ): ScreenRect | undefined {
    const zone = layout.zones[zoneIndex];

    return zone ? getScreenZoneRect(zone, board.value) : undefined;
  }

  const previewRect = computed<ScreenRect | undefined>(() =>
    target.value
      ? getZoneRect(target.value.layout, target.value.zoneIndex)
      : undefined,
  );

  /** Место, для которого сейчас выбирают окно. */
  const assistRect = computed<ScreenRect | undefined>(() => {
    const active = assist.value;
    const [zoneIndex] = active?.pendingZones ?? [];

    return active && zoneIndex !== undefined
      ? getZoneRect(active.layout, zoneIndex)
      : undefined;
  });

  /** Места, до которых очередь ещё не дошла. */
  const assistQueueRects = computed<Array<ScreenRect>>(() => {
    const active = assist.value;

    if (!active) {
      return [];
    }

    return active.pendingZones
      .slice(1)
      .map((zoneIndex) => getZoneRect(active.layout, zoneIndex))
      .filter((rect) => rect !== undefined);
  });

  /** Окна, которые ещё можно поставить в раскладку. */
  const assistCandidates = computed(() => {
    const active = assist.value;

    return active
      ? windows.value.filter(
          (screenWindow) => !active.placedIds.includes(screenWindow.id),
        )
      : [];
  });

  /**
   * Уходит ли окно на второй план: идёт подбор, а окно в раскладку ещё не
   * поставлено.
   * @param id - окно
   */
  function isDimmed(id: string): boolean {
    return assist.value !== undefined && !assist.value.placedIds.includes(id);
  }

  /**
   * Продолжает подбор со следующего места; без мест или окон подбор
   * заканчивается.
   * @param nextAssist - раскладка, свободные места и поставленные окна
   */
  function continueAssist(nextAssist: LayoutAssist): void {
    const hasCandidates = windows.value.some(
      (screenWindow) => !nextAssist.placedIds.includes(screenWindow.id),
    );

    assist.value =
      nextAssist.pendingZones.length && hasCandidates ? nextAssist : undefined;
  }

  /**
   * Окно начали тащить: подбор окон в прошлую раскладку заканчивается.
   * @param id - окно
   */
  function startDrag(id: string): void {
    draggingId.value = id;
    assist.value = undefined;
  }

  /**
   * Окно тащат дальше.
   * @param client - указатель в окне браузера
   */
  function moveDrag(client: ScreenPoint): void {
    clientPointer.value = client;
  }

  /**
   * Окно отпустили. Над местом раскладки оно занимает это место, а
   * остальные места начинают подбор окон.
   * @returns место, которое заняло окно, или `undefined`
   */
  function endDrag(): ScreenRect | undefined {
    const id = draggingId.value;
    const dropped = target.value;
    const rect = previewRect.value;

    draggingId.value = undefined;
    clientPointer.value = undefined;
    pickerTarget.value = undefined;

    if (!id || !dropped || !rect) {
      return undefined;
    }

    continueAssist({
      layout: dropped.layout,
      pendingZones: dropped.layout.zones
        .map((_, zoneIndex) => zoneIndex)
        .filter((zoneIndex) => zoneIndex !== dropped.zoneIndex),
      placedIds: [id],
    });

    return rect;
  }

  /**
   * Запоминает место панели раскладок под указателем.
   * @param nextTarget - место или `undefined`, если указатель не над местом
   */
  function setPickerTarget(nextTarget?: ScreenLayoutTarget): void {
    pickerTarget.value = nextTarget;
  }

  /**
   * Ставит окно в место, которое заполняется сейчас, и переходит к
   * следующему.
   * @param id - окно
   */
  function place(id: string): void {
    const active = assist.value;
    const rect = assistRect.value;

    if (!active || !rect) {
      return;
    }

    restore(id);
    update(id, rect);

    continueAssist({
      ...active,
      pendingZones: active.pendingZones.slice(1),
      placedIds: [...active.placedIds, id],
    });
  }

  /** Оставляет место пустым и переходит к следующему. */
  function skip(): void {
    const active = assist.value;

    if (active) {
      continueAssist({ ...active, pendingZones: active.pendingZones.slice(1) });
    }
  }

  /** Заканчивает подбор окон. */
  function stopAssist(): void {
    assist.value = undefined;
  }

  return {
    clientPointer: shallowReadonly(clientPointer),
    target,
    isPickerVisible,
    fittingLayouts,
    pickerPlacement: readonly(pickerPlacement),
    setPickerPlacement,
    setPickerHeight,
    previewRect,
    assistRect,
    assistQueueRects,
    assistCandidates,
    isDimmed,
    startDrag,
    moveDrag,
    endDrag,
    setPickerTarget,
    place,
    skip,
    stopAssist,
  };
});
