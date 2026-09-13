/**
 * Osnova lekcí. Pořadí kláves odpovídá české praxi výuky psaní všemi deseti:
 * nejdřív základní řada od ukazováčků ven, pak horní řada, dolní řada,
 * velká písmena a nakonec diakritika na číselné řadě.
 *
 * Každá lekce má výklad (intro) a několik kroků (steps). Konkrétní text
 * kroků se skládá až v generator.js, aby se neopakoval pořád stejný.
 */

const L = (id, block, title, newKeys, targetCpm, intro, steps) => ({
  id, block, title, newKeys, targetCpm, intro, steps,
});

/**
 * První tři lekce nemají ani jednu samohlásku, takže z nich nejde složit
 * slabika ani slovo. Cvičí se čistý nácvik hmatu a jde se ve třech stupních:
 *
 *   1. jedno písmeno pořád dokola  — prst si zapamatuje cestu
 *   2. pravidelné střídání rukou   — naváže se rytmus
 *   3. zamíchané skupinky ze všeho, co už umí — prst musí klávesu najít sám
 *
 * Pořadí není náhodné. Předvídatelné opakování se zvládá snáz a je potřeba na
 * začátku, zamíchané pořadí se hůř nacvičuje, ale mnohem líp se pamatuje.
 * Třetí stupeň proto vždycky přibírá i starší písmena, ne jenom ta nová.
 *
 * Délka lekce je schválně taková, aby zabrala zhruba celé denní cvičení.
 * Kratší lekce by znamenala, že po ní do denního cíle pár minut chybí
 * a muselo by se řešit, jestli začínat další. Takhle je den uzavřený jednou
 * lekcí a kdo nemá dost sil, skončí mezi cvičeními a zbytek dodělá zítra.
 */
const firstSteps = [
  { kind: 'letters', label: 'Jedno po druhém', lines: 3, phase: 0 },
  { kind: 'letters', label: 'Střídáme ruce', lines: 3, phase: 1 },
  { kind: 'mixedkeys', label: 'Zamícháme to', lines: 3 },
];

/**
 * Každá další lekce začíná rozcvičkou na to, co dítě umí z dřívějška.
 * Takhle to má i klasická učebnice: nejdřív si připomeneme, teprve pak
 * přijde nová klávesa. Prsty se zahřejí a ruce se usadí do základní polohy.
 */
const warmup = { kind: 'warmup', label: 'Rozcvička', lines: 2 };

const drillSteps = [warmup, ...firstSteps];

/** Lekce, jejíž písmena leží přímo v základní řadě. Prst se nikam nenatahuje. */
const homeRowSteps = [
  warmup,
  { kind: 'letters', label: 'Jedno po druhém', lines: 3, phase: 0 },
  { kind: 'mixedkeys', label: 'Zamícháme to', lines: 3 },
  { kind: 'syllables', label: 'Slabiky', lines: 3 },
  { kind: 'words', label: 'Slova', lines: 3 },
  { kind: 'mixed', label: 'Procvičení', lines: 3 },
];

/**
 * Lekce, ve které se prst natahuje mimo základní řadu. Navíc má krok
 * "Zpátky domů", tedy sevření natažené klávesy mezi dvěma domovskými úhozy.
 */
const standardSteps = [
  warmup,
  { kind: 'letters', label: 'Jedno po druhém', lines: 3, phase: 0 },
  { kind: 'reach', label: 'Zpátky domů', lines: 3 },
  { kind: 'mixedkeys', label: 'Zamícháme to', lines: 3 },
  { kind: 'words', label: 'Slova', lines: 3 },
  { kind: 'mixed', label: 'Procvičení', lines: 3 },
];

/**
 * Od dolní řady dál se cvičení prodlužuje ze tří řádků na čtyři. Dítě v té
 * době píše rychleji, takže lekce zabere pořád zhruba stejný čas, ale nácviku
 * na jednu klávesu je o třetinu víc.
 */
const longSteps = standardSteps.map((s) => (s.kind === 'warmup' ? s : { ...s, lines: 4 }));

/**
 * Opakovací lekce. Nepřidává klávesu, jen dá dohromady všechno probrané.
 * Starý DOSový kurz, na kterém se učila celá generace, měl takových lekcí
 * čtvrtinu. Bez nich připadá na jednu novou klávesu jen zlomek nácviku.
 */
/**
 * Lekce, jejíž nová klávesa není písmeno, tedy čárka, tečka a pomlčka.
 * Zamíchané skupinky se skládají z písmen, takže by v nich znaménko nebylo
 * a krok by vyšel naprázdno. Místo něj se rovnou píší slova.
 */
const punctSteps = longSteps.filter((s) => s.kind !== 'mixedkeys');

const bigReviewSteps = [
  warmup,
  { kind: 'mixedkeys', label: 'Zamíchané skupinky', lines: 3 },
  { kind: 'words', label: 'Slova', lines: 4 },
  { kind: 'mixed', label: 'Slova a věty', lines: 4 },
];

const reviewSteps = [
  warmup,
  { kind: 'words', label: 'Slova', lines: 4 },
  { kind: 'mixed', label: 'Procvičení', lines: 4 },
];

