# Průběžná zpráva – Cvičení 3: UX návrh, prototyp a funkce
**Předmět:** Web Design  
**Projekt:** INTERFACE 2026 – Festival hudby, digitálního umění a technologií  
**Autor:** Filip Surjomartono (obor INFO)  
**Výstup:** Interaktivní funkční prototyp (HTML5, Vanilla CSS, JavaScript) a datová základna  

---

## 1. Seznam navržených interaktivních funkcí

Podle požadavků zadání web neslouží pouze jako statická prezentace, ale obsahuje soubor vzájemně provázaných interaktivních funkcí:

### Funkce 1: Multidimenzionální filtrování a fulltextové vyhledávání v programu
* **Popis:** Umožňuje uživateli plynule procházet 60 programových položek ve 3 dnech. Kombinuje přepínání dnů (Pátek, Sobota, Neděle), výběr scény (Sound & Live Stage, AV & Light Dome, Modular Lab), filtr podle typu akce (koncerty, AV shows, workshopy, algorave) a okamžité fulltextové vyhledávání (shoda v názvu vystoupení, jménu účinkujícího i tematických tazích).
* **Rychlé presety:** Obsahuje jedno-klikové filtry pro nejčastější záměry (např. *Pátek večer @ Sound Stage*, *Pouze workshopy*).

### Funkce 2: „Můj program“ (Personal Timetable Builder) s detekcí konfliktů (Clashfinder)
* **Popis:** Každé vystoupení má tlačítko pro uložení do vlastního výběru. Stav se ukládá do `localStorage` prohlížeče (funguje bez nutnosti přihlášení a perzistuje i po obnovení stránky).
* **Detekce časového konfliktu (Clashfinder):** Algoritmus automaticky porovnává časové intervaly uložených vystoupení v tomtéž dni. Pokud se dvě položky na různých scénách časově překrývají, systém zobrazí varovný alert s konkrétním výčtem kolidujících akcí.
* **Export do kalendáře:** Uživatel si může svůj harmonogram vyexportovat jako standardní soubor `.ics` (kompatibilní s Apple Kalendářem, Google Kalendářem a Outlookem).

### Funkce 3: Integrovaný audio preview přehrávač (Web Audio API Synthesizer)
* **Popis:** Umožňuje návštěvníkovi okamžitě si poslechnout zvukovou charakteristiku kteréhokoliv z 60 interpretů bez nutnosti opouštět stránku nebo se proklikávat na externí služby.
* **Technické řešení:** Přehrávač využívá moderní Web Audio API a v reálném čase generuje frekvenční syntézu a arpeggia odpovídající žánru interpreta s animovaným vizualizérem zvukových vln. Funguje 100% offline bez závislosti na externích souborech.

### Funkce 4: Interaktivní mapa areálu Výstaviště Holešovice
* **Popis:** Vektorová mapa areálu s aktivními piny pro jednotlivé scény (Křižíkův pavilon B, Nová Spirála, Pavilon D, venkovní park a gastro zónu).
* **Propojení s programem:** Kliknutím na pódium se zobrazí detail scény, kapacita a nejbližší navazující program daného dne. Tlačítko *„Zobrazit celý program této scény“* automaticky nastaví filtr v programu a plynule na něj odscrolluje.

### Funkce 5: Registrace na kapacitně omezené workshopy
* **Popis:** U položek typu Workshop systém počítá zbývající volná místa z maximální kapacity. Uživatel může přímo z rozhraní otevřít rezervační formulář, zadat své údaje a místo si rezervovat (kapacita se v reálném čase poníží a workshop se automaticky zařadí do uživatelova programu).

---

## 2. Vazba funkcí na uživatelské potřeby

