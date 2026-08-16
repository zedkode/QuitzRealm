# Assets lipsă pentru reconstrucția din `design-reference/`

Fiecare intrare e un element vizual prezent în capturi care **nu** are
corespondent în `mobile/assets/`. Până apare assetul real, ecranul folosește un
substituent **vizibil ca substituent** — niciodată o iconiță Material pusă pe
furiș în locul lui.

Stare: `LIPSĂ` = nu există nimic; `SUBSTITUENT` = e desenat provizoriu în cod;
`ACOPERIT` = există deja un asset potrivit.

---

## Existente, de refolosit

| Element din capturi | Asset existent |
|---|---|
| Blazonul QuizRealm (ecran principal, cerc de căutare) | `assets/game/quizrealm_crest.png` |
| Iconițe de categorie (Istorie, Știință…) | `assets/game/icons/quiz-categories/*.png` (20) |
| Monedă de aur, gems, XP, cheie, cupă | `assets/game/icons/resources/*.png` (20) |
| Cufere (zilnic, epic, recompensă de capitol) | `assets/game/chests/static/*.png` (10) |
| Insigne de rang | `assets/game/badges/ranks/*.png` (10) |
| Insigne de realizări | `assets/game/badges/achievements/` |
| Harta regatului | `assets/game/realm_map_v2.png` |
| Markere de hartă (cetate, blocat, curent) | `assets/game/map/markers/*.png` |
| Plăci ilustrate de buton (RO) | `assets/game/Buttons/ro/*.png` |

---

## Lipsă

