import 'dart:convert';
import 'dart:io';

import 'package:quiz_realm/data/pack/owner_question_pack_catalog.dart';

final class _Fact {
  const _Fact(this.subject, this.answerA, this.answerB);

  final String subject;
  final String answerA;
  final String answerB;
}

final class _CategoryTemplate {
  const _CategoryTemplate({
    required this.code,
    required this.promptA,
    required this.promptB,
    required this.facts,
  });

  final String code;
  final String promptA;
  final String promptB;
  final List<_Fact> facts;
}

List<_Fact> _facts(String raw) => raw
    .trim()
    .split('\n')
    .map((line) => line.trim().split('|'))
    .map((parts) {
      if (parts.length != 3) {
        throw FormatException('Fapt invalid: ${parts.join('|')}');
      }
      return _Fact(parts[0], parts[1], parts[2]);
    })
    .toList(growable: false);

String _question(String template, String subject) =>
    template.replaceAll('{subject}', subject);

List<String> _options(List<String> pool, String answer, int seed) {
  final unique = <String>[];
  for (final candidate in [answer, ...pool]) {
    if (!unique.contains(candidate)) unique.add(candidate);
  }
  if (unique.length < 4) {
    throw StateError('Pool cu prea puține variante pentru $answer');
  }
  final distractors = unique.where((candidate) => candidate != answer).toList();
  final start = seed % distractors.length;
  final selected = <String>[
    answer,
    for (var index = 0; index < 3; index += 1)
      distractors[(start + index) % distractors.length],
  ];
  final rotation = seed % selected.length;
  return [...selected.skip(rotation), ...selected.take(rotation)];
}

Map<String, Object> _buildPack(
  OwnerQuestionPackDefinition definition,
  _CategoryTemplate template,
) {
  if (template.facts.length != 25) {
    throw StateError(
      '${template.code} trebuie să aibă exact 25 de fapte duale.',
    );
  }
  final poolA = template.facts.map((fact) => fact.answerA).toList();
  final poolB = template.facts.map((fact) => fact.answerB).toList();
  final questions = <Map<String, Object>>[];
  for (var index = 0; index < template.facts.length; index += 1) {
    final fact = template.facts[index];
    final numberA = index * 2 + 1;
    final numberB = numberA + 1;
    questions.add({
      'id': '${template.code}-${numberA.toString().padLeft(3, '0')}',
      'type': 'choice',
      'difficulty': 1 + index % 5,
      'text': _question(template.promptA, fact.subject),
      'options': _options(poolA, fact.answerA, numberA),
      'answer': fact.answerA,
      'explanation':
          'Pentru „${fact.subject}”, răspunsul corect este „${fact.answerA}”.',
    });
    questions.add({
      'id': '${template.code}-${numberB.toString().padLeft(3, '0')}',
      'type': 'choice',
      'difficulty': 1 + (index + 2) % 5,
      'text': _question(template.promptB, fact.subject),
      'options': _options(poolB, fact.answerB, numberB),
      'answer': fact.answerB,
      'explanation':
          'Pentru „${fact.subject}”, răspunsul corect este „${fact.answerB}”.',
    });
  }
  return {
    'id': definition.code,
    'name': definition.name,
    'source': 'ai',
    'reviewStatus': 'pending',
    'questions': questions,
  };
}

void main() {
  final templates = <String, _CategoryTemplate>{
    for (final template in _templates()) template.code: template,
  };
  if (templates.length != ownerQuestionPacks.length) {
    throw StateError('Catalogul și template-urile nu au aceeași dimensiune.');
  }
  final outputDirectory = Directory('assets/questions');
  if (!outputDirectory.existsSync()) {
    outputDirectory.createSync(recursive: true);
  }
  const encoder = JsonEncoder.withIndent('  ');
  for (final definition in ownerQuestionPacks) {
    final template = templates[definition.code];
    if (template == null) throw StateError('Lipsește ${definition.code}.');
    final file = File(definition.assetPath);
    file.writeAsStringSync(
      '${encoder.convert(_buildPack(definition, template))}\n',
    );
    stdout.writeln('${definition.code}: 50');
  }
}

List<_CategoryTemplate> _templates() => [
  ..._worldTemplates(),
  ..._cultureTemplates(),
  ..._knowledgeTemplates(),
  ..._challengeTemplates(),
];

