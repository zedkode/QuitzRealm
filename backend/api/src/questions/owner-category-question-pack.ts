import { OWNER_GAMEPLAY_CATEGORY_CODES } from '../categories/initial-taxonomy';

export interface OwnerCategoryQuestion {
  readonly id: string;
  readonly categoryCode: (typeof OWNER_GAMEPLAY_CATEGORY_CODES)[number];
  readonly difficulty: number;
  readonly text: string;
  readonly options: readonly [string, string, string, string];
  readonly correctAnswer: string;
  readonly explanation: string;
}

type QuestionInput = Omit<OwnerCategoryQuestion, 'id' | 'categoryCode'>;

const choice = (
  difficulty: number,
  text: string,
  options: readonly [string, string, string, string],
  correctAnswer: string,
  explanation: string,
): QuestionInput => ({
  difficulty,
  text,
  options,
  correctAnswer,
  explanation,
});

const questionsByCategory: Record<
  OwnerCategoryQuestion['categoryCode'],
  readonly QuestionInput[]
> = {
  geography: [
    choice(
      1,
      'Care este capitala Canadei?',
      ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
      'Ottawa',
      'Ottawa este capitala federală a Canadei.',
    ),
    choice(
      1,
      'Care este cel mai întins ocean al Pământului?',
      ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
      'Pacific',
      'Oceanul Pacific este cel mai întins bazin oceanic al planetei.',
    ),
    choice(
      2,
      'Pe ce continent se află deșertul Sahara?',
      ['Asia', 'Africa', 'America de Sud', 'Australia'],
      'Africa',
      'Sahara ocupă o mare parte din nordul Africii.',
    ),
  ],
  history: [
    choice(
      2,
      'În ce an este datată tradițional căderea Imperiului Roman de Apus?',
      ['395', '476', '800', '1453'],
      '476',
      'În 476, ultimul împărat roman din Occident, Romulus Augustulus, a fost înlăturat.',
    ),
    choice(
      2,
      'În ce an a fost sigilată Magna Carta?',
      ['1066', '1215', '1492', '1648'],
      '1215',
      'Regele Ioan al Angliei a sigilat Magna Carta în 1215.',
    ),
    choice(
      1,
      'Ce civilizație antică a construit Colosseumul?',
      ['Egiptenii', 'Romanii', 'Fenicienii', 'Perșii'],
      'Romanii',
      'Colosseumul a fost construit la Roma în timpul dinastiei Flaviene.',
    ),
  ],
  science: [
    choice(
      1,
      'Care este formula chimică a apei?',
      ['CO2', 'H2O', 'O2', 'NaCl'],
      'H2O',
      'O moleculă de apă conține doi atomi de hidrogen și unul de oxigen.',
    ),
    choice(
      2,
      'Care este unitatea SI pentru forță?',
      ['Joule', 'Watt', 'Newton', 'Pascal'],
      'Newton',
      'Newtonul este unitatea derivată SI pentru forță.',
    ),
    choice(
      1,
      'Cum se numește procesul prin care plantele folosesc lumina pentru a produce substanțe nutritive?',
      ['Respirație', 'Fermentație', 'Fotosinteză', 'Evaporare'],
      'Fotosinteză',
      'În fotosinteză, energia luminii este transformată în energie chimică.',
    ),
  ],
  wars: [
    choice(
      1,
      'În ce an a început Primul Război Mondial?',
      ['1905', '1914', '1918', '1939'],
      '1914',
      'Primul Război Mondial a început în vara anului 1914.',
    ),
    choice(
      2,
      'La ce bătălie a fost învins definitiv Napoleon în 1815?',
      ['Austerlitz', 'Waterloo', 'Trafalgar', 'Leipzig'],
      'Waterloo',
      'Înfrângerea de la Waterloo a încheiat revenirea lui Napoleon din Cele O Sută de Zile.',
    ),
    choice(
      3,
      'Care două puteri au fost principalii adversari ai Războiului Peloponesiac?',
      [
        'Atena și Sparta',
        'Roma și Cartagina',
        'Persia și Egipt',
        'Macedonia și Tracia',
      ],
      'Atena și Sparta',
      'Războiul Peloponesiac a opus liga condusă de Atena celei conduse de Sparta.',
    ),
  ],
  gaming: [
    choice(
      1,
      'Ce companie publică seria de jocuri The Legend of Zelda?',
      ['Nintendo', 'Sega', 'Valve', 'Ubisoft'],
      'Nintendo',
      'The Legend of Zelda este una dintre seriile emblematice Nintendo.',
    ),
    choice(
      2,
      'Cine a creat jocul Tetris?',
      ['Shigeru Miyamoto', 'Alexey Pajitnov', 'John Carmack', 'Sid Meier'],
      'Alexey Pajitnov',
      'Programatorul Alexey Pajitnov a creat Tetris în 1984.',
    ),
    choice(
      1,
      'Ce personaj galben este urmărit de fantome într-un labirint?',
      ['Sonic', 'Pac-Man', 'Kirby', 'Link'],
      'Pac-Man',
      'Pac-Man străbate labirintul și evită patru fantome.',
    ),
  ],
  movies: [
    choice(
      1,
      'Cine a regizat filmul Jurassic Park din 1993?',
      ['James Cameron', 'Steven Spielberg', 'Ridley Scott', 'George Lucas'],
      'Steven Spielberg',
      'Steven Spielberg a regizat adaptarea cinematografică Jurassic Park.',
    ),
    choice(
      2,
      'Cum este numită popular statueta premiilor Academiei Americane de Film?',
      ['Emmy', 'Grammy', 'Oscar', 'Tony'],
      'Oscar',
      'Premiile Academiei sunt cunoscute în mod curent drept Premiile Oscar.',
    ),
    choice(
      2,
      'Ce definește în principal un film mut?',
      [
        'Este alb-negru',
        'Nu are dialog sincronizat înregistrat',
        'Nu are muzică',
        'Durează sub o oră',
      ],
      'Nu are dialog sincronizat înregistrat',
      'Filmele mute nu folosesc dialog vorbit sincronizat, deși puteau avea acompaniament muzical.',
    ),
  ],
  music: [
    choice(
      1,
      'Câte clape are un pian modern standard?',
      ['76', '80', '88', '96'],
      '88',
      'Pianul standard are 52 de clape albe și 36 negre, în total 88.',
    ),
    choice(
      2,
      'Cine a compus Simfonia a IX-a?',
      ['Mozart', 'Beethoven', 'Vivaldi', 'Chopin'],
      'Beethoven',
      'Ludwig van Beethoven a compus Simfonia a IX-a, finalizată în 1824.',
    ),
    choice(
      1,
      'Ce măsoară indicația BPM în muzică?',
      [
        'Înălțimea sunetului',
        'Bătăile pe minut',
        'Numărul de instrumente',
        'Volumul maxim',
      ],
      'Bătăile pe minut',
      'BPM indică tempo-ul prin numărul de bătăi într-un minut.',
    ),
  ],
  sports: [
    choice(
      1,
      'Câți jucători are pe teren o echipă de fotbal la începutul meciului?',
      ['9', '10', '11', '12'],
      '11',
      'O echipă începe partida cu cel mult unsprezece jucători, inclusiv portarul.',
    ),
    choice(
      1,
      'Câte cercuri are simbolul olimpic?',
      ['4', '5', '6', '7'],
      '5',
      'Simbolul olimpic este alcătuit din cinci cercuri interconectate.',
    ),
    choice(
      2,
      'Ce punctaj urmează după 30 într-un game de tenis obișnuit?',
      ['35', '40', '45', '50'],
      '40',
      'Succesiunea tradițională este 0, 15, 30 și 40.',
    ),
  ],
  'general-knowledge': [
    choice(
      1,
      'Câte zile are un an bisect?',
      ['365', '366', '367', '364'],
      '366',
      'Anul bisect include ziua de 29 februarie și are 366 de zile.',
    ),
    choice(
      2,
      'În ce oraș se află sediul principal al Organizației Națiunilor Unite?',
      ['Geneva', 'Paris', 'New York', 'Haga'],
      'New York',
      'Sediul principal al ONU se află în New York.',
    ),
    choice(
      1,
      'Care sunt culorile drapelului României, de la hampă spre exterior?',
      [
        'Roșu, galben, albastru',
        'Albastru, galben, roșu',
        'Galben, albastru, roșu',
        'Albastru, roșu, galben',
      ],
      'Albastru, galben, roșu',
      'Drapelul României este un tricolor vertical albastru, galben și roșu.',
    ),
  ],
  technology: [
    choice(
      1,
      'Cine a inventat World Wide Web?',
      ['Alan Turing', 'Tim Berners-Lee', 'Bill Gates', 'Steve Wozniak'],
      'Tim Berners-Lee',
      'Tim Berners-Lee a propus sistemul World Wide Web la CERN.',
    ),
    choice(
      1,
      'Ce înseamnă abrevierea CPU?',
      [
        'Central Processing Unit',
        'Computer Personal Utility',
        'Core Program User',
        'Central Power Usage',
      ],
      'Central Processing Unit',
      'CPU este unitatea centrală de procesare a unui calculator.',
    ),
    choice(
      2,
      'Ce bază folosește sistemul numeric binar?',
      ['2', '8', '10', '16'],
      '2',
      'Sistemul binar folosește doar cifrele 0 și 1, deci are baza 2.',
    ),
  ],
  mythology: [
    choice(
      1,
      'Cine este zeul tunetului în mitologia nordică?',
      ['Loki', 'Thor', 'Odin', 'Tyr'],
      'Thor',
      'Thor este zeul nordic asociat tunetului și fulgerului.',
    ),
    choice(
      1,
      'Cum se numește ciocanul lui Thor?',
      ['Gungnir', 'Mjölnir', 'Gram', 'Excalibur'],
      'Mjölnir',
      'Mjölnir este arma magică a zeului Thor.',
    ),
    choice(
      2,
      'Cu ce civilizație antică este asociat zeul Anubis?',
      ['Greacă', 'Egipteană', 'Nordică', 'Aztecă'],
      'Egipteană',
      'Anubis este o divinitate egipteană legată de îmbălsămare și lumea morților.',
    ),
  ],
  animals: [
    choice(
      2,
      'Câte inimi are o caracatiță?',
      ['1', '2', '3', '4'],
      '3',
      'Caracatița are două inimi branhiale și o inimă sistemică.',
    ),
    choice(
      1,
      'Care este cel mai mare mamifer cunoscut?',
      ['Elefantul african', 'Balena albastră', 'Cașalotul', 'Girafa'],
      'Balena albastră',
      'Balena albastră este cel mai mare animal cunoscut că a existat.',
    ),
    choice(
      1,
      'Din ce clasă de animale fac parte liliecii?',
      ['Păsări', 'Mamifere', 'Reptile', 'Amfibieni'],
      'Mamifere',
      'Liliecii sunt mamifere și își hrănesc puii cu lapte.',
    ),
  ],
  space: [
    choice(
      1,
      'Câte planete sunt recunoscute în Sistemul Solar?',
      ['7', '8', '9', '10'],
      '8',
      'Sistemul Solar are opt planete recunoscute.',
    ),
    choice(
      1,
      'Ce planetă este numită adesea Planeta Roșie?',
      ['Venus', 'Marte', 'Jupiter', 'Mercur'],
      'Marte',
      'Oxizii de fier de la suprafață îi dau planetei Marte nuanța roșiatică.',
    ),
    choice(
      2,
      'Cum se numește galaxia în care se află Sistemul Solar?',
      ['Andromeda', 'Calea Lactee', 'Triangulum', 'Sombrero'],
      'Calea Lactee',
      'Sistemul Solar se află într-un braț al galaxiei Calea Lactee.',
    ),
  ],
  literature: [
    choice(
      1,
      'Cine a scris tragedia Hamlet?',
      [
        'William Shakespeare',
        'Charles Dickens',
        'Dante Alighieri',
        'Victor Hugo',
      ],
      'William Shakespeare',
      'Hamlet este una dintre tragediile lui William Shakespeare.',
    ),
    choice(
      2,
      'Cine este autorul romanului Don Quijote?',
      [
        'Miguel de Cervantes',
        'Jorge Luis Borges',
        'Gabriel García Márquez',
        'Federico García Lorca',
      ],
      'Miguel de Cervantes',
      'Miguel de Cervantes a publicat cele două părți ale romanului Don Quijote.',
    ),
    choice(
      1,
      'Cine a scris romanul 1984?',
      ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H. G. Wells'],
      'George Orwell',
      'George Orwell a publicat romanul distopic 1984 în 1949.',
    ),
  ],
  art: [
    choice(
      1,
      'Cine a pictat Mona Lisa?',
      ['Michelangelo', 'Leonardo da Vinci', 'Rafael', 'Botticelli'],
      'Leonardo da Vinci',
      'Mona Lisa este un portret realizat de Leonardo da Vinci.',
    ),
    choice(
      1,
      'Cine a pictat Noaptea înstelată?',
      ['Claude Monet', 'Vincent van Gogh', 'Pablo Picasso', 'Salvador Dalí'],
      'Vincent van Gogh',
      'Vincent van Gogh a pictat Noaptea înstelată în 1889.',
    ),
    choice(
      2,
      'Cine a sculptat statuia renascentistă David aflată la Florența?',
      ['Donatello', 'Bernini', 'Michelangelo', 'Rodin'],
      'Michelangelo',
      'Michelangelo a realizat celebra statuie David la începutul secolului al XVI-lea.',
    ),
  ],
  cars: [
    choice(
      2,
      'Ce inventator este asociat cu automobilul Benz Patent-Motorwagen?',
      ['Karl Benz', 'Henry Ford', 'Rudolf Diesel', 'Nikolaus Otto'],
      'Karl Benz',
      'Karl Benz a brevetat vehiculul Patent-Motorwagen în 1886.',
    ),
    choice(
      1,
      'Ce înseamnă abrevierea ABS la un automobil?',
      [
        'Sistem antiblocare la frânare',
        'Sistem automat de baterie',
        'Suspensie activă de bază',
        'Senzor auxiliar de viteză',
      ],
      'Sistem antiblocare la frânare',
      'ABS ajută la prevenirea blocării roților în timpul frânării puternice.',
    ),
    choice(
      2,
      'Ce transformare energetică realizează în principal un motor cu ardere internă?',
      [
        'Electrică în nucleară',
        'Chimică în mecanică',
        'Solară în chimică',
        'Mecanică în gravitațională',
      ],
      'Chimică în mecanică',
      'Motorul transformă energia chimică a combustibilului în lucru mecanic.',
    ),
  ],
  logic: [
    choice(
      2,
      'Cum se numește un argument în care concluzia decurge necesar din premise?',
      [
        'Deductiv valid',
        'Inductiv slab',
        'Circular fals',
        'Analogic aleatoriu',
      ],
      'Deductiv valid',
      'Într-un argument deductiv valid, premise adevărate nu pot conduce la o concluzie falsă.',
    ),
    choice(
      2,
      'Ce formează o propoziție împreună cu negația ei?',
      ['O tautologie', 'O contradicție', 'O analogie', 'O definiție'],
      'O contradicție',
      'O propoziție și negația sa nu pot fi adevărate simultan.',
    ),
    choice(
      1,
      'Cum se numește raționamentul clasic cu două premise și o concluzie?',
      ['Sofism', 'Silogism', 'Paradox', 'Axiomă'],
      'Silogism',
      'Silogismul combină două premise pentru a deriva o concluzie.',
    ),
  ],
  economy: [
    choice(
      1,
      'Cum se numește creșterea generală și susținută a nivelului prețurilor?',
      ['Deflație', 'Inflație', 'Recesiune', 'Lichiditate'],
      'Inflație',
      'Inflația reprezintă creșterea generală a prețurilor și reducerea puterii de cumpărare a banilor.',
    ),
    choice(
      1,
      'Ce măsoară produsul intern brut, prescurtat PIB?',
      [
        'Doar exporturile',
        'Valoarea bunurilor și serviciilor finale produse într-o economie',
        'Numărul de companii',
        'Rezervele de aur',
      ],
      'Valoarea bunurilor și serviciilor finale produse într-o economie',
      'PIB sintetizează valoarea producției finale realizate într-o perioadă.',
    ),
    choice(
      2,
      'Ce instituție stabilește de regulă politica monetară a unei țări?',
      [
        'Banca centrală',
        'Bursa de valori',
        'Ministerul culturii',
        'Camera de comerț',
      ],
      'Banca centrală',
      'Banca centrală gestionează de regulă dobânzile de politică monetară și oferta monetară.',
    ),
  ],
  medieval: [
    choice(
      2,
      'Ce oraș a cucerit Imperiul Otoman în 1453?',
      ['Roma', 'Constantinopol', 'Viena', 'Alexandria'],
      'Constantinopol',
      'Cucerirea Constantinopolului de către otomani a avut loc în 1453.',
    ),
    choice(
      2,
      'Cum se numea domeniul acordat unui vasal în schimbul serviciilor?',
      ['Forum', 'Fief', 'Polis', 'Comitat electoral'],
      'Fief',
      'În sistemul feudal, fief-ul era acordat unui vasal în schimbul obligațiilor sale.',
    ),
    choice(
      2,
      'În ce secol a lovit Europa pandemia numită Moartea Neagră?',
      [
        'Secolul al XII-lea',
        'Secolul al XIII-lea',
        'Secolul al XIV-lea',
        'Secolul al XVI-lea',
      ],
      'Secolul al XIV-lea',
      'Valul principal al Morții Negre a ajuns în Europa la mijlocul secolului al XIV-lea.',
    ),
  ],
  'royal-challenge': [
    choice(
      4,
      'Ce cucerire din 1066 este ilustrată de Tapiseria de la Bayeux?',
      [
        'Cucerirea normandă a Angliei',
        'Căderea Constantinopolului',
        'Prima cruciadă',
        'Unirea Castiliei',
      ],
      'Cucerirea normandă a Angliei',
      'Tapiseria relatează evenimentele care au dus la cucerirea normandă și la Bătălia de la Hastings.',
    ),
    choice(
      4,
      'Ce element chimic are simbolul W?',
      ['Wolfram', 'Wolframiu imaginar', 'Vanadiu', 'Wismut'],
      'Wolfram',
      'Simbolul W provine de la denumirea wolfram, folosită pentru tungsten.',
    ),
    choice(
      4,
      'Care este cel mai mic număr prim?',
      ['0', '1', '2', '3'],
      '2',
      'Numărul 2 are exact doi divizori pozitivi, 1 și 2, și este cel mai mic număr prim.',
    ),
  ],
};

