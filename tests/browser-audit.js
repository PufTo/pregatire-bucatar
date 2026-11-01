'use strict';
// Optional dev-only tools: playwright and axe-core. No browser dependency is shipped.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const axePath=require.resolve('axe-core/axe.min.js');
const root=path.resolve(__dirname,'..');
const artifactDir=process.env.AUDIT_ARTIFACTS||'/tmp/bucatar-audit-artifacts';
fs.mkdirSync(artifactDir,{recursive:true});
let revision='v5',failAsset=false;
const server=http.createServer((req,res)=>{
  let route=new URL(req.url,'http://localhost').pathname;
  for(const prefix of ['/pregatire-bucatar','/other-app'])if(route===prefix){res.writeHead(301,{Location:prefix+'/'});return res.end();}
  route=route.replace(/^\/(pregatire-bucatar|other-app)\//,'/');
  if(route==='/')route='/index.html';
  if(failAsset&&route==='/assets/js/logic.js'){res.writeHead(503);return res.end('test failure');}
  const file=path.resolve(root,'.'+route);
  if(!file.startsWith(root+path.sep)||route.includes('/.git')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
  res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.setHeader('Cache-Control','no-store');
  let body=fs.readFileSync(file);
  if(route==='/sw.js')body=body.toString().replace("const VERSION='v5'",`const VERSION='${revision}'`);
  res.end(body);
});
const key='pregatire_bucatar_v1:/pregatire-bucatar/';
const errors=[],networkErrors=[],thirdParty=[],accessibility=[];
let browser,base,checks=0;
const click=(p,a)=>p.locator(`[data-action="${a}"]`).first().click();
const nav=(p,id)=>p.locator('#nav-'+id).click();
const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function answer(p,correct=true){const index=await p.evaluate(correct=>{const q=QUESTIONS.find(q=>q.question===document.querySelector('.question-title').textContent);const opts=[...document.querySelectorAll('[data-opt]')];return opts.findIndex(o=>o.querySelector('span:nth-child(2)').textContent===(correct?q.correct:q.wrong[0]));},correct);await p.locator(`[data-opt="${index}"]`).click();}
async function fresh(options={}){const context=await browser.newContext({serviceWorkers:'block',...options});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)networkErrors.push(r.url()+':'+r.status());});p.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin)thirdParty.push(r.url());});await p.goto(base);return {context,p};}
async function test(name,fn){if(process.env.AUDIT_FILTER&&!name.includes(process.env.AUDIT_FILTER))return;await fn();checks++;console.log('PASS:',name);}
async function layout(p,label){const overflow=await p.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));assert(overflow.document<=overflow.width&&overflow.body<=overflow.width,JSON.stringify({label,overflow}));const targets=await p.locator('button:visible:not(:disabled),select:visible,summary:visible,.source-link:visible,.checkline:visible').evaluateAll(els=>els.map(e=>({text:e.textContent.trim(),w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter(r=>r.w<24||r.h<24));assert.deepEqual(targets,[],label+' small targets');}
async function axe(p,label){await p.addScriptTag({path:axePath});const r=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));accessibility.push({label,violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});assert.deepEqual(r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],label);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://localhost:${server.address().port}/pregatire-bucatar/`;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 console.log('Browser:',browser.version());
 await test('mobile touch navigation, overflow, axe and screenshots at 320/360/390/430/768',async()=>{
  for(const width of [320,360,390,430,768]){
   const {context,p}=await fresh({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   await layout(p,`${width}:home`);await axe(p,`${width}:home`);await p.screenshot({path:path.join(artifactDir,`${width}-home.png`),fullPage:true});
   for(const action of ['toc','written-2023','practical-2023','sources','learn-menu','exam-menu','mistakes-menu']){
    if(action==='toc')await p.locator('#nav-toc').tap();else{await nav(p,'toc');const target=p.locator(`[data-action="${action}"]`);if(await target.count())await target.first().tap();else {await click(p,'written-2023');await p.locator(`[data-action="${action}"]`).first().tap();}}
    await layout(p,`${width}:${action}`);await axe(p,`${width}:${action}`);
   }
   await nav(p,'toc');await click(p,'written-2023');await p.locator('summary').first().tap();await p.locator('#calc-6').fill('0,3');await p.locator('[data-calc="6"]').tap();assert.match(await p.locator('#calc-fb-6').innerText(),/Corect/);
   await p.screenshot({path:path.join(artifactDir,`${width}-written.png`),fullPage:true});
   await nav(p,'home');await click(p,'start-learn');await layout(p,`${width}:question`);await answer(p,false);await axe(p,`${width}:feedback`);await p.screenshot({path:path.join(artifactDir,`${width}-question.png`),fullPage:true});
   await context.close();
  }
 });
 await test('all categories; 10, 15, 25, all and 30-model sessions; all 146 answers and explanations',async()=>{
  const {context,p}=await fresh();
  const categories=await p.evaluate(()=>CATEGORIES);
  for(const cat of categories){await nav(p,'learn');await p.locator('#category').selectOption(cat);await p.locator('#batch-size').selectOption('all');await click(p,'start-learn');const s=await state(p);assert.equal(s.active.ids.length,await p.evaluate(cat=>QUESTIONS.filter(q=>q.category===cat).length,cat));await click(p,'session-exit');}
  for(const size of ['10','15','25','all']){
   await nav(p,'learn');await p.locator('#category').selectOption('Toate');await p.locator('#batch-size').selectOption(size);await click(p,'start-learn');const total=size==='all'?146:Number(size);assert.equal((await state(p)).active.ids.length,total);
   for(let i=0;i<total;i++){await answer(p,i%2===0);assert(await p.locator('.feedback').isVisible());if(i===0){await p.reload();assert(await p.locator('.feedback').isVisible());assert(await p.locator('[data-action="prev"]').isDisabled());}await click(p,'next');}
   assert.match(await p.locator('h1').innerText(),new RegExp(`${Math.ceil(total/2)} din ${total}`));
  }
  await nav(p,'toc');await click(p,'start-model');assert.equal((await state(p)).active.ids.length,30);await click(p,'session-exit');
  await nav(p,'mistakes');const wrong=Object.values((await state(p)).stats).filter(s=>s.lastWrong).length;assert(wrong>0);await p.locator('#batch-size').selectOption('all');await click(p,'start-learn');assert.equal((await state(p)).active.ids.length,wrong);for(let i=0;i<wrong;i++){await answer(p);await click(p,'next');}await nav(p,'mistakes');assert(await p.locator('[data-action="start-learn"]').isDisabled());
  await context.close();
 });
 await test('exam selection, back/change answer, reload, 20/25 score, review and one-time completion',async()=>{
  const {context,p}=await fresh();p.on('dialog',d=>d.accept());await nav(p,'exam');await click(p,'start-exam');assert.match(await p.locator('#timer').innerText(),/30:00/);
  await answer(p,false);assert.equal(await p.locator('.feedback').count(),0);await click(p,'next');await click(p,'prev');await answer(p,true);await p.reload();assert.equal(await p.locator('[aria-pressed="true"]').count(),1);
  for(let i=0;i<25;i++){if(i>0)await answer(p,i<20);await click(p,'next');}
  assert.match(await p.locator('h1').innerText(),/20 din 25/);assert.equal(await p.locator('.score-number').innerText(),'80%');assert.equal(await p.locator('.review-item').count(),25);await axe(p,'exam-results');const s=await state(p);assert.equal(s.exams.length,1);assert.equal(Object.values(s.stats).reduce((n,s)=>n+s.attempts,0),25);await p.reload();assert.equal((await state(p)).exams.length,1);await context.close();
 });
 await test('timer expiration live, on reload, at click, and after background return',async()=>{
  for(const mode of ['live','reload','click','background']){console.log('Timer scenario:',mode);
   const {context,p}=await fresh();await nav(p,'exam');await click(p,'start-exam');await answer(p);if(mode==='reload'){
    await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.active.startedAt=Date.now()-1800001;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();
   }else{
    await p.evaluate(()=>{const realNow=Date.now.bind(Date);Date.now=()=>realNow()+1800001;});
    if(mode==='click')await answer(p,false);
    if(mode==='background')await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
   }
   await p.waitForSelector('.score-number');assert.match(await p.locator('h1').innerText(),/1 din 25/);assert.equal((await state(p)).exams.length,1);assert.equal(await p.locator('.review-item .tag').filter({hasText:'Fără răspuns'}).count(),24);await context.close();
  }
 });
 await test('exit confirmation cancel/accept; reset; learning repeated clicks',async()=>{
  const {context,p}=await fresh();await click(p,'start-learn');await p.locator('[data-opt="0"]').dblclick();assert.equal(Object.values((await state(p)).stats).reduce((n,s)=>n+s.attempts,0),1);await click(p,'session-exit');await nav(p,'exam');await click(p,'start-exam');p.once('dialog',d=>d.dismiss());await nav(p,'home');assert(await p.locator('#timer').isVisible());p.once('dialog',d=>d.accept());await click(p,'session-exit');assert.equal((await state(p)).active,null);await click(p,'sources');p.once('dialog',d=>d.dismiss());await click(p,'reset');assert(Object.keys((await state(p)).stats).length>0);p.once('dialog',d=>d.accept());await click(p,'reset');assert.deepEqual((await state(p)).stats,{});await context.close();
 });
 await test('all recipe fields, comma/dot, empty/invalid, practical checklist persistence',async()=>{
  const {context,p}=await fresh();await nav(p,'toc');await click(p,'written-2023');const values=['300','750','90','45','15','15','0,3','15','30','9'];
  for(let i=0;i<10;i++){await p.locator('#calc-'+i).fill(values[i]);await p.locator(`[data-calc="${i}"]`).click();assert.match(await p.locator('#calc-fb-'+i).innerText(),/Corect/);}
  for(const x of ['','no','-1','0.3005']){await p.locator('#calc-6').fill(x);await p.locator('[data-calc="6"]').click();assert.doesNotMatch(await p.locator('#calc-fb-6').innerText(),/Corect/);}
  await p.locator('#calc-6').fill('0.3');await p.locator('[data-calc="6"]').click();assert.match(await p.locator('#calc-fb-6').innerText(),/Corect/);
  await click(p,'practical-2023');assert.equal(await p.locator('.ingredients tbody tr').count(),9);await p.locator('[data-practice="0"]').check();await p.reload();await nav(p,'toc');await click(p,'practical-2023');assert(await p.locator('[data-practice="0"]').isChecked());await context.close();
 });
 await test('malformed storage, legacy migration, XSS payload and unavailable storage',async()=>{
  for(const raw of ['{', 'null','[]','{"stats":null,"exams":null}',JSON.stringify({stats:{1:null},exams:[{correct:'<img src=x onerror=alert(1)>',total:25,date:'x'}],active:{mode:'exam',ids:[999],index:0}})]){
   const {context,p}=await fresh();await p.evaluate(([k,r])=>localStorage.setItem(k,r),[key,raw]);await p.reload();assert(await p.locator('.hero').isVisible());assert.equal(await p.locator('img').count(),0);await context.close();
  }
  const {context,p}=await fresh();await p.evaluate(k=>{localStorage.removeItem(k);localStorage.setItem('pregatire_bucatar_v1',JSON.stringify({stats:{1:{attempts:2,correct:1,lastWrong:true}},exams:[]}));},key);await p.reload();assert.equal((await state(p)).stats[1].attempts,2);await context.close();
  for(const method of ['getItem','setItem']){const c=await browser.newContext({serviceWorkers:'block'});await c.addInitScript(method=>{Storage.prototype[method]=()=>{throw new Error('storage unavailable');};},method);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);assert(await p.locator('#storage-status').isVisible());await click(p,'start-learn');await answer(p);assert(await p.locator('.feedback').isVisible());await c.close();}
 });
 await test('empty bank and invalid restored session fail gracefully; keyboard focus',async()=>{
  const {context,p}=await fresh();await p.evaluate(()=>QUESTIONS.splice(0));await click(p,'start-learn');assert.match(await p.locator('#toast').innerText(),/Nu sunt/);await p.reload();await p.locator('#nav-learn').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('h1').evaluate(e=>e===document.activeElement),true);await p.locator('#category').focus();await p.locator('#category').selectOption('Igienă');assert.equal(await p.locator('#category').evaluate(e=>e===document.activeElement),true);await click(p,'start-learn');await p.locator('[data-opt="0"]').focus();await p.keyboard.press('Space');assert.equal(await p.locator('.feedback').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.action),'next');await context.close();
 });
 await test('root/subpath assets, manifest, reload and path-isolated progress',async()=>{
  const {context,p}=await fresh();await click(p,'start-learn');await answer(p);const saved=await state(p);await p.goto(base.replace('/pregatire-bucatar/','/other-app/'));assert.match(await p.locator('.stat').first().innerText(),/^0/);await p.goto(base);assert.deepEqual((await state(p)).stats,saved.stats);await p.goto(base.replace('/pregatire-bucatar/','/'));assert(await p.locator('.hero').isVisible());await context.close();
 });
 await test('offline cached navigation/learning/exam/calculator; safe update and foreign-cache preservation',async()=>{
  const {context,p}=await fresh({serviceWorkers:'allow'});await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);const initial=await p.evaluate(async()=>({scope:(await navigator.serviceWorker.getRegistration()).scope,keys:await caches.keys()}));assert.equal(initial.scope,base);assert(initial.keys.includes('pregatire-bucatar:/pregatire-bucatar/:v5'));
  assert.equal(await p.evaluate(async()=>{const c=await caches.open('pregatire-bucatar:/pregatire-bucatar/:v5');return (await c.keys()).length;}),8);
  await p.evaluate(async()=>{await caches.open('unrelated-site-cache');await caches.open('pregatire-bucatar:/other-app/:v1');});await context.setOffline(true);await p.reload();await click(p,'start-learn');await answer(p);await p.reload();assert(await p.locator('.feedback').isVisible());await click(p,'session-exit');await nav(p,'exam');await click(p,'start-exam');await answer(p);await p.reload();assert(await p.locator('#timer').isVisible());p.once('dialog',d=>d.accept());await click(p,'session-exit');await nav(p,'toc');await click(p,'written-2023');await p.locator('#calc-6').fill('0,3');await p.locator('[data-calc="6"]').click();assert.match(await p.locator('#calc-fb-6').innerText(),/Corect/);await p.goto(base+'index.html?offline=1');assert(await p.locator('.hero').isVisible());await context.setOffline(false);
  await click(p,'start-learn');await answer(p);const before=await state(p);revision='v6-audit';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await p.waitForSelector('#update-app:visible');assert.equal(await p.locator('.feedback').count(),1);await click(p,'update-app');await p.waitForFunction(()=>document.querySelector('.feedback'));await p.waitForFunction(async()=>!(await caches.keys()).includes('pregatire-bucatar:/pregatire-bucatar/:v5'));assert.deepEqual((await state(p)).stats,before.stats);const keys=await p.evaluate(()=>caches.keys());assert(keys.includes('unrelated-site-cache'));assert(keys.includes('pregatire-bucatar:/other-app/:v1'));assert(keys.includes('pregatire-bucatar:/pregatire-bucatar/:v6-audit'));
  await context.setOffline(true);await p.reload();assert(await p.locator('.feedback').isVisible());await context.setOffline(false);
  // A failed new precache must leave the current complete cache usable.
  failAsset=true;revision='v7-failed';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await p.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('nu a reușit'));failAsset=false;await context.setOffline(true);await p.reload();assert(await p.locator('.feedback').isVisible());await context.close();revision='v5';
 });
 await test('real service-worker pages have no browser console errors',async()=>{
  const {context,p}=await fresh({serviceWorkers:'allow'});const messages=[];p.on('console',m=>{if(m.type()==='error')messages.push(m.text());});await p.reload();await p.evaluate(()=>navigator.serviceWorker.ready);
  for(const action of ['written-2023','practical-2023','sources','learn-menu','exam-menu']){await nav(p,'toc');await click(p,action);}
  await click(p,'start-exam');await answer(p);p.once('dialog',d=>d.accept());await click(p,'session-exit');assert.deepEqual(messages,[]);await context.close();
 });
 // Deliberately failed install is the sole expected HTTP error.
 assert.deepEqual(errors,[]);assert.deepEqual(networkErrors,[]);assert.deepEqual([...new Set(thirdParty)],[]);
 fs.writeFileSync(path.join(artifactDir,'accessibility.json'),JSON.stringify(accessibility,null,2));
 console.log(`OK: ${checks} browser groups; ${accessibility.length} axe scans; no page errors, unexpected HTTP failures or third-party requests`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(artifactDir,'diagnostics.json'),JSON.stringify({errors,networkErrors,thirdParty,accessibility},null,2));if(browser)await browser.close();server.close();});