List<_CategoryTemplate> _worldTemplates() => [
  _CategoryTemplate(
    code: 'geography',
    promptA: 'Care este capitala statului {subject}?',
    promptB: 'Pe ce continent se află statul {subject}?',
    facts: _facts('''
România|București|Europa
Franța|Paris|Europa
Japonia|Tokyo|Asia
Canada|Ottawa|America de Nord
Brazilia|Brasília|America de Sud
Australia|Canberra|Oceania
Egipt|Cairo|Africa
Argentina|Buenos Aires|America de Sud
India|New Delhi|Asia
Mexic|Ciudad de México|America de Nord
Norvegia|Oslo|Europa
Kenya|Nairobi|Africa
Thailanda|Bangkok|Asia
Noua Zeelandă|Wellington|Oceania
Peru|Lima|America de Sud
Maroc|Rabat|Africa
Coreea de Sud|Seul|Asia
Portugalia|Lisabona|Europa
Cuba|Havana|America de Nord
Chile|Santiago|America de Sud
Nigeria|Abuja|Africa
Islanda|Reykjavík|Europa
Indonezia|Jakarta|Asia
Fiji|Suva|Oceania
Costa Rica|San José|America de Nord
'''),
  ),
  _CategoryTemplate(
    code: 'history',
    promptA: 'În ce an a avut loc evenimentul „{subject}”?',
    promptB: 'Cu ce spațiu istoric este asociat evenimentul „{subject}”?',
    facts: _facts('''
Căderea Imperiului Roman de Apus|476|Roma
Încoronarea lui Carol cel Mare|800|Aachen
Bătălia de la Hastings|1066|Anglia
Semnarea Magna Carta|1215|Anglia
Căderea Constantinopolului|1453|Imperiul Bizantin
Prima călătorie a lui Columb în America|1492|Caraibe
Începutul Reformei lui Luther|1517|Sfântul Imperiu Roman
Unirea Principatelor Române|1859|România
Proclamarea independenței SUA|1776|America de Nord
Revoluția Franceză|1789|Franța
Bătălia de la Waterloo|1815|Belgia
Independența României|1877|România
Începutul Primului Război Mondial|1914|Europa
Marea Unire a României|1918|România
Descoperirea mormântului lui Tutankhamon|1922|Egipt
Începutul celui de-Al Doilea Război Mondial|1939|Polonia
Fondarea Organizației Națiunilor Unite|1945|San Francisco
Independența Indiei|1947|Asia
Tratatul de la Roma|1957|Italia
Primul om pe Lună|1969|Luna
Căderea Zidului Berlinului|1989|Germania
Dizolvarea Uniunii Sovietice|1991|Eurasia
Intrarea României în NATO|2004|Europa
Intrarea României în Uniunea Europeană|2007|Europa
Proclamarea Republicii Populare Chineze|1949|China
'''),
  ),
  _CategoryTemplate(
    code: 'science',
    promptA: 'Care este simbolul chimic pentru {subject}?',
    promptB: 'Care este numărul atomic al elementului {subject}?',
    facts: _facts('''
Hidrogen|H|1
Heliu|He|2
Litiu|Li|3
Carbon|C|6
Azot|N|7
Oxigen|O|8
Fluor|F|9
Neon|Ne|10
Sodiu|Na|11
Magneziu|Mg|12
Aluminiu|Al|13
Siliciu|Si|14
Fosfor|P|15
Sulf|S|16
Clor|Cl|17
Argon|Ar|18
Potasiu|K|19
Calciu|Ca|20
Fier|Fe|26
Cupru|Cu|29
Zinc|Zn|30
Argint|Ag|47
Staniu|Sn|50
Aur|Au|79
Plumb|Pb|82
'''),
  ),
  _CategoryTemplate(
    code: 'wars',
    promptA: 'În ce an a început conflictul „{subject}”?',
    promptB:
        'Care a fost principalul teatru geografic al conflictului „{subject}”?',
    facts: _facts('''
Războaiele Medice|499 î.Hr.|Grecia și Marea Egee
Războiul Peloponesiac|431 î.Hr.|Grecia
Al Doilea Război Punic|218 î.Hr.|Mediterana de Vest
Războiul Galic al lui Cezar|58 î.Hr.|Galia
Primul Război Iudeo-Roman|66|Iudeea
Războiul de O Sută de Ani|1337|Franța
Războaiele Rozelor|1455|Anglia
Războiul de Treizeci de Ani|1618|Europa Centrală
Războiul Civil Englez|1642|Anglia
Marele Război al Nordului|1700|Europa de Nord
Războiul de Șapte Ani|1756|Europa și colonii
Războiul de Independență al SUA|1775|America de Nord
Războaiele Napoleoniene|1803|Europa
Războiul Crimeii|1853|Crimeea
Războiul Civil American|1861|Statele Unite
Războiul Franco-Prusac|1870|Franța și Germania
Războiul Ruso-Japonez|1904|Manciuria și Marea Japoniei
Primul Război Mondial|1914|Europa
Războiul Civil Spaniol|1936|Spania
Al Doilea Război Mondial|1939|Global
Războiul din Coreea|1950|Peninsula Coreeană
Războiul din Vietnam|1955|Asia de Sud-Est
Războiul de Șase Zile|1967|Orientul Mijlociu
Războiul din Golf|1990|Golful Persic
Războiul din Kosovo|1998|Balcani
'''),
  ),
  _CategoryTemplate(
    code: 'gaming',
    promptA: 'Ce studio a dezvoltat inițial jocul {subject}?',
    promptB: 'În ce an a fost lansat inițial jocul {subject}?',
    facts: _facts('''
Pong|Atari|1972
Space Invaders|Taito|1978
Pac-Man|Namco|1980
Donkey Kong|Nintendo|1981
Tetris|Academia Sovietică de Științe|1984
Super Mario Bros.|Nintendo|1985
The Legend of Zelda|Nintendo|1986
Final Fantasy|Square|1987
SimCity|Maxis|1989
Sonic the Hedgehog|Sega|1991
Wolfenstein 3D|id Software|1992
Doom|id Software|1993
Warcraft: Orcs & Humans|Blizzard Entertainment|1994
Pokémon Red și Green|Game Freak|1996
Half-Life|Valve|1998
The Sims|Maxis|2000
Halo: Combat Evolved|Bungie|2001
World of Warcraft|Blizzard Entertainment|2004
Portal|Valve|2007
Minecraft|Mojang|2011
The Elder Scrolls V: Skyrim|Bethesda Game Studios|2011
Dark Souls|FromSoftware|2011
Grand Theft Auto V|Rockstar North|2013
The Witcher 3: Wild Hunt|CD Projekt Red|2015
Fortnite|Epic Games|2017
'''),
  ),
];