export const LESSONS = [
  /* ------------------------------------------------- základní řada */
  L('L01', 'Základní řada', 'F a J: domov ukazováčků', ['f', 'j'], 40, {
    lead: 'Dneska najdeme domov pro obě ruce. Levý ukazováček polož na F, pravý ukazováček na J. Na obou klávesách je malý hrbolek, nahmatáš ho i poslepu. To je tvoje kotva: kdykoliv se ztratíš, sjedeš prstem po klávesnici, najdeš hrbolek a hned víš, kde jsi. Mezi skupinkami se mačká mezerník palcem, ten zůstává dole a nikam neodchází.',
    points: [
      'Seď rovně, obě chodidla na zemi, lokty volně u těla.',
      'Levá ruka píše levou půlku klávesnice, pravá ruka pravou. Nikdy se neprohodí.',
      'Než klávesu stiskneš, řekni si nahlas, která ruka to je. Zní to hloupě, ale pomáhá to.',
      'Na ruce se nedívej. Když nevíš, koukni se na obrázek rukou na obrazovce.',
      'Cvič radši deset minut každý den než hodinu jednou týdně.',
    ],
  }, firstSteps),

  L('L02', 'Základní řada', 'D a K: prostředníčky', ['d', 'k'], 45, {
    lead: 'Ukazováčky už mají svoje místo, teď přidáme prostředníčky. Levý prostředníček bydlí na D, pravý na K, hned vedle F a J. Nikam se pro ně nenatahuješ, prst už na nich leží. Zkus je nahmatat poslepu, bez dívání.',
    points: [
      'D a K jsou taky domovské klávesy. Prostředníček na nich rovnou leží a jen je stiskne.',
      'Ukazováčky přitom zůstanou ležet na F a J. Nezvedej celou ruku kvůli jednomu prstu.',
      'V posledním cvičení se D a K zamíchají s F a J. Tam se pozná, jestli to prsty umí doopravdy.',
      'Zápěstí neopírej o stůl, ruce drž lehce nad klávesnicí.',
    ],
  }, drillSteps),

  L('L03', 'Základní řada', 'S a L: prsteníčky', ['s', 'l'], 50, {
    lead: 'Prsteníčky jsou ze všech prstů nejlínější a nejhůř se jim hýbe samostatně. Zkus zvednout jen prsteníček a uvidíš, jak se za ním táhne prostředníček. Právě proto potřebují nejvíc trpělivosti. Levý prsteníček bydlí na S, pravý na L.',
    points: [
      'Prsteníček se hýbe hůř než ostatní prsty. Je to normální, není to tvoje chyba.',
      'I S a L jsou domovské klávesy. Prst na nich leží a jen je stiskne.',
      'Když se s prsteníčkem hne i soused, nevadí. Časem se to samo srovná.',
      'Radši pomalu a správně než rychle a špatně.',
    ],
  }, drillSteps),

  L('L04', 'Základní řada', 'A a Ů: malíčky', ['a', 'ů'], 55, {
    lead: 'Zbývají malíčky, nejmenší a nejslabší prsty. Levý malíček bydlí na A, pravý na Ů. Tím máš celou základní řadu: a s d f  j k l ů. Osm prstů, osm kláves, každý prst na svém místě. Odsud budou prsty vyrážet nahoru i dolů a vždycky se sem zase vrátí.',
    points: [
      'Malíček používej opravdu vždycky, i když je to nepohodlné. Špatný zvyk se odnaučuje mnohem hůř, než se učí ten správný.',
      'Přečti si celou řadu nahlas zleva doprava: a s d f, j k l ů.',
      'Když se ztratíš, nahmatej hrbolky na F a J a zase víš, kde jsi.',
      'Od téhle lekce už jde napsat i pár opravdových slov.',
    ],
  }, homeRowSteps),

  L('L05', 'Základní řada', 'G a H: krok dovnitř', ['g', 'h'], 60, {
    lead: 'G a H jsou první klávesy, pro které se prst musí natáhnout. Leží uprostřed klávesnice, mezi oběma rukama. Levý ukazováček si sáhne doprava na G, pravý ukazováček doleva na H. Hned potom se oba vrátí na svůj hrbolek.',
    points: [
      'Natahuje se jenom prst. Ruka i ostatní prsty zůstávají na místě.',
      'Po úhozu nahmatej hrbolek na F nebo J. Návrat domů je stejně důležitý jako samotný úhoz.',
      'Když se ruka za prstem posune, další písmeno bude vedle. Odsud se berou překlepy.',
    ],
  }, standardSteps),

  L('L06', 'Základní řada', 'Celá základní řada', [], 70, {
    lead: 'Dnes nic nového, jen si pořádně procvičíme, co už umíš. Celá základní řada je tvoje: a s d f g  h j k l ů.',
    points: [
      'Zkus se na klávesnici vůbec nedívat.',
      'Když uděláš chybu, nic se neděje. Piš dál.',
      'Dýchej a nespěchej.',
    ],
  }, reviewSteps),

  /* ---------------------------------------------------- horní řada */
  L('L07', 'Horní řada', 'E: levý prostředníček nahoru', ['e'], 70, {
    lead: 'Vyrážíme na horní řadu. Levý prostředníček povyskočí z D na E a hned se vrátí zpátky. Je to krok šikmo nahoru, ruka zůstává dole.',
    points: [
      'Prst jde nahoru a hned zpátky, jako když si sáhneš na horkou plotnu.',
      'E je první samohláska kromě A, takže se hned objeví opravdová slova.',
      'Ruka zůstává na místě, hýbe se jen prst.',
    ],
  }, standardSteps),

  L('L07B', 'Horní řada', 'I: pravý prostředníček nahoru', ['i'], 70, {
    lead: 'Pravý prostředníček dělá totéž, co včera dělal levý: skočí z K na I. Obě ruce tak umí ten samý pohyb a dají se střídat.',
    points: [
      'I je nad K, stejně jako E nad D.',
      'V posledním cvičení se E a I střídají, tam se pozná, jestli to prsty umí.',
      'Po úhozu nahmatej hrbolek na F nebo J.',
    ],
  }, standardSteps),

  L('L08', 'Horní řada', 'R: levý ukazováček nahoru', ['r'], 75, {
    lead: 'Levý ukazováček skočí z F nahoru na R. Klávesa je přímo nad domovskou, jen o kousek doleva.',
    points: [
      'R je nad F.',
      'Natahuje se jenom prst, ruka i ostatní prsty zůstávají.',
      'Po úhozu zase nahmatej hrbolek.',
    ],
  }, standardSteps),

  L('L08B', 'Horní řada', 'U: pravý ukazováček nahoru', ['u'], 75, {
    lead: 'Pravý ukazováček skočí z J nahoru na U. Je to zrcadlo toho, co včera dělal levý ukazováček s R.',
    points: [
      'U je nad J.',
      'R a U se ti budou střídat pořád, je to častá dvojice.',
      'Zkontroluj, jestli pořád sedíš rovně.',
    ],
  }, standardSteps),

  L('L09R', 'Horní řada', 'Opakování: E, I, R a U', [], 80, {
    lead: 'Dnes nic nového. Čtyři klávesy horní řady se musí usadit, než přidáme další.',
    points: [
      'Zkus se na klávesnici vůbec nedívat.',
      'Když uděláš chybu, piš dál. Opravovat se bude až později.',
      'Radši pomalu a správně než rychle a špatně.',
    ],
  }, bigReviewSteps),

  L('L09', 'Horní řada', 'T: krok šikmo doprava', ['t'], 80, {
    lead: 'T leží napravo od R a bere ho taky levý ukazováček. Prst se musí natáhnout dál než u R, šikmo nahoru a doprava.',
    points: [
      'T je nad G, obě klávesy bere levý ukazováček.',
      'Je to delší natažení, dej pozor, aby se ruka neposunula.',
      'Ostatní prsty nechej ležet.',
    ],
  }, standardSteps),

  L('L09B', 'Horní řada', 'Z: krok šikmo doleva', ['z'], 80, {
    lead: 'Tady se česká klávesnice liší od anglické. Na české je Z nahoře, tam kde bývá anglické Y. Píše ho pravý ukazováček nataženým krokem doleva nahoru.',
    points: [
      'Z je nahoře v horní řadě, ne dole.',
      'Je to zrcadlo toho, co dělá levý ukazováček s T.',
      'Po úhozu se prst vrací na J.',
    ],
  }, standardSteps),

  L('L10', 'Horní řada', 'W: levý prsteníček nahoru', ['w'], 85, {
    lead: 'Teď jde nahoru levý prsteníček, ze S na W. W se v češtině skoro nepoužívá, ale prst na něj musí umět trefit.',
    points: [
      'Prsteníček se natahuje nahoru, ne do strany.',
      'Prsteníček je línější než ostatní, dej mu čas.',
      'Ostatní prsty nechej ležet na svých klávesách.',
    ],
  }, standardSteps),

  L('L10B', 'Horní řada', 'O: pravý prsteníček nahoru', ['o'], 85, {
    lead: 'Pravý prsteníček jde z L nahoru na O. Na rozdíl od W je O v češtině skoro všude, takže se ti otevře spousta nových slov.',
    points: [
      'O je nad L, stejně jako W nad S.',
      'S O půjde napsat kolo, okno i kotě.',
      'Prsteníčky se hýbou hůř, proto mají vlastní lekci.',
    ],
  }, standardSteps),

  L('L11', 'Horní řada', 'Q: levý malíček nahoru', ['q'], 85, {
    lead: 'Levý malíček jde z A na Q. Je to nejslabší prst a nejdelší natažení, takže je tohle z horní řady nejtěžší krok.',
    points: [
      'Malíček natahuj nahoru, ne do strany.',
      'Q se v češtině skoro nepoužívá, ale v angličtině ano.',
      'Když je toho moc, dej si pauzu a vrať se za chvíli.',
    ],
  }, standardSteps),

  L('L11B', 'Horní řada', 'P: pravý malíček nahoru', ['p'], 85, {
    lead: 'Pravý malíček jde z Ů nahoru na P. Malíček je slabý, ale P musí psát on, jinak se ruka pokaždé posune.',
    points: [
      'P je nad Ů.',
      'Prsteníček a malíček se hýbou spolu, drž je uvolněné.',
      'S P přibudou slova jako pes, pole nebo poklad.',
    ],
  }, standardSteps),

  L('L12', 'Horní řada', 'Ú a celá horní řada', ['ú'], 90, {
    lead: 'Ú leží napravo od P a píše ho pravý malíček. Tím máme celou horní řadu hotovou: q w e r t  z u i o p ú.',
    points: [
      'Ú je hned vedle P, malíček se natáhne ještě o kousek dál.',
      'Ú se píše na začátku slova, uvnitř slova bývá ů.',
      'Zkus si celou horní řadu přeříkat nahlas.',
    ],
  }, standardSteps),

  L('L13', 'Horní řada', 'Základní a horní řada dohromady', [], 100, {
    lead: 'Umíš už dvě celé řady. Dnes je spojíme dohromady a budeme psát opravdová slova.',
    points: [
      'Zkus psát plynule, bez zastavování mezi písmeny.',
      'Mezerník mačkej palcem hned po posledním písmenu slova.',
      'Když se spleteš, klidně piš dál.',
    ],
  }, bigReviewSteps),

  /**
   * W a Q se v českém textu skoro nevyskytují, takže by je prsty po svých
   * lekcích už nikdy nepotkaly. V angličtině jsou přitom běžné. Anglická
   * slova jsou tedy jediný způsob, jak je dál procvičovat, a dají se složit
   * hned po horní řadě: quiet, square, water i wheel vystačí s tím, co dítě
   * v tu chvíli umí.
   */
  L('L13B', 'Horní řada', 'W a Q: anglická slovíčka', [], 95, {
    lead: 'W a Q se v češtině skoro nepíšou, ale v angličtině jsou všude. Dnes si je proto zacvičíme na anglických slovech. Číst je nemusíš umět, jde o prsty.',
    points: [
      'W píše levý prsteníček, Q levý malíček. Oba jdou z domovské klávesy nahoru.',
      'Ve slovech qu se po Q vždycky píše U, ta dvojice chodí spolu.',
      'Slova jsou anglická, takže se píší jinak, než se čtou. Opisuj je písmeno po písmenu.',
    ],
  }, [
    { kind: 'warmup', label: 'Rozcvička', lines: 2 },
    { kind: 'english', label: 'Slova s W', lines: 3, mode: 'w' },
    { kind: 'english', label: 'Slova s Q', lines: 2, mode: 'q' },
    { kind: 'english', label: 'Všechno dohromady', lines: 3, mode: 'wq' },
    { kind: 'mixed', label: 'Zpátky do češtiny', lines: 3 },
  ]),

  /* ---------------------------------------------------- dolní řada */
  L('L14', 'Dolní řada', 'V: levý ukazováček dolů', ['v'], 95, {
    lead: 'Jdeme do dolní řady. Levý ukazováček sjede z F dolů na V. Dolní řada je pro prsty nezvyklá, protože se musí skrčit, ne natáhnout.',
    points: [
      'V je pod F, jen o kousek doprava.',
      'Prst se krčí, dlaň zůstává ve stejné výšce.',
      'Po úhozu zase nahoru na hrbolek.',
    ],
  }, longSteps),

  L('L14B', 'Dolní řada', 'M: pravý ukazováček dolů', ['m'], 95, {
    lead: 'Pravý ukazováček sjede z J dolů na M. Je to zrcadlo toho, co včera dělal levý ukazováček s V.',
    points: [
      'M je pod J.',
      'V a M jsou obě pro ukazováčky, jen každé na své straně.',
      'Zkontroluj, že se ti neposouvá celá ruka.',
    ],
  }, longSteps),

  L('L15', 'Dolní řada', 'C: levý prostředníček dolů', ['c'], 95, {
    lead: 'Levý prostředníček sjede z D dolů na C. S C přibude i spojení CH, které se v češtině píše jako dvě klávesy za sebou.',
    points: [
      'C je pod D.',
      'CH se píše C a pak H, žádná zvláštní klávesa na to není.',
      'Prsteníček i malíček nechej ležet na svém místě.',
    ],
  }, longSteps),

  L('L15B', 'Dolní řada', 'Čárka: pravý prostředníček dolů', [','], 95, {
    lead: 'Pod pravým prostředníčkem leží čárka. Je to první znaménko, které se učíš, a píše se úplně stejným pohybem jako C na druhé straně.',
    points: [
      'Čárka je pod K.',
      'Za čárkou se vždycky píše mezera, před ní nikdy.',
      'Ve cvičení se čárka objeví uvnitř řádku, tak jak ji potkáš v textu.',
    ],
  }, punctSteps.map((st) => (st.kind === 'words' || st.kind === 'mixed' ? { ...st, punct: ',' } : st))),

  L('L16R', 'Dolní řada', 'Opakování: V, M, C a čárka', [], 100, {
    lead: 'Dnes nic nového. Dolní řada je pro prsty nejnezvyklejší, tak si ji usadíme, než přidáme další klávesy.',
    points: [
      'Po každém úhozu dolů se prst vrací na svou domovskou klávesu.',
      'Když se ti plete, zpomal. Přesnost je víc než rychlost.',
      'Na ruce se nedívej, radši se podívej na obrázek na obrazovce.',
    ],
  }, bigReviewSteps),

  L('L16', 'Dolní řada', 'X: levý prsteníček dolů', ['x'], 100, {
    lead: 'Levý prsteníček sjede z S dolů na X. X se v češtině objeví jen ve slovech jako box nebo taxi, ale prst na něj musí trefit.',
    points: [
      'X je pod S.',
      'Prsteníček se krčí hůř než ostatní prsty, dej mu čas.',
      'Ruka zůstává na místě.',
    ],
  }, longSteps),

  L('L16B', 'Dolní řada', 'Tečka: pravý prsteníček dolů', ['.'], 100, {
    lead: 'Pod pravým prsteníčkem leží tečka. Konec věty, jedno z nejčastějších znamének vůbec.',
    points: [
      'Tečka je pod L.',
      'Za tečkou se píše mezera, před ní ne.',
      'Po tečce začíná další věta velkým písmenem. Ta přijdou brzy.',
    ],
  }, punctSteps.map((st) => (st.kind === 'words' || st.kind === 'mixed' ? { ...st, punct: '.' } : st))),

  L('L17', 'Dolní řada', 'B: krok dovnitř zleva', ['b'], 100, {
    lead: 'B leží uprostřed dolní řady a bere ho levý ukazováček nataženým krokem doprava dolů. Je to stejný chvat jako T v horní řadě, jen opačným směrem.',
    points: [
      'B je napravo od V, prst se musí natáhnout.',
      'Je to nejdelší cesta, jakou ukazováček dělá.',
      'Po úhozu nahmatej hrbolek na F.',
    ],
  }, longSteps),

  L('L17B', 'Dolní řada', 'N: krok dovnitř zprava', ['n'], 100, {
    lead: 'N bere pravý ukazováček krokem doleva dolů. Zrcadlo k B. N je v češtině velmi časté, takže tenhle hmat budeš potřebovat pořád.',
    points: [
      'N je nalevo od M.',
      'B a N jsou vedle sebe, nepleť si je.',
      'Po úhozu se prst vrací na J.',
    ],
  }, longSteps),

  L('L18', 'Dolní řada', 'Y: levý malíček dolů', ['y'], 105, {
    lead: 'Levý malíček sjede z A dolů na Y. Na české klávesnici je Y dole vlevo, tam kde bývá anglické Z. Pozor, s Z se plete i lidem, kteří píší dávno.',
    points: [
      'Y je pod A.',
      'Y je dole, Z je nahoře. Na anglické klávesnici je to naopak.',
      'Malíček je slabý, ale pletení Y a Z se odnaučuje hůř než pomalý úhoz.',
    ],
  }, longSteps),

  L('L18B', 'Dolní řada', 'Pomlčka a celá abeceda', ['-'], 105, {
    lead: 'Poslední klávesa dolní řady je pomlčka a píše ji pravý malíček. Tím umíš celou abecedu, všechna písmena bez háčků a čárek.',
    points: [
      'Pomlčka je napravo od tečky.',
      'Spojovník se píše bez mezer: modro-bílý.',
      'Od téhle chvíle jde napsat skoro každé české slovo bez diakritiky.',
    ],
  }, punctSteps.map((st) => (st.kind === 'words' || st.kind === 'mixed' ? { ...st, punct: ' -' } : st))),

  L('L18R', 'Dolní řada', 'Opakování celé abecedy', [], 105, {
    lead: 'Umíš všechna písmena. Dnes si to celé projdeme dohromady, se slovy i větami.',
    points: [
      'Piš plynule a nezastavuj se po každém slově.',
      'Když uděláš chybu, nech ji být a piš dál.',
      'Tohle je dobré místo zkusit si psát úplně poslepu.',
    ],
  }, bigReviewSteps),

  /* ------------------------------------------------- velká písmena */
  L('L19', 'Velká písmena', 'Velká písmena pravým Shiftem', [
    'Q', 'W', 'E', 'R', 'T', 'A', 'S', 'D', 'F', 'G', 'Y', 'X', 'C', 'V', 'B',
  ], 100, {
    lead: 'Velké písmeno se píše dvěma prsty najednou. Platí jednoduché pravidlo: písmeno píše jedna ruka, Shift drží ta druhá. Dnes píšeme levou rukou a Shift držíme pravým malíčkem.',
    points: [
      'Nejdřív stiskni a drž Shift, pak teprve písmeno.',
      'Písmeno levou rukou, Shift pravým malíčkem.',
      'Klávesu Caps Lock nepoužívej, ta se hodí jen výjimečně.',
    ],
  }, [
    warmup,
    { kind: 'shiftpairs', label: 'Malé a velké', lines: 3 },
    { kind: 'anchorwords', label: 'Slova mezi kotvami', lines: 3, side: 'ShiftRight' },
    { kind: 'mixed', label: 'Procvičení', lines: 3 },
  ]),

  L('L20', 'Velká písmena', 'Velká písmena levým Shiftem', [
    'Z', 'U', 'I', 'O', 'P', 'H', 'J', 'K', 'L', 'N', 'M',
  ], 105, {
    lead: 'Teď obráceně. Písmeno píše pravá ruka a Shift drží levý malíček. Od teď umíš napsat opravdovou větu: velké písmeno na začátku, tečka na konci.',
    points: [
      'Písmeno pravou rukou, Shift levým malíčkem.',
      'Věta začíná velkým písmenem a končí tečkou.',
      'Za tečkou udělej mezeru a pokračuj.',
    ],
  }, [
    warmup,
    { kind: 'shiftpairs', label: 'Malé a velké', lines: 3 },
    { kind: 'anchorwords', label: 'Slova mezi kotvami', lines: 3, side: 'ShiftLeft' },
    { kind: 'sentences', label: 'Věty', lines: 3 },
  ]),

  L('L20C', 'Velká písmena', 'Střídavě obě ruce', [], 105, {
    lead: 'Nejtěžší na Shiftu je, když jdou dvě velká písmena za sebou z opačných stran klávesnice. Musí se prohodit nejen ruka, která píše, ale i ruka, která drží Shift. Dneska se to naučíš. Platí pořád stejné pravidlo: písmeno jednou rukou, Shift malíčkem té druhé.',
    points: [
      'Nejdřív stiskni a drž Shift, pak teprve písmeno, a pak obojí pusť.',
      'Malíček se po Shiftu vrací na svou domovskou klávesu, tedy na A nebo na Ů.',
      'V prvním cvičení jdou dvě velká za sebou schválně z opačných stran. Zpomal.',
      'Když se ti Shift plete, podívej se na obrázek rukou. Svítí ten prst, který je na řadě.',
    ],
  }, [
    warmup,
    { kind: 'shiftmix', label: 'Dvě velká za sebou', lines: 3 },
    { kind: 'anchorwords', label: 'Slova mezi kotvami', lines: 3 },
    { kind: 'sentences', label: 'Věty', lines: 3 },
  ]),

  /* ------------------------------------------------------ oprava chyb */
  L('L20B', 'Oprava chyb', 'Backspace: mazání překlepů', [], 105, {
    lead: 'Až doteď jsi překlepy neopravovala a psala jsi dál. Bylo to schválně. Kdo opravuje každou chybu hned, pořád se zastavuje a prsty se nestihnou naučit správný pohyb. Teď už umíš dost na to, aby ses naučila chybu smazat. Slouží k tomu klávesa Backspace úplně vpravo nahoře a píše ji pravý malíček.',
    points: [
      'Backspace smaže znak vlevo od kurzoru.',
      'Natáhni pro něj pravý malíček nahoru a hned se vrať do základní polohy.',
      'Chyba se ve statistice počítá i po opravě. Cílem není mazat, ale nedělat je.',
      'Když se řádek nepovede, neopravuj ho po písmenku. Radši ho napiš celý znovu.',
    ],
  }, [
    warmup,
    { kind: 'words', label: 'Slova', lines: 3 },
    { kind: 'sentences', label: 'Věty', lines: 3 },
    { kind: 'mixed', label: 'Procvičení', lines: 3 },
  ]),

  /* ----------------------------------------------------- diakritika */
  L('L21', 'Háčky a čárky', 'Š: levý prostředníček na číselnou řadu', ['š'], 105, {
    lead: 'Písmena s háčky a čárkami mají na české klávesnici vlastní klávesy v číselné řadě, tedy ještě nad horní řadou. Začneme levým prostředníčkem, který jde z D přes E až na Š.',
    points: [
      'Číselná řada je nejvýš, prst se natáhne přes horní řadu.',
      'Ruku nechej na místě, natahuje se jen prst.',
      'Po úhozu vždycky zpátky do základní polohy.',
    ],
  }, longSteps),

  L('L21B', 'Háčky a čárky', 'Á: pravý prostředníček nahoru', ['á'], 105, {
    lead: 'Pravý prostředníček jde z K přes I až na Á. Je to ten samý pohyb, jaký včera dělal levý prostředníček se Š, jen na druhé straně.',
    points: [
      'Á je nad I.',
      'Á je nejčastější dlouhá samohláska v češtině, budeš ji psát pořád.',
      'Dlouhé samohlásky si vyslov nahlas, pomůže ti to.',
    ],
  }, longSteps),

  L('L22', 'Háčky a čárky', 'Č: levý ukazováček nahoru', ['č'], 110, {
    lead: 'Levý ukazováček jde z F přes R až na Č. Je to nejvyšší klávesa, na kterou zatím sahal.',
    points: [
      'Č je nad R.',
      'Natáhni prst nahoru, ne celou ruku.',
      'Ostatní prsty zůstávají ležet.',
    ],
  }, longSteps),

  L('L22B', 'Háčky a čárky', 'Ý: pravý ukazováček nahoru', ['ý'], 110, {
    lead: 'Pravý ukazováček jde z J přes U na Ý. Zrcadlo k Č. Pozor, Ý se píše jinde než Y z dolní řady, ale vyslovuje se skoro stejně.',
    points: [
      'Ý je nad U.',
      'Krátké Y je dole vlevo, dlouhé Ý nahoře vpravo.',
      'Po úhozu se prst vrací na hrbolek.',
    ],
  }, longSteps),

  L('L22R', 'Háčky a čárky', 'Opakování: Š, Á, Č a Ý', [], 110, {
    lead: 'Dnes nic nového. Číselná řada je nejdál ze všech, tak si čtyři nová písmena usadíme, než přidáme další.',
    points: [
      'Prst jde nahoru a hned zpátky, ruka zůstává dole.',
      'Když ztratíš základní polohu, nahmatej hrbolky na F a J.',
      'Nespěchej, tahle řada je pomalejší i pro dospělé.',
    ],
  }, bigReviewSteps),

  L('L23', 'Háčky a čárky', 'Ř: krok dovnitř zleva', ['ř'], 110, {
    lead: 'Ř leží napravo od Č a bere ho taky levý ukazováček, nataženým krokem dovnitř. Je to nejtypičtější české písmeno, cizinci ho neumí vyslovit ani napsat.',
    points: [
      'Ř je nad T, obě klávesy bere levý ukazováček.',
      'Je to natažení šikmo nahoru a doprava.',
      'Dej pozor, aby se za prstem neposunula celá ruka.',
    ],
  }, longSteps),

  L('L23B', 'Háčky a čárky', 'Ž: krok dovnitř zprava', ['ž'], 110, {
    lead: 'Ž bere pravý ukazováček krokem doleva nahoru. Zrcadlo k Ř, stejně jako je Z zrcadlem k T v horní řadě.',
    points: [
      'Ž je nad Z.',
      'Ř a Ž leží vedle sebe, každé ale patří jiné ruce.',
      'Po úhozu nahmatej hrbolek na J.',
    ],
  }, longSteps),

  L('L24', 'Háčky a čárky', 'Ě: levý prsteníček nahoru', ['ě'], 115, {
    lead: 'Levý prsteníček jde ze S přes W až na Ě. Ě stojí jen uvnitř slov, nikdy na začátku.',
    points: [
      'Ě je nad W.',
      'Prsteníček je líný, dej mu čas.',
      'Ě se píše po souhlásce: dě, tě, ně, bě, pě, vě, mě.',
    ],
  }, longSteps),

  L('L24B', 'Háčky a čárky', 'Í: pravý prsteníček nahoru', ['í'], 115, {
    lead: 'Pravý prsteníček jde z L přes O na Í. Zrcadlo k Ě a zároveň jedno z nejčastějších písmen v češtině.',
    points: [
      'Í je nad O.',
      'Krátké I je v horní řadě, dlouhé Í v číselné.',
      'Tohle písmeno budeš psát každou chvíli, vyplatí se ho mít jistě.',
    ],
  }, longSteps),

  L('L25', 'Háčky a čárky', 'É a celá číselná řada', ['é'], 120, {
    lead: 'Poslední písmeno číselné řady je É a píše ho pravý malíček. Tím umíš celou číselnou řadu a s ní všechna malá písmena s háčky a čárkami.',
    points: [
      'É je nad P, píše ho pravý malíček.',
      'Shift nad těmito klávesami dá číslici, ne velké písmeno. Velké Č nebo Ř se dělá jinak, to přijde za dvě lekce.',
      'Teď se soustřeď na to, aby prst šel nahoru sám a ruka zůstala dole.',
    ],
  }, longSteps),

  L('L25R', 'Háčky a čárky', 'Opakování s háčky a čárkami', [], 120, {
    lead: 'Umíš všechna česká písmena. Dnes si je projdeme dohromady, ve slovech i větách.',
    points: [
      'Diakritika je nejdál od základní polohy, proto se na ní ztrácí nejvíc rychlosti.',
      'Piš plynule, nezastavuj se před každým háčkem.',
      'Když se ti řádek nepovede, nic se neděje, napíšeš ho znovu.',
    ],
  }, bigReviewSteps),

  /* --------------------------------------------- znaménka a čísla */
  L('L26', 'Znaménka a čísla', 'Otazník, vykřičník, dvojtečka', ['?', '!', ':', '"'], 120, {
    lead: 'Znaménka se píší se Shiftem, stejně jako velká písmena. Otazník je Shift a čárka, dvojtečka je Shift a tečka, vykřičník je Shift a klávesa vedle Ů.',
    points: [
      'Shift drž vždycky opačnou rukou, než kterou píšeš znaménko.',
      'Před otazníkem ani vykřičníkem se nedělá mezera.',
      'Za znaménkem mezera být musí.',
    ],
  }, [
    warmup,
    { kind: 'letters', label: 'Znaménka', lines: 2, phase: 0 },
    { kind: 'sentences', label: 'Věty se znaménky', lines: 4, punctuate: true },
    { kind: 'mixed', label: 'Procvičení', lines: 3 },
  ]),

  L('L27', 'Znaménka a čísla', 'Háček a čárka jako mrtvá klávesa', ['ď', 'ť', 'ň', 'ó'], 115, {
    lead: 'Ď, Ť, Ň a Ó nemají vlastní klávesu. Píší se na dvakrát: nejdřív stiskneš klávesu s háčkem nebo čárkou úplně vpravo nahoře, ta se sama nenapíše, a pak teprve písmeno. Háček je Shift a ta klávesa, čárka je ta klávesa samotná.',
    points: [
      'Nejdřív háček, potom písmeno. Objeví se to naráz.',
      'Klávesu s háčkem najdeš vpravo od nuly, píše ji pravý malíček.',
      'Úplně stejně se píší velká Č, Ř, Š, Ž, Á, É, Í a Ý. Shift nad nimi dá číslici, tak se musí složit háčkem nebo čárkou a velkým písmenem.',
      'Ó se v češtině skoro nepoužívá, ale v cizích slovech ano.',
    ],
  }, [
    warmup,
    { kind: 'letters', label: 'Nová písmena', lines: 3, phase: 0 },
    { kind: 'words', label: 'Slova', lines: 4, focusOnly: true },
    { kind: 'mixed', label: 'Procvičení', lines: 3 },
  ]),

  L('L28', 'Znaménka a čísla', 'Číslice', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], 110, {
    lead: 'Na české klávesnici jsou číslice schované pod písmeny s háčky. Napíšeš je tak, že držíš Shift. Prsty jsou stejné jako u písmen nad nimi.',
    points: [
      'Shift drž opačnou rukou, než kterou píšeš číslici.',
      'Jednička patří levému malíčku, nula pravému malíčku.',
      'Na notebooku většinou není číselná klávesnice, tohle je jediná cesta.',
    ],
  }, [
    warmup,
    { kind: 'numbers', label: 'Číslice', lines: 3 },
    { kind: 'numbers', label: 'Čísla dohromady', lines: 3 },
    { kind: 'text', label: 'Souvislý text', lines: 1 },
  ]),

  /* ------------------------------------------------------- prstolamy */
  L('L29', 'Prstolamy', 'Jen jednou rukou', [], 100, {
    lead: 'Dneska bude jedna ruka pracovat sama a druhá si odpočine. Existují slova, která se celá napíšou jednou rukou, třeba sestra nebo srdce jen levou a kolo nebo okno jen pravou. Nezvyk to je pořádný, protože si ruce nemůžou pomáhat a všechno musí zvládnout prsty jedné ruky za sebou.',
    points: [
      'Druhou ruku nech ležet v základní poloze. Neodkládej ji do klína.',
      'Tady se pozná, jestli prsty pracují samostatně, nebo se za sebou táhnou.',
      'Jde to pomaleji než obvykle. Tak to má být, nespěchej.',
      'Nejdřív levá ruka, ta toho v češtině zvládne víc, potom pravá.',
    ],
  }, [
    warmup,
    { kind: 'onehand', label: 'Jen levou rukou', lines: 3, side: 'L' },
    { kind: 'onehand', label: 'Jen pravou rukou', lines: 3, side: 'R' },
    { kind: 'mixed', label: 'Zase obě ruce', lines: 3 },
  ]),

  L('L30', 'Prstolamy', 'Prstolamy', [], 100, {
    lead: 'Prstolam je jako jazykolam, jenom pro prsty. Nejtěžší jsou dvě písmena za sebou, která píše ten samý prst. Nedá se to rozdělit mezi dva prsty ani mezi ruce, prst musí odskočit z jedné klávesy a hned trefit druhou. V češtině jsou nejhorší lo a ol, ce a ec, tr a rt a taky ed a de. Nejtěžší české slovo na téhle klávesnici je čtvrtek, ten má takové dvojice hned čtyři.',
    points: [
      'Zpomal víc než jindy. Tady se rychlostí nic nezíská.',
      'Prst se musí zvednout a přesunout. Nesmekej ho po klávesnici.',
      'Když se ti nedaří, napiš to slovo třikrát po sobě pomalu.',
      'Až tyhle zvládneš, zvládneš cokoliv.',
    ],
  }, [
    warmup,
    { kind: 'twisters', label: 'Nejtěžší dvojice', lines: 3, mode: 'pairs' },
    { kind: 'twisters', label: 'Nejtěžší slova', lines: 3 },
    { kind: 'sentences', label: 'Věty', lines: 3 },
  ]),

  /* ------------------------------------------------------ pro zábavu */
  L('L31', 'Pro zábavu', 'Zvířata', [], 110, {
    lead: 'Od téhle lekce se už nic nového neučíš, jen píšeš. Dneska zvířata, od šneka po velrybu. Slova jsou delší a zapeklitější než v dřívějších lekcích, takže je to dobrý trénink na všechno dohromady.',
    points: [
      'Klávesnici klidně schovej, tady už ji nepotřebuješ.',
      'Když se spleteš, nezastavuj se a piš dál.',
      'Tyhle lekce se dají opakovat, kolikrát chceš.',
    ],
  }, [
    warmup,
    { kind: 'theme', label: 'Zvířata', lines: 4, theme: 'zvirata' },
    { kind: 'theme', label: 'Věty o zvířatech', lines: 4, theme: 'zvirata', mode: 'sentences' },
  ]),

  L('L32', 'Pro zábavu', 'Česká města', [], 110, {
    lead: 'Dneska si projedeme mapu republiky. Jména měst mají spoustu háčků a čárek a začínají velkým písmenem, takže si u nich procvičíš Shift i celou číselnou řadu.',
    points: [
      'Každé město začíná velkým písmenem. Shift drž opačnou rukou.',
      'U Plzně a Děčína dej pozor na háčky.',
      'Zkus si cestou vybavit, kde to město leží.',
    ],
  }, [
    warmup,
    { kind: 'theme', label: 'Města', lines: 4, theme: 'mesta' },
    { kind: 'theme', label: 'Věty o městech', lines: 4, theme: 'mesta', mode: 'sentences' },
  ]),

  L('L33', 'Pro zábavu', 'Dny, měsíce a datumy', [], 110, {
    lead: 'Dny v týdnu, měsíce a datumy. Datum je zrádné v tom, že se v něm střídají číslice s tečkami a mezerami. Číslice se píší se Shiftem, tečka pravým prsteníčkem.',
    points: [
      'Za tečkou v datu se dělá mezera: 24. prosince.',
      'Číslice se píší se Shiftem, protože nad nimi bydlí háčky a čárky.',
      'Zkus si napsat i své narozeniny.',
    ],
  }, [
    warmup,
    { kind: 'theme', label: 'Dny a měsíce', lines: 4, theme: 'dny' },
    { kind: 'theme', label: 'Věty s datem', lines: 4, theme: 'dny', mode: 'sentences' },
  ]),

  L('L34', 'Pro zábavu', 'Jména a legrační příjmení', [], 110, {
    lead: 'V češtině je spousta příjmení, která jsou zároveň obyčejná slova, takže znějí legračně. Pan Mrkvička, paní Buchtová, pan Skočdopole. Dneska je budeme psát a u toho se procvičí velká písmena.',
    points: [
      'Jméno i příjmení začínají velkým písmenem.',
      'Za jménem je mezera, ne čárka.',
      'Zkus si napsat i jména svých kamarádů.',
    ],
  }, [
    warmup,
    { kind: 'theme', label: 'Jména a příjmení', lines: 4, theme: 'jmena' },
    { kind: 'theme', label: 'Věty se jmény', lines: 4, theme: 'jmena', mode: 'sentences' },
  ]),

  L('L35', 'Pro zábavu', 'Anglická slovíčka', [], 110, {
    lead: 'Angličtina na české klávesnici má jednu zradu: prohozené Y a Z. Anglické yes má Y dole vlevo a zoo má Z nahoře vpravo, přesně obráceně, než by čekal někdo zvyklý na anglickou klávesnici. Zbytek písmen je stejný.',
    points: [
      'Y píše levý malíček dole, Z pravý ukazováček nahoře.',
      'V angličtině nejsou háčky ani čárky, číselná řada zůstává v klidu.',
      'Slovíčka jsou ze školní slovní zásoby, takže je nejspíš znáš.',
    ],
  }, [
    warmup,
    { kind: 'english', label: 'Slovíčka s Y a Z', lines: 3, mode: 'yz' },
    { kind: 'english', label: 'Slovíčka', lines: 4 },
    { kind: 'english', label: 'Věty', lines: 4, mode: 'sentences' },
  ]),

  L('L36', 'Pro zábavu', 'Minecraft anglicky', [], 110, {
    lead: 'Anglická slovíčka, která znáš ze hry. Creeper, pickaxe, obsidian. Většina hráčů je zná z obrázků, ale napsat je je něco jiného. Platí tu stejná zrada s prohozeným Y a Z jako v předchozí lekci.',
    points: [
      'Slova jsou anglicky, takže žádné háčky ani čárky.',
      'Dlouhá slova jako cobblestone piš po kouskách, ne najednou.',
      'Až to zvládneš, půjde ti psát v chatu mnohem rychleji.',
    ],
  }, [
    warmup,
    { kind: 'theme', label: 'Bloky a věci', lines: 4, theme: 'minecraft' },
    { kind: 'theme', label: 'Věty ze hry', lines: 4, theme: 'minecraft', mode: 'sentences' },
  ]),
];

