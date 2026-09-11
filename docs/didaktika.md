# Didaktika psaní všemi deseti

Co jsem o výuce psaní našel, co z toho program používá a co ne. Slouží jako
zdůvodnění rozhodnutí v osnově lekcí, aby je někdo později neměnil naslepo.

## Odkud podklady pocházejí

Použitelné byly čtyři druhy zdrojů. České metodické weby ZAV, Umíme informatiku
a psani-deseti.cz. Otevřené soubory lekcí GNU Typist a jeho předchůdce z MIT,
což je doslovný přepis klasické učebnice psaní a dá se číst řádek po řádku.
Kurzy how-to-type a Ratatype. A vlastní výpočty nad slovníkem tohoto programu.

Nepodařilo se sehnat obsah lekcí z učebnic Century 21 a 20th Century
Typewriting, vyhledávání vrací jen katalogové záznamy. Stejně tak strukturu
lekcí programů Klavaro a TIPP10. Kniha Mastering Computer Typing se ukázala
jako sken, jehož textová vrstva je rozsypaná a čte se pozpátku.

## Pořadí kláves

České zdroje se shodují na postupu od ukazováčků ven: nejdřív F a J, pak D a K,
S a L, A a Ů, potom G a H. Následuje horní řada, dolní řada, velká písmena
a nakonec diakritika na číselné řadě.

Metoda ZAV to má jinak. Učí písmena podle četnosti v češtině a začíná od A,
protože pak jdou brzy skládat slabiky a krátká slova. Po dvou stech cvičeních
má student probráno zhruba pětaosmdesát procent běžného textu.

Klasická anglická učebnice jde ještě jinudy. V lekci T1 probere celou základní
řadu naráz a hned na konci té samé lekce píše opravdová slova a větu:

    fff jjj ddd kkk sss lll aaa ;;;
    asdf jkl; asdf jkl; asdf jkl;
    sad add all; alas flask fad
    dad asks a lad; a lass falls

Program jde cestou malých kroků: základní řadu rozkládá do čtyř lekcí. Platí
se za to tím, že první opravdová slova přijdou až ve čtvrté lekci a první věta
až v osmnácté. Pro devítileté dítě, které začíná od nuly, mi menší krůčky
přišly důležitější než rychlá odměna v podobě skutečného slova.

## Stavba cvičení

### Slábnoucí skupinky

Učebnice nepíše jedno písmeno pořád dokola, ale zkracuje skupinky:

    fff fff fff  ff ff ff  f f f

Má to důvod. Čím kratší skupinka, tím častěji přijde mezerník a tím častěji se
prst musí vrátit do základní polohy. Řádek složený jen z „fff“ cvičí jeden
pohyb dokola, ale návrat domů skoro vůbec.

### Mezerník od první lekce

Otázka, kdy zapojit mezerník, má v podkladech jasnou odpověď: hned. Klasická
učebnice odděluje skupinky mezerou už na prvním řádku první lekce a české
zdroje to mají stejně. Mezerník není další klávesa, kterou by se dalo odložit,
protože bez něj nejde napsat nic víc než jeden shluk písmen.

Má to i druhý důvod. Mezerník mačká palec, tedy jediný prst, který nemá v
základní řadě domovskou klávesu a nikam se nenatahuje. Nekonkuruje tak nácviku
ostatních prstů a dá se zvládnout současně s nimi. Program proto od první lekce
požaduje palec a nikde nezavádí mezerník jako novou látku.

### Tři stupně nácviku

Výzkum motorického učení popisuje efekt kontextové interference. Blokovaný
nácvik, tedy stejná věc za sebou, vede k lepším výsledkům během samotného
cvičení, ale k horšímu zapamatování. Zamíchané pořadí se během cvičení zvládá
hůř, zato mnohem líp drží při pozdějším vybavení a přenosu. Pro začátečníka
v rané fázi platí, že blokovaný nácvik funguje líp, takže správné pořadí je
obojí, ne jedno místo druhého.

Program proto jde takto:

- jedno písmeno pořád dokola, aby si prst zapamatoval cestu
- pravidelné střídání obou rukou, aby naskočil rytmus
- zamíchané skupinky, do kterých se přimíchají i písmena z dřívějších lekcí

### Rozcvička na začátek

Lekce v učebnici nezačíná novou látkou, ale připomenutím toho, co už student
umí. Nejdřív celá základní řada, potom sevření dřív naučených kláves.

