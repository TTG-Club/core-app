/**
 * Растровые копии карты деревни для шапки главной.
 *
 * Карта `public/img/home/hero-map-ТЕМА.svg` — сотни фигур и шумовые фильтры.
 * Браузер разбирает её в основном потоке, а видеокарта растрирует при первом
 * показе долго: на телефоне несколько секунд, и всё это время страница не
 * рисует кадры и не прокручивается. Поэтому шапка показывает заранее
 * отрисованную WebP — её достаточно декодировать. SVG остаётся исходником.
 *
 * Скрипт рисует SVG в headless Chrome или Edge (цвета карты заданы через oklch
 * и color-mix, которые понимают только браузеры) и сохраняет рядом с ней:
 * - `hero-map-ТЕМА.webp` — весь холст;
 * - `hero-map-ТЕМА-sm.webp` — середина холста для экранов уже 768px: на
 *   телефоне края карты всё равно за экраном.
 *
 * Картинки прозрачные, как и сама карта: под шапкой лежит не ровный цвет, а
 * закреплённый градиент страницы (в светлой теме — ещё и бумажная фактура), и
 * карта, заранее наложенная на один цвет, легла бы на него заметной вуалью.
 * Прозрачность шумовой текстуры весит много, поэтому её сжимает `sharp` с
 * потерями (`ALPHA_QUALITY`).
 *
 * Запуск после правки любого `hero-map-ТЕМА.svg`:
 *   node scripts/render-hero-map.mjs
 * Путь к Chrome или Edge, если он не на стандартном месте:
 *   CHROME_PATH=/path/to/chrome node scripts/render-hero-map.mjs
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import sharp from 'sharp';

/** Темы сайта — у каждой свой рисунок карты */
const THEMES = ['light', 'dark', 'svifty7'];

/** Холст карты — `viewBox` в `hero-map-ТЕМА.svg` */
const CANVAS = { width: 3200, height: 1100 };

/**
 * На телефоне карта шириной 1600px, а видна середина шириной с экран (до
 * 768px): это 1536 единиц карты. Пиксель картинки — единица карты, то есть
 * два пикселя экрана на CSS-пиксель.
 */
const SMALL_CROP_WIDTH = 1536;

/** Качество цвета: выше глаз разницы не видит, ниже мылится дорога */
const QUALITY = 70;

/**
 * Качество прозрачности. Без потерь шумовая текстура весит втрое больше, а с
 * бледностью и маской шапки полутонов прозрачности на экране не различить.
 */
const ALPHA_QUALITY = 50;

/** Сколько ждать, пока фильтры карты дорисуются, мс */
const RENDER_SETTLE_DELAY = 3000;

/** Сколько раз спросить у браузера адрес отладки, пока он запускается */
const CONNECT_ATTEMPTS = 50;

/** Пауза между попытками подключения, мс */
const CONNECT_RETRY_DELAY = 200;

/** Сколько дать браузеру закрыться перед удалением его профиля, мс */
const BROWSER_EXIT_DELAY = 500;

/**
 * Порт отладки выбирается случайно из этого окна: второй запуск скрипта не
 * столкнётся с первым
 */
const DEBUGGING_PORT_BASE = 9500;

const DEBUGGING_PORT_RANGE = 400;

/** Старание кодировщика WebP (0–6): медленнее, зато файл меньше */
const ENCODER_EFFORT = 6;

const BYTES_IN_KILOBYTE = 1024;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const root = fileURLToPath(new URL('..', import.meta.url));
const imageDirectory = join(root, 'public', 'img', 'home');
const chromePath = CHROME_CANDIDATES.find((path) => existsSync(path));

if (!chromePath) {
  throw new Error('Chrome или Edge не найден — укажите путь в CHROME_PATH');
}

/**
 * Пауза.
 *
 * @param {number} milliseconds - длительность
 * @returns {Promise<void>} завершится по истечении паузы
 */
function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const debuggingPort =
  DEBUGGING_PORT_BASE + Math.floor(Math.random() * DEBUGGING_PORT_RANGE);

const profileDirectory = mkdtempSync(join(tmpdir(), 'hero-map-'));

