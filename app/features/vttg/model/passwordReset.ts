import type { VttgGuideVariant } from './types';

import { SOCIAL_LINKS } from '~home/social-links/model';

/** Путь страницы инструкции — на него ведёт ссылка из окна входа VTTG. */
export const VTTG_PASSWORD_RESET_PATH = '/vttg/reset-password';

/** Путь лендинга VTTG — кнопка «назад» на странице инструкции. */
export const VTTG_LANDING_PATH = '/vttg';

/** Заголовок и описание страницы для поисковиков и вкладки браузера. */
export const VTTG_PASSWORD_RESET_SEO = {
  title: 'Сброс мастер-пароля — Virtual TTG Club',
  description:
    'Как сбросить забытый мастер-пароль VTTG: в приложении на компьютере и на выделенном сервере.',
} as const;

/** Заголовок и подзаголовок страницы; заголовок — он же пункт меню. */
export const VTTG_PASSWORD_RESET_PAGE = {
  title: 'Сброс мастер-пароля',
  subtitle: 'Virtual TTG Club',
} as const;

/** Вводные абзацы перед вкладками. */
export const VTTG_PASSWORD_RESET_INTRO: Array<string> = [
  'Мастер-пароль закрывает главное меню VTTG: список миров, настройки и управление серверами. Он хранится только на вашем компьютере или сервере — у TTG Club его нет, поэтому восстановить пароль через сайт или поддержку нельзя.',
  'Зато его можно сбросить: нужно удалить одну строку из файла настроек приложения. Сделать это может только тот, у кого есть доступ к файлам компьютера или сервера, — в этом и состоит защита.',
];

/** Что сброс затрагивает, а что нет — плашка перед вкладками. */
export const VTTG_PASSWORD_RESET_SAFETY = {
  title: 'Миры и персонажи останутся на месте',
  description:
    'Сброс удаляет только мастер-пароль. Миры, персонажи, игровые системы и скачанные материалы не трогаются. После сброса VTTG предложит придумать новый пароль, как при первом запуске.',
  icon: 'tabler:shield-check',
} as const;

/** Подпись над вкладками вариантов установки. */
export const VTTG_PASSWORD_RESET_VARIANTS_TITLE = 'Где у вас установлен VTTG?';

/** Подпись кнопки копирования фрагмента кода. */
export const VTTG_GUIDE_COPY_LABEL = 'Скопировать';

/** Иконка кнопки копирования фрагмента кода. */
export const VTTG_GUIDE_COPY_ICON = 'tabler:copy';

/** Иконка предупреждения в шаге инструкции. */
export const VTTG_GUIDE_WARNING_ICON = 'tabler:alert-triangle';

/** Имя файла настроек, в котором хранится мастер-пароль. */
const APP_CONFIG_FILE = 'app-config.json';

/**
 * Скрипт Node.js, который убирает мастер-пароль из файла настроек в текущей
 * папке. Node.js на сервере есть всегда — на нём работает сам VTTG, — а правка
 * скриптом не ломает JSON лишней запятой, как ручная.
 */
const REMOVE_PASSWORD_SCRIPT = `node -e 'const fs = require("fs"); const file = "${APP_CONFIG_FILE}"; const config = JSON.parse(fs.readFileSync(file, "utf8")); delete config.passwordHash; fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\\n");'`;

/** Имя контейнера из docker-compose.yml VTTG. */
const DOCKER_CONTAINER = 'vttg-server';

/** Папка данных в Docker-образе VTTG. */
const DOCKER_DATA_DIR = '/data';

/** Предупреждение для серверов: без пароля панель открыта всем. */
const SERVER_OPEN_PANEL_WARNING =
  'Пока новый пароль не задан, главное меню сервера открыто любому, кто знает его адрес. Задайте пароль сразу после запуска.';

/** Последний шаг — общий для всех вариантов. */
const CREATE_NEW_PASSWORD_TITLE = 'Задайте новый пароль';

/** Последний шаг на сервере: окно создания пароля открывается в браузере. */
const SERVER_CREATE_PASSWORD_TEXT =
  'Откройте адрес сервера в браузере. Вместо входа появится окно «Создание мастер-пароля» — придумайте новый пароль и подтвердите его.';