List<_CategoryTemplate> _cultureTemplates() => [
  _CategoryTemplate(
    code: 'movies',
    promptA: 'Cine a regizat filmul {subject}?',
    promptB: 'În ce an a avut premiera filmul {subject}?',
    facts: _facts('''
Metropolis|Fritz Lang|1927
The Wizard of Oz|Victor Fleming|1939
Citizen Kane|Orson Welles|1941
Seven Samurai|Akira Kurosawa|1954
Psycho|Alfred Hitchcock|1960
Lawrence of Arabia|David Lean|1962
2001: A Space Odyssey|Stanley Kubrick|1968
The Godfather|Francis Ford Coppola|1972
Jaws|Steven Spielberg|1975
Star Wars|George Lucas|1977
Alien|Ridley Scott|1979
Blade Runner|Ridley Scott|1982
Back to the Future|Robert Zemeckis|1985
Cinema Paradiso|Giuseppe Tornatore|1988
Goodfellas|Martin Scorsese|1990
Jurassic Park|Steven Spielberg|1993
Pulp Fiction|Quentin Tarantino|1994
Toy Story|John Lasseter|1995
Titanic|James Cameron|1997
The Matrix|Lana și Lilly Wachowski|1999
The Lord of the Rings: The Fellowship of the Ring|Peter Jackson|2001
Spirited Away|Hayao Miyazaki|2001
The Dark Knight|Christopher Nolan|2008
Parasite|Bong Joon-ho|2019
Dune|Denis Villeneuve|2021
'''),
  ),
  _CategoryTemplate(
    code: 'music',
    promptA: 'Cine a compus sau a interpretat creația {subject}?',
    promptB: 'Cu ce gen muzical este asociată în principal creația {subject}?',
    facts: _facts('''
Anotimpurile|Antonio Vivaldi|Muzică barocă
Mica serenadă|Wolfgang Amadeus Mozart|Muzică clasică
Simfonia a IX-a|Ludwig van Beethoven|Muzică clasică
Lacul lebedelor|Piotr Ilici Ceaikovski|Balet
Rapsodia Română nr. 1|George Enescu|Muzică orchestrală
Boléro|Maurice Ravel|Muzică orchestrală
Rhapsody in Blue|George Gershwin|Jazz simfonic
Take the A Train|Duke Ellington|Jazz
What a Wonderful World|Louis Armstrong|Jazz vocal
Johnny B. Goode|Chuck Berry|Rock and roll
Jailhouse Rock|Elvis Presley|Rock and roll
Respect|Aretha Franklin|Soul
Purple Haze|The Jimi Hendrix Experience|Rock psihedelic
Bohemian Rhapsody|Queen|Rock
Superstition|Stevie Wonder|Funk
Dancing Queen|ABBA|Disco
Billie Jean|Michael Jackson|Pop
Like a Prayer|Madonna|Pop
Smells Like Teen Spirit|Nirvana|Grunge
Nothing Else Matters|Metallica|Heavy metal
No Scrubs|TLC|R&B
Lose Yourself|Eminem|Hip-hop
Crazy in Love|Beyoncé|R&B
Rolling in the Deep|Adele|Pop soul
Blinding Lights|The Weeknd|Synth-pop
'''),
  ),
  _CategoryTemplate(
    code: 'sports',
    promptA: 'Câți jucători are pe teren o echipă în {subject}?',
    promptB: 'Care este durata sau ținta standard indicată pentru {subject}?',
    facts: _facts('''
fotbal|11|90 de minute
baschet|5|4 sferturi
handbal|7|60 de minute
volei de sală|6|3 seturi câștigate
volei pe plajă|2|2 seturi câștigate
rugby union|15|80 de minute
rugby sevens|7|14 minute
hochei pe gheață|6|3 reprize
baseball|9|9 reprize
softball|9|7 reprize
cricket Test|11|maximum 5 zile
polo pe apă|7|4 sferturi
futsal|5|40 de minute
lacrosse pe teren|10|4 sferturi
curling|4|10 end-uri
tenis de simplu|1|2 seturi câștigate
tenis de dublu|2|2 seturi câștigate
badminton de simplu|1|2 game-uri câștigate
tenis de masă de simplu|1|3 sau 4 seturi câștigate
ștafeta 4×100 m|4|400 de metri total
bobsleigh de patru persoane|4|4 manșe olimpice
baschet 3x3|3|10 minute
kabaddi|7|40 de minute
netball|7|60 de minute
hochei pe iarbă|11|60 de minute
'''),
  ),
  _CategoryTemplate(
    code: 'mythology',
    promptA: 'Din ce mitologie provine personajul {subject}?',
    promptB: 'Cu ce rol sau simbol este asociat personajul {subject}?',
    facts: _facts('''
Zeus|Greacă|Cerul și fulgerul
Poseidon|Greacă|Marea
Athena|Greacă|Înțelepciunea
Hades|Greacă|Lumea morților
Apollo|Greacă|Soarele și artele
Artemis|Greacă|Vânătoarea
Odin|Nordică|Înțelepciunea și războiul
Thor|Nordică|Tunetul
Loki|Nordică|Vicleșugul
Freyja|Nordică|Dragostea și magia
Tyr|Nordică|Legea și curajul
Anubis|Egipteană|Îmbălsămarea
Ra|Egipteană|Soarele
Isis|Egipteană|Magia și maternitatea
Osiris|Egipteană|Viața de apoi
Horus|Egipteană|Regalitatea și cerul
Amaterasu|Japoneză|Soarele
Susanoo|Japoneză|Furtunile și marea
Quetzalcoatl|Aztecă|Șarpele cu pene
Tlaloc|Aztecă|Ploaia
Ganesha|Hindusă|Înlăturarea obstacolelor
Saraswati|Hindusă|Cunoașterea și artele
Maui|Polineziană|Erou cultural și pescar
Gilgameș|Mesopotamiană|Rege-erou
Zamolxis|Geto-dacică|Divinitate și nemurire
'''),
  ),
  _CategoryTemplate(
    code: 'literature',
    promptA: 'Cine a scris opera {subject}?',
    promptB: 'În ce limbă a fost publicată inițial opera {subject}?',
    facts: _facts('''
Iliada|Homer|Greacă veche
Divina Comedie|Dante Alighieri|Italiană
Don Quijote|Miguel de Cervantes|Spaniolă
Hamlet|William Shakespeare|Engleză
Faust|Johann Wolfgang von Goethe|Germană
Mândrie și prejudecată|Jane Austen|Engleză
Frankenstein|Mary Shelley|Engleză
Roșu și negru|Stendhal|Franceză
Mizerabilii|Victor Hugo|Franceză
Crimă și pedeapsă|Feodor Dostoievski|Rusă
Război și pace|Lev Tolstoi|Rusă
Aventurile lui Tom Sawyer|Mark Twain|Engleză
Luceafărul|Mihai Eminescu|Română
Ion|Liviu Rebreanu|Română
Enigma Otiliei|George Călinescu|Română
Marele Gatsby|F. Scott Fitzgerald|Engleză
Procesul|Franz Kafka|Germană
Micul Prinț|Antoine de Saint-Exupéry|Franceză
1984|George Orwell|Engleză
Un veac de singurătate|Gabriel García Márquez|Spaniolă
Numele trandafirului|Umberto Eco|Italiană
Beloved|Toni Morrison|Engleză
Alchimistul|Paulo Coelho|Portugheză
Orbitor|Mircea Cărtărescu|Română
Povestea slujitoarei|Margaret Atwood|Engleză
'''),
  ),
];

