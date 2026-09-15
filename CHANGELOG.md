# Změny

Verze se značí podle [semver](https://semver.org): první číslo se zvedne při
velké změně, druhé při nové funkci, třetí při opravě. K téhle verzi patří
i vydání na GitHubu se stejným popisem.

## 1.2.0

### Osnova

- **Osnova má 90 lekcí místo 39.** Nácviku na jednu novou klávesu je dvakrát víc
  a den u klávesnice se nijak neprodloužil. Vzorem byl DOSový kurz z roku 1990,
  který dává na klávesu skoro čtyřnásobek nácviku než naše původní verze.
- **Písmena se učí po jednom.** Horní, dolní i číselná řada jdou po jedné klávese,
  vždycky ale levá a hned za ní její zrcadlová pravá, aby se dvojice dala
  cvičit střídáním rukou. Mezi bloky jsou opakovací lekce.
- **Lekce s novým písmenem se dělí na dvě.** Od lekce s A a Ů má první část
  nácvik a slova. Druhá část přináší nový způsob procvičování: vzory z kláves
  pořád dokola jako stupnici (`asdf jklů ůlkj fdsa`, `adsf jlků ůklj fsda`,
  `adjl ůkfs`), krátké skupinky slov dokola (`jak lak sak sad`) a na konci
  procvičení. Slova a procvičení byla v jedné lekci do věty totéž.
- **Číselná řada je spárovaná symetricky**: Š a Á, Č a Ý, Ř a Ž, Ě a Í.
- **Čárka, tečka a pomlčka se procvičí i za slovy**: `duben - lepidlo - lid -`.
- **Cvičení od dolní řady dál má čtyři řádky místo tří.**

### Nové

- **Po splnění dnešního cíle program radí odpočinek.** Místo „Zvládneš ještě
  dvě cvičení?“ řekne, že cíl je splněný a že je lepší si teď odpočinout.
  Hlavní tlačítko je Konec pro dnešek.
- **Rodič může zajistit obrázek po příští lekci.** Po předání se volba sama
  vypne a dítě o ní dopředu neví, takže odměna zůstává překvapením.
- **Klávesy, které dřou, jde seřadit** celkově, podle chybovosti nebo podle
  reakce.
- **Měří se rytmus psaní.** Každý úhoz se zařadí podle toho, co se zrovna děje
  (konec slova, začátek slova, stejný prst, stejná ruka, střídání rukou) a u
  každé skupiny se sčítají zaváhání. Vedle profilu se ukládá syrový záznam
  úhozů do `<profil>.keys.jsonl` jako podklad pro pozdější rozbor.

### Opravy

- **Přerušená lekce se ukládá.** Hotová cvičení se dřív zahodila, takže se
  nezapočítal čas do dnešního cíle ani statistika kláves.
- **Dokončení přerušené lekce dá hvězdičky.** Pokračování od prostředního
  cvičení se bralo jako opakování kousku, lekce tak nešla dál.
- **Změna osnovy nezamyká hotové lekce.** Odemčeno je všechno po nejvzdálenější
  zvládnutou lekci a jedna další. Pravidla pro další změny osnovy jsou
  v hlavičce `curriculum.js`.
- Zamíchané skupinky vyšly naprázdno u čárky, tečky a pomlčky.
- Sevření mezi domovské klávesy bylo u jednoklávesové lekce pořád stejné.

### Aktualizace z předchozí verze

Program je potřeba zavřít a spustit znovu přes `start.bat`. Dosavadní pokrok
zůstává, lekce si drží svá id.

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
