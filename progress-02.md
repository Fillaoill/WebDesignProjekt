# Průběžná zpráva – cvičení 3

## 1. Navržené interaktivní funkce

| Funkce | Realizace v prototypu |
|---|---|
| Filtrování programu | Program lze filtrovat podle dne, scény a typu programu; současně je možné vyhledávat podle názvu, interpreta, popisu i tagů. |
| Vyhledávání účinkujících | Seznam 60 účinkujících nabízí fulltextové hledání a filtry kategorií Hudba, AV art a Kreativní kód. |
| Osobní program | Uživatel přidá vystoupení do „Mého programu“. Výběr se uchová v `localStorage`, tedy i po obnovení stránky. |
| Detail programu a interpreta | Z programu lze otevřít podrobný kontext položky, interpreta a jeho dalších vystoupení; profil obsahuje funkční zvukový náhled. |
| Rezervace workshopu | Workshopy zobrazují zbývající kapacitu. Formulář provede lokální simulaci rezervace, sníží počet míst a přidá workshop do osobního programu. |

## 2. Vazba na uživatelské potřeby

| Uživatel / potřeba ze specifikace | Funkce, která ji řeší |
|---|---|
| Viktorie chce zjistit páteční večerní program hlavní scény a objevit hudbu interpretů. | Filtr dne a scény, detail položky, profil interpreta a zvukový náhled. |
| Ondřej hledá workshop modulární syntézy, potřebuje znát podmínky a rezervovat kapacitu. | Filtr typu programu, vyhledávání, detail workshopu a rezervační formulář s kapacitou. |
| Filip se na místě potřebuje rychle orientovat v nabídce a uložit si zajímavé akce. | Mobile-first navigace, přehled scén a „Můj program“ dostupný z mobilní spodní lišty. |
| Fanoušci line-upu chtějí hledat konkrétní jméno nebo objevovat nové umělce. | Fulltextové hledání a tematické filtrování seznamu účinkujících. |

## 3. Ověřování návrhu

Prototyp byl ověřován ručním průchodem dvou klíčových scénářů z `project-specification.md`.

1. **Viktorie — páteční hudební večer:** V části Program zvolí **Pá 11/09** a **Sound & Live Stage**, otevře detail některého vystoupení, přejde na profil interpreta a spustí zvukový náhled. Zvolenou položku přidá do „Mého programu“. Filtry, detail, náhled i uložení musí bez chyby reagovat.
2. **Ondřej — workshop modulární syntézy:** Vyhledá výraz **modulární** nebo nastaví typ **Workshop**, otevře položku „Základy zapojování analogových modulárních syntezátorů“, vyplní jméno a e-mail a odešle rezervaci. Ověřuje se potvrzení, snížení volné kapacity a uložení položky do Mého programu.

Kontrolováno je také mobilní rozvržení od šířky 320 px, desktopové rozvržení od 720 px, ovladatelnost klávesnicí u formuláře a to, že není nutné spouštět server ani instalovat závislosti. Prototyp používá lokální export dat v `prototype/js/data.js`, aby fungoval také po otevření `prototype/index.html` přes `file://`; export odpovídá `data.json` z první iterace.

## 4. Použití AI a ověření výstupů

AI byla použita jako pomoc při návrhu informační hierarchie, formulaci textů, návrhu HTML/CSS/JavaScriptu a kontrole konzistence dat. Výstupy byly ověřeny vůči `project-specification.md` a `data.json`: festival má tři dny, tři scény, 60 účinkujících a 60 programových položek. Ručně byla kontrolována funkčnost filtrů, vyhledávání, detailů, ukládání voleb a rezervačního toku. Žádná externí tvrzení ani neověřená reálná data nebyla do návrhu doplňována.

## 5. Spuštění

Stačí otevřít `prototype/index.html` v moderním prohlížeči. Prototyp nevyžaduje instalaci, build ani lokální server.