List<_CategoryTemplate> _knowledgeTemplates() => [
  _CategoryTemplate(
    code: 'technology',
    promptA: 'Ce înseamnă abrevierea {subject}?',
    promptB: 'În ce domeniu este folosită în principal abrevierea {subject}?',
    facts: _facts('''
CPU|Central Processing Unit|Procesoare
GPU|Graphics Processing Unit|Grafică digitală
RAM|Random Access Memory|Memorie volatilă
ROM|Read-Only Memory|Stocare firmware
SSD|Solid-State Drive|Stocare de date
HDD|Hard Disk Drive|Stocare magnetică
USB|Universal Serial Bus|Conectarea perifericelor
HDMI|High-Definition Multimedia Interface|Semnal audio-video
HTTP|Hypertext Transfer Protocol|Web
HTTPS|Hypertext Transfer Protocol Secure|Web securizat
URL|Uniform Resource Locator|Adresarea resurselor web
HTML|HyperText Markup Language|Structura paginilor web
CSS|Cascading Style Sheets|Stilizarea paginilor web
SQL|Structured Query Language|Baze de date
API|Application Programming Interface|Integrare software
DNS|Domain Name System|Rezolvarea numelor de internet
IP|Internet Protocol|Adresarea în rețea
LAN|Local Area Network|Rețele locale
WAN|Wide Area Network|Rețele extinse
VPN|Virtual Private Network|Tuneluri de rețea
GPS|Global Positioning System|Navigație prin satelit
NFC|Near Field Communication|Comunicații la distanță mică
QR|Quick Response|Coduri bidimensionale
AI|Artificial Intelligence|Inteligență artificială
IoT|Internet of Things|Dispozitive conectate
'''),
  ),
  _CategoryTemplate(
    code: 'animals',
    promptA: 'Din ce clasă zoologică face parte {subject}?',
    promptB: 'Care este habitatul natural reprezentativ pentru {subject}?',
    facts: _facts('''
balena albastră|Mamifer|Ocean deschis
pinguinul imperial|Pasăre|Antarctica
broasca săgeată otrăvitoare|Amfibian|Pădure tropicală
țestoasa verde|Reptilă|Mări tropicale
somonul atlantic|Pește|Râuri și Atlanticul de Nord
caracatița comună|Moluscă|Mări temperate
fluturele monarh|Insectă|Pajiști și păduri nord-americane
păianjenul văduva neagră|Arahnidă|Zone temperate
cangurul roșu|Mamifer|Interiorul arid al Australiei
ursul polar|Mamifer|Arctica
leul african|Mamifer|Savane africane
komodo|Reptilă|Insulele indoneziene
axolotlul|Amfibian|Lacurile din Valea Mexicului
vulturul pleșuv|Pasăre|America de Nord
rechinul-balenă|Pește|Oceane tropicale
sepiile|Moluscă|Mări de coastă
albina meliferă|Insectă|Pajiști și stupi
scorpionul imperial|Arahnidă|Păduri vest-africane
ornitorincul|Mamifer|Râurile Australiei de Est
struțul|Pasăre|Savane africane
crocodilul de Nil|Reptilă|Râuri africane
salamandra de foc|Amfibian|Păduri europene umede
tonul roșu|Pește|Atlantic și Mediterană
nautilul|Moluscă|Recife indo-pacifice
furnica tăietoare de frunze|Insectă|Păduri tropicale americane
'''),
  ),
  _CategoryTemplate(
    code: 'space',
    promptA: 'Ce tip de corp sau structură cosmică este {subject}?',
    promptB: 'Cu ce sistem, constelație sau regiune este asociat {subject}?',
    facts: _facts('''
Mercur|Planetă telurică|Sistemul Solar
Venus|Planetă telurică|Sistemul Solar
Pământ|Planetă telurică|Sistemul Solar
Marte|Planetă telurică|Sistemul Solar
Jupiter|Gigant gazos|Sistemul Solar
Saturn|Gigant gazos|Sistemul Solar
Uranus|Gigant de gheață|Sistemul Solar
Neptun|Gigant de gheață|Sistemul Solar
Luna|Satelit natural|Sistemul Pământ-Lună
Titan|Satelit natural|Saturn
Europa|Satelit natural|Jupiter
Ganymede|Satelit natural|Jupiter
Pluto|Planetă pitică|Centura Kuiper
Ceres|Planetă pitică|Centura de asteroizi
Soarele|Stea de tip G|Sistemul Solar
Proxima Centauri|Pitic roșu|Centaurus
Betelgeuse|Supergigantă roșie|Orion
Sirius|Stea de secvență principală|Câinele Mare
Polaris|Sistem stelar multiplu|Ursa Mică
Calea Lactee|Galaxie spirală barată|Grupul Local
Andromeda|Galaxie spirală|Grupul Local
Nebuloasa Orion|Nebuloasă de emisie|Orion
Messier 87|Galaxie eliptică|Roiul Fecioarei
Gaura neagră Sagittarius A*|Gaură neagră supermasivă|Centrul Căii Lactee
Cometa Halley|Cometă periodică|Sistemul Solar
'''),
  ),
  _CategoryTemplate(
    code: 'art',
    promptA: 'Cine a realizat opera de artă {subject}?',
    promptB: 'În ce muzeu sau loc este expusă în principal opera {subject}?',
    facts: _facts('''
Mona Lisa|Leonardo da Vinci|Muzeul Luvru
David|Michelangelo|Galleria dell'Accademia din Florența
Nașterea lui Venus|Sandro Botticelli|Galeria Uffizi
Școala din Atena|Rafael|Palatul Apostolic din Vatican
Rondul de noapte|Rembrandt|Rijksmuseum
Fata cu cercel de perlă|Johannes Vermeer|Mauritshuis
Las Meninas|Diego Velázquez|Muzeul Prado
Libertatea conducând poporul|Eugène Delacroix|Muzeul Luvru
Impresie, răsărit de soare|Claude Monet|Musée Marmottan Monet
Bal la Moulin de la Galette|Pierre-Auguste Renoir|Musée d'Orsay
Noaptea înstelată|Vincent van Gogh|Museum of Modern Art New York
Țipătul|Edvard Munch|Muzeul Național al Norvegiei
Sărutul|Gustav Klimt|Palatul Belvedere
Domnișoarele din Avignon|Pablo Picasso|Museum of Modern Art New York
Persistența memoriei|Salvador Dalí|Museum of Modern Art New York
Compoziție VIII|Wassily Kandinsky|Muzeul Guggenheim New York
American Gothic|Grant Wood|Art Institute of Chicago
Nighthawks|Edward Hopper|Art Institute of Chicago
Coloana Infinitului|Constantin Brâncuși|Târgu Jiu
Gânditorul|Auguste Rodin|Musée Rodin
Venus din Milo|Autor grec necunoscut|Muzeul Luvru
Victoria din Samothrace|Autor elenistic necunoscut|Muzeul Luvru
Guernica|Pablo Picasso|Museo Reina Sofía
Fiul omului|René Magritte|Colecție privată
Campbell's Soup Cans|Andy Warhol|Museum of Modern Art New York
'''),
  ),
  _CategoryTemplate(
    code: 'cars',
    promptA: 'Ce marcă produce sau a produs modelul {subject}?',
    promptB: 'Din ce țară provine marca asociată modelului {subject}?',
    facts: _facts('''
Model T|Ford|Statele Unite
Beetle|Volkswagen|Germania
911|Porsche|Germania
300 SL|Mercedes-Benz|Germania
Golf|Volkswagen|Germania
Corolla|Toyota|Japonia
Civic|Honda|Japonia
Skyline GT-R|Nissan|Japonia
MX-5|Mazda|Japonia
Impreza|Subaru|Japonia
Mustang|Ford|Statele Unite
Corvette|Chevrolet|Statele Unite
Charger|Dodge|Statele Unite
Wrangler|Jeep|Statele Unite
Mini|BMC|Regatul Unit
E-Type|Jaguar|Regatul Unit
DB5|Aston Martin|Regatul Unit
F40|Ferrari|Italia
Miura|Lamborghini|Italia
Giulia|Alfa Romeo|Italia
500|Fiat|Italia
2CV|Citroën|Franța
Clio|Renault|Franța
Logan|Dacia|România
Veyron|Bugatti|Franța
'''),
  ),
  _CategoryTemplate(
    code: 'economy',
    promptA: 'Ce descrie termenul economic „{subject}”?',
    promptB: 'Cu ce indicator sau instituție este asociat direct „{subject}”?',
    facts: _facts('''
inflație|Creșterea generală a prețurilor|Indicele prețurilor de consum
deflație|Scăderea generală a prețurilor|Indicele prețurilor de consum
PIB|Valoarea producției finale interne|Conturile naționale
PIB pe locuitor|PIB împărțit la populație|Nivelul mediu de producție
recesiune|Contracție semnificativă a activității economice|PIB real
șomaj|Persoane fără loc de muncă ce caută activ|Rata șomajului
dobândă|Costul utilizării capitalului împrumutat|Banca centrală
curs de schimb|Prețul unei monede exprimat în alta|Piața valutară
buget public|Planul veniturilor și cheltuielilor statului|Guvernul
deficit bugetar|Cheltuieli publice peste venituri|Datoria publică
datorie publică|Obligațiile financiare ale statului|Trezoreria
export|Vânzarea de bunuri în străinătate|Balanța comercială
import|Cumpărarea de bunuri din străinătate|Balanța comercială
tarif vamal|Taxă aplicată bunurilor importate|Autoritatea vamală
subvenție|Sprijin financiar acordat unei activități|Bugetul public
productivitate|Producție obținută pe unitate de resursă|Producția pe oră
lichiditate|Ușurința transformării unui activ în bani|Piața monetară
capital|Resurse folosite pentru producție|Investițiile
dividend|Parte din profit distribuită acționarilor|Compania emitentă
obligațiune|Titlu de datorie|Emitent public sau privat
acțiune|Titlu de proprietate într-o companie|Bursa de valori
monopol|Piață dominată de un singur furnizor|Autoritatea de concurență
oligopol|Piață dominată de câțiva furnizori|Concentrarea pieței
cerere|Cantitatea dorită de cumpărători|Prețul de piață
ofertă|Cantitatea pusă la vânzare|Prețul de piață
'''),
  ),
];