### Sevření mezi domovské klávesy

Nejčastější chyba začátečníka není špatná klávesa, ale posun celé ruky za
nataženým prstem. Ruka se pak nevrátí a další písmeno je o jedno vedle.
Učebnice na to má u každé klávesy mimo základní řadu tenhle chvat:

    fgf jhj ded k,k

Prst se natáhne a hned se vrátí domů, ještě než se ruka stihne posunout.
Program si tyto trojice odvozuje sám z přiřazení prstů, takže vznikne
i `frf juj` pro R a U nebo `sěs dšd` pro Ě a Š na číselné řadě.

### Shift

Kurzy se shodují na pravidle opačné ruky: písmeno jednou rukou, Shift malíčkem
té druhé. Učebnice k tomu přidává sevření mezi domovskou klávesu toho malíčku,
který Shift drží, a později totéž s celými slovy:

    ;;; ;A; ;;; ;F; ;;; ;D;
    aaa Pi aaa Lord aaa Jill aaa

Nejtěžší je střídání obou Shiftů, tedy dvě velká písmena za sebou z opačných
stran klávesnice. Kurz how-to-type na to má zvláštní krok nazvaný All Together.

## Jak se měří výkon

V češtině se rychlost psaní udává v úhozech za minutu, ne ve slovech za minutu
jako v angličtině. Jeden úhoz je jedno stisknutí klávesy včetně mezerníku.
Program se drží české jednotky, protože v ní jsou zadané všechny tuzemské
požadavky a dítě v ní později uvidí i případné školní výsledky.

Ukazuje se čistá rychlost, tedy snížená o chybovost. Hrubá rychlost bez ohledu
na chyby je u začátečníka zavádějící: dá se zvýšit tím, že se píše rychle a
špatně, což je přesně to, čemu se celý nácvik snaží zabránit.

### Cílová rychlost lekce

Každá lekce má svou cílovou rychlost, od čtyřiceti úhozů za minutu v první
lekci po sto dvacet v nejtěžších. Tahle řada není převzatá z žádné tabulky,
nastavil jsem ji jako mírný náběh. Je to tak schválně, protože cílová rychlost
nikde nic neblokuje. Rozhoduje jen o třetí hvězdičce a odemčení další lekce
závisí čistě na přesnosti. Když je tedy číslo u některé lekce nastavené
přísněji, než odpovídá devítiletému dítěti, nestane se nic horšího, než že
se tam hůř dosáhne na třetí hvězdičku.

Pro srovnání: běžný dospělý, který píše všemi deseti, se pohybuje kolem dvou
set úhozů za minutu. Cíle v programu jsou tedy záměrně hluboko pod tím.

## Chyba během nácviku

Zdroje se shodují, že se překlepy během nácviku neopravují, protože zastavování
a mazání přerušuje pohyb, který se má prst naučit. Program to dodržuje tím, že
je Backspace zpočátku vypnutý a přijde až jako samostatná lekce.

Jenže nechat dítě dopsat řádek, na kterém už udělalo šest chyb, taky nedává
smysl. Prsty si při tom upevňují právě ten špatný pohyb. Program proto řádek
hlídá: když se na něm nasbírají víc než dvě chyby, řádek se smaže a píše se
znovu od začátku. Po třech pokusech se pokračuje dál, aby se dítě nezaseklo na
jednom řádku a neztratilo chuť. Hranice dvou chyb jde v nastavení změnit nebo
úplně vypnout.

Rozdíl proti mazání je v tom, že se neopravuje jednotlivý znak uprostřed
psaní, ale opakuje se celý pohyb od začátku. To odpovídá tomu, jak se nacvičuje
každá jiná motorická dovednost.

## Slabé klávesy se vracejí

Adaptivní programy typu keybr sledují u každé klávesy zvlášť chybovost i
reakční dobu a slabé klávesy cíleně vracejí do textu. Program to přebírá
v mírnější podobě: u každého znaku si vede chybovost a klouzavý průměr latence
a z nich počítá váhu pro losování slov. Slovo obsahující klávesu, která dítěti
dělá potíže, se objeví častěji.

Mírnější je to ve dvou ohledech. Váha se pohybuje v malém rozmezí, takže se
cvičení nepromění v jednu a tutéž obtížnou klávesu dokola. A klávesa, která
zatím má míň než deset úhozů, dostane zvýšenou váhu taky, protože o ní program
ještě nic neví a málo procvičená klávesa si pozornost zaslouží stejně jako
chybová.

