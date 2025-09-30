# Исследование hCaptcha Fingerprinting — Отчет

## Сводка
- **Цель**: зареверсить JavaScript‑проверки, которые hCaptcha использует для сбора отпечатка браузера/оборудования (canvas, audio, fonts, WebGL, и т. п.), и задокументировать процедуру деобфускации и инструменты.
- **Результат**: деобфусцированные проверки присутствуют в `cleaned.js` и `deobfuscated.js`; пайплайн и скрипты деобфускации — в папке `hCaptcha-hsv-Deobfuscator/`. В отчете приведены точки входа и конкретные ссылки на код. Связка JS↔WASM разобрана.

## Файлы и структура
- `demo.html` — демо‑страница виджета (подключает `https://js.hcaptcha.com/1/api.js`).
- `obfuscated.js` — исходный обфусцированный бандл.
- `cleaned.js` — очищенный/читабельный JS c проверками отпечатка.
- `deobfuscated.js` — деобфусцированный JS; загрузка WASM пропатчена на `require('fs').readFileSync('./wasm.txt')` для анализа.
- `hsw.js` — компактная обертка hsw (минифицирована).
- `api.js` — вендорный бандл (минимизирован).
- `hCaptcha-hsv-Deobfuscator/` — тулкит деобфускации (NodeJS + Babel AST):
  - `main.js` — оркестрация трансформаций.
  - `transformers/*.js` — трансформеры (замена словарей/идентификаторов, расшифровка строк, чистка кода, извлечение wasm/воркеров и т. п.).
  - `wasm.txt` — извлеченный WASM‑пейлоад (base64/ASCII), сохраняется трансформером.

## Процедура деобфускации и инструменты
- **Инструменты**: NodeJS, Babel (`@babel/core`, `@babel/generator`, `@babel/traverse`), собственные трансформеры; Chrome DevTools; ripgrep для поиска по коду; опционально WABT (`wasm2wat`) для дизассемблирования WASM.
- **Пайплайн** (см. `hCaptcha-hsv-Deobfuscator/main.js`):
  1. Парсинг входного `hsv.js` в AST.
  2. `replaceIdentifiers` и `decryptVars` — разворачивают словари/строки и переименовывают идентификаторы.
  3. `cleanUp` и `removeDeadCode` — удаляют мертвый код, инлайнит константы, чистят AST.
  4. `extractWasm` — сохраняет встроенный WASM в `./wasm.txt` и патчит вызовы на `require('fs').readFileSync('./wasm.txt')`.
  5. `extractWorkers` + `replaceDicts`, `deobfuscateWorker*` — очищают и сохраняют воркеры.
  6. Генерация деобфусцированного вывода (`hsv.out.js`).
- **Подтверждение**: `hCaptcha-hsv-Deobfuscator/README.md` описывает схему обфускации; `transformers/extractWasm.js` сохраняет `wasm.txt` и меняет загрузчик.

## WebAssembly и его взаимодействие с JavaScript
- **Инициализация**: `deobfuscated.js` 2715–2766.
  - Фолбэк‑загрузчик: base64 → `Uint8Array` → `WebAssembly.Module`/`instantiate`.
  - Патч на `require('fs').readFileSync('./wasm.txt')` для локального анализа.
- **Импорты**: модуль инициализируется с импортами `{ a: DI }` (≈2761).
- **Клей (`DI`)**: `deobfuscated.js` 2040–2418 — набор JS‑оберток, которые предоставляет окружение WASM:
  - Проверки типов: `La` (Canvas), `ka` (Window), `j` (ArrayBuffer) и др.
  - Доступ к среде: `A`/`ha`/`$a` к `global`/`document`/`window`, `Reflect.*`, `Proxy`, `Symbol`, `Promise`, маршалинг буферов через `TQ()/xQ()`.
  - Хелперы доступа к полям/методам DOM/Canvas: `L`, `E`, `cb`, `_`, `V` и др.
- **Экспорты**: обернуты в JS как `ub`, `qb`, `vb` (см. обертки `RI` 2775–2799).
- **Фасад**: возвращаемая функцией логика (2800–2825) маршрутизирует вызовы: `A===0` → `FI(Q)`, `A===1` → `HI(Q)`, иначе парсит JWT и вызывает `sI(JSON.stringify(payload), epoch, key)`, который проксирует в `DI.ub(...)`.
- **Вывод**: WASM реализует крипто‑ядро/комбинацию данных; JS в основном собирает отпечаток и подготавливает входы в WASM.

## Классификация JS‑проверок (с указанием мест в коде)
- **Canvas**
  - `cleaned.js` 436–474 — рисование фигур/теней/emoji, `toDataURL()`, чтение `getImageData(...).data`.
  - `hCaptcha-hsv-Deobfuscator/hsv.js` ~1979–1996, 2995 — использование `toDataURL()` для передачи.
- **WebGL / WebGL2**
  - `cleaned.js` 722–747, 783–791 — параметры `getParameter(...)`, `getExtension('WEBGL_debug_renderer_info')`, анизотропная фильтрация (34047), draw buffers (34852), атрибуты контекста.
  - `deobfuscated.js` ~1413–1543 — те же ветки в деобфусцированном виде.
  - `obfuscated.js` ~1217–1315 — исходная обфусцированная форма.
- **Audio**
  - `cleaned.js` ~228–233+ — `OfflineAudioContext(1, 5000, 44100)`, `Oscillator`, `DynamicsCompressor`, `Analyser`.
  - `hCaptcha-hsv-Deobfuscator/hsv.js` ~852–855 — `window.OfflineAudioContext || window.webkitOfflineAudioContext`.