List<_CategoryTemplate> _challengeTemplates() => [
  _CategoryTemplate(
    code: 'general-knowledge',
    promptA: 'Care este răspunsul corect pentru reperul „{subject}”?',
    promptB: 'Cu ce domeniu este asociat reperul „{subject}”?',
    facts: _facts('''
numărul zilelor unui an bisect|366|Calendar
numărul continentelor în modelul uzual|7|Geografie
numărul planetelor Sistemului Solar|8|Astronomie
capitala Uniunii Europene de facto|Bruxelles|Instituții europene
sediul principal al ONU|New York|Relații internaționale
moneda Japoniei|yen|Economie
limba oficială a Braziliei|portugheză|Limbi
cel mai mare ocean|Pacific|Geografie
cel mai înalt munte deasupra nivelului mării|Everest|Geografie
cea mai mare planetă|Jupiter|Astronomie
autorul teoriei relativității|Albert Einstein|Fizică
inventatorul tiparului european cu litere mobile|Johannes Gutenberg|Istorie
formula chimică a apei|H2O|Chimie
organul care pompează sângele|inima|Biologie
capitala Australiei|Canberra|Geografie
simbolul olimpic|cinci cercuri|Sport
instrumentul cu 88 de clape|pianul|Muzică
limba în care a scris Shakespeare|engleză|Literatură
pictorul tabloului Mona Lisa|Leonardo da Vinci|Artă
zeul nordic al tunetului|Thor|Mitologie
unitatea SI pentru forță|newton|Fizică
gazul cel mai abundent în atmosfera terestră|azot|Știința atmosferei
țara de origine a automobilului Dacia|România|Automobile
baza sistemului binar|2|Informatică
numărul laturilor unui hexagon|6|Geometrie
'''),
  ),
  _CategoryTemplate(
    code: 'logic',
    promptA: 'Ce urmează logic în șirul {subject}?',
    promptB: 'Care este regula principală a șirului {subject}?',
    facts: _facts('''
2, 4, 6, 8|10|Se adaugă 2
3, 6, 9, 12|15|Se adaugă 3
5, 10, 15, 20|25|Se adaugă 5
1, 2, 4, 8|16|Se înmulțește cu 2
3, 9, 27, 81|243|Se înmulțește cu 3
1, 4, 9, 16|25|Pătratele numerelor naturale
1, 8, 27, 64|125|Cuburile numerelor naturale
1, 1, 2, 3, 5|8|Fiecare termen este suma precedentelor două
2, 3, 5, 7, 11|13|Numere prime în ordine
10, 9, 7, 4|0|Se scade succesiv 1, 2, 3, 4
100, 50, 25, 12,5|6,25|Se împarte la 2
81, 27, 9, 3|1|Se împarte la 3
2, 6, 12, 20|30|Produsul a două numere consecutive
1, 3, 6, 10, 15|21|Se adaugă succesiv 2, 3, 4, 5, 6
20, 18, 15, 11|6|Se scade succesiv 2, 3, 4, 5
7, 14, 28, 56|112|Se dublează termenul
64, 32, 16, 8|4|Se înjumătățește termenul
4, 7, 10, 13|16|Progresie aritmetică de rație 3
2, 5, 10, 17|26|Se adaugă numere impare succesive
1, 2, 6, 24|120|Factoriale succesive
11, 22, 33, 44|55|Multiplii lui 11
30, 25, 20, 15|10|Se scade constant 5
2, 4, 8, 14, 22|32|Diferențele sunt 2, 4, 6, 8, 10
9, 18, 16, 32, 30|60|Alternativ se dublează și se scade 2
1, 10, 2, 20, 3, 30|4|Două șiruri intercalate
'''),
  ),
  _CategoryTemplate(
    code: 'medieval',
    promptA: 'În ce an sau secol este plasat reperul medieval „{subject}”?',
    promptB: 'Cu ce loc este asociat reperul medieval „{subject}”?',
    facts: _facts('''
încoronarea lui Carol cel Mare|800|Aachen
tratatul de la Verdun|843|Imperiul Carolingian
bătălia de la Hastings|1066|Anglia
începerea Primei Cruciade|1096|Europa și Levant
cucerirea Ierusalimului de cruciați|1099|Ierusalim
fondarea Universității din Bologna|1088|Italia
Magna Carta|1215|Runnymede
bătălia de la Crécy|1346|Franța
începutul Morții Negre în Europa|1347|Sicilia
bătălia de la Poitiers|1356|Franța
lupta de la Rovine|1395|Țara Românească
bătălia de la Grunwald|1410|Polonia și Lituania
execuția Ioanei d'Arc|1431|Rouen
căderea Constantinopolului|1453|Constantinopol
bătălia de la Bosworth|1485|Anglia
domnia lui Ștefan cel Mare|1457|Moldova
bătălia de la Vaslui|1475|Moldova
fondarea Ordinului Templierilor|cca 1119|Ierusalim
ridicarea catedralei Notre-Dame din Paris|începută în 1163|Paris
apariția Hansei|secolele XII-XIII|Europa de Nord
domnia lui Richard Inimă de Leu|1189|Anglia
al patrulea conciliu de la Lateran|1215|Roma
călătoria lui Marco Polo spre Asia|1271|Drumul Mătăsii
începutul Războiului de O Sută de Ani|1337|Franța
inventarea tiparului lui Gutenberg|cca 1450|Mainz
'''),
  ),
  _CategoryTemplate(
    code: 'royal-challenge',
    promptA: 'Care este răspunsul de elită pentru „{subject}”?',
    promptB: 'Din ce domeniu provine provocarea „{subject}”?',
    facts: _facts('''
simbolul chimic W|wolfram|Chimie
cel mai mic număr prim|2|Matematică
autorul Criticii rațiunii pure|Immanuel Kant|Filosofie
capitala istorică a Imperiului Inca|Cusco|Istorie
limba originală a epopeii Beowulf|engleză veche|Literatură
particula purtătoare a interacțiunii electromagnetice|fotonul|Fizică
cel mai mare satelit al lui Saturn|Titan|Astronomie
arhitectul cupolei catedralei din Florența|Filippo Brunelleschi|Arhitectură
anul păcii de la Westfalia|1648|Istorie
compozitorul Artei fugii|Johann Sebastian Bach|Muzică
unitatea SI pentru activitate catalitică|katal|Chimie
autorul romanului Maestrul și Margareta|Mihail Bulgakov|Literatură
galaxia care conține Sagittarius A*|Calea Lactee|Astronomie
zeul mesopotamian din epopeea Enuma Eliș|Marduk|Mitologie
orașul antic al bibliotecii lui Assurbanipal|Ninive|Arheologie
matematicianul asociat cu teoremele incompletitudinii|Kurt Gödel|Logică
pictorul Grădinii desfătărilor|Hieronymus Bosch|Artă
elementul cu numărul atomic 74|wolfram|Chimie
prima femeie laureată a Premiului Nobel|Marie Curie|Istoria științei
strâmtoarea dintre Asia și America de Nord|Bering|Geografie
instrumentul de măsurare a presiunii atmosferice|barometrul|Fizică
dinastia chineză a flotei lui Zheng He|Ming|Istorie
filosoful autor al dialogului Republica|Platon|Filosofie
limba în care a fost scrisă Divina Comedie|italiană|Literatură
constanta aproximativă 1,618|raportul de aur|Matematică
'''),
  ),
];