/**
 * Znaky, které lekce zpřístupní, ale nedriluje je samostatně.
 * Velká písmena s háčky a čárkami se píší úplně stejně jako ostatní velká
 * písmena, stačí tedy, že se objeví ve slovech a větách.
 */
const EXTRA_KEYS = {
  // Velká písmena s háčkem a čárkou se skládají mrtvou klávesou, proto patří
  // až k lekci, která mrtvé klávesy vysvětluje.
  L27: ['Ď', 'Ť', 'Ň', 'Ó', 'Č', 'Ř', 'Š', 'Ž', 'Á', 'É', 'Í', 'Ú', 'Ý'],
};
for (const lesson of LESSONS) lesson.extraKeys = EXTRA_KEYS[lesson.id] || [];

/** Lekce, která zavádí opravování chyb. Do té doby Backspace nefunguje. */
const BACKSPACE_LESSON = 'L20B';
lessonById(BACKSPACE_LESSON).introducesBackspace = true;
lessonById(BACKSPACE_LESSON).highlightCodes = ['Backspace'];

/**
 * Smí se v téhle fázi mazat Backspacem?
 * V prvních lekcích ne: české učebnice nechávají chyby být a nechají psát dál,
 * aby se nácvik hmatu nepřerušoval.
 */
export function backspaceAllowedAt(index) {
  const at = LESSONS.findIndex((l) => l.id === BACKSPACE_LESSON);
  return at >= 0 && index >= at;
}

