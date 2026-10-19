# Projektová specifikace – INTERFACE 2026
**Předmět:** Web Design  
**Projekt:** Web fiktivního festivalu

---

## 1. Identita festivalu

| Položka | Hodnota |
| :--- | :--- |
| **Název festivalu** | **INTERFACE 2026** |
| **Podtitul / Motto** | *Festival hudby, digitálního umění a kreativních technologií* |
| **Ročník** | 4. ročník |
| **Lokalita** | Praha – Výstaviště Holešovice (Křižíkovy pavilony, kruhové divadlo Nová Spirála a park) |
| **Datumový rozsah** | 11. 9. 2026 – 13. 9. 2026 (Pátek až neděle, 3 dny) |
| **Charakter festivalu** | Třídenní mezinárodní festival propojující pokročilou elektronickou hudbu, audiovizuální performance, imerzivní světelné instalace, kreativní kódování a hudební technologie. Festival funguje ve dvou rovinách: přes den nabízí praktické workshopy, prezentace nových médií a laboratoře zvukového i vizuálního designu; od podvečera do noci se proměňuje v dynamický hudební festival s koncerty, live elektronickými sety a algorave scénou. |
| **Hlavní žánry / témata** | Progresivní elektronická hudba (Live Ambient, IDM, Synth, Melodic Techno, Experimental), Audiovizuální performance & VJing, Generativní digitální umění & Creative Coding, Imerzivní světelné instalace & Laser choreography, Hudební hardware (Modular synths, Web Audio API, Sensory). |

---

## 2. Účel webu

### K čemu web slouží
Web slouží jako ústřední multimediální, informační a nákupní platforma festivalu. Představuje hudební i umělecký line-up, poskytuje zvukové a vizuální ochutnávky vystupujících a umožňuje nákup vstupenek.

### Hlavní cíle webu
1. **Představení unikátního konceptu:** Emocionálně a technologicky působivou formou představit propojení hudby, digitálního umění a technologií s důrazem na špičkový dark mode vizuál a audio prvky.
2. **Objevování a poslech line-upu:** Umožnit návštěvníkům snadno procházet 60 účinkujících, poslechnout si audio ukázky (integrovaný mini-přehrávač skladeb / live setů) a zhlédnout ukázky vizuálních instalací.
3. **Přehledný časový harmonogram:** Zprostředkovat orientaci v 60 programových položkách rozdělených do 3 dnů a 3 scén s filtrací dle typu programu (koncert, AV show, workshop, noční party).
4. **Konverze (vstupenky a registrace):** Zajištění hladkého nákupu festivalových pasů a registrace na kapacitně limitované tvůrčí workshopy.

### Důležité akce uživatelů na webu
* **Poslech audio ukázek vystupujících** přímo z karet interpretů nebo programu.
* **Procházení a filtrování programu** podle dnů, scén a žánrů (Live Music, AV Show, Workshop, Algorave).
* **Nákup vstupenek** (Festival Pass, VIP, Student) přes intuitivní rozhraní.
* **Rezervace místa na tvůrčí workshop** (např. modulární syntéza, programování vizuálů v TouchDesigneru).

---

## 3. Cílové skupiny

### 1. Fanoušci elektronické & alternativní hudby
* **Potřeby:** Hledají kvalitní dramaturgii, zahraniční headlinery live elektroniky, časový rozpis koncertů a audio ukázky pro objevování nových jmen.
* **Očekávání:** Rychlý přístup k poslechu skladeb přímo na webu, možnost snadného sdílení interpretů a plynulý nákup vstupenky na mobilu.
* **Požadované funkce na webu:** Integrovaný mini audio přehrávač skladeb, filtrace programu dle hudebních subžánrů, přehledné časové sloty stagí.

### 2. Audiovizuální umělci, designéři a kreativní technologové
* **Potřeby:** Zajímají se o technické pozadí instalací, použité technologie (TouchDesigner, Unreal Engine, WebGPU, lasery), chtějí navštívit denní odborné přednášky a workshopy.
* **Očekávání:** Detailní anotace u instalací a AV shows, profily umělců s odkazy na portfolia, možnost registrace na hands-on laby.
* **Požadované funkce na webu:** Štítky použitých technologií u performancí, registrační formulář na workshopy, profily vystupujících se seznamem jejich děl a technického vybavení.

