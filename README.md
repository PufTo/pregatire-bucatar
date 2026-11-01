# Pregătire Bucătar 🍲

Aplicație web gratuită, în limba română, pentru exersarea noțiunilor de bucătărie profesională. Funcționează pe telefon, tabletă și calculator, fără cont.

## Ce găsești în aplicație

- **146 de întrebări** originale, în 8 capitole, cu răspuns și explicație.
- **Învățare pe capitole:** sesiuni de 10, 15, 25 sau toate întrebările.
- **Simulare:** 25 de întrebări alese aleatoriu, 30 de minute, corectare la final.
- **Recapitularea greșelilor** și evidența progresului, salvate local în browser.
- **Cuprins, 10 exerciții de calcul din barem și probă practică** inspirate de etapa județeană Neamț, 4 martie 2023 (bucătar, clasa a XI-a).
- Linkuri către subiectul scris, barem, proba practică și standardul ocupațional ANC.
- **Utilizare offline** după ce site-ul se încarcă și fișierele sunt salvate de browser.

Întrebările din aplicație sunt redactate pentru antrenament. Documentele originale ale concursului se deschid prin linkuri către sursele publicate; nu sunt copiate integral în repository. Vezi [sursele și verificările](docs/SURSE-SI-VERIFICARE.md).

## Structura proiectului

```text
pregatire-bucatar/
├── index.html                   # Pagina de intrare
├── assets/
│   ├── css/style.css            # Interfață responsive
│   ├── js/app.js                # Navigare, teste, progres
│   ├── js/logic.js              # Validare progres, punctaje și calcule
│   ├── js/questions.js          # Banca de întrebări
│   └── icons/icon.svg           # Pictogramă
├── manifest.webmanifest         # Instalare pe ecranul principal
├── sw.js                        # Cache pentru utilizare offline
├── .nojekyll                    # Publicare statică fără Jekyll
├── docs/SURSE-SI-VERIFICARE.md  # Proveniența materialelor
├── docs/PRE_DEPLOYMENT_AUDIT.md # Rezultatul auditului
├── docs/CONTENT_REVIEW.md       # Registrul reviziei tuturor întrebărilor
└── tests/                      # Validare, logică și audit în browser
```

## Publicare pe GitHub Pages

1. Creează un repository **public** numit `pregatire-bucatar`.
2. Încarcă **conținutul** acestui folder în rădăcina repository-ului: `index.html` trebuie să fie imediat vizibil în lista de fișiere.
3. Deschide **Settings → Pages → Build and deployment**.
4. Alege **Deploy from a branch**, apoi branch **main**, folder **/(root)** și **Save**.
5. După publicare, adresa va avea forma `https://UTILIZATOR.github.io/pregatire-bucatar/`.

Nu sunt necesare npm, build-uri, chei API, backend sau baze de date. Linkurile către resursele locale sunt relative și funcționează în subfolderul folosit de GitHub Pages.

## Dezvoltare locală

Servește directorul proiectului printr-un server static, de exemplu:

```bash
python -m http.server 8000
```

Deschide `http://localhost:8000/`. Pentru verificarea datelor și a fișierelor:

```bash
node tests/validate-content.js
node tests/test-logic.js
```

Pentru verificarea în browser (opțională la dezvoltare, fără dependențe în aplicație):

```bash
npm install --prefix /tmp/bucatar-audit-tools --no-audit --no-fund playwright axe-core
NODE_PATH=/tmp/bucatar-audit-tools/node_modules node tests/browser-audit.js
```

Scriptul pornește singur un server HTTP local, cu `/pregatire-bucatar/`, și folosește Chrome din `/usr/bin/google-chrome`. Pentru alt executabil, setează `CHROME_PATH`. Capturile și rezultatele accesibilității se scriu în `/tmp/bucatar-audit-artifacts` (sau `AUDIT_ARTIFACTS`). Testul simulează trecerea timpului; nu așteaptă 30 de minute.

La fiecare modificare a fișierelor aplicației, schimbă `VERSION` din `sw.js`. Toate resursele necesare sunt salvate împreună într-un cache separat pe calea aplicației. O versiune nouă se activează când utilizatorul apasă „Actualizează aplicația” sau după închiderea filelor vechi. Actualizarea păstrează progresul și sesiunea în curs; nu reîncarcă automat un examen fără alegerea utilizatorului. Dacă descărcarea noilor fișiere eșuează, versiunea instalată rămâne utilizabilă. Nu publica fișierele incomplet.

## Progres și confidențialitate

Datele testelor sunt salvate prin `localStorage` **doar în browserul utilizatorului**, într-o cheie separată pentru calea aplicației. Progresul din versiunea inițială este importat automat la prima deschidere. Nu sunt transmise unui server și nu se sincronizează între telefoane. Ștergerea datelor browserului poate elimina progresul. Dacă stocarea este blocată sau plină, aplicația afișează un mesaj și permite în continuare exersarea.

Sesiunile de învățare și simulările se reiau după reîncărcare. Timpul examenului continuă când pagina este închisă; o simulare expirată este corectată la redeschidere. Ieșirea explicită încheie sesiunea curentă; răspunsurile deja exersate în modul de învățare rămân în progres. După părăsirea rezultatului, se păstrează scorul și greșelile, nu întreaga pagină de corectare. Folosește o singură filă pentru studiu: modificările simultane din mai multe file nu sunt sincronizate.

Modul offline este gata după mesajul de confirmare din pagină, pe HTTPS sau localhost. PDF-urile și site-urile externe necesită internet și nu sunt descărcate automat. Browserul poate elimina cache-ul sau datele locale; o primă vizită fără internet nu este suficientă. Nu sunt folosite analytics, reclame, conturi, cookie-uri sau servicii de colectare a progresului. Site-urile externe au propriile politici când sunt deschise.

## Materiale și drepturi

Codul și banca de întrebări sunt incluse aici pentru proiectul de pregătire. Materialele externe rămân la autorii și instituțiile lor; un repository public nu înseamnă că documentele terților pot fi redistribuite fără drepturi. Nu a fost aleasă o licență open-source pentru repository.
