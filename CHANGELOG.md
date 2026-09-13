# Změny

Verze se značí podle [semver](https://semver.org): první číslo se zvedne při
velké změně, druhé při nové funkci, třetí při opravě. K téhle verzi patří
i vydání na GitHubu se stejným popisem.

## 1.2.0

### Změny

- **Osnova má 58 lekcí místo 39.** Písmena horní, dolní a číselné řady se teď
  učí po jednom, ne po dvou naráz, a mezi ně jsou vložené opakovací lekce.
  Vzorem byl DOSový kurz z roku 1990, který má na jednu klávesu skoro
  čtyřnásobek nácviku. Rozdíl se tím zmenšil z čtyřnásobku na dvojnásobek,
  aniž by se prodloužil den u klávesnice.
- **Cvičení od dolní řady dál má čtyři řádky místo tří.** Dítě už v té době
  píše rychleji, takže lekce zabere stejný čas, ale nácviku je o třetinu víc.
- **Dvojice zůstává didaktickou jednotkou.** Lekce s levou klávesou je vždycky
  následovaná lekcí s její zrcadlovou pravou, takže střídání rukou nezmizelo.
- **Čárka, tečka a pomlčka se procvičí i za slovy**, ne jen samy o sobě.
  Řádek pak vypadá jako `duben - lepidlo - lid -`, tak jak to dělaly staré
  kurzy.
- **Číselná řada je spárovaná symetricky**: Š a Á jsou prostředníčky, Č a Ý
  ukazováčky, Ř a Ž jejich krok dovnitř, Ě a Í prsteníčky, É zůstává samo.
  Dřív se párovala po sousedech, což jako jediné místo v osnově neumožňovalo
  cvičit střídání rukou.

### Opravy

- **Změna osnovy zamykala hotové lekce.** Odemykání se dívalo jen na lekci
  bezprostředně předcházející, takže po vložení nové lekce se zamklo i to, co
  měl uživatel dávno hotové, a naopak šlo přeskočit dopředu. Teď je odemčeno
  všechno až po nejvzdálenější zvládnutou lekci a k tomu jedna další, a lekce,
  kterou už někdo dělal, se nezamyká nikdy. Pravidla pro další změny osnovy
  jsou sepsaná v hlavičce curriculum.js.
- Zamíchané skupinky vyšly naprázdno v lekci, jejíž nová klávesa nebyla
  písmeno, tedy u čárky, tečky a pomlčky.
- Sevření mezi domovské klávesy bylo u lekce s jedinou novou klávesou pořád
  ten samý řádek. Teď druhý řádek přibírá i naposledy probrané sevření druhé
  ruky, ať se návrat cvičí na obou rukou.

## 1.1.0

### Nové

- **Měření po jednotlivých cvičeních, ne jen po lekcích.** Lekce míchá
  rozcvičku, nácvik kláves i věty dohromady, takže se v jejím průměru ztratí,
  co dělá potíže. Přehled pro rodiče má proto novou tabulku podle druhu
  cvičení, seřazenou od nejslabšího, s trendem a počtem opakování.
- **Cvičení navíc od rodiče.** V přehledu jde zadat jeden druh cvičení, který
  se dítěti ukáže na úvodní stránce nad další lekcí. Je kratší než lekce,
  nová písmena v něm nejsou a do osnovy se nezapisuje. Po dokončení se u něj
  ukáže porovnání: jak ten druh vypadal předtím a jak dopadlo cvičení navíc.
  Zadat jde jen druh, který dítě už dělalo.
- **Lekce na W a Q v angličtině**, hned po dokončené horní řadě. Obě písmena
  se v češtině skoro nepíšou, takže by je prsty po jejich lekci už nikdy
  nepotkaly. Osnova má tím pádem 39 lekcí.
- **Program upozorní, že se změnily jeho soubory** a je potřeba ho spustit
  znovu. Do té doby běží dál ta verze, se kterou se zapnul.

### Změny

- **Lekce 10 a 11 se páruje symetricky**: W a O jsou prsteníčky, Q a P
  malíčky. Dřív to byla celá pravá ruka a pak celá levá, takže tam nešlo
  cvičit střídání rukou.
- **Rozcvička připomíná celou dosavadní látku, ne jen poslední čtyři klávesy.**
  První řádek má za základní řadou tři naposledy naučená písmena, druhý losuje
  starší sevření se sklonem k těm, která dělají potíže.
- **Slovník má 799 českých slov** místo 539 a 280 anglických místo 225.
  Přibyla hlavně slova pro první lekce: po čtvrté lekci jich jde napsat 24
  místo jedenácti, po sedmé 63 místo třiatřiceti.
- Když je slov v dané fázi míň než pětadvacet, míchají se se slabikami, aby
  cvičení nebyla pořád tatáž hrstka slov dokola.

### Opravy

- Rozcvička po lekci s mrtvými klávesami vynechávala ď, ť a ň. Skládané
  písmeno nese příznak Shift kvůli háčku a rozcvička ho podle toho zahazovala.
- Výklad cvičení navíc vypisoval klávesy jako novou látku, i když se v něm
  nic nového neučí.
- Generátor chystal míň kousků, než se vejde na řádek, takže poslední řádek
  mohl skončit jediným slovem.
- Nácvik zamíchaných skupinek nevyrobil nic, když se klávesy vzaly z lekce
  o číslicích. Skupinky se skládají jen z písmen.
- Odsazené pokračování odrážky se v převodu dokumentů stávalo samostatným
  odstavcem, takže se delší odrážky ve Wordu trhaly.

### Dokumentace

- Poznámky k didaktice, psychologii a češtině jsou i anglicky a generují se
  z Markdownu do Wordu i do HTML pro web.
- Testů je 122.

## 1.0.0

První zveřejněná verze. 38 lekcí od F a J po číslice, generátor cvičení,
klávesnice a ruce na obrazovce, odměny do notýsku, přehled pro rodiče,
tři poznámky o tom, z čeho osnova vychází.