### 3. Příležitostní návštěvníci a milovníci zážitků (Urban Culture)
* **Potřeby:** Chtějí zažít jedinečnou atmosféru večerního areálu, světelné parkové instalace, dobré jídlo a potkat přátele.
* **Očekávání:** Atraktivní fotogalerie a video teasery, jasné informace o otevírací době, cenách na barech, možnostech dopravy a bezpečnosti.
* **Požadované funkce na webu:** Přehledný časový harmonogram, FAQ, sekce „Jak se k nám dostat“.

### 4. Studenti uměleckých a technických vysokých škol (FAVU, FAMU, ČVUT, VUT...)
* **Potřeby:** Hledají cenově dostupné vstupenky, inspiraci pro vlastní tvorbu, networking a možnost zapojit se do nočních otevřených live coding / algorave jamů.
* **Očekávání:** Cenově zvýhodněné studentské akreditace, srozumitelná navigace, moderní a neotřelý design webu.
* **Požadované funkce na webu:** Studentské vstupné (ISIC ověření), přehled volně přístupných zón a otevřených komunitních vystoupení.

---

## 4. Informační architektura

### Struktura webu (Sitemap)

```
INTERFACE 2026 (Web)
├── 1. Úvodní stránka (Home)
│    ├── Hero sekce (Vizuální teaser, datum, claim, CTA vstupenky)
│    ├── Lineup Highlights (Karty klíčových hudebních & AV headlinerů)
│    ├── Koncept festivalu (Propojení zvuku, světla a kódu)
│    ├── Ochutnávka programu & Widget „Právě hraje“
│    └── Newsletter & Partneři
│
├── 2. Program
│    ├── Filtrační lišta (Dny 1–3, Scény, Žánr/Typ programu, Vyhledávání)
│    ├── Časová osa (Timeline) s indikátorem aktuálního času
│    ├── Programové položky (Čas, scéna, interpret, štítky, audio ikona)
│    └── Detail programu (Modální okno s plnou anotací a audio ukázkou)
│
├── 3. Účinkující
│    ├── Seznam účinkujících (Karty 60 interpretů, filtry: Hudba / AV Art / Kód)
│    └── Detail účinkujícího (/ucinkujici/:id)
│         ├── Profil (Jméno, žánr/role, bio, fotografie, země původu)
│         ├── Integrovaný audio/video přehrávač (Ukázka tvorby)
│         ├── Vystoupení (Provázání na položky v programu festivalu)
│         └── Odkazy (Spotify, SoundCloud, Bandcamp, Web, Instagram)
│
├── 4. Scény
│    ├── Přehled 3 hlavních scén:
│    │    ├── Sound & Live Stage (Křižíkův pavilon B – hlavní hudební aréna)
│    │    ├── Audiovisual & Light Dome (Nová Spirála – imerzivní 3D zvuk & lasery)
│    │    └── Creative Code & Modular Lab (Křižíkův pavilon D – workshopy & algorave)
│    └── Popis venkovních světelných instalací v parku
│
├── 5. Praktické informace
│    ├── Doprava a areál (Spojení MHD, parkování, pěší trasy)
│    ├── Vstupenky a akreditace (Páskování, otevírací doba pokladen)
│    ├── Gastro & Nápoje (Bezhotovostní systém, nabídka jídla)
│    ├── Přístupnost a bezpečí (Bezbariérovost, Safe Space, lékař)
│    └── FAQ (Často kladené otázky)
│
└── 6. Vstupenky & Rezervace workshopů
     ├── Nákup festivalových pasů (Celofestivalový, Víkendový, Denní)
     └── Rezervační formulář na kapacitně omezené tvůrčí laboratoře
```