/** Варианты установки и шаги сброса для каждого. */
export const VTTG_PASSWORD_RESET_VARIANTS: Array<VttgGuideVariant> = [
  {
    label: 'На компьютере',
    icon: 'tabler:device-desktop',
    description:
      'Приложение Virtual TTG Club, установленное на Windows, macOS или Linux.',
    steps: [
      {
        title: 'Закройте приложение',
        paragraphs: [
          'Полностью выйдите из Virtual TTG Club. На Windows и Linux достаточно закрыть окно. На macOS этого мало — выберите в меню «Virtual TTG Club → Завершить» или нажмите Cmd+Q.',
        ],
      },
      {
        title: 'Найдите папку данных',
        paragraphs: [
          'При первом запуске приложение просило выбрать папку для данных. Какую папку вы выбрали, записано в файле data-location.json в служебной папке VTTG. Откройте служебную папку: на Windows вставьте путь в адресную строку проводника, на macOS — в Finder через «Переход → Переход к папке» (Cmd+Shift+G), на Linux — в файловый менеджер.',
        ],
        locations: [
          {
            label: 'Windows',
            icon: 'tabler:brand-windows',
            path: '%APPDATA%\\VTTG',
          },
          {
            label: 'macOS',
            icon: 'tabler:brand-apple',
            path: '~/Library/Application Support/VTTG',
          },
          {
            label: 'Linux',
            icon: 'tabler:brand-ubuntu',
            path: '~/.config/VTTG',
          },
        ],
        codes: [
          {
            caption: 'Пример data-location.json',
            content: '{\n  "path": "D:\\\\Games\\\\VTTG Data"\n}',
          },
        ],
        warning:
          'Двойные обратные косые черты в файле — особенность формата: путь из примера на самом деле D:\\Games\\VTTG Data. Если файла data-location.json нет, папка данных — сама служебная папка.',
      },
      {
        title: 'Сделайте копию файла настроек',
        paragraphs: [
          `В папке данных лежит файл ${APP_CONFIG_FILE} — в нём список миров и мастер-пароль. Скопируйте его рядом, например под именем app-config.backup.json. Если при правке что-то пойдёт не так, копию можно будет вернуть на место.`,
        ],
      },
      {
        title: 'Удалите строку с паролем',
        paragraphs: [
          `Откройте ${APP_CONFIG_FILE} текстовым редактором: на Windows — Блокнотом, на macOS — TextEdit, на Linux — любым. Найдите строку, которая начинается с "passwordHash", и удалите её целиком.`,
          'Проверьте запятые: после последней строки перед закрывающей фигурной скобкой запятой быть не должно. Обычно пароль записан последним, поэтому запятую нужно убрать в конце строки над ним. Сохраните файл.',
        ],
        codes: [
          {
            caption: 'Было',
            content:
              '{\n  "worldFolders": [\n    "D:\\\\Games\\\\VTTG Data\\\\my-world"\n  ],\n  "nextWorldId": 2,\n  "passwordHash": "9f2c41…e7b0"\n}',
          },
          {
            caption: 'Стало',
            content:
              '{\n  "worldFolders": [\n    "D:\\\\Games\\\\VTTG Data\\\\my-world"\n  ],\n  "nextWorldId": 2\n}',
          },
        ],
        warning:
          'Не удаляйте весь файл: вместе с паролем пропадёт список миров, и их придётся подключать заново.',
      },
      {
        title: CREATE_NEW_PASSWORD_TITLE,
        paragraphs: [
          'Запустите Virtual TTG Club. Вместо входа откроется окно «Создание мастер-пароля» — придумайте новый пароль и подтвердите его.',
        ],
      },
    ],
  },
  {
    label: 'Сервер в Docker',
    icon: 'tabler:brand-docker',
    // Docker-сборку пользователям пока не выдаём — шаги готовы, вкладка скрыта
    hidden: true,
    description:
      'Сервер VTTG, запущенный из Docker-образа или через docker compose.',
    steps: [
      {
        title: 'Узнайте имя контейнера',
        paragraphs: [
          `В docker-compose.yml из поставки VTTG контейнер называется ${DOCKER_CONTAINER}. Если вы запускали образ по-своему, найдите имя в списке запущенных контейнеров и подставляйте его в команды ниже.`,
        ],
        codes: [
          {
            caption: 'Команда',
            content: 'docker ps',
          },
        ],
      },
      {
        title: 'Сделайте копию файла настроек',
        paragraphs: [
          `Данные сервера лежат в томе, подключённом к папке ${DOCKER_DATA_DIR}. Мастер-пароль записан в ${APP_CONFIG_FILE} — сохраните копию файла на случай ошибки.`,
        ],
        codes: [
          {
            caption: 'Команда',
            content: `docker exec ${DOCKER_CONTAINER} cp ${DOCKER_DATA_DIR}/${APP_CONFIG_FILE} ${DOCKER_DATA_DIR}/app-config.backup.json`,
          },
        ],
      },
      {
        title: 'Удалите пароль из настроек',
        paragraphs: [
          'Команда убирает из файла только мастер-пароль, остальные настройки остаются как были.',
        ],
        codes: [
          {
            caption: 'Команда',
            content: `docker exec -w ${DOCKER_DATA_DIR} ${DOCKER_CONTAINER} ${REMOVE_PASSWORD_SCRIPT}`,
          },
        ],
      },
      {
        title: 'Перезапустите контейнер',
        paragraphs: [
          'Перезапуск закрывает все открытые входы в главное меню — войти по старому паролю больше не получится ни с одного устройства.',
        ],
        codes: [
          {
            caption: 'Команда',
            content: `docker restart ${DOCKER_CONTAINER}`,
          },
        ],
      },
      {
        title: CREATE_NEW_PASSWORD_TITLE,
        paragraphs: [SERVER_CREATE_PASSWORD_TEXT],
        warning: SERVER_OPEN_PANEL_WARNING,
      },
    ],
  },
  {
    label: 'Сервер из архива',
    icon: 'tabler:server',
    description:
      'Сервер VTTG на Linux, распакованный из архива и запущенный через start.sh — вручную или службой systemd.',
    steps: [
      {
        title: 'Остановите сервер',
        paragraphs: [
          'Если сервер запущен службой systemd, остановите её (ниже — пример для службы с именем vttg). Если запускали start.sh вручную, нажмите Ctrl+C в его терминале.',
        ],
        codes: [
          {
            caption: 'Команда',
            content: 'sudo systemctl stop vttg',
          },
        ],
      },
      {
        title: 'Найдите папку данных',
        paragraphs: [
          'Папку данных задаёт переменная окружения VTT_DATA_DIR — у службы systemd она записана в её настройках. Если переменная не задана, данные лежат в папке vtt-data внутри папки, из которой запускался start.sh.',
          'Проверить себя можно по журналу: при старте сервер пишет строку «Data directory:» с путём к папке данных.',
        ],
        codes: [
          {
            caption: 'Команда',
            content: 'systemctl cat vttg | grep VTT_DATA_DIR',
          },
        ],
      },
      {
        title: 'Удалите пароль из настроек',
        paragraphs: [
          'Перейдите в папку данных, сохраните копию файла настроек и уберите из него мастер-пароль. Замените /srv/vttg/data на свою папку. Остальные настройки остаются как были.',
        ],
        codes: [
          {
            caption: 'Команды',
            content: `cd /srv/vttg/data\ncp ${APP_CONFIG_FILE} app-config.backup.json\n${REMOVE_PASSWORD_SCRIPT}`,
          },
        ],
      },
      {
        title: 'Запустите сервер',
        paragraphs: [
          'Запустите службу снова или выполните start.sh, как обычно.',
        ],
        codes: [
          {
            caption: 'Команда',
            content: 'sudo systemctl start vttg',
          },
        ],
      },
      {
        title: CREATE_NEW_PASSWORD_TITLE,
        paragraphs: [SERVER_CREATE_PASSWORD_TEXT],
        warning: SERVER_OPEN_PANEL_WARNING,
      },
    ],
  },
];

