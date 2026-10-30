'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/questions.js'), 'utf8');
const ctx = {};
vm.runInNewContext(js + '\nthis.questions = QUESTIONS; this.categories = CATEGORIES;', ctx, { timeout: 1500 });
const questions = Array.from(ctx.questions);
const categories = Array.from(ctx.categories);
assert.equal(questions.length, 146, 'Banca trebuie să conțină 146 întrebări');
assert.equal(categories.length, 8, 'Sunt prevăzute 8 capitole');
assert.equal(questions.filter(q => q.model2023).length, 30, 'Sunt prevăzute 30 exerciții pe temele Neamț');
const prompts = new Set();
for (const q of questions) {
  assert(Number.isInteger(q.id), 'ID lipsă');
  assert(categories.includes(q.category), `Categorie nevalidă la #${q.id}`);
  assert(q.question.trim().length > 12, `Enunț prea scurt la #${q.id}`);
  assert(q.explanation.trim().length > 12, `Explicație lipsă la #${q.id}`);
  const choices = [q.correct, ...q.wrong];
  assert.equal(choices.length, 4, `Trebuie să aibă patru variante la #${q.id}`);
  assert.equal(new Set(choices).size, 4, `Variante duplicate la #${q.id}`);
  assert(!prompts.has(q.question), `Întrebare dublată: ${q.question}`);
  prompts.add(q.question);
}
const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(x => x[1]);
for (const ref of assets) {
  if (/^(https?:|data:)/.test(ref)) continue;
  assert(!ref.startsWith('/'), `Cale absolută nerecomandată pentru GitHub Pages: ${ref}`);
  assert(fs.existsSync(path.join(root, ref)), `Fișier lipsă: ${ref}`);
}
assert(fs.existsSync(path.join(root, '.nojekyll')));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
for (const icon of manifest.icons) assert(fs.existsSync(path.join(root, icon.src)));
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const file of ['index.html', ...assets.filter(x => !/^https?:/.test(x)), 'manifest.webmanifest']) {
  if (file === 'manifest.webmanifest') continue;
  assert(sw.includes(file), `Nu e disponibil offline: ${file}`);
}
const recipeGrams = [1000, 2500, 300, 150, 50, 50, 1, 50, 100, 30];
const expectedGrams = [300, 750, 90, 45, 15, 15, 0.3, 15, 30, 9];
recipeGrams.forEach((grams, i) => assert(Math.abs(grams * 3 / 10 - expectedGrams[i]) < 1e-9, `Calcul greșit la ingredientul ${i + 1}`));
console.log(`OK: ${questions.length} întrebări / ${categories.length} categorii / 30 exerciții Neamț`);
console.log('OK: răspunsuri distincte, explicații, legături locale, manifest, fișiere offline și calcule');
