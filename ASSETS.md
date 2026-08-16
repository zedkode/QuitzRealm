# QuizRealm — active grafice și direcție artistică

## Direcție artistică

**QuizRealm** folosește un stil **dark-fantasy territory conquest** pentru un joc mobil de quiz competitiv. Baza este bleumarinul aproape negru, cu rame de metal auriu îmbătrânit; albastrul regal și cyanul indică jucătorul, progresul și selecția, iar roșul-crimson este rezervat adversarului și stărilor negative. Interfața trebuie să fie densă în informație, dar nu aglomerată: harta și decorul rămân la margini, iar centrul păstrează contrast mare pentru text și interacțiuni.

### Reguli de compoziție

| Zonă | Tratament obligatoriu |
|---|---|
| Fundal de duel | Hartă de luptă cu facțiune albastră la stânga și fortăreață crimson la dreapta; centrul întunecat și curat pentru HUD. |
| Panouri | Umplutură bleumarin discretă, ramă aurie dublă, ornamente de colț și umbre controlate. |
| HUD competitiv | Portrete de jucător, marcaj de confruntare, cronometru/temporizator și progres vizibil înaintea conținutului întrebării. |
| Feedback | Cyan/electric pentru selecție, verde pentru răspuns corect, crimson pentru eroare sau adversar; animațiile trebuie să fie scurte și utile. |

## Active existente și noi

| Activ | Rol | Fișier |
|---|---|---|
| Ținta vizuală de duel | Referință de compoziție și QA pentru ecranul competitiv. | `design-reference/manus-duel-visual-target.png` |
| Fundal de duel | Backdrop vertical cu facțiuni opuse și centru pentru UI. | `mobile/assets/game/duel_arena_backdrop.png` |
| Portret implicit al jucătorului | Avatar de facțiune albastră pentru lipsa avatarului de profil. | `mobile/assets/game/avatars/default_duelist_blue.png` |
| Portret implicit al adversarului | Avatar de facțiune crimson pentru lipsa avatarului de profil. | `mobile/assets/game/avatars/default_duelist_crimson.png` |
| Hartă generală | Fundal pentru campanie sau ecrane non-competitive. | `mobile/assets/game/realm_map_v2.png` |
| Blazon QuizRealm | Ancoră de brand pentru titlu, progres și rezultate. | `mobile/assets/game/quizrealm_crest.png` |

## Criterii de acceptare vizuală

1. Ecranul de duel trebuie să arate ca o confruntare între două facțiuni, nu ca un formular cu întrebări.
2. Fundalul nu trebuie să reducă lizibilitatea întrebărilor, răspunsurilor sau controalelor.
3. Nu se introduc culori locale în ecrane: codul folosește tokenii `QuizRealmColors` și componentele de design unificate.
4. Activele noi sunt doar fallback-uri grafice; ele nu înlocuiesc avatarurile reale ale utilizatorilor atunci când acestea sunt disponibile.
