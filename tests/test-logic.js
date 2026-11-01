'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const logic = require('../assets/js/logic.js');
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/questions.js'),'utf8')+';this.questions=QUESTIONS;',ctx);
const qs = Array.from(ctx.questions);
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS:',name);}
test('all answer keys accept exactly one of the four alternatives',()=>{
  for(const q of qs)for(const answer of [q.correct,...q.wrong])assert.equal(logic.score([q.id],{[q.id]:answer},qs),Number(answer===q.correct));
  assert.equal(logic.score(qs.map(q=>q.id),{},qs),0);
  assert.equal(logic.score(qs.map(q=>q.id),Object.fromEntries(qs.map(q=>[q.id,q.correct])),qs),146);
});
test('real recipe data matches all ten original marking-scheme results',()=>{
  assert.deepEqual(logic.recipe.map(x=>logic.scale(x[1],3)),[300,750,90,45,15,15,0.3,15,30,9]);
  assert.equal(logic.scale(600,10,4),1500);
  assert.equal(1600/2000*100,80);
  assert.deepEqual(logic.practical.map(x=>x[1]),['300 g','30 g','8 g','60 g','45 g','23 g','5 g','450 ml','3 g']);
});
test('Romanian decimal input, invalid and empty input',()=>{
  for(const x of ['0,3','0.3',' 0,30 '])assert.equal(logic.parseGrams(x),0.3);
  for(const x of ['', ' ', '-1', 'Infinity','1e3','0x10','3g','1,2,3','1.000,5'])assert.equal(logic.parseGrams(x),null);
  assert.equal(logic.parseGrams('300'),300);
});
test('malformed data is discarded without losing valid progress or allowing HTML',()=>{
  for(const x of [null,0,[],true,'bad',{stats:null,exams:null},JSON.parse('{"__proto__":{"polluted":true}}')])assert.deepEqual(logic.sanitize(x,qs),logic.empty());
  const result=logic.sanitize({stats:{1:{attempts:3,correct:2,lastWrong:true},2:{attempts:-1,correct:4},3:null,999:{attempts:1,correct:1}},exams:[{correct:'<img onerror=alert(1)>',total:25,date:'2026-10-30'},{correct:20,total:25,date:'2026-10-30'}],practice:{0:true,1:'true',99:true}},qs);
  assert.deepEqual(result.stats,{1:{attempts:3,correct:2,lastWrong:true}});
  assert.equal(result.exams.length,1);assert.deepEqual(result.practice,{0:true});
  assert.equal({}.polluted,undefined);
});
const active={mode:'exam',ids:[1,2],index:0,answers:{1:qs[0].correct},confirmed:{},duration:logic.duration,startedAt:1000,opts1:[qs[0].correct,...qs[0].wrong]};
test('valid old sessions survive; expired sessions are retained for scoring',()=>{
  for(const now of [2000,5000000])assert.equal(logic.sanitize({active},qs,now).active.answers[1],qs[0].correct);
});
test('invalid sessions, answer strings and option orders cannot crash or inject content',()=>{
  for(const patch of [{ids:[]},{ids:[1,1]},{ids:[999]},{index:10},{startedAt:NaN},{startedAt:9000000},{duration:0},{answers:null},{mode:'bad'}])assert.equal(logic.sanitize({active:{...active,...patch}},qs,2000).active,null);
  const clean=logic.sanitize({active:{...active,answers:{1:'<script>bad</script>'},opts1:['<img>']}},qs,2000).active;
  assert.deepEqual(clean.answers,{});assert.equal(clean.opts1,undefined);
  const learn=logic.sanitize({active:{...active,mode:'learn',confirmed:{}}},qs,2000).active;
  assert.deepEqual(learn.answers,{},'Unconfirmed learning answers must not inflate a final score');
});
console.log(`OK: ${checks} logic groups`);
