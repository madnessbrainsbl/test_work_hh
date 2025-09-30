const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const wabt = await require('wabt')();
    const wasmTxtPath = path.join(__dirname, 'hCaptcha-hsv-Deobfuscator', 'wasm.txt');
    if (!fs.existsSync(wasmTxtPath)) {
      throw new Error(`Файл не найден: ${wasmTxtPath}`);
    }
    let raw = fs.readFileSync(wasmTxtPath, 'utf8').trim();
 
    raw = raw.replace(/^\s+|\s+$/g, '').replace(/[\r\n\t ]+/g, '');


    const base64Re = /^[A-Za-z0-9+/=]+$/;
    if (!base64Re.test(raw)) {
     
      const m = raw.match(/"([A-Za-z0-9+/=]+)"/);
      if (m) raw = m[1];
    }

    const wasmBuf = Buffer.from(raw, 'base64');
    if (wasmBuf.length < 8 || wasmBuf.readUInt32LE(0) !== 0x6d736100) { 
      
      const magic = wasmBuf.slice(0, 4).toString('binary');
      if (magic !== '\u0000asm') {
        throw new Error('Некорректный формат wasm: сигнатура не совпадает');
      }
    }

    const outDir = __dirname;
    const wasmOut = path.join(outDir, 'hsv.wasm');
    fs.writeFileSync(wasmOut, wasmBuf);

    const mod = wabt.readWasm(wasmBuf, { readDebugNames: true });
    try {
      mod.generateNames();
      mod.applyNames();
    } catch (_) {}
    const wat = mod.toText({ foldExprs: false, inlineExport: false });
    const watOut = path.join(outDir, 'hsv.wat');
    fs.writeFileSync(watOut, wat, 'utf8');


    const importRegex = /\(import\s+"([^"]+)"\s+"([^"]+)"\s+\(([^\)]+)\)\s*\)/g;
    const exportRegex = /\(export\s+"([^"]+)"\s+\(([^\)]+)\)\s*\)/g;

    const imports = [];
    let m;
    while ((m = importRegex.exec(wat)) !== null) {
      imports.push({ module: m[1], name: m[2], desc: m[3] });
    }

    const exports = [];
    while ((m = exportRegex.exec(wat)) !== null) {
      exports.push({ name: m[1], desc: m[2] });
    }

    const md = [
      '# WASM Импорты/Экспорты',
      '',
      `- Всего импортов: ${imports.length}`,
      `- Всего экспортов: ${exports.length}`,
      '',
      '## Импорты',
      ...imports.map((it, i) => `- [${i}] module="${it.module}", name="${it.name}", desc=(${it.desc})`),
      '',
      '## Экспорты',
      ...exports.map((it, i) => `- [${i}] name="${it.name}", desc=(${it.desc})`),
      '',
      'Примечание: desc содержит «сырое» текстовое описание из WAT (func/memory/table и пр.).',
    ].join('\n');

    const mdOut = path.join(outDir, 'WASM_IMPORTS_EXPORTS.md');
    fs.writeFileSync(mdOut, md, 'utf8');

    console.log('Готово. Созданы файлы:');
    console.log('- ' + wasmOut);
    console.log('- ' + watOut);
    console.log('- ' + mdOut);
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
})();
