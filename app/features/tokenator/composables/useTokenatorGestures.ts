import { useGesture } from '@vueuse/gesture';
import { getScaleFactor, TokenatorEditMode } from '~tokenator/model';

import { useTokenatorStore } from './useTokenatorStore';

interface UseTokenatorGesturesOptions {
  containerRef: Ref<HTMLElement | null>;
  canvasRef: Ref<HTMLCanvasElement | null>;
  paintMask: (x: number, y: number, prevX?: number, prevY?: number) => void;
  scaleReferenceSize?: number;
  disabled?: MaybeRefOrGetter<boolean>;
}

export function useTokenatorGestures({
  containerRef,
  canvasRef,
  paintMask,
  scaleReferenceSize = 1000,
  disabled = false,
}: UseTokenatorGesturesOptions) {
  const store = useTokenatorStore();

  const isDisabled = toRef(disabled);
  const isDragging = ref(false);
  const isPainting = ref(false);
  const isPinching = ref(false);
  const isHovering = ref(false);
  const cursorX = ref(0);
  const cursorY = ref(0);
  const dragStartPos = { x: 0, y: 0 };
  const bgDragStartPos = { x: 0, y: 0 };
  const canvasPanStartPos = { x: 0, y: 0 };
  const lastPaintPos = { x: 0, y: 0 };

  // Zoom constraints
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 3;
  const SCALE_STEP = 0.12;

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (isDisabled.value || isPinching.value) {
          return;
        }

        // Canvas pan mode
        if (store.canvasViewport.isPanning) {
          isDragging.value = true;
          canvasPanStartPos.x = store.canvasViewport.pan.x;
          canvasPanStartPos.y = store.canvasViewport.pan.y;

          return;
        }

        // Brush mode - start painting immediately on click
        if (store.editMode === TokenatorEditMode.Brush && containerRef.value) {
          if (!store.currentImage) {
            return;
          }

          isPainting.value = true;

          const rect = containerRef.value.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          // Рисуем сразу при клике (без prevX/prevY - будет круг)
          paintMask(x, y);

          lastPaintPos.x = x;
          lastPaintPos.y = y;

          return;
        }

        // Background drag mode
        if (store.editMode === TokenatorEditMode.Background) {
          isDragging.value = true;
          bgDragStartPos.x = store.backgroundStyle.position.x;
          bgDragStartPos.y = store.backgroundStyle.position.y;

          return;
        }

        // Image drag mode
        if (!store.currentImage) {
          return;
        }

        isDragging.value = true;
        dragStartPos.x = store.transform.position.x;
        dragStartPos.y = store.transform.position.y;
      },

      onDrag: ({ xy: [x, y], movement: [mx, my], pinching, dragging }) => {
        if (isDisabled.value || pinching || !dragging) {
          return;
        }

        // Canvas pan mode
        if (store.canvasViewport.isPanning && isDragging.value) {
          store.canvasViewport.pan.x = canvasPanStartPos.x + mx;
          store.canvasViewport.pan.y = canvasPanStartPos.y + my;

          return;
        }

        // Brush mode
        if (store.editMode === TokenatorEditMode.Brush) {
          if (!store.currentImage) {
            return;
          }

          if (containerRef.value) {
            const rect = containerRef.value.getBoundingClientRect();
            const localX = x - rect.left;
            const localY = y - rect.top;

            cursorX.value = localX;
            cursorY.value = localY;

            paintMask(localX, localY, lastPaintPos.x, lastPaintPos.y);

            lastPaintPos.x = localX;
            lastPaintPos.y = localY;
          }

          return;
        }

        // Background drag mode
        if (
          store.editMode === TokenatorEditMode.Background &&
          isDragging.value
        ) {
          const scaleFactor = getScaleFactor(
            containerRef.value,
            scaleReferenceSize,
          );

          store.backgroundStyle.position.x =
            bgDragStartPos.x + mx * scaleFactor;

          store.backgroundStyle.position.y =
            bgDragStartPos.y + my * scaleFactor;

          return;
        }

        // Image drag mode
        if (!store.currentImage) {
          return;
        }

        if (isDragging.value) {
          const scaleFactor = getScaleFactor(
            containerRef.value,
            scaleReferenceSize,
          );

          store.transform.position.x = dragStartPos.x + mx * scaleFactor;
          store.transform.position.y = dragStartPos.y + my * scaleFactor;
        }
      },

      onDragEnd: () => {
        if (isDisabled.value) {
          return;
        }

        isDragging.value = false;
        isPainting.value = false;
      },

      onMove: ({ xy: [x, y] }) => {
        if (isDisabled.value || !containerRef.value) {
          return;
        }

        const rect = containerRef.value.getBoundingClientRect();

        cursorX.value = x - rect.left;
        cursorY.value = y - rect.top;
      },

      onHover: ({ hovering }) => {
        if (isDisabled.value) {
          return;
        }

        isHovering.value = hovering;

        if (!hovering) {
          isPainting.value = false;
        }
      },

      onPinchStart: () => {
        if (isDisabled.value) {
          return;
        }

        isPinching.value = true;
        isDragging.value = false;
      },

      onPinch: ({ event, direction: [dir], velocities: [velocity] }) => {
        event.preventDefault();

        if (
          isDisabled.value ||
          !store.currentImage ||
          store.editMode !== 'none'
        ) {
          return;
        }

        const canvas = canvasRef.value;

        if (!canvas) {
          return;
        }

        // Вычисляем delta внутри pinch handler
        const rect = canvas.getBoundingClientRect();
        const delta = rect.width > 0 ? canvas.width / rect.width : 1;

        // Формула: (STEP / delta) * velocity * direction * currentScale
        const step =
          (SCALE_STEP / delta) *
          (Math.abs(velocity) || 1) *
          dir *
          store.transform.scale;

        store.transform.scale = Math.min(
          Math.max(store.transform.scale + step, MIN_SCALE),
          MAX_SCALE,
        );
      },

      onPinchEnd: () => {
        if (isDisabled.value) {
          return;
        }

        isPinching.value = false;
      },

      onWheel: ({ event, delta: [, deltaY], ctrlKey }) => {
        // Игнорируем ctrl+wheel - обрабатывается в onPinch
        if (ctrlKey || isDisabled.value) {
          return;
        }

        event.preventDefault();

        // Canvas zoom mode (приоритет над image zoom)
        if (store.canvasViewport.isPanning) {
          const zoomSpeed = 0.001;
          const newZoom = store.canvasViewport.zoom - deltaY * zoomSpeed;

          store.canvasViewport.zoom = Math.min(Math.max(newZoom, 0.5), 3);

          return;
        }

        if (!store.currentImage || store.editMode !== 'none') {
          return;
        }

        const zoomSpeed = 0.001;
        const newScale = store.transform.scale - deltaY * zoomSpeed;

        store.transform.scale = Math.min(
          Math.max(newScale, MIN_SCALE),
          MAX_SCALE,
        );
      },
    },
    {
      domTarget: containerRef,
      eventOptions: { passive: false },
      drag: {
        filterTaps: false, // Разрешаем обработку кликов без движения
        threshold: 0, // Убираем порог для начала драга
      },
      pinch: {
        rubberband: true,
      },
    },
  );

  return {
    isDragging,
    isPainting,
    isPinching,
    isHovering,
    cursorX,
    cursorY,
  };
}