/** Варианты, которые показываются на странице: без скрытых сборок. */
export const VTTG_PASSWORD_RESET_VISIBLE_VARIANTS =
  VTTG_PASSWORD_RESET_VARIANTS.filter((variant) => !variant.hidden);

/** Раздел «Если что-то пошло не так» после вкладок. */
export const VTTG_PASSWORD_RESET_TROUBLESHOOTING = {
  title: 'Если что-то пошло не так',
  /** Частые проблемы после правки и что с ними делать. */
  problems: [
    'Приложение или сервер не запускается после правки — скорее всего, в файле осталась лишняя или пропала нужная запятая. Верните копию app-config.backup.json под именем app-config.json и повторите правку внимательнее.',
    'После запуска снова просят старый пароль — правка попала не в тот файл. Проверьте папку данных: на компьютере по файлу data-location.json, на сервере по строке «Data directory:» в журнале.',
  ],
  icon: 'tabler:lifebuoy',
  supportText: 'Не получается — напишите нам в Discord, поможем разобраться.',
  supportLabel: 'Открыть Discord',
} as const;

/**
 * Discord проекта для вопросов по сбросу — берётся из общего списка сообществ,
 * чтобы адрес приглашения не расходился с остальным сайтом.
 */
export const VTTG_SUPPORT_LINK = SOCIAL_LINKS.find(
  (socialLink) => socialLink.name === 'Discord',
);
