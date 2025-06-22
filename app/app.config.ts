export default defineAppConfig({
  icon: {
    customize: (content: string) =>
      content
        .replace(/fill="[^"]*"/g, 'fill="currentColor"')
        .replace(/width="[^"]*"/g, '')
        .replace(/height="[^"]*"/g, '')
        .replace(/style="[^"]*"/g, '')
        .replace(/color="[^"]*"/g, '')
        .replace(/stroke="[^"]*"/g, '')
        .replace(/stroke-width="[^"]*"/g, ''),
  },
  ui: {
    icons: {
      arrowLeft: 'i-fluent-arrow-left-16-regular',
      arrowRight: 'i-fluent-arrow-right-16-regular',
      check: 'i-ttg-check',
      chevronDoubleLeft: 'i-fluent-chevron-double-left-16-regular',
      chevronDoubleRight: 'i-fluent-chevron-double-right-16-regular',
      chevronDown: 'i-fluent-chevron-down-16-regular',
      chevronLeft: 'i-fluent-chevron-left-16-regular',
      chevronRight: 'i-fluent-chevron-right-16-regular',
      chevronUp: 'i-fluent-chevron-up-16-regular',
      close: 'i-ttg-x',
      ellipsis: 'i-lucide-ellipsis',
      external: 'i-fluent-arrow-up-right-16-regular',
      folder: 'i-fluent-folder-16-regular',
      folderOpen: 'i-fluent-folder-open-16-regular',
      loading: 'i-fluent-spinner-ios-16-regular',
      minus: 'i-ttg-minus',
      plus: 'i-ttg-plus',
      search: 'i-ttg-search',
    },
    button: {
      slots: {
        base: 'cursor-pointer',
      },
    },
    checkbox: {
      slots: {
        wrapper: 'w-auto',
        label: 'cursor-pointer',
      },
    },
    input: {
      slots: {
        root: 'w-full',
      },
    },
    popover: {
      slots: {
        content: [
          'max-w-(--reka-popover-content-available-width) md:max-w-md h-auto',
          'flex flex-col gap-2 py-2 px-4',
          'text-xs text-highlighted',
        ],
      },
    },
    tooltip: {
      slots: {
        content: [
          'max-w-(--reka-tooltip-content-available-width) md:max-w-md h-auto',
          'flex flex-col gap-2',
        ],
        text: 'whitespace-normal',
      },
    },
    drawer: {
      slots: {
        content: 'w-2xl overflow-hidden max-md:rounded-none',
        container: 'gap-0 p-0',
        header: 'bg-default sticky top-0 p-4',
        body: 'px-4 pb-4',
        overlay: 'bg-elevated/45',
      },
    },
    toast: {
      variants: {
        color: {
          primary: {
            title: 'text-primary',
          },
          secondary: {
            title: 'text-secondary',
          },
          success: {
            title: 'text-success',
          },
          info: {
            title: 'text-info',
          },
          warning: {
            title: 'text-warning',
          },
          error: {
            title: 'text-error',
          },
          neutral: {
            title: 'text-highlighted',
          },
        },
      },
    },
  },
});