/** Znaky, které se v lekcích vůbec neučí, ale text je smí obsahovat od začátku. */
const ALWAYS_ALLOWED = [' '];

/**
 * Množina znaků, které uživatel zná po dokončení lekce s daným indexem.
 * Velká písmena bez háčků se považují za známá až od lekce s velkými písmeny.
 */
export function allowedCharsUpTo(index) {
  const set = new Set(ALWAYS_ALLOWED);
  for (let i = 0; i <= index && i < LESSONS.length; i++) {
    for (const k of LESSONS[i].newKeys) set.add(k);
    for (const k of LESSONS[i].extraKeys) set.add(k);
  }
  return set;
}

/** Zná už uživatel v této fázi velká písmena? */
export function knowsUppercase(index) {
  return index >= LESSONS.findIndex((l) => l.id === 'L19');
}

export function lessonById(id) {
  return LESSONS.find((l) => l.id === id) || null;
}

export function lessonIndex(id) {
  return LESSONS.findIndex((l) => l.id === id);
}

/**
 * Je lekce odemčená? Odemyká se první hvězdičkou v předchozí lekci.
 * Aby se dítě nezaseklo, stačí i tři pokusy o předchozí lekci.
 */
export function isUnlocked(index, profile) {
  if (index <= 0) return true;
  const prev = LESSONS[index - 1];
  const rec = (profile.lessons || {})[prev.id];
  if (!rec) return false;
  return rec.stars > 0 || (rec.attempts || []).length >= 3;
}

/**
 * Index první lekce, kterou má smysl teď dělat: první, která ještě není
 * zvládnutá aspoň na jednu hvězdičku. Když je hotové všechno, vrací poslední.
 */
export function nextLessonIndex(profile) {
  for (let i = 0; i < LESSONS.length; i++) {
    const rec = (profile.lessons || {})[LESSONS[i].id];
    if (!rec || rec.stars < 1) return i;
  }
  return LESSONS.length - 1;
}
