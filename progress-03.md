# Průběžná zpráva – cvičení 4

## 1. Implementováno

Ve složce `web/` je vytvořena funkční responzivní webová prezentace fiktivního festivalu INTERFACE 2026.

- Úvodní sekce s termínem, místem konání, hlavním sdělením a výzvami k akci.
- Samostatná obsahová stránka `lineup.html` se seznamem účinkujících, vyhledáváním, filtry kategorií a tlačítkem pro jejich zrušení.
- Hlavní navigace pro Program, Line-up, Scény a praktické informace.
- Program festivalu s filtrováním podle dne, scény a typu programu, fulltextovým vyhledáváním, počtem zobrazených položek a tlačítkem pro zrušení aktivních filtrů.
- Seznam účinkujících s vyhledáváním a kategoriemi.
- Přehled scén a praktických informací.
- Detail programové položky a detail interpreta v modálním okně.
- Zvukový náhled interpreta generovaný ve Web Audio API.
- Uložení položek do „Mého programu“ pomocí `localStorage`.
- Lokální simulace rezervace workshopu včetně kontroly zbývající kapacity.
- Responzivní rozvržení pro mobil a desktop.

## 2. UX a design: aktuální best practices a jejich použití

- **Mobile-first a responzivní rozhraní:** Základní rozvržení je navrženo pro malé displeje; od šířky 720 px se rozšiřuje do desktopové mřížky.
- **Sticky navigace:** Horní navigace zůstává při posouvání stránky dostupná na mobilu i desktopu. Na mobilu je menu kompaktní a rozbalovací, aby nezakrývalo obsah trvale zobrazenou spodní lištou.
- **Prioritizace vyhledávání:** Vyhledávání v programu je umístěno na začátku filtračního panelu a zabírá celou šířku. Uživatel může rychle najít interpreta, workshop nebo výraz z anotace.
- **Postupné filtrování:** Den je řešen rychlými přepínacími čipy, zatímco scéna a typ programu jsou výběrové prvky. Aktivní filtrování lze jedním tlačítkem vrátit do výchozího stavu.
- **Okamžitá zpětná vazba:** Počet výsledků se aktualizuje při filtrování, ukládání programu i rezervaci se zobrazují krátké stavové zprávy.
- **Personalizace bez přihlášení:** „Můj program“ ukládá výběr návštěvníka do `localStorage`, takže zůstává dostupný i po obnovení stránky.
- **Přístupnost:** Použity jsou sémantické prvky `header`, `nav`, `main`, `section`, `form`, `fieldset`, `legend` a popisky formulářových polí. Web obsahuje odkaz pro přeskočení na program, viditelné focus stavy, `aria-live` pro počet výsledků a nativní dialogová okna.
- **Respektování uživatelských preferencí:** Při aktivním `prefers-reduced-motion` se potlačí výrazné animace a přechody.

## 3. Změny oproti prototypu a důvody

- Filtry programu byly přepracovány. Vyhledávání je nyní první, následuje filtr dne a potom dvojice filtrů Scéna a Typ. Rozvržení je přehlednější a lépe odpovídá prioritě nejčastějších úkonů.
- Přibylo tlačítko „Zrušit filtry“, které se ukáže pouze při aktivním filtrování. Uživatel tak může rychle obnovit celý program.
- Spodní mobilní navigace byla odstraněna. Nahrazuje ji sticky header s rozbalovacím menu, v němž je dostupný také „Můj program“. Cílem bylo omezit trvalé zabírání výšky mobilního displeje.
- Header je sticky také na desktopu a jeho pozadí vede přes celou šířku obrazovky. Navigace je dostupná bez nutnosti vracet se na začátek stránky.
- Rozestupy mezi položkami desktopové navigace byly zvětšeny pro lepší čitelnost a přesnější ovládání.
- Line-up byl přesunut z úvodní stránky na samostatnou stránku `lineup.html`, aby měl vlastní prostor pro vyhledávání a filtrování.

## 4. Provedené testy a kontroly

- Kontrola JavaScriptu pomocí `node --check web/js/app.js`.
- Kontrola responzivního rozvržení pro mobilní a desktopovou šířku.
- Ruční průchod filtrováním programu: den, scéna, typ, vyhledávání a zrušení filtrů.
- Kontrola aktualizace počtu zobrazených položek.
- Ruční ověření otevření detailu programu, profilu interpreta, zvukového náhledu a ukládání do „Mého programu“.
- Ověření rezervačního formuláře workshopu, změny kapacity a zobrazení potvrzení.
- Kontrola ovládání formulářů a tlačítek klávesnicí, focus stavů a zobrazení mobilního menu.

## 5. Použití AI a ověření výstupů

AI byla použita jako konzultační a implementační nástroj při návrhu informační hierarchie, mobilního rozvržení filtrů, úpravách HTML, CSS a JavaScriptu a při formulaci textů.

Výstupy AI nebyly přebírány bez kontroly. Každá změna byla porovnána s projektovou specifikací a ověřena v lokálním prototypu. Byla kontrolována funkčnost navigace, filtrů, modálních oken, ukládání položek, rezervačního toku a responzivního rozvržení. Obsah festivalu vychází z lokálních dat projektu; nebyla použita neověřená externí data.

## 6. Struktura stránek

Odevzdání obsahuje úvodní stránku `index.html` a obsahově odlišnou stránku `lineup.html`. Obě stránky používají společné styly, data a JavaScript, ale každá zobrazuje jiný hlavní obsah.