### Hlavní navigace
* **Desktop:** Fixní horní lišta: `Program` | `Line-up / Účinkující` | `Scény` | `Praktické info` | `Koupit vstupenku [CTA]`.
* **Mobile:** Kompaktní záhlaví s logem a stavem přehrávače, spodní navigační panel s palcovým ovládáním: `Dnes v programu` | `Line-up` | `Scény` | `Koupit vstupenku [CTA]`.

### Vztahy mezi hlavními částmi webu
* **Program <-> Účinkující:** Každá položka programu odkazuje na profil interpreta. V profilu interpreta jsou vypsány všechny jeho festivalové sloty.
* **Program <-> Scény:** Kliknutím na název scény v programu se uživatel přenese na popis a polohu daného pódia.
* **Účinkující <-> Přehrávač:** Z profilu i z programu lze okamžitě spustit audio náhled interpreta.

---

## 5. Uživatelské scénáře

### Scénář 1: Výběr hudebního večera a poslech interpretů (Návštěvnice Viktorie)
* **Typ uživatele:** Fanoušek experimentální elektroniky a ambientu (24 let).
* **Cíl:** Zjistit, kdo vystupuje v pátek večer na hlavní *Sound & Live Stage*, poslechnout si ukázky jejich tvorby.
* **Výchozí situace:** Viktorie je večer doma na notebooku, plánuje víkend s přáteli a vybírá páteční hudební program.
* **Průběh a očekávaný výsledek:**
  1. Otevře web a v menu klikne na **Program**.
  2. Zvolí záložku **Den 1 (Pátek)** a zapne filtr scény **Sound & Live Stage**.
  3. U vystoupení od 20:00 klikne na ikonu *Přehrát ukázku* – ve spodní části webu se spustí audio náhled tracku.
  4. Hudba se jí líbí, klikne na detail interpreta, kde si přečte bio a zhlédne ukázku živé pódiové show.
  5. Viktorii to navdnadí na návstěvu festivalu.

---

### Scénář 2: Účast na tvůrčím workshopu modulární syntézy (Hudebník a bastlíř Ondřej)
* **Typ uživatele:** Poloprofesionální producent a hudební nadšenec (28 let).
* **Cíl:** Najít v programu praktický workshop zaměřený na stavbu a patchování modulárních syntezátorů, zjistit požadavky na vybavení a rezervovat si místo.
* **Výchozí situace:** Ondřej navštěvuje web přes odkaz ve facebookové komunitě hudebních tvůrců z mobilního telefonu.
* **Průběh a očekávaný výsledek:**
  1. V menu otevře **Program** a zapne rychlý filtr *Workshopy & Laby*.
  2. Zobrazí se mu sobotní odpolední blok *Modular Synth Patching & Sound Design* na scéně **Creative Code & Modular Lab**.
  3. Rozklikne detail workshopu, kde vidí, co si vzít s sebou (vlastní sluchátka), kdo workshop vede (Roman Bartoš) a stav kapacity (např. *Zbývá 6 volných míst z 25*).
  4. Klikne na tlačítko *Rezervovat místo*, vyplní jméno a e-mail.
  5. Zobrazí se potvrzovací hláška s číslem rezervace.

---

### Scénář 3: Noční orientace v areálu a vyhledání světelné instalace (Student Filip)
* **Typ uživatele:** Návštěvník festivalu přímo na místě v nočních hodinách (22 let).
* **Cíl:** Zjistit, kde se v parku Výstaviště nachází laserová instalace, o které mluví přátelé, a kudy projít od Křižíkovy fontány k Nové Spirále.
* **Výchozí situace:** Filip je v sobotu ve 22:30 na festivalu, stojí v areálu a drží v ruce chytrý telefon.
* **Průběh a očekávaný výsledek:**
  1. Otevře festivalový web, kde je na hlavní stránce aktivní widget *„Právě probíhá na scénách“*.
  2. Klepne na záložku **Scény**.
  3. Zvolí vrstvu *Světelné instalace & Park* a klikne na ikonu *Laser Tunnel Nová Spirála*.
  4. Zobrazí se krátká karta s popisem instalace, jménem autora a popis jak se na scénu dostat.
  5. Filip snadno najde cestu a pokračuje za zážitkem.