- **Fonts**
  - `cleaned.js` 482–539 — скрытые DOM‑элементы + `getClientRects()`, `FontFace(...).load()`.
  - `deobfuscated.js` ~688–694 — `new FontFace(...).load().then(e => e.family)`.
- **Navigator / UA / фичи**
  - `cleaned.js` 582–602, 699–705, 813–820, 949–951 — `navigator.userAgent`, `navigator.userAgentData.getHighEntropyValues`, плагины, webdriver, признаки окружения.
  - Touch‑детект: `cleaned.js` 611–617 — `document.createEvent('TouchEvent')` и `'ontouchstart' in window`.
  - WebRTC‑наличие: `hCaptcha-hsv-Deobfuscator/hsv.js` ~1413–1416 — `RTCPeerConnection`/webkit.
- **Workers / SharedWorkers**
  - `deobfuscated.js` ~1715 — `new Worker(...)` (Blob‑URL), `postMessage([...])` (~1754), гонки с `Promise.race`.
  - `hCaptcha-hsv-Deobfuscator/hsv.js` ~689 — `new Worker(B,Q)`; ~1270–1276 — `new SharedWorker`, `port.start()`.
- **Crypto/Entropy**
  - `hCaptcha-hsv-Deobfuscator/hsv.js` 3293–3303 — `crypto.getRandomValues` через обертки.

## Как воспроизвести деобфускацию локально
```bash
cd hCaptcha-hsv-Deobfuscator
npm install
node main.js hsv.js hsv.out.js --extract-wasm --clean-workers --rename-workers --save-workers
```
Результаты:
- `hsv.out.js` — деобфусцированный бандл.
- `wasm.txt` — извлеченный WASM‑пейлоад.
- Воркеры — `*-worker-<name>.out.js` (и `*-og-worker-...` при `--save-workers`).

## Импорты/экспорты WASM (автоматическая генерация)
Для полной формализации «какие методы вызывает WebAssembly»:
1. В корне `d:/600d` добавлен скрипт `wasm_inspect.js`.
2. Выполните команды (Windows PowerShell):
```powershell
npm init -y
npm i wabt
node wasm_inspect.js
```
Скрипт создаст:
- `d:/600d/hsv.wasm` — бинарь.
- `d:/600d/hsv.wat` — дизассемблированный WAT.
- `d:/600d/WASM_IMPORTS_EXPORTS.md` — сводка импортов/экспортов.

После генерации в этот отчет можно вставить выдержки из `WASM_IMPORTS_EXPORTS.md` (импортируемый модуль обычно `"a"` → методы `DI.*`; экспортируемые функции — например, `ub`/`qb`/`vb`).

## Импорты/экспорты WASM — результаты (сгенерировано)
- **Общее**: 120 импортов, 13 экспортов (см. `d:/600d/WASM_IMPORTS_EXPORTS.md`).
- **Импорты**:
  - Все импорты идут из модуля `"a"` с именами от `a` до `lb` (включая формы `aa`, `bb`, ..., `lb`). Это соответствует объекту импортов `{ a: DI }` из `deobfuscated.js` (≈2761), то есть вызовам `DI.*` из JavaScript.
- **Экспорты**:
  - Список экспортов: `mb`, `nb`, `ob`, `pb`, `qb`, `rb`, `sb` (table), `tb`, `ub`, `vb`, `wb`, `xb`, `yb` (memory).
  - Сопоставление с использованием в JS (`d:/600d/deobfuscated.js`):
    - `yb` (memory): используется для представлений TypedArray, например `new Uint8Array(aQ.yb[...])` (1871–1875), `new Float64Array(aQ.yb[...])` (2110).
    - `sb` (table): таблица функций; используется во вспомогательной обвязке (`aQ.sb[...]`) в финализаторе/обёртках (1980–2007).
    - `ub`: основная вычислительная функция, вызывается как `aQ.ub(...)` внутри `DI.ub` (2098–2101).
    - `qb`: вызывается из `DI.qb` (2190–2200).
    - `vb`: вызывается из `DI.vb` (2639–2648).
    - `rb`/`tb`/`wb`: служебные вызовы, применяются в маршалинге/вызовах (`aQ.rb` в `XQ` 2009–2018; `aQ.tb` при обработке ошибок 2037–2038; `aQ.wb` 2431–2434).
    - `mb`/`pb`: базовые указатели/структуры, активно используются в маршалинге буферов между JS и WASM: см. вызовы вида `bQ(..., aQ.mb, aQ.pb)` в `DI.*` (например, 2098–2105, 2219–2222, 2263–2266, 2338–2341, 2399–2403, 2465–2468, 2616–2619, 2621–2625).
- **Вывод**: `ub/qb/vb` — ключевые экспортируемые функции (ядро/сервис); `yb` — память; `sb` — таблица; `rb/tb/wb` — системные/вспомогательные; `mb/pb` — инфраструктура маршалинга.

## Итог
- JS‑проверки деобфусцированы и разложены по категориям с привязкой к строкам.
- Пайплайн деобфускации и инструменты задокументированы.
- Взаимодействие JS↔WASM описано; показана точка подключения импортов/экспортов.
- Для абсолютной полноты включите в отчет результаты `WASM_IMPORTS_EXPORTS.md` (после запуска `wasm_inspect.js`).