export const OWNER_CATEGORY_QUESTION_PACK: readonly OwnerCategoryQuestion[] =
  OWNER_GAMEPLAY_CATEGORY_CODES.flatMap((categoryCode, categoryIndex) =>
    questionsByCategory[categoryCode].map((question, questionIndex) => ({
      ...question,
      id: `30000000-0000-4000-8000-${String(categoryIndex * 10 + questionIndex + 1).padStart(12, '0')}`,
      categoryCode,
    })),
  );

export function validateOwnerCategoryQuestionPack(): void {
  const ids = new Set<string>();
  const texts = new Set<string>();
  for (const code of OWNER_GAMEPLAY_CATEGORY_CODES) {
    const questions = OWNER_CATEGORY_QUESTION_PACK.filter(
      (question) => question.categoryCode === code,
    );
    if (questions.length < 3) {
      throw new Error(
        `Categoria ${code} trebuie să aibă cel puțin 3 întrebări.`,
      );
    }
  }
  for (const question of OWNER_CATEGORY_QUESTION_PACK) {
    if (ids.has(question.id) || texts.has(question.text.toLowerCase())) {
      throw new Error(`Întrebare duplicată: ${question.id}`);
    }
    ids.add(question.id);
    texts.add(question.text.toLowerCase());
    if (question.difficulty < 1 || question.difficulty > 5) {
      throw new Error(`Dificultate invalidă: ${question.id}`);
    }
    if (question.options.length !== 4 || new Set(question.options).size !== 4) {
      throw new Error(`Variante invalide: ${question.id}`);
    }
    if (!question.options.includes(question.correctAnswer)) {
      throw new Error(`Răspunsul lipsește din variante: ${question.id}`);
    }
    if (question.explanation.trim().length < 10) {
      throw new Error(`Explicație prea scurtă: ${question.id}`);
    }
  }
}
