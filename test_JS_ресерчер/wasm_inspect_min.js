// Минимальный инспектор WASM без внешних зависимостей.
// Читает hCaptcha-hsv-Deobfuscator/wasm.txt (base64),
// сохраняет бинарь hsv.wasm, выводит импорты/экспорты через
// WebAssembly.Module.imports/exports в WASM_IMPORTS_EXPORTS.md.

const fs = require('fs');
const path = require('path');

function isBase64Like(s) {
  return /^[A-Za-z0-9+/=\r\n\t\s]+$/.test(s);
}

function ensureBase64(raw) {
  let s = raw.trim();
  // Удалим пробелы/переводы строк
  s = s.replace(/[\r\n\t ]+/g, '');
  if (isBase64Like(s)) return s;
  // Попробуем вытащить из кавычек
  const m = s.match(/"([A-Za-z0-9+/=]+)"/);
  if (m) return m[1];
  throw new Error('wasm.txt не похож на base64');
}

function checkWasmMagic(buf) {
  if (buf.length < 4) return false;
  const magic = buf.slice(0, 4);
  return magic[0] === 0x00 && magic[1] === 0x61 && magic[2] === 0x73 && magic[3] === 0x6D; // "\0asm"
}

(function main() {
  const wasmTxtPath = path.join(__dirname, 'hCaptcha-hsv-Deobfuscator', 'wasm.txt');
  if (!fs.existsSync(wasmTxtPath)) {
    console.error('Файл не найден:', wasmTxtPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(wasmTxtPath, 'utf8');
  const b64 = ensureBase64(raw);
  const wasmBuf = Buffer.from(b64, 'base64');

  if (!checkWasmMagic(wasmBuf)) {
    console.error('Сигнатура не похожа на wasm (нет "\\0asm")');
    process.exit(2);
  }

  const wasmOut = path.join(__dirname, 'hsv.wasm');
  fs.writeFileSync(wasmOut, wasmBuf);

  let mod;
  try {
    mod = new WebAssembly.Module(wasmBuf);
  } catch (e) {
    console.error('Ошибка при создании WebAssembly.Module:', e.message);
    process.exit(3);
  }

  const imports = WebAssembly.Module.imports(mod) || [];
  const exports = WebAssembly.Module.exports(mod) || [];

  const lines = [];
  lines.push('# WASM Импорты/Экспорты (минимальный метод)');
  lines.push('');
  lines.push(`- Всего импортов: ${imports.length}`);
  lines.push(`- Всего экспортов: ${exports.length}`);
  lines.push('');
  lines.push('## Импорты');
  imports.forEach((it, i) => {
    // Node обычно даёт { module, name, kind }
    lines.push(`- [${i}] module="${it.module}", name="${it.name}", kind=${it.kind || 'func'}`);
  });
  lines.push('');
  lines.push('## Экспорты');
  exports.forEach((it, i) => {
    // Node обычно даёт { name, kind }
    lines.push(`- [${i}] name="${it.name}", kind=${it.kind || 'func'}`);
  });
  lines.push('');
  lines.push('Подсказка: модуль импортов часто называется "a" (см. { a: DI } в deobfuscated.js), что соответствует вызовам DI.* из JS.');

  const mdOut = path.join(__dirname, 'WASM_IMPORTS_EXPORTS.md');
  fs.writeFileSync(mdOut, lines.join('\n'), 'utf8');

  console.log('Готово. Созданы файлы:');
  console.log('- ' + wasmOut);
  console.log('- ' + mdOut);
})();
