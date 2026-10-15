import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import * as identity from '../lib/domain/conversations.mjs';

const buyer='10000000-0000-4000-8000-000000000001';
const seller='20000000-0000-4000-8000-000000000002';
const profile='30000000-0000-4000-8000-000000000003';
const gig='40000000-0000-4000-8000-000000000004';
const conversation='50000000-0000-4000-8000-000000000005';
function database() {
  const tables={seller_profiles:[{id:profile,user_id:seller}],gigs:[{id:gig,seller_id:profile,status:'active',seller_profiles:{user_id:seller}}],orders:[{id:'order',buyer_id:buyer,seller_id:profile,gig_id:gig,status:'in_escrow'}],conversations:[{id:conversation,buyer_id:buyer,seller_id:seller,gig_id:gig,seller:{display_name:'Creator'},gigs:{title:'Product'},messages:[]}],messages:[{id:'message',conversation_id:conversation,sender_id:buyer,body:'Hello',created_at:'2026-10-15T00:00:00Z'}]};
  return {from(table){
    let rows=[...(tables[table]??[])];let single=false;
    const q={select(){return q;},eq(k,v){rows=rows.filter(r=>r[k]===v);return q;},in(k,vs){rows=rows.filter(r=>vs.includes(r[k]));return q;},or(filter){const clauses=filter.split(',').map(x=>x.split('.eq.'));rows=rows.filter(r=>clauses.some(([k,v])=>r[k]===v));return q;},order(){return q;},limit(n){rows=rows.slice(0,n);return q;},maybeSingle(){single=true;return q;},single(){single=true;return q;},insert(row){rows=[{id:conversation,...row}];tables[table].push(rows[0]);return q;},then(resolve){return Promise.resolve({data:single?rows[0]??null:rows,error:null}).then(resolve);}};return q;
  }};
}
async function route(path,userId,db) {
  const source=await readFile(new URL(path,import.meta.url),'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const loadedModule={exports:{}};
  const require=(name)=>{
    if(name.includes('/marketplace'))return {authenticatedUser:async()=>({id:userId}),serviceClient:()=>db,uuidPattern:/^[0-9a-f-]{36}$/,privateJson:(body,status=200)=>Response.json(body,{status})};
    if(name.includes('same-origin'))return {sameOriginMutation:()=>true};
    if(name.includes('/conversations.mjs'))return identity;
    throw new Error('Unexpected import '+name);
  };
  new Function('require','module','exports',output)(require,loadedModule,loadedModule.exports);
  return loadedModule.exports;
}
test('buyer and seller can list paid conversations despite different seller profile IDs',async()=>{
  for(const uid of [buyer,seller]){
    const api=await route('../app/api/conversations/route.ts',uid,database());
    const body=await (await api.GET()).json();
    assert.equal(body.conversations.length,1);
    assert.equal(body.conversations[0].gigTitle,'Product');
    assert.equal(body.conversations[0].counterpartName,uid===buyer?'Creator':'Private buyer');
  }
});
test('conversation creation uses seller user ID and reuses existing conversation',async()=>{
  const api=await route('../app/api/conversations/route.ts',buyer,database());
  const response=await api.POST(new Request('https://example.test/api/conversations',{method:'POST',body:JSON.stringify({gigId:gig})}));
  assert.equal(response.status,200);assert.equal((await response.json()).id,conversation);
});
test('message access joins paid order through seller profile and denies outsiders',async()=>{
  for(const uid of [buyer,seller,'60000000-0000-4000-8000-000000000006']){
    const api=await route('../app/api/conversations/[id]/messages/route.ts',uid,database());
    const response=await api.GET(new Request('https://example.test'),{params:Promise.resolve({id:conversation})});
    assert.equal(response.status,uid===buyer||uid===seller?200:404);
  }
});