| Uživatelská skupina (Persona) | Klíčová potřeba | Řešení v prototypu |
| :--- | :--- | :--- |
| **Fanoušek hudby (Viktorie, 24 let)** | Rychle najít večerní hudební program a zjistit, jak interpret zní. | Filtrační preset *„Pátek večer @ Sound Stage“* + integrovaný audio přehrávač skladeb. |
| **Tvůrce / producent (Ondřej, 28 let)** | Zjistit detaily o praktickém workshopu modulární syntézy a zajistit si místo. | Filtr *„Pouze workshopy“*, zobrazení počtu volných míst a interaktivní rezervační formulář. |
| **Festivalový návštěvník na místě (Filip, 22 let)** | Rychlá orientace v areálu a vyřešení situace, kdy hrají dva oblíbení DJs naráz. | Mobilní spodní lišta (Bottom Bar), interaktivní mapa areálu a Clashfinder v „Mém programu“. |

---

## 3. Co bylo ověřováno a jak (Uživatelské scénáře)

V prototypu bylo prakticky ověřeno projití dvou klíčových scénářů definovaných v projektové specifikaci:

### Ověření Scénáře 1: Výběr pátečního večera a uložení do programu
1. **Postup testu:** Uživatel přichází na stránku, v sekci Program klikne na rychlý filtr *„Pátek večer @ Sound Stage“*.
2. **Výsledek:** Zobrazí se chronologicky seřazená večerní vystoupení (od 16:00 do 04:00). U vystoupení Jona Hopkinse uživatel klikne na tlačítko *Ukázka* – ve spodní části obrazovky se vysune audio přehrávač s vizualizérem a generovaným zvukem.
3. **Akce uložení:** Uživatel klikne na tlačítko *„Přidat“*. Tlačítko změní stav na *„Uloženo“*, v záhlaví i ve spodní mobilní liště se zvedne čítač v odznaku *Můj program*.
4. **Závěr:** Scénář proběhl hladce na mobilním i desktopovém zobrazení, uložení perzistuje v paměti prohlížeče.

### Ověření Scénáře 2: Nalezení workshopu modulární syntézy a rezervace místa
1. **Postup testu:** Uživatel zadá do vyhledávacího pole v programu slovo *„modular“* nebo klikne na filtr *Pouze workshopy*.
2. **Výsledek:** Vyfiltruje se workshop *„Základy zapojování analogových modulárních syntezátorů“* (lektor Roman Bartoš, scéna Creative Code & Modular Lab).
3. **Akce rezervace:** Uživatel klikne na *„Rezervovat (volno: 25/25)“*, otevře se modální dialog. Po vyplnění jména a e-mailu a odeslání se zobrazí potvrzovací toast notifikace, kapacita klesne na 24/25 a workshop se automaticky přidá do osobního harmonogramu.
4. **Závěr:** Rezervační flow je intuitivní, uživatel má okamžitou zpětnou vazbu.

---

## 4. Použití AI a ověření výstupů

V souladu se zadáním bylo AI využito v úvodních fázích jako asistenční nástroj pro rutinní a strukturované úkoly:
* **Generování syntetické datové sady:** AI bylo využito pro vytvoření rozsáhlého schématu 60 účinkujících a 60 programových položek v souladu s formátem JSON.
* **Ověření a korekce výstupů (lidská validace):**
  * Veškerá data byla zvalidována automatickým kontrolním skriptem na integritu cizích klíčů (`stageId`, `performerIds`) a časové překryvy na stejné scéně.
  * Anotace a popisy vystoupení byly manuálně zrevidovány, aby odpovídaly reálnému kontextu festivalů elektronické hudby a digitálního umění (Sónar, Lunchmeat) a neobsahovaly umělé generické fráze.
  * Kód frontendu (HTML, CSS, JS) byl navržen ručně s důrazem na sémantiku, standardy přístupnosti (WCAG) a mobile-first responzivitu.

---

## 5. Pokyny ke spuštění prototypu (bez instalace)

Prototyp je vytvořen tak, aby fungoval **zcela samostatně bez nutnosti instalace jakéhokoliv balíčku či spouštění serveru**:
1. Otevřete soubor `index.html` v libovolném moderním webovém prohlížeči (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
2. Data se načítají z lokálního skriptu `js/data.js` (záloha pro `file://` protokol) a jsou synchronní se souborem `data.json`.
3. Pro testování mobilního zobrazení stačí zapnout vývojářské nástroje v prohlížeči (klávesa `F12` -> ikona mobilního zařízení) nebo stránku otevřít na smartphonu.
