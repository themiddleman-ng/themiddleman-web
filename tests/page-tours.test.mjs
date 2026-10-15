import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../lib/onboarding/tour-state.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { tourKey, readTourState, mergeTourStates, markTourSeen } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
test('product tours are once per page type rather than repeated for each listing', () => {
  assert.equal(tourKey('/gigs/first-product'), '/gigs/detail');
  assert.equal(tourKey('/gigs/second-product'), '/gigs/detail');
  assert.equal(tourKey('/gigs/new'), '/gigs/new');
  assert.equal(tourKey('/gigs/mine'), '/gigs/mine');
});
test('closing a page marks it seen without disabling other page tours', () => {
  const initial = { version: 2, optedIn: true, seen: {} };
  const next = markTourSeen(initial, '/orders');
  assert.equal(next.optedIn, true);
  assert.equal(next.seen['/orders'], true);
  assert.equal(next.seen['/messages'], undefined);
  assert.deepEqual(initial.seen, {});
});
test('a delayed account response cannot erase a locally completed tour', () => {
  const state = mergeTourStates({ version: 2, optedIn: true, seen: { '/profile': true } }, { version: 2, optedIn: true, seen: { '/orders': true } });
  assert.deepEqual(state.seen, { '/profile': true, '/orders': true });
});
test('invalid cache entries are rejected and only completed flags are retained', () => {
  assert.equal(readTourState({ version: 1, optedIn: true, seen: {} }), null);
  assert.equal(readTourState('broken'), null);
  assert.deepEqual(readTourState({version:2,optedIn:false,seen:{'/orders':true,'/profile':false}}), {version:2,optedIn:false,seen:{'/orders':true}});
});