| # | Element | Apare în | Stare | Ce e nevoie |
|---|---|---|---|---|
| 1 | **Avatare de jucător** (portrete: Strategul, Artemis, BlackWolf, QueenMara…) | 01, 02, 04, 05, 06, 08, 09, 10 | LIPSĂ | Set de 12–20 portrete ilustrate, pătrate, ≥ 256 px, tăiate circular la afișare. Fără ele, orice listă de jucători arată goală. |
| 2 | **Ramă de avatar cu insignă de nivel** | toate ecranele cu antet | SUBSTITUENT | Inel auriu + pastilă hexagonală în colțul de jos. Desenabil în cod; asset doar dacă se vrea ornament mai bogat. |
| 3 | **Emblemă de ligă** (scut albastru „Liga Albastră", cu diviziune) | 01, 02, 08, 09 | LIPSĂ | 5–8 embleme de ligă (bronz → diamant), fiecare cu 3 diviziuni. Insignele de rang existente au altă formă și alt nume. |
| 4 | **Steag/banieră de ligă** (panglica verticală din colțul dreapta-sus, ecranul 01) | 01 | LIPSĂ | Banieră verticală cu coadă în „V". |
| 5 | **Ornamente de colț pentru panouri** | toate | SUBSTITUENT | Colț auriu în „L" + romb central pe muchie. Desenat vectorial în `GoldFrame`; un set PNG ar arăta mai bogat. |
| 6 | **Separator ornamental de titlu** (romburile din stânga/dreapta titlului) | 01, 03, 05, 07, 08, 09 | SUBSTITUENT | Desenat vectorial. |
| 7 | **Iconițe de secțiune pentru setări** (difuzor, clopoțel, săbii, glob, paletă, amprentă, scut, monitor, coș) | 03, 04 | LIPSĂ | 12 iconițe în stil auriu gravat. `GameSymbol` acoperă doar o parte (`shield`, `swords`, `globe`, `chat`). |
| 8 | **Sigla Google** pentru contul conectat | 04 | LIPSĂ | Logo oficial Google „G". Nu se desenează de mână: se ia din materialele oficiale de brand. |
| 9 | **Emblemă de alianță** (scut cu sabie, anunțul fixat) | 05, 06 | LIPSĂ | Set de embleme de alianță/guildă. |
| 10 | **Fundal de conversație** (cetate estompată în dreapta-sus) | 06 | LIPSĂ | Ilustrație de fundal, foarte estompată, ca să nu strice lizibilitatea. |
| 11 | **Hartă de campanie pe capitole** cu trasee și noduri | 07 | PARȚIAL | `realm_map_v2.png` există, dar capturile arată o hartă **per capitol**, cu traseu albastru între noduri și zone blocate întunecate. E nevoie fie de hărți per capitol, fie de un strat de traseu desenat peste harta existentă. |
| 12 | **Cetăți per nod de hartă** (deblocată vs blocată) | 07 | PARȚIAL | Markerele existente sunt generice; capturile arată cetăți diferite per teritoriu. |
| 13 | **Podium de clasament** (rame locul 1/2/3, cu coroană și lauri) | 08 | LIPSĂ | Trei rame distincte: aur cu lauri, argint, bronz. |
| 14 | **Inel de căutare adversar** (cercul rotativ cu „Q" din matchmaking) | 09 | SUBSTITUENT | Compunere din blazonul existent + inel animat desenat în cod. |
| 15 | **Iconiță de dragon** (Pass Sezonier) | 02 | LIPSĂ | Ilustrație de sezon; se schimbă oricum la fiecare sezon. |
| 16 | **Iconițe pentru bara de jos** (casă/cetate, săbii, chat, cupă, coif) | 02–09 | PARȚIAL | `GameSymbol` acoperă `swords`, `chat`, `trophy`, `helmet`, `castle`. Capturile le arată ilustrate, nu vectoriale. |

| 17 | **Ilustrații pentru cartonașele de mod** (cetate, săbii încrucișate, bulă de chat, cupă — fiecare pe fundalul ei) | 02 | SUBSTITUENT | Patru ilustrații pătrate, ≥ 256 px. Până atunci `GameModeCard` desenează simbolul jocului peste un fundal în tonul cerut. |

---

## Goluri de date

Nu tot ce apare în capturi are sursă de date. Aceste secțiuni **nu** sunt
desenate cu valori inventate: regula proprietarului e explicită — „nu introduce
date false în logica de business doar ca să arate ecranul ca în captură".

| Secțiune din captură | Apare în | Ce lipsește | Unde e planificată |
|---|---|---|---|
| **Misiuni zilnice** (3 rânduri cu progres, recompensă, buton) | 02 | Nu există model, tabel sau endpoint de misiuni. | `owner-plan.md` §7.2 |
| **Pass sezonier** (nivel, XP de sezon, zile rămase, recompense) | 02 | Nu există sezoane, nici battle pass. | `owner-plan.md` §9.2 |
| **Cristale/gems** (al doilea contor din antet) | 01–04, 08, 09 | `User` are doar `coins`; nu există a doua monedă. | `owner-plan.md` §9.1 |
| **Putere / Resurse pe oră** („Regatul tău") | 02 | Nu există economie de resurse. | — |
| **XP de cont cu prag de nivel** | toate ecranele cu antet | Serverul păstrează `xp` și `level`, dar nu există regula de prag; antetul folosește deocamdată progresul de campanie, singurul cu formulă reală. | `owner-plan.md` §7.3 |
| **Ligă și diviziune** (banieră, „Liga Albastră — Divizia II") | 01, 08, 09 | Rangul există (`resolveRank`), ligile cu diviziuni nu. | `owner-plan.md` §5.2 |
| **Temă luminoasă** (comutatorul Întunecată/Luminoasă) | 03 | Aplicația are o singură temă implementată. Comutatorul lipsește din ecran până când există ce comuta. | — |

---

## Reguli

1. Un substituent trebuie să **arate** ca substituent la revizuire — nu o
   iconiță generică care trece drept finală.
2. Nimic din capturi nu se înlocuiește tăcut cu altceva „asemănător".
3. Avatarele (#1) și emblemele de ligă (#3) sunt cele mai vizibile lipsuri:
   apar pe majoritatea ecranelor și, fără ele, listele arată neterminate.