## Zásady, na kterých se zdroje shodují

- Přesnost je důležitější než rychlost. Rychlé psaní se špatným hmatem chyby
  jen upevňuje.
- Krátké denní dávky fungují líp než dlouhé cvičení jednou za čas. Deset až
  patnáct minut denně stačí.
- Nedívat se na ruce. Kdo se dívá, ten se psát všemi deseti nenaučí.
- Chyby se během nácviku neopravují. Kdo opravuje každý překlep, pořád se
  zastavuje a prsty se nestihnou naučit pohyb. Backspace má přijít později
  jako samostatná látka.
- Mezerník se mačká palcem. Anglická učebnice trvá na pravém palci, české
  zdroje to nechávají otevřené.
- Po každém úhozu mimo základní řadu se prst vrací na svou domovskou klávesu.
- Posez patří k látce, ne k dobrým radám. Rovná záda, obě chodidla na zemi,
  lokty volně u těla, zápěstí neležící na stole. Program to připomíná ve
  výkladu první lekce a pak už jen občas, aby to nezevšednělo.

### Délka jedné lekce

Z krátkých denních dávek plyne rozhodnutí, které není na první pohled vidět:
lekce je dlouhá zhruba tak, aby zabrala celé denní cvičení. Vypadalo by
rozumněji udělat lekce kratší a přívětivější, ale pak by po dokončené lekci do
denního cíle pár minut chybělo a muselo by se pokaždé řešit, jestli začínat
další. Takhle je den uzavřený jednou lekcí.

Komu nezbývají síly, skončí mezi cvičeními a zbytek dodělá zítra, protože
program si pamatuje, u kterého cvičení se přestalo. Tím je ošetřená ta část,
kvůli které by se jinak lekce zkracovaly.

### Nedívat se na ruce

Obrázek klávesnice na obrazovce je v tomhle sporný. Pomáhá, dokud dítě neví,
kde klávesa leží, a škodí, jakmile se na něj začne dívat místo toho, aby si
polohu pamatovalo. Program ho proto umí vypnout a počítá s tím, že se vypne,
jakmile se hmat usadí. Nákres rukou se zvýrazněným prstem zůstává, protože ten
ukazuje, který prst jde na řadu, ne kde klávesa je.

## Specifika české klávesnice

Rozložení QWERTZ, diakritika na číselné řadě, velká písmena s háčky skládaná
mrtvou klávesou a k tomu vlastní výpočet, které dvojice písmen jsou v češtině
pro jeden prst nejtěžší: to všechno má samostatný dokument
[Čeština a česká klávesnice](cestina.md). Osnova lekcí z něj vychází na
několika místech, hlavně v lekci o skládání velkých písmen a v prstolamech.

## Pravá a levá u devítiletého dítěte

Záměna stran je v tomhle věku běžná. Doporučení, která se v podkladech opakují,
jsou barevné odlišení, slovní pojmenování s opakováním a ukazování na vlastním
těle vedle dítěte, ne proti němu.

Program to řeší tak, že barva znamená prst, ne ruku. Stejný prst má na obou
rukou stejnou barvu, takže barvy stačí čtyři a jdou od sebe rozeznat. Levou od
pravé dítě pozná podle nákresu rukou s velkým L a P na dlani a podle nápisu
v nápovědě. Osm tlumených pastelových odstínů, se kterými program začínal, se
při zkoušení slévalo dohromady.

## Zdroje

- Internetová škola ZAV, https://www.zav.cz/vyuka-psani-na-klavesnici/
- Psaní všemi deseti, Umíme informatiku, https://www.umimeinformatiku.cz/cviceni-psani-vsemi-deseti
- Teorie psaní všemi deseti, https://www.psani-deseti.cz/teorie
- Typist, soubor lekcí, MIT, https://web.mit.edu/games/lib/typist/t.typ
- GNU Typist, https://www.gnu.org/software/gtypist/doc/gtypist.html
- How To Type, lekce o velkých písmenech, https://www.how-to-type.com/touch-typing-lessons/how-to-type-capitals/
- Ratatype, průvodce pro učitele, https://www.ratatype.com/faq/The-ultimate-Guide-for-Teachers-to-teach-touch-typing-to-children/
- Přehled k blokovanému a náhodnému nácviku, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4069194/