const browser = spawn(
  chromePath,
  [
    '--headless=new',
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${profileDirectory}`,
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let debuggerUrl;

for (let attempt = 0; attempt < CONNECT_ATTEMPTS && !debuggerUrl; attempt++) {
  try {
    const versionResponse = await fetch(
      `http://127.0.0.1:${debuggingPort}/json/version`,
    );

    debuggerUrl = (await versionResponse.json()).webSocketDebuggerUrl;
  } catch {
    await wait(CONNECT_RETRY_DELAY);
  }
}

const socket = new WebSocket(debuggerUrl);

await new Promise((resolve) => {
  socket.addEventListener('open', resolve);
});

let lastMessageId = 0;

const pendingRequests = new Map();

socket.addEventListener('message', (socketEvent) => {
  const protocolMessage = JSON.parse(socketEvent.data);
  const pendingRequest = pendingRequests.get(protocolMessage.id);

  if (!pendingRequest) {
    return;
  }

  pendingRequests.delete(protocolMessage.id);

  if (protocolMessage.error) {
    pendingRequest.reject(new Error(JSON.stringify(protocolMessage.error)));

    return;
  }

  pendingRequest.resolve(protocolMessage.result);
});

/**
 * Команда DevTools Protocol.
 *
 * @param {string} method - метод протокола
 * @param {object} [commandParams] - параметры метода
 * @param {string} [sessionId] - сессия вкладки
 * @returns {Promise<any>} ответ браузера
 */
function sendCommand(method, commandParams = {}, sessionId = undefined) {
  return new Promise((resolve, reject) => {
    lastMessageId++;
    pendingRequests.set(lastMessageId, { resolve, reject });

    socket.send(
      JSON.stringify({
        id: lastMessageId,
        method,
        params: commandParams,
        sessionId,
      }),
    );
  });
}

const { targetId } = await sendCommand('Target.createTarget', {
  url: 'about:blank',
});

const { sessionId } = await sendCommand('Target.attachToTarget', {
  targetId,
  flatten: true,
});

await sendCommand('Page.enable', {}, sessionId);

await sendCommand(
  'Emulation.setDeviceMetricsOverride',
  { ...CANVAS, deviceScaleFactor: 1, mobile: false },
  sessionId,
);

// Прозрачный фон вкладки: снимок сохраняет прозрачность самой карты
await sendCommand(
  'Emulation.setDefaultBackgroundColorOverride',
  { color: { r: 0, g: 0, b: 0, a: 0 } },
  sessionId,
);

try {
  for (const theme of THEMES) {
    const svgPath = join(imageDirectory, `hero-map-${theme}.svg`);
    const pagePath = join(profileDirectory, `${theme}.html`);

    writeFileSync(
      pagePath,
      `<style>html,body{margin:0;background:transparent}</style>`
        + `<img src="${pathToFileURL(svgPath).href}" `
        + `width="${CANVAS.width}" height="${CANVAS.height}" style="display:block">`,
    );

    await sendCommand(
      'Page.navigate',
      { url: pathToFileURL(pagePath).href },
      sessionId,
    );

    await wait(RENDER_SETTLE_DELAY);

    const { data: screenshotBase64 } = await sendCommand(
      'Page.captureScreenshot',
      {
        format: 'png',
        clip: { x: 0, y: 0, ...CANVAS, scale: 1 },
      },
      sessionId,
    );

    const mapPng = Buffer.from(screenshotBase64, 'base64');

    const variants = [
      { fileName: `hero-map-${theme}.webp`, left: 0, width: CANVAS.width },
      {
        fileName: `hero-map-${theme}-sm.webp`,
        left: (CANVAS.width - SMALL_CROP_WIDTH) / 2,
        width: SMALL_CROP_WIDTH,
      },
    ];

    for (const variant of variants) {
      const outputPath = join(imageDirectory, variant.fileName);

      const { size } = await sharp(mapPng)
        .extract({
          left: variant.left,
          top: 0,
          width: variant.width,
          height: CANVAS.height,
        })
        .webp({
          quality: QUALITY,
          alphaQuality: ALPHA_QUALITY,
          effort: ENCODER_EFFORT,
        })
        .toFile(outputPath);

      console.info(
        `${variant.fileName}: ${variant.width}×${CANVAS.height}, ${Math.round(size / BYTES_IN_KILOBYTE)} КБ`,
      );
    }
  }
} finally {
  socket.close();
  browser.kill();
  await wait(BROWSER_EXIT_DELAY);
  rmSync(profileDirectory, { recursive: true, force: true });
}
