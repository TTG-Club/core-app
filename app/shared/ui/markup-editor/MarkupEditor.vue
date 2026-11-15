<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';
  import type { EditorView } from '@tiptap/pm/view';
  import type { Editor } from '@tiptap/vue-3';

  import type { MarkupEditorPreset, MarkupTag } from './tags';
  import type { ToolbarHandlers } from './toolbar-items';

  import { Selection } from '@tiptap/pm/state';

  import { buildImageMarker, toMarkupSource, toStoredMarkup } from '~ui/markup';

  import {
    MARKUP_IMAGE_ICON,
    MARKUP_IMAGE_MAX_SIZE,
    MARKUP_IMAGE_UPLOAD_LABEL,
    MARKUP_IMAGE_UPLOADING_LABEL,
  } from './constants';
  import MarkupInsertPanel from './MarkupInsertPanel.vue';
  import {
    BASIC_TAG_KEYS,
    BLOCK_TAGS,
    FORMAT_TAGS,
    INLINE_TAGS,
    INTERACTIVE_TAGS,
    SECTION_TAGS,
  } from './tags';
  import {
    insertImageNode,
    transformPastedMarkupHtml,
    TtgBlockMarker,
    ttgFormatMarks,
    ttgHeadingExtensions,
    TtgImage,
    TtgKeymap,
    ttgListExtensions,
    TtgMarker,
    ttgParagraphExtensions,
    ttgQuoteExtensions,
    TtgSectionLink,
    TtgSeparatorMarkdown,
    ttgTableExtensions,
  } from './tiptap';
  import { buildToolbarItems, TOOLBAR_LAYER_CLASS } from './toolbar-items';

  /** Режим панели ввода под тулбаром (поиск раздела / нотация кубика / подпись таблицы / URL ссылки). */
  type InsertPanelMode =
    | { kind: 'section'; tag: MarkupTag }
    | { kind: 'dice'; tag: MarkupTag }
    | { kind: 'caption' }
    | { kind: 'link'; tag: MarkupTag }
    | { kind: 'image-caption' }
    | { kind: 'image-alt' };

  // Маркеры {@...} в редакторе: форматирующие ({@i}/{@b}/…) — редактируемые марки
  // (можно вкладывать друг в друга и Markdown), остальные — атомарные чипы.
  // Списки {@list} — НАТИВНЫЕ узлы TipTap (см. ttgListExtensions).
  const editorExtensions = [
    TtgMarker,
    TtgBlockMarker,
    TtgSectionLink,
    TtgSeparatorMarkdown,
    TtgImage,
    TtgKeymap,
    ...ttgFormatMarks,
    ...ttgHeadingExtensions,
    ...ttgParagraphExtensions,
    ...ttgListExtensions,
    ...ttgTableExtensions,
    ...ttgQuoteExtensions,
  ];

  // Наружу модель — СТРУКТУРНАЯ форма хранения: строка с JSON-массивом узлов
  // (блоки — объектами `{@table}`/`{@list}`/`{@quote}`/…), либо пустая строка.
  // Автор же правит обычный ИСХОДНИК «Markdown + {@...}» (`source`). Значение с
  // бэкенда (AST/JSON/исходник) приводится к исходнику `toMarkupSource`, а правки
  // обратно в структуру — `toStoredMarkup`. Поле остаётся строковым во всех формах.
  const model = defineModel<string>({ default: '' });

  const {
    placeholder = 'Опиши материал',
    preset = 'full',
    imageSection = undefined,
  } = defineProps<{
    placeholder?: string;
    /**
     * Раздел хранилища для картинок в тексте (первый сегмент ключа в S3). Задан —
     * в редакторе появляется кнопка картинки, вставка из буфера и
     * перетаскиванием. Не задан — картинок нет: так живут пользовательские формы
     * (баг-репорт, лист персонажа, поиск игр).
     */
    imageSection?: string;
    /**
     * Набор кнопок: `full` — всё для мастерской, `basic` — только оформление
     * текста (жирный/курсив/…, заголовки, списки, цитата, ссылка) для
     * пользовательских форм вроде баг-репорта.
     */
    preset?: MarkupEditorPreset;
  }>();

  // Интеграция с обёрткой UFormField (как у UTextarea): id/имя, aria, события
  // валидации и подсветка ошибки. Вне формы всё безопасно вырождается в no-op.
  const {
    emitFormInput,
    emitFormChange,
    emitFormBlur,
    id,
    name,
    highlight,
    ariaAttrs,
  } = useFormField(undefined, { deferInputValidation: true });

  // Редактируемый исходник, с которым работает UEditor. РАЗВЯЗАН с моделью: UEditor
  // видит только эту строку и никогда — результат обратного разбора, поэтому нет
  // «эха»/скачков курсора при round-trip source↔структура. Инициализируется из
  // модели immediate-watcher'ом ниже (не читаем model.value в setup напрямую).
  const source = ref('');

  // Последние синхронизированные значения по обе стороны. По ним отличаем СВОЮ
  // запись (эхо, игнорируем) от ВНЕШНЕЙ смены (загрузка/сброс формы, применяем) —
  // без липких флагов и гонок. Стартовое значение по умолчанию — пустое (как модель).
  let lastModel = '';
  let lastSource = '';

  // Значение модели в том виде, в каком его записал бы редактор. Нужно, чтобы
  // отличить правку автора от пересборки того же самого: бэкенд отдаёт разметку
  // с отступами (`[ "…", {\n  "type" : "list"`), а редактор пишет её плотно, и
  // без сверки с приведённым значением форма считалась бы изменённой сразу
  // после загрузки — сохранение уходило бы на каждое открытие записи.
  let canonicalModel = '';

  // Правка автора (source) → структурная модель. Свою же синхронизацию из модели
  // (source === lastSource) назад не пишем, иначе форма ложно становится «изменённой».
  watch(source, (value) => {
    if (value === lastSource) {
      return;
    }

    lastSource = value;

    const stored = toStoredMarkup(value);

    // Разметка та же, разошлось только оформление записи — модель не трогаем.
    if (stored === canonicalModel) {
      return;
    }

    canonicalModel = stored;
    lastModel = stored;
    model.value = stored;

    // Ввод в редактор → сообщаем форме (гасит ошибку валидации по мере ввода).
    emitFormInput();
  });

  // Внешняя смена модели (маунт/загрузка/сброс формы) → пересобрать исходник. Свою
  // же запись (model === lastModel) пропускаем, чтобы не дёргать редактор. immediate
  // выполняет и первичную инициализацию source из модели на маунте.
  watch(
    model,
    (value) => {
      if (value === lastModel) {
        return;
      }

      lastModel = value;

      const next = toMarkupSource(value);

      lastSource = next;
      canonicalModel = toStoredMarkup(next);
      source.value = next;
    },
    { immediate: true },
  );

  /** Потеря фокуса редактором/полем — триггерим change+blur валидацию формы. */
  function handleFieldBlur() {
    emitFormChange();
    emitFormBlur();
  }

  // false — визуальный режим (UEditor), true — сырой код (textarea).
  const showCode = ref(false);
  const textareaRef = useTemplateRef<HTMLTextAreaElement>('textarea');

  // Отключаем встроенные Markdown-узлы/марки StarterKit, которые сериализуются в
  // Markdown (заголовки/списки/цитата/ссылка + `**`/`*`/`~~`). Всё
  // форматирование даёт наш ttgFormatMarks ({@b}/{@i}/…), а блочные элементы —
  // нативные ttg-узлы ({@h}/{@list}/{@quote}/{@table}) либо {@...}-чипы. Так
  // визуальный редактор НИКОГДА не выдаёт Markdown наружу.
  //
  // heading/paragraph заменяем СВОИМИ узлами (TtgHeading/TtgParagraph): заголовок
  // становится редактируемым и сериализуется в `{@h … | level:N}`, а абзац несёт
  // атрибут выравнивания и при align → `{@p … | align:…}` (см. ttg-heading.ts /
  // ttg-paragraph.ts).
  const starterKit = {
    heading: false,
    paragraph: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    blockquote: false,
    link: false,
    bold: false,
    italic: false,
    strike: false,
    // Underline StarterKit не сериализуется в {@u} и вешает СВОЙ Mod-u —
    // отключаем, чтобы Ctrl+U однозначно переключал ttgUnderline (marks.ts).
    underline: false,
    // Shift+Enter (hardBreak) сериализуется в «  \n» — одиночный перенос строки,
    // на котором падает бэкенд-десериализатор описания. Отключаем: перенос — это
    // новый абзац (Enter). Так наружу не уходит «сырой» одиночный \n.
    hardBreak: false,
    // Блок кода сериализуется в ``` — маркера под него в разметке нет, и такой
    // блок вышел бы на страницу тройными бэктиками. Код из буфера раскладывается
    // построчно обычным текстом (см. transformPastedMarkupHtml).
    codeBlock: false,
  } as const;

  // Правки ProseMirror: приводим ЧУЖОЙ HTML из буфера к нашей схеме. Без этого
  // ProseMirror молча теряет `<strong>`/`<em>`/`<a>` (их марок в схеме нет), а
  // `<hr>`, `<code>` и `<img>` доживают до сохранения чужими узлами и печатаются
  // на странице мусорным текстом.
  //
  // Файлы-картинки из буфера и перетаскивания загружаем сами (см. ниже): без
  // этого ProseMirror их молча отбрасывает.
  const editorProps = {
    transformPastedHTML: transformPastedMarkupHtml,
    handlePaste: handleEditorPaste,
    handleDrop: handleEditorDrop,
  };

  // Картинки в тексте включены, только если форма назвала раздел хранилища.
  const isImageEnabled = computed(() => !!imageSection);

  const { isUploading: isImageUploading, uploadImage } = useImageUpload({
    section: () => imageSection ?? '',
    maxSize: MARKUP_IMAGE_MAX_SIZE,
  });

  const { open: openImageDialog, onChange: onImageDialogChange } =
    useFileDialog({ accept: IMAGE_UPLOAD_ACCEPT, multiple: true });

  // Куда вставлять выбранные в диалоге файлы: в визуальный редактор, с тулбара
  // которого открыли диалог, либо (не задано) — в текст режима кода.
  let imageDialogView: EditorView | undefined;

  /**
   * Файлы-картинки из буфера обмена или перетаскивания.
   *
   * @param transfer - Данные события вставки или перетаскивания
   * @returns Файлы с типом `image/*`
   */
  function getImageFiles(transfer: DataTransfer | null): File[] {
    return Array.from(transfer?.files ?? []).filter((file) =>
      file.type.startsWith('image/'),
    );
  }

  /**
   * Загружает файлы по одному и отдаёт адрес каждого на вставку. Файл, не
   * прошедший проверку, пропускается — пользователь уже увидел причину тостом.
   *
   * @param files - Выбранные, вставленные или перетащенные файлы
   * @param insert - Вставка картинки по адресу загруженного файла
   */
  async function uploadImages(
    files: File[],
    insert: (url: string) => void,
  ): Promise<void> {
    for (const file of files) {
      const url = await uploadImage(file);

      if (url) {
        insert(url);
      }
    }
  }

  /**
   * Открывает выбор файлов с тулбара визуального редактора.
   *
   * @param editor - Редактор, в который встанут картинки
   */
  function pickImages(editor: Editor): void {
    imageDialogView = editor.view;
    openImageDialog();
  }

  /** Открывает выбор файлов из режима кода. */
  function pickImagesIntoCode(): void {
    imageDialogView = undefined;
    openImageDialog();
  }

  onImageDialogChange((files) => {
    const view = imageDialogView;

    uploadImages(Array.from(files ?? []), (url) =>
      view ? insertImageNode(view, url) : insertImageIntoCode(url),
    );
  });

  /**
   * Вставка из буфера: картинка-файл (снимок экрана, скопированное изображение)
   * загружается и встаёт в текст. Буфер с текстом не трогаем: редакторы
   * документов кладут рядом с текстом его снимок картинкой, и вставился бы он.
   *
   * @param view - Представление редактора
   * @param event - Событие вставки
   * @returns true, если вставку обработали сами
   */
  function handleEditorPaste(view: EditorView, event: ClipboardEvent): boolean {
    const files = getImageFiles(event.clipboardData);

    if (
      !isImageEnabled.value
      || !files.length
      || event.clipboardData?.getData('text/plain')
    ) {
      return false;
    }

    event.preventDefault();
    uploadImages(files, (url) => insertImageNode(view, url));

    return true;
  }

  /**
   * Перетаскивание файлов-картинок в редактор: курсор встаёт в точку броска, и
   * картинки вставляются туда. Перенос узлов внутри редактора не трогаем.
   *
   * @param view - Представление редактора
   * @param event - Событие броска
   * @param _slice - Перетаскиваемый фрагмент документа (не нужен)
   * @param moved - Перенос внутри самого редактора
   * @returns true, если бросок обработали сами
   */
  function handleEditorDrop(
    view: EditorView,
    event: DragEvent,
    _slice: unknown,
    moved: boolean,
  ): boolean {
    const files = getImageFiles(event.dataTransfer);

    if (moved || !isImageEnabled.value || !files.length) {
      return false;
    }

    event.preventDefault();

    const dropPoint = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    if (dropPoint) {
      view.dispatch(
        view.state.tr.setSelection(
          Selection.near(view.state.doc.resolve(dropPoint.pos)),
        ),
      );
    }

    uploadImages(files, (url) => insertImageNode(view, url));

    return true;
  }

  // Markdown здесь — лишь ТРАНСПОРТ для round-trip наших {@...}. Формат Markdown
  // мы не используем, поэтому GFM выключен: `| a | b |`, `~~зачёркнутое~~`,
  // автоссылки и т.п. НЕ интерпретируются как разметка (у нас всё через {@...}).
  const markdownConfig = { markedOptions: { gfm: false } };

  // Класс контейнера редактора: при ошибке валидации подсвечиваем рамкой error,
  // иначе обычная рамка с подсветкой primary при фокусе.
  const containerClass = computed(() => [
    'flex h-60 min-h-40 min-w-0 resize-y flex-col overflow-hidden rounded-md border',
    highlight.value
      ? 'border-error'
      : 'border-default focus-within:border-primary',
  ]);

  // Панель ввода под тулбаром: null — закрыта. Открывается кнопками раздела/кубика.
  const insertPanel = ref<InsertPanelMode | null>(null);

  function openSectionPanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'section', tag };
  }

  function openLinkPanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'link', tag };
  }

  function openDicePanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'dice', tag };
  }

  function openCaptionPanel() {
    insertPanel.value = { kind: 'caption' };
  }

  /** Открывает панель ввода подписи под выделенной картинкой. */
  function openImageCaptionPanel() {
    insertPanel.value = { kind: 'image-caption' };
  }

  /** Открывает панель ввода текста-описания выделенной картинки. */
  function openImageAltPanel() {
    insertPanel.value = { kind: 'image-alt' };
  }

  function closeInsertPanel() {
    insertPanel.value = null;
  }

  // Ключ панели: пересоздаёт её при смене режима/раздела (у подписей таблицы и
  // картинки tag нет — ключом служит сам режим).
  const insertPanelKey = computed(() => {
    const panel = insertPanel.value;

    if (!panel) {
      return '';
    }

    return 'tag' in panel ? `${panel.kind}:${panel.tag.key}` : panel.kind;
  });

  /**
   * Колбэки тулбара визуального редактора. Загрузка картинки передаётся, только
   * когда картинки включены, — без неё тулбар кнопку не рисует.
   *
   * @param editor - Экземпляр TipTap из слота UEditor
   * @returns Колбэки панелей ввода и загрузки картинки
   */
  function getToolbarHandlers(editor: Editor): ToolbarHandlers {
    return {
      onSection: openSectionPanel,
      onLink: openLinkPanel,
      onDice: openDicePanel,
      onCaption: openCaptionPanel,
      onImage: isImageEnabled.value ? () => pickImages(editor) : undefined,
      onImageCaption: openImageCaptionPanel,
      onImageAlt: openImageAltPanel,
    };
  }

  // Те же группы и порядок, что и в визуальном тулбаре (форматы → блок →
  // kbd+интерактив → раздел), чтобы набор кнопок совпадал в обоих режимах.
  // Базовый пресет оставляет из них только теги BASIC_TAG_KEYS.
  const codeToolbarGroups = computed<MarkupTag[][]>(() => {
    const groups: MarkupTag[][] = [
      FORMAT_TAGS,
      BLOCK_TAGS,
      [...INLINE_TAGS, ...INTERACTIVE_TAGS],
    ];

    if (preset === 'full') {
      return groups;
    }

    return groups
      .map((group) => group.filter((tag) => BASIC_TAG_KEYS.has(tag.key)))
      .filter((group) => group.length > 0);
  });

  // Ссылки на разделы сайта — доменная вставка, в базовом пресете их нет.
  const hasSectionLinks = computed(() => preset === 'full');

  const sectionItems = computed<DropdownMenuItem[]>(() =>
    SECTION_TAGS.map((tag) => ({
      label: tag.label,
      icon: tag.icon,
      onSelect: () => insertIntoCode(tag),
    })),
  );

  function toggleMode() {
    closeInsertPanel();
    showCode.value = !showCode.value;
  }

  // Разделитель абзацев в МОДЕЛИ — пустая строка (\n\n): так нужно бэкенду и
  // визуальному редактору (там пустая строка = новый абзац). В режиме кода
  // показываем КОМПАКТНО — каждый абзац на своей строке (\n), без «пустых»
  // строк-разделителей, которые пришлось бы удалять вручную. При правке кода
  // одиночный \n снова разворачивается в \n\n, поэтому «сырой» одиночный \n
  // (на котором падает бэкенд) физически не попадает в модель/сохранение.
  const codeValue = computed({
    get: () => source.value.replace(/\n{2,}/g, '\n'),
    set: (value) => {
      source.value = value.replace(/\n/g, '\n\n');
    },
  });

  /**
   * Вставляет маркер картинки в текст режима кода отдельной строкой — туда, где
   * стоит курсор (или в конец, если поле ещё не трогали).
   *
   * @param url - Адрес загруженной картинки
   */
  function insertImageIntoCode(url: string): void {
    const value = codeValue.value;
    const position = textareaRef.value?.selectionEnd ?? value.length;

    codeValue.value = [
      value.slice(0, position).trimEnd(),
      buildImageMarker({ url }),
      value.slice(position).trimStart(),
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Вставляет разметку тега в позицию курсора текстового поля режима кода:
   * оборачивает выделение либо подставляет значение-заглушку.
   */
  function insertIntoCode(tag: MarkupTag) {
    const element = textareaRef.value;

    if (!element) {
      return;
    }

    const { selectionStart, selectionEnd } = element;
    const source = codeValue.value;

    const selected =
      source.slice(selectionStart, selectionEnd) || tag.placeholder;

    const inserted = `${tag.before}${selected}${tag.after}`;

    codeValue.value =
      source.slice(0, selectionStart) + inserted + source.slice(selectionEnd);

    const cursor = selectionStart + tag.before.length;

    nextTick(() => {
      element.focus();
      element.setSelectionRange(cursor, cursor + selected.length);
    });
  }
</script>

<template>
  <div class="markup-editor-table grid min-w-0 grid-cols-1 gap-2">
    <div class="flex items-center justify-start gap-2">
      <UButton
        variant="ghost"
        size="xs"
        :icon="showCode ? 'tabler:eye' : 'tabler:code'"
        @click.left.exact.prevent="toggleMode"
      >
        {{ showCode ? 'Визуальный вид' : 'Показать код' }}
      </UButton>

      <span
        v-if="isImageUploading"
        class="flex items-center gap-1 text-xs text-muted"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-3.5 animate-spin"
        />

        {{ MARKUP_IMAGE_UPLOADING_LABEL }}
      </span>
    </div>

    <ClientOnly>
      <!-- Общий контейнер с изменяемым размером (тянуть за нижний угол). Он
           ОДИН на оба режима, поэтому заданная высота сохраняется при
           переключении «код ↔ визуальный вид». -->
      <div :class="containerClass">
        <UEditor
          v-if="!showCode"
          v-model="source"
          content-type="markdown"
          :markdown="markdownConfig"
          :starter-kit="starterKit"
          :extensions="editorExtensions"
          :editor-props="editorProps"
          :image="false"
          :mention="false"
          :placeholder
          class="flex min-h-0 min-w-0 flex-1 flex-col"
          :ui="{
            content: 'min-h-0 min-w-0 flex-1 overflow-y-auto',
            base: 'px-3 py-3 sm:px-3',
          }"
          @blur="handleFieldBlur"
        >
          <template #default="{ editor }">
            <div class="relative shrink-0">
              <UEditorToolbar
                :editor
                :items="
                  buildToolbarItems(editor, getToolbarHandlers(editor), preset)
                "
                class="flex-wrap border-b border-default"
                :ui="{ group: 'flex-wrap' }"
              />

              <MarkupInsertPanel
                v-if="insertPanel"
                :key="insertPanelKey"
                :editor
                :mode="insertPanel"
                class="absolute inset-x-0 top-full z-20"
                @close="closeInsertPanel"
              />
            </div>
          </template>
        </UEditor>

        <div
          v-else
          class="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <div
            class="flex shrink-0 flex-wrap items-center gap-1 border-b border-default p-1"
          >
            <div
              v-for="(group, groupIndex) in codeToolbarGroups"
              :key="groupIndex"
              class="flex items-center gap-0.5"
            >
              <UTooltip
                v-for="tag in group"
                :key="tag.key"
                :text="tag.label"
                :ui="{ content: TOOLBAR_LAYER_CLASS }"
              >
                <UButton
                  :icon="tag.icon"
                  :aria-label="tag.label"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click.left.exact.prevent="insertIntoCode(tag)"
                />
              </UTooltip>
            </div>

            <UTooltip
              v-if="isImageEnabled"
              :text="MARKUP_IMAGE_UPLOAD_LABEL"
              :ui="{ content: TOOLBAR_LAYER_CLASS }"
            >
              <UButton
                :icon="MARKUP_IMAGE_ICON"
                :aria-label="MARKUP_IMAGE_UPLOAD_LABEL"
                color="neutral"
                variant="ghost"
                size="xs"
                @click.left.exact.prevent="pickImagesIntoCode"
              />
            </UTooltip>

            <UDropdownMenu
              v-if="hasSectionLinks"
              :items="sectionItems"
              :ui="{ content: TOOLBAR_LAYER_CLASS }"
            >
              <UButton
                icon="tabler:external-link"
                aria-label="Ссылка на раздел"
                color="neutral"
                variant="ghost"
                size="xs"
              />
            </UDropdownMenu>
          </div>

          <textarea
            :id="id"
            ref="textarea"
            v-model="codeValue"
            :name="name"
            :placeholder
            class="min-h-0 w-full flex-1 resize-none bg-default px-3 py-3 font-mono text-sm leading-6 text-default outline-none"
            v-bind="ariaAttrs"
            @blur="handleFieldBlur"
          />
        </div>
      </div>

      <template #fallback>
        <UTextarea
          v-model="source"
          :rows="8"
          :placeholder
        />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
  /* Нативная таблица внутри визуального редактора (ProseMirror + extension-table).
     Ни StarterKit, ни @nuxt/ui таблиц не содержат, поэтому CSS для них никто не
     задаёт — без этих правил таблица в редакторе выглядит «сломанной»/обрезанной.
     Стили повторяют вид таблицы на странице материала (MarkupTable.vue). */

  /* Обёртка таблицы (node view extension-table): даём горизонтальный скролл,
     чтобы широкая таблица прокручивалась, а не обрезалась в редакторе. */
  .markup-editor-table :deep(.tableWrapper) {
    overflow-x: auto;
    margin: 0.5rem 0;
  }

  .markup-editor-table :deep(table) {
    table-layout: fixed;
    border-collapse: collapse;
    width: 100%;
  }

  .markup-editor-table :deep(:is(th, td)) {
    position: relative; /* для .selectedCell и ручки ресайза колонки */

    box-sizing: border-box;
    min-width: 3rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--ui-border);

    vertical-align: top;
  }

  .markup-editor-table :deep(th) {
    font-weight: 600;
    color: var(--ui-text-highlighted);
    text-align: center;
    background-color: var(--ui-bg-muted);
  }

  /* Абзацы внутри ячеек не должны добавлять свои вертикальные отступы. */
  .markup-editor-table :deep(:is(th, td) > p) {
    margin: 0;
  }

  /* Выравнивание по атрибуту align → data-align — как на странице, и для тела,
     и для заголовков. Явный left перебивает дефолты (тело слева, заголовок — по
     центру), поэтому правило для left тоже нужно. */
  .markup-editor-table :deep(:is(th, td)[data-align='left']) {
    text-align: left;
  }

  .markup-editor-table :deep(:is(th, td)[data-align='center']) {
    text-align: center;
  }

  .markup-editor-table :deep(:is(th, td)[data-align='right']) {
    text-align: right;
  }

  /* Подпись таблицы (атрибут caption → data-caption) — показываем над таблицей
     прямо в редакторе, чтобы автор видел заданную подпись. */
  .markup-editor-table :deep(table[data-caption]::before) {
    caption-side: top;
    content: attr(data-caption);

    display: table-caption;

    padding: 0.25rem 0.5rem;

    font-weight: 600;
    color: var(--ui-text-highlighted);
    text-align: center;
  }

  /* Нативная цитата (blockquote) в редакторе: StarterKit-стилей нет (blockquote
     отключён), поэтому без CSS она неотличима от обычных абзацев. На странице
     цитата рисуется богатым MarkupQuote/UCard — здесь только явный вид для автора. */
  .markup-editor-table :deep(.tiptap blockquote) {
    margin: 0.5rem 0;
    padding: 0.25rem 0.75rem;
    border-left: 4px solid var(--ui-border-accented);
    color: var(--ui-text-toned);
  }

  .markup-editor-table :deep(.tiptap blockquote > p) {
    margin: 0;
  }

  /* Нативный заголовок (TtgHeading) в редакторе: StarterKit-heading отключён, а
     наш узел рендерит h1–h4 по пользовательскому уровню 1–4. Стилизуем размеры
     под вид заголовка на странице (MarkupHeading), чтобы автор видел иерархию. */
  .markup-editor-table :deep(.tiptap :is(h1, h2, h3, h4)) {
    font-weight: 600;
    line-height: 1.3;
    color: var(--ui-text-highlighted);
  }

  .markup-editor-table :deep(.tiptap h1) {
    margin: 0.75rem 0 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--ui-border);
    font-size: 1.25rem;
  }

  .markup-editor-table :deep(.tiptap h2) {
    margin: 0.6rem 0 0.35rem;
    font-size: 1.125rem;
  }

  .markup-editor-table :deep(.tiptap h3) {
    margin: 0.5rem 0 0.25rem;
    font-size: 1rem;
  }

  .markup-editor-table :deep(.tiptap h4) {
    margin: 0.4rem 0 0.2rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Выравнивание любого текстового блока (абзац/заголовок) по атрибуту align →
     data-align. Значение хранит TtgParagraph/TtgHeading; так автор видит
     выравнивание прямо в редакторе, как оно будет на странице. */
  .markup-editor-table
    :deep(.tiptap :is(p, h1, h2, h3, h4)[data-align='center']) {
    text-align: center;
  }

  .markup-editor-table
    :deep(.tiptap :is(p, h1, h2, h3, h4)[data-align='right']) {
    text-align: right;
  }

  .markup-editor-table
    :deep(.tiptap :is(p, h1, h2, h3, h4)[data-align='left']) {
    text-align: left;
  }

  /* Картинка с обтеканием (TtgImage) — это float. Рядом с ней таблица, цитата и
     линия-разделитель не помещаются и уходят под неё; заголовок и список встают
     рядом, сужаясь (иначе линия под заголовком и маркеры списка уезжают под
     картинку). Так же ведёт себя текст на странице — см. IMAGE_FLOW_BLOCK_CLASSES. */
  .markup-editor-table
    :deep(.tiptap :is(.tableWrapper, blockquote, .ttg-marker-chip-block)) {
    clear: both;
  }

  .markup-editor-table :deep(.tiptap :is(h1, h2, h3, h4, ul, ol)) {
    display: flow-root;
  }

  /* Подсветка выделенной при редактировании ячейки (prosemirror-tables). */
  .markup-editor-table :deep(.selectedCell::after) {
    pointer-events: none;
    content: '';

    position: absolute;
    inset: 0;

    opacity: 0.25;
    background-color: var(--ui-border-accented);
  }

  /* Ручка изменения ширины колонки (prosemirror-tables). */
  .markup-editor-table :deep(.column-resize-handle) {
    pointer-events: none;

    position: absolute;
    top: 0;
    right: -1px;
    bottom: 0;

    width: 3px;

    background-color: var(--ui-border-accented);
  }

  .markup-editor-table :deep(.tiptap.resize-cursor) {
    cursor: col-resize;
  }
</style>
