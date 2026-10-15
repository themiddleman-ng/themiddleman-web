import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../lib/client/download-csv.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { csvCell } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
test('CSV exports quote product names and neutralise spreadsheet formulas', () => {
  assert.equal(csvCell('A, "B"'), '"A, ""B"""');
  assert.equal(csvCell('=HYPERLINK("example")'), '"\'=HYPERLINK(""example"")"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(8500), '"8500"');
});
