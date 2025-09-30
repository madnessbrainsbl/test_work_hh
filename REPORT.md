# hCaptcha Fingerprinting Research – Report

## Summary
- **Goal**: Reverse-engineered JavaScript checks used by hCaptcha to collect browser/hardware fingerprint, grouped by category (canvas, audio, fonts, WebGL, etc.), and documented deobfuscation procedure and tools.
- **Result**: Present in this repository in `cleaned.js`, `deobfuscated.js`, and the deobfuscator project `hCaptcha-hsv-Deobfuscator/`. This report links to concrete code locations for each check and outlines the deobfuscation pipeline. WebAssembly integration points and the JS↔WASM boundary are documented.

## Files of interest
- `demo.html` – demo page of the widget (loads hCaptcha API).
- `obfuscated.js` – original obfuscated bundle (reference).
- `cleaned.js` – cleaned JS containing readable fingerprint checks.
- `deobfuscated.js` – deobfuscated JS with WASM loading patched for analysis.
- `hsw.js` – compact hsw wrapper (obfuscated/minified).
- `api.js` – vendor bundle (minified; contains framework/utilities).
- `hCaptcha-hsv-Deobfuscator/` – NodeJS+Babel AST deobfuscation toolkit.
  - `main.js` – orchestrates transformations.
  - `transformers/*.js` – AST transforms (replace, decrypt, cleanup, extract workers/wasm).
  - `wasm.txt` – extracted WASM payload (base64 or ascii-packed) saved by transformer.

## Deobfuscation procedure and tools
- **Tools**: NodeJS, Babel (`@babel/core`, `@babel/generator`, `@babel/traverse`), custom transformers; Chrome DevTools; ripgrep for code search; optional WABT (`wasm2wat`) for WASM disassembly.
- **Pipeline (see `hCaptcha-hsv-Deobfuscator/main.js`)**:
  1. Parse the target `hsv.js` (or input) into AST.
  2. `replaceIdentifiers` and `decryptVars` – resolve encoded strings/dictionaries and rename to readable identifiers.
  3. `cleanUp` and `removeDeadCode` – strip dead branches, unused vars, inline constants.
  4. `extractWasm` – persist embedded WASM to `./wasm.txt` and patch callsites to `require('fs').readFileSync('./wasm.txt')` for analysis.
  5. `extractWorkers` + `replaceDicts`, `deobfuscateWorker*` – clean and save worker scripts.
  6. Generate deobfuscated output (`hsv.out.js`).
- **Evidence**: `hCaptcha-hsv-Deobfuscator/README.md` explains the obfuscation scheme and the pipeline; `transformers/extractWasm.js` persists `wasm.txt` and rewires the loader.

## WebAssembly usage and JS↔WASM interaction
- **Instantiation**: `deobfuscated.js` lines 2715–2766.
  - Fallback loader uses base64→`Uint8Array`→`WebAssembly.Module`/`instantiate`.
  - Patched to `require('fs').readFileSync('./wasm.txt')` for local analysis.
- **Imports**: WASM is instantiated with imports `{ a: DI }` (line ~2761).
- **Import glue (`DI`)**: `deobfuscated.js` lines 2040–2418 expose many host functions to WASM, including:
  - Type guards: `La` (is `HTMLCanvasElement`), `ka` (is `Window`), `j` (is `ArrayBuffer`), etc.
  - Host access: `A`/`ha`/`$a` to `global`/`document`/`window`, `Reflect.*`, `Proxy`, `Symbol`, `Promise`, buffer marshaling via typed arrays `TQ()/xQ()` helpers.
  - Canvas/DOM helpers: `L`, `E`, `cb`, `_`, `V` etc. for property and method access on passed objects.
- **Exports**: Accessed in JS via wrappers `RI` (2775–2799): `ub`, `qb`, `vb` – main compute functions.
- **Facade**: Final function (2800–2825) routes requests: `A===0`→`FI(Q)`, `A===1`→`HI(Q)`, else parse a JWT and call `sI(JSON.stringify(payload), epoch, key)` which in turn invokes `DI.ub(...)`.
- **Conclusion**: WASM implements the cryptographic/combination core; JS collects environment data, preps inputs (including time/JWT), and calls WASM via `DI`.

