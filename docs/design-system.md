# QuizRealm — sistem de design (reconstruit din `design-reference/`)

**Sursa de adevăr:** cele 10 capturi din `design-reference/`. Unde textul de
mai jos și o captură nu se potrivesc, captura are dreptate.

Valorile nu sunt alese din ochi: au fost **măsurate** din imagini, pe zone
alese pe elemente concrete (fundal, panou, ramă, umplere de slider, bară de
navigație). Ecranul de setări a servit ca etalon pentru culorile de interfață,
fiind cel mai puțin acoperit de ilustrație.

---

## 1. Fundamente

| Proprietate | Valoare |
|---|---|
| Raport de referință | 941 × 1672 px (≈ 9:16), portret |
| Lățime logică țintă | 360–430 dp |
| Temă | una singură, întunecată (comutatorul „Luminoasă" din ecranul de setări e o opțiune de produs, nu o a doua temă implementată) |

Toate cele 10 ecrane sunt construite din **același tipar**: fundal foarte
închis → panouri delimitate de ramă aurie → rânduri interioare cu fundal abia
mai deschis. Panourile **nu** se disting prin culoarea umpluturii (e aproape
identică cu fundalul), ci prin **ramă**. Asta e diferența esențială față de un
card Material, care se distinge prin elevație și umbră.

---

## 2. Culori

### Fundaluri și suprafețe

| Token | Valoare | Măsurat pe | Rol |
|---|---|---|---|
| `backgroundDeep` | `#01060F` | margini de ecran | fundalul cel mai închis, vignetă |
| `background` | `#010C1A` | zonă liberă de ecran | fundalul de bază |
| `surfacePanel` | `#000D1B` | interiorul panoului „SUNET" | umplutura panourilor |
| `surfaceRow` | `#04121F` | rând de setare | rândurile din interiorul panourilor |
| `surfaceRaised` | `#051A31` | panoul de răspuns din duel | panouri care trebuie să iasă în față |
| `surfaceSelected` | `#012252` | element selectat din bara de jos | stare selectată |

### Auriu (accentul metalic)

| Token | Valoare | Rol |
|---|---|---|
| `goldLight` | `#FFE9B8` | reflexul de pe muchia ramei, text pe fundal auriu |
| `goldBright` | `#F6C46B` | titluri de secțiune, iconițe active |
| `gold` | `#C9A45C` | rama standard, text de buton |
| `goldDeep` | `#7A5F3A` | latura umbrită a ramei |
| `goldShadow` | `#3B2E1B` | conturul exterior al ramei |

Rama aurie e **dublă**: un fir exterior subțire (`goldShadow`), un corp
(`gold`/`goldDeep` în degradeu) și un reflex interior (`goldLight`). Un singur
fir de 1 px arată sărac și rupe identitatea.

### Albastru (accentul interactiv)

| Token | Valoare | Rol |
|---|---|---|
| `royalBlue` | `#0048C2` | umplerea barelor de progres și a sliderelor |
| `royalBlueDeep` | `#013E98` | pista comutatoarelor pornite |
| `electric` | `#29B6FF` | evidențierea stării active, iconița selectată |
| `electricGlow` | `#7FE0FF` | halou în jurul elementelor active |
| `bubbleOutgoing` | `#022751` | bula proprie din conversație |
| `bubbleIncoming` | `#0A1A2A` | bula interlocutorului |

### Semantice

| Token | Valoare | Rol |
|---|---|---|
| `crimson` | `#C4392F` | acțiuni distructive, jucătorul advers |
| `crimsonDeep` | `#450F0C` | banda adversarului din duel |
| `success` | `#4ADE6A` | „Conectat", victorie |
| `onlineDot` | `#55E06A` | punctul de prezență |

### Text

| Token | Valoare | Rol |
|---|---|---|
| `textPrimary` | `#F5EFE2` | text principal, crem cald |
| `textOnGold` | `#1A1206` | text pe suprafață aurie |
| `textSecondary` | `#9FB6D0` | descrieri, text auxiliar |
| `textAccent` | `#6FC4F0` | subtitlul de sub numele jucătorului |
| `textMuted` | `#5D708A` | text dezactivat |

---

## 3. Tipografie

| Rol | Familie | Caz | Observații |
|---|---|---|---|
| Titlu de ecran | Cinzel | MAJUSCULE | spațiere generoasă între litere, ornament pe ambele laturi |
| Titlu de secțiune | Cinzel | Majuscule mici | precedat de o iconiță aurie |
| Etichetă de buton | Cinzel | MAJUSCULE | |
| Nume de jucător | serif | Normal | |
| Corp / descriere | sans de sistem | Normal | lizibilitatea are prioritate |
| Valori numerice | sans, cifre tabulare | | monede, XP, scor |

Cinzel **nu** se folosește pentru text de corp: la dimensiuni mici devine greu
de citit, iar referințele îl rezervă titlurilor și butoanelor.

---

## 4. Spațiere, raze, contururi

| Token | Valoare |
|---|---|
| `space.xs` / `sm` / `md` / `lg` / `xl` | 4 / 8 / 12 / 16 / 24 dp |
| `radius.sm` | 6 dp (bare de progres, pastile mici) |
| `radius.md` | 10 dp (rânduri, butoane) |
| `radius.lg` | 14 dp (panouri) |
| `radius.pill` | 999 dp (pastile de resurse, comutatoare) |
| `border.hairline` | 1 dp (fir exterior) |
| `border.frame` | 2 dp (rama standard de panou) |
| `border.emphasis` | 3 dp (panou evidențiat, element selectat) |

Colțurile panourilor poartă un **ornament** (un „L" auriu sau un romb), nu doar
o rotunjire. Fără el, panoul citește ca un card generic.

---

## 5. Structuri comune

### 5.1 Bara de sus (`PlayerIdentityHeader`)

Prezentă pe 8 din 10 ecrane. Compoziție, de la stânga la dreapta:

1. avatar rotund cu ramă aurie și **insignă de nivel** în colțul de jos;
2. nume (serif) + titlu (albastru accent) pe două rânduri;
3. rând secundar: coroană + bară de XP cu text `4.250 / 6.000 XP`;
4. la dreapta: două contoare de monedă (aur, gems), fiecare cu buton `+`;
5. buton de meniu (hamburger) rotund.

Ecranele de conversație și de duel **nu** o au: acolo contextul e altul (cine
vorbește / cine joacă).

### 5.2 Bara de jos (`QuizRealmBottomNavigation`)

Cinci intrări: **Acasă, Campanie, Chat, Clasament, Profil**. Eticheta e sub
iconiță. Elementul selectat: iconiță și text în `electric`, fundal
`surfaceSelected`, halou și un **romb auriu pe muchia de sus**.

Pe ecranul de multiplayer, a patra intrare devine „Multiplayer" — bara se
adaptează contextului, nu e fixă.

### 5.3 Panoul cu ramă (`FantasyPanel` / `GoldFrame`)

Blocul de bază al întregii interfețe: umplutură aproape de fundal, ramă aurie
dublă, ornamente în colțuri, titlu opțional cu iconiță.

### 5.4 Butoane

| Tip | Aspect |
|---|---|
| Primar | umplutură albastră cu degradeu, ramă aurie groasă, text Cinzel auriu, adesea cu săgeată la dreapta |
| Secundar | fără umplutură, doar ramă aurie, text auriu |
| Distructiv | ramă și text în `crimson` |
| Rotund | doar iconiță, ramă aurie circulară (înapoi, meniu, acțiuni de chat) |

---

## 6. Ce diferă față de implementarea actuală

| Aspect | Acum în aplicație | În referințe |
|---|---|---|
| Navigație | fiecare ecran deschis din meniu, cu buton „înapoi" | bară de navigație permanentă, cu 5 intrări |
| Bară de sus | doar titlu + înapoi | identitate completă + monede pe fiecare ecran |
| Auriu | `#F0B542`, saturat, plat | `#C9A45C` metalic, cu reflex și umbră |
| Fundal | `#080B1C` violet-albastru | `#010C1A` bleumarin aproape negru |
| Panouri | ramă simplă cu nituri | ramă dublă cu ornamente de colț |
| Ecrane lipsă | — | setări, setări de cont, listă de chat, multiplayer |
| Monedă | inexistentă în UI | aur + gems, prezente permanent |

---

## 7. Reguli de implementare

1. **Niciun ecran nu definește culori proprii.** Totul vine din
   `QuizRealmColors`; o culoare care nu există în tabelul de mai sus e un
   defect, nu o alegere.
2. **Iconițele sunt assets sau `GameSymbol`**, niciodată emoji și niciodată
   iconițe Material generice.
3. **Nicio dimensiune absolută legată de 941 × 1672.** Proporțiile se exprimă
   în fracțiuni sau în tokeni de spațiere.
4. **Ținta de atingere ≥ 44 dp.** Referințele au butoane generoase; nu le
   micșora sub acest prag ca să încapă mai mult conținut.
5. **Datele rămân cele reale.** Numerele din capturi (12.860 monede, Liga
   Albastră, „Sezonul V") sunt exemple de compoziție, nu conținut de
   implementat ca atare.
