# Structura jocului — ce spune planul vs. ce e implementat

**Data:** 2026-08-16
**Surse normative:** `plan.md` §0, §1, §6, §8, §10 și `owner-plan.md` §5, §7.3, §9, §10.

Documentul acesta nu propune o viziune nouă. Compară structura implementată azi
cu cea decisă în plan și marchează divergențele care trebuie rezolvate.

---

## 1. Divergența principală: campania secvențială

`owner-plan.md` §7.3 e explicit:

> QuizRealm **nu are și nu va avea o campanie de nivele parcurse secvențial** —
> jocul e construit în jurul multiplayer-ului online (`plan.md` secțiunea 0,
> decizie confirmată).

Aplicația de azi e construită exact invers. Structura implementată:

| Element implementat | Fișier | Ce e |
|---|---|---|
| 9 „ținuturi" deblocate secvențial | `domain/campaign/realm_chapter.dart` | Campanie de nivele |
| Stele per etapă (0–3), praguri de deblocare | `domain/campaign/campaign_progress.dart` | Progres secvențial prin conținut |
| Hartă cu ținuturi blocate/deblocate | `features/map/world_map_screen.dart` | Hartă de campanie |
| „Asalt" pe etapă | `features/battle/battle_screen.dart` | Nivel de campanie |

Multiplayer-ul — care ar trebui să fie **centrul** jocului — există, dar subțire:
un singur ecran de duel (`features/duel/`), fără selecție de mod, fără cameră
privată, fără boți, fără hartă de cucerire în meci.

### Dovadă că direcția se schimbă deja

Pachetele românești ale campaniei (`istorie.json`, `romania.json`,
`geografie.json`, `literatura.json`, `mituri.json`, `sport.json`,
`stiinta.json`, `tehnologie.json`) au fost **șterse** pe 16.08.2026, iar
conținutul a trecut integral pe cele 20 de categorii. Campania rămăsese să
trimită la fișiere inexistente — adică ar fi crăpat la joc. Am repointat-o
provizoriu pe pachetele de categorii ca aplicația să funcționeze, dar asta e un
pansament, nu structura corectă.

---

## 2. Structura corectă, conform planului

`plan.md` §6 definește modurile v1:

| Mod | Ce e | Stare azi |
|---|---|---|
| **Clasic** | Hartă cu teritorii, runde multiple, atac/apărare — miezul jocului | ❌ neimplementat |
| **Blitz** | Variantă rapidă, timpi scurți | ❌ neimplementat (există `blitz` în enum-ul de server) |
| **Duo (1v1)** | Duel direct, matchmaking ELO | ⚠️ parțial (`features/duel/`) |
| **Partidă privată** | Cameră cu cod, boți, **alegerea categoriilor** | ❌ neimplementat |
| **Solo/Antrenament** | Fără presiune, pentru onboarding și testarea băncii | ⚠️ există, dar deghizat în campanie |

Observația care leagă totul: **harta nu e un ecran de campanie, ci tabla de joc
a modului Clasic.** În `plan.md` §1, mecanica de bază e „răspunzi corect →
cucerești teritoriu pe hartă", într-un duel sau o partidă multiplayer. Harta
există deja, desenată și funcțională — dar e folosită ca meniu de nivele în loc
de tablă de meci.

---

## 3. Ce trebuie făcut, în ordine

1. **Redenumire terminologică** (`owner-plan.md` §7.3, obligatoriu):
   „Nivel de cont" / „Nivel online", niciodată „nivel" simplu, niciodată sugestie
   de progres prin conținut secvențial.
2. **Antrenament pe categorii** — modul solo sancționat de plan (§6), care preia
   rolul actual al campaniei: alegi una sau mai multe dintre cele 20 de
   categorii și joci o rundă. Stratul de date există deja
   (`CategoryRoundSource`, cu deduplicare între categorii care se suprapun).
3. **Ecran de moduri** — „Joacă" duce la alegerea modului, nu direct în duel.
4. **Selecția de categorii per meci** — cerută explicit de proprietar. Serverul e
   gata: `agreeOnCategories` face intersecția preferințelor, cu revenire la
   „toate" când intersecția e goală; `matchmaking:join` acceptă `categoryCodes`.
   Lipsește doar interfața.
5. **Modul Clasic** — harta ca tablă de meci, cu teritorii cucerite în timp real.
   Aici intră animațiile de cucerire din `plan.md` §7.
6. **Retragerea campaniei** — după ce Antrenamentul acoperă rolul ei. Necesită
   decizia proprietarului: stelele și progresul salvat pe telefoane se pierd,
   iar capturile de design aprobate (`design-reference/02`, `07`) arată o
   secțiune „Campanie".

---

## 4. Conflictul care are nevoie de decizia proprietarului

Capturile de design aprobate conțin **Campanie** ca mod de sine stătător:
`02-home-dashboard.png` are un cartonaș „CAMPANIE — Progresează și cucerește noi
teritorii" și un panou „Progres recent — Campania Nordului, Capitolul 3", iar
`07-campaign.png` e un ecran întreg de campanie cu teritorii înlănțuite.

`owner-plan.md` §7.3 spune că un astfel de sistem nu există și nu va exista.

**Cele două nu pot fi ambele adevărate.** Variantele:

- **A. Planul are prioritate** — campania dispare, harta devine tabla modului
  Clasic, iar cartonașul „Campanie" din capturi devine „Clasic". Cel mai
  aproape de `plan.md` §0 („multiplayer din MVP").
- **B. Capturile au prioritate** — campania rămâne ca mod solo de progres, iar
  `owner-plan.md` §7.3 se modifică explicit ca să nu mai fie contrazis de cod.
- **C. Compromis** — campania devine „Antrenament pe categorii" cu progres
  vizibil (deblocare de categorii), fără hartă secvențială. Păstrează senzația
  de progres din capturi fără să încalce interdicția de campanie de nivele.

Recomandarea mea e **C**: satisface și cerința de progres solo din capturi, și
regula din plan, și folosește direct cele 20 de categorii pe care proprietarul
tocmai le-a populat. Decizia rămâne însă a proprietarului — nu am retras nimic
din campanie până când nu e luată.
