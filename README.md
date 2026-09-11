# Píšeme všemi deseti

Výukový program psaní všemi deseti prsty na české klávesnici. Běží lokálně,
nic neodesílá na internet a data si drží v obyčejných souborech vedle sebe.

> **In English:** a touch-typing course for a Czech nine-year-old. The program
> and its whole interface are in Czech, and so is this README. The three notes
> explaining the decisions behind it are in `docs`, in both languages:
> [didactics](docs/didactics.md), [motivation](docs/motivation.md) and
> [Czech and the Czech keyboard](docs/czech-keyboard.md).

## Spuštění

Dvojklik na **`start.bat`**. Otevře se prohlížeč na adrese `http://127.0.0.1:7331`.
Okno s černým pozadím nechej otevřené, dokud program běží. Zavřením okna
nebo klávesami Ctrl+C program skončí.

Přehled pro rodiče se otevírá zvlášť souborem **`pro-rodice.bat`**. V dětské
aplikaci na něj schválně nevede žádné tlačítko. Když už program běží, jen se
otevře další záložka v prohlížeči.

Potřebuje jen [Node.js](https://nodejs.org). Žádné knihovny se neinstalují.

Když je port obsazený, dá se zvolit jiný: `node server.js --port 7332`.

## Co program umí

- **38 lekcí** v pořadí, jaké se u nás používá: nejdřív `f` a `j`, pak zbytek
  základní řady, horní řada, dolní řada, velká písmena včetně střídání obou
  Shiftů, oprava chyb, háčky a čárky, znaménka a číslice. Na konci jsou
  prstolamy a tematická cvičení pro zábavu.
- Každá lekce začíná **výkladem v češtině**: co se dnes učíme, který prst
  klávesu obsluhuje a na co si dát pozor.
- **Dítě vidí jen dnešní cíl**, ne celkový počet lekcí. Když ho splní, program
  to řekne a pochválí vydrženou práci. Zbytek cesty je schovaný pod odkazem.
- **Vždy jen jeden řádek na obrazovce**, dost dlouhý, aby se psalo plynule.
  Po jeho dopsání se přeskočí na další sám, mezera navíc nevadí.
- **Během lekce je vidět, kolik ještě zbývá.** Po každém cvičení se ukáže,
  kolik jich zůstává a na kolik minut to zhruba je, počítáno podle toho, jak
  dítě doopravdy píše. Vedle je tlačítko Konec pro dnešek.
- **Lekci jde přerušit a vrátit se k ní.** Program si pamatuje, u kterého
  cvičení dítě skončilo, a nabídne návrat přesně tam. Hotovou lekci jde
  zopakovat i po částech, stačí kliknout na jedno cvičení.
- **Řádek plný chyb se nepustí dál.** Když se na něm nasbírají víc než dvě chyby,
  smaže se a napíše znovu. Po třech pokusech se pokračuje, ať se dítě nezasekne.
  Hranice jde změnit v nastavení.
- **Backspace je zpočátku vypnutý.** Chyby se neopravují, jen se píše dál, aby se
  nácvik hmatu nepřerušoval. Zapne ho vlastní lekce, která ho vysvětlí.
- **Každá lekce začíná rozcvičkou** na to, co dítě umí z dřívějška. Nejdřív
  základní řada, pak sevření dřív naučených kláves. Teprve potom nová klávesa.
- **Nácvik jde ve třech stupních**: jedno písmeno pořád dokola, pak pravidelné
  střídání rukou, pak zamíchané skupinky, do kterých se přimíchají i písmena
  z dřívějších lekcí. Teprve potom slova a věty.
- **Skupinky se v prvním cvičení zkracují**: `fff fff ff ff f f`. Mezerník tak
  přichází čím dál častěji a prst se čím dál častěji vrací do základní polohy.
- **Krok Zpátky domů** u každé klávesy mimo základní řadu sevře natažený úhoz
  mezi dva domovské: `frf juj`, `fgf jhj`, `dcd k,k`. Nejčastější chybou
  začátečníka není špatná klávesa, ale ruka, která se za prstem posune.
- **Obrázek obou rukou** se zvýrazněným prstem. Každá ruka má svou barvu
  a stejnou barvou se v nápovědě píše její jméno.
- **Obrázek klávesnice** s barvami prstů a zvýrazněnou další klávesou.
  Jde vypnout, jakmile se hmat usadí.
- **Adaptivní výběr slov**: častěji se objeví slova s písmeny, která zrovna
  dřou. Program nikdy nedá znak, který se ještě neučil.
- **Paměť pro každý profil** zvlášť: hotové lekce, hvězdičky, rychlost,
  přesnost, čas u klávesnice a statistika po jednotlivých klávesách.
- **Virtuální notýsek** jako odměna: linkovaný papír, na který se lepí získané
  obrázky. Na papír se tisknou jen jako obrys, aby si je šlo vybarvit
  a aby stačila černobílá tiskárna.
- **Stránka pro rodiče** s hvězdičkami po lekcích, sloupcovými grafy rychlosti
  a přesnosti, přehledem klávesových potíží a nastavením dětského profilu.
  Je na samostatné adrese `/rodice.html` a spouští se přes `pro-rodice.bat`.
  V dětské aplikaci nastavení není, dítě si při psaní přepíná jen klávesnici.
- **Cvičení jen jednou rukou** a **prstolamy**, tedy slova, kde jeden prst musí
  hned po sobě na dvě různé klávesy. Nejtěžší dvojice se počítají přímo ze
  slovníku, v češtině vedou lo a ol, ce a ec, tr a rt.
- **Tematická cvičení**: zvířata, česká města, dny a datumy, jména a legrační
  příjmení, anglická slovíčka ze školy a slovíčka z Minecraftu.
- **Dokument Word** s výkladem všech lekcí a ukázkami cvičení k vytištění.

## Odkud se berou rozhodnutí

Ve složce **`docs`** jsou tři dokumenty, které shrnují rešerše a zdůvodňují,
proč je osnova i motivační část udělaná tak, jak je. Zdrojem je Markdown,
z něj se generují verze pro Word i pro web.

| Soubor | O čem |
| --- | --- |
| `docs/didaktika.md` | pořadí kláves, stavba cvičení, měření výkonu, technika |
| `docs/psychologie.md` | odměny, cíle, pochvala, hvězdičky, co v programu záměrně není |
| `docs/cestina.md` | české rozložení, mrtvé klávesy, nejtěžší dvojice písmen v češtině |

Každý z nich má i anglickou verzi, protože odkazy na ně vedou z webové
stránky: `docs/didactics.md`, `docs/motivation.md` a `docs/czech-keyboard.md`.
České verze zůstávají zdrojem pro tisk, anglické pro web.

## Jak je to s motivací

Na úvodní stránce má dítě jeden jediný cíl, a to dnešní. Bandura a Schunk
ukázali, že děti postupují mnohem líp s blízkým dosažitelným cílem, zatímco
vzdálený cíl nepomohl skoro vůbec. Celý seznam všech lekcí je proto
schovaný pod odkazem, ne rozprostřený přes celou obrazovku.

Chválí se odvedená práce, nikdy dítě samo. Mueller a Dweck ukázali, že pochvala
za chytrost dětem po prvním neúspěchu ubere chuť i výkon, kdežto pochvala za
snahu je u věci udrží. Program proto říká „u klávesnice to bylo deset minut“,
ne „jsi šikovná“.

Hvězdičky nejsou bodování proti ostatním, ale zpráva o vlastní přesnosti.
Souhrny typu „pět hvězdiček z osmdesáti sedmi“ vidí jen rodič. Dítě má u každé
lekce jen její vlastní tři hvězdičky.

Denní cíl je v nastavení, výchozí je deset minut.

## Jak je to s odměnami

Během psaní je obrazovka schválně klidná, žádné body ani odpočet. Odměna
přichází až po dokončené lekci a nikdy se neslibuje dopředu. Vychází to
z výzkumu motivace u dětí: odměna slíbená předem snižuje zájem o samotnou
činnost, zatímco stejná odměna jako překvapení ne. V notýsku jsou proto vidět
jen obrázky, které už dítě získalo, ne ty, které teprve může získat.

## Rychlost a hvězdičky

Rychlost se měří v **úhozech za minutu**, jak je u nás zvykem. Jeden úhoz je
jedno stisknutí klávesy včetně mezery. Čistá rychlost je snížená o chybovost.

| Hvězdičky | Podmínka |
| --- | --- |
| ★ | přesnost aspoň 90 % (tím se odemkne další lekce) |
| ★★ | přesnost aspoň 95 % |
| ★★★ | přesnost aspoň 98 % a zároveň cílová rychlost lekce |

Přesnost je vždy důležitější než rychlost. Když se ještě plete hmat, rychlé
psaní jen upevňuje chyby. Když se lekce třikrát nepovede, další se odemkne
i tak, aby se dítě nezaseklo.

## Rozložení klávesnice

Program počítá s rozložením **Čeština (QWERTZ)**, tedy `z` v horní řadě a
`ěščřžýáíé` na číselné řadě. V nastavení jde přepnout na variantu QWERTY.
Pokud ve Windows není zapnutá česká klávesnice, program na to upozorní.

Velká písmena s háčky a čárkami se na české klávesnici píší mrtvou klávesou
(nejdřív háček nebo čárka, pak velké písmeno), protože Shift nad `ř` dá pětku.
Program to tak i učí, v lekci 28.

## Data a zálohování

Každý profil je jeden soubor JSON ve složce **`data`**. Jinou složku lze
zvolit proměnnou prostředí `PSANI_DATA`, což se hodí při zkoušení. Zálohu uděláš tím,
že tu složku zkopíruješ. Smazáním souboru se smaže profil i s historií.

## Vývoj

```
node --test "test/*.test.mjs"   testy výpočtů, osnovy a obsahu
node test/check-content.mjs     přehled, kolik slov a vět je v které lekci
node tools/make-docx.mjs        vyrobí Pisme-vsemi-deseti-lekce.docx
node tools/make-docs.mjs        vyrobí .docx a .html z dokumentů ve složce docs
```

Dokument Word obsahuje výklad všech lekcí a ukázky cvičení. Nácvik kláves je
vždycky stejný, takže se vypíše přesně tak, jak ho dítě uvidí. Slabiky, slova
a věty se losují pokaždé znovu, u těch je v dokumentu jedno vylosování jako ukázka.

Struktura:

```
server.js              HTTP server a API, bez závislostí
web/rodice.html        samostatná stránka pro rodiče
web/js/engine.js       jádro psaní: vstup, časování, vyhodnocení
web/js/keyboard.js     rozložení kláves a přiřazení prstů
web/js/hands.js        nákres rukou se zvýrazněným prstem
web/js/curriculum.js   osnova lekcí a výklady
web/js/generator.js    skládání textu cvičení
web/js/stats.js        výpočet rychlosti, přesnosti a hvězdiček
web/js/stickers.js     obrázky a logika odměn
web/content/           slovníky, věty, texty a tematické sady
tools/make-docx.mjs    generátor dokumentu Word, bez knihoven
tools/make-docs.mjs    převod rešerší z docs do Wordu
docs/                  rešerše k didaktice, psychologii a češtině
```

## Licence

MIT, viz soubor [LICENSE](LICENSE). Slovníky, věty a tematické sady jsou
součástí programu a platí pro ně totéž.