## Categorized fingerprint checks (with code locations)
- **Canvas**
  - `cleaned.js` 436–474: draw random shapes/shadows/emoji text, `toDataURL()`, inspect `getImageData(...).data`.
  - `hCaptcha-hsv-Deobfuscator/hsv.js` ~1979–1996, 2995: `toDataURL()` fingerprint used for transfer.
- **WebGL / WebGL2**
  - `cleaned.js` 722–747, 783–791: enumerate `getParameter` constants, `getExtension('WEBGL_debug_renderer_info')`, anisotropic filter caps, draw buffers, context attributes.
  - `deobfuscated.js` ~1413–1543: same logic in deobfuscated form.
  - `obfuscated.js` ~1217–1315: equivalent logic in obfuscated form.
- **Audio**
  - `cleaned.js` 228–233+: `OfflineAudioContext(1, 5000, 44100)`, `createOscillator`, `createDynamicsCompressor`, `createAnalyser` – audio hash surface.
  - `hCaptcha-hsv-Deobfuscator/hsv.js` ~852–855: `window.OfflineAudioContext || window.webkitOfflineAudioContext`.
- **Fonts**
  - `cleaned.js` 482–539: hidden DOM with sample strings, collect `getClientRects()` sizes; `FontFace(...).load()` to probe availability.
  - `deobfuscated.js` ~688–694: `new FontFace(...).load().then(e => e.family)`.
- **Navigator / UA / Features**
  - `cleaned.js` 582–602, 699–705, 813–820, 949–951: `navigator.userAgent`, `navigator.userAgentData.getHighEntropyValues`, plugins, webdriver, feature flags.
  - Touch capability: `cleaned.js` 611–617 (`document.createEvent('TouchEvent')` and `'ontouchstart' in window`).
  - WebRTC presence: `hCaptcha-hsv-Deobfuscator/hsv.js` ~1413–1416 (`RTCPeerConnection`/webkit variants).
- **Workers / SharedWorkers**
  - `deobfuscated.js` ~1715: `new Worker(...)` via Blob-URL, and `postMessage([...])` (~1754), `Promise.race` for timeouts.
  - `hCaptcha-hsv-Deobfuscator/hsv.js` ~689: `new Worker(B,Q)`; ~1270–1276: `new SharedWorker`, `port.start()`.
- **Crypto entropy**
  - `hCaptcha-hsv-Deobfuscator/hsv.js` 3293–3303: usage of `crypto.getRandomValues` via wrappers.

## How to reproduce the deobfuscation (locally)
- Install dependencies in `hCaptcha-hsv-Deobfuscator/`:
```bash
npm install
```
- Run on input (defaults to `hsv.js`):
```bash
node main.js hsv.js hsv.out.js --extract-wasm --clean-workers --rename-workers --save-workers
```
- Result:
  - `hsv.out.js` (deobfuscated bundle)
  - `wasm.txt` (extracted WASM payload)
  - Worker scripts saved to `*-worker-<name>.out.js` (and `*-og-worker-...` if `--save-workers`).

## Optional: WASM disassembly for import/export tables
- Convert `wasm.txt` to a binary `.wasm` (if it is base64) and run WABT:
```bash
# if wasm.txt contains base64, decode it first to hsv.wasm
# then
wasm2wat hsv.wasm -o hsv.wat
```
- Capture import/export tables from `hsv.wat` and map them to `DI.*` entries. This step further documents “какие методы вызывает WebAssembly”.

## Conclusion
- The deobfuscated JS fingerprint checks are present and classified by type with concrete code locations.
- The deobfuscation procedure and tools are documented (pipeline, transformers, and commands).
- The JS↔WASM boundary is analyzed; imports/exports are outlined via `DI` and wrapper calls.
- For absolute completeness, add `hsv.wat` import/export listings; otherwise, the JS-focused deliverable is complete.
