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
│   ├── js/questions.js          # Banca de întrebări
│   └── icons/icon.svg           # Pictogramă
├── manifest.webmanifest         # Instalare pe ecranul principal
├── sw.js                        # Cache pentru utilizare offline
├── .nojekyll                    # Publicare statică fără Jekyll
├── docs/SURSE-SI-VERIFICARE.md  # Proveniența materialelor
└── tests/validate-content.js    # Verificări automate fără dependențe
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
```

La publicarea unei versiuni noi, schimbă valoarea `CACHE` din `sw.js` (de exemplu `pregatire-bucatar-v5`), astfel încât browserul să actualizeze fișierele offline.

## Progres și confidențialitate

Datele testelor sunt salvate prin `localStorage` **doar în browserul utilizatorului**. Nu sunt transmise unui server și nu se sincronizează între telefoane. Ștergerea datelor browserului poate elimina progresul.

## Materiale și drepturi

Codul și banca de întrebări sunt incluse aici pentru proiectul de pregătire. Materialele externe rămân la autorii și instituțiile lor; un repository public nu înseamnă că documentele terților pot fi redistribuite fără drepturi. Nu a fost aleasă o licență open-source pentru repository.
