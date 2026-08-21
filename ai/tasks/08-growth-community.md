# Creștere și comunitate — registru de task-uri

**Disciplină:** cum ajung jucătorii la joc, de ce rămân, cum se aduc unii pe alții.
**Prefix ID:** `GRW-`
**Convenții:** [`00-README.md`](00-README.md)

Un joc de trivia bun fără jucători e un joc mort. Registrul ăsta lipsea, iar
absența lui însemna că întreg planul construia un produs fără să se întrebe
vreodată cine îl instalează și de ce se întoarce a doua zi.

QuizRealm are un avantaj rar pentru un joc mic: aproape toate mecanicile lui
sociale produc, ca efect secundar, motive de invitație. Provocarea către un
prieten, Liga Familiei, cronica de sezon, replay-ul unei reveniri — toate sunt
și mecanici de joc, și canale de creștere. Registrul le tratează ca atare.

---

## Grupa A · Prima experiență

#### GRW-001 · Pâlnia de la instalare la prima partidă
- **Status:** ⬜ De făcut
- **Descriere:** Câți dintre cei care deschid aplicația ajung să joace o partidă întreagă. E singura cifră care contează în prima săptămână după lansare.
- **Implementare corectă:** Fiecare pas măsurat separat: deschidere, ecran de cont, cont creat, alegere de țară și limbă, tutorial început, tutorial terminat, prima partidă terminată. Se măsoară **înainte** de a optimiza ceva — altfel se optimizează pasul greșit. Ținta rezonabilă: peste jumătate ajung la prima partidă.
- **Finalizat:** —
- **Sursă:** `plan.md` §12 (de la linia 254)
- **Commit:** —
- **Produce:** DATA-003, APP-011

#### GRW-002 · Joc înainte de cont
- **Status:** ⬜ De făcut
- **Descriere:** Un ecran de înregistrare pus înaintea oricărui joc pierde cea mai mare parte a instalărilor.
- **Implementare corectă:** Modul invitat există deja și migrează progresul o singură dată la înregistrare. Trebuie folosit ca **drum implicit**: se joacă prima partidă, apoi se cere contul, în momentul în care jucătorul are ceva de pierdut. Contul rămâne obligatoriu pentru clasat și chat.
- **Finalizat:** —
- **Sursă:** `docs/archive/owner-plan-progress.md` §1
- **Commit:** —
- **Produce:** APP-011, WEB-024

#### GRW-003 · Momentul „am înțeles"
- **Status:** ⬜ De făcut
- **Descriere:** Clipa în care un jucător nou pricepe că răspunsul corect îi ia teritoriu. Dacă nu vine în primele două minute, nu mai vine.
- **Implementare corectă:** Tutorialul cu bot trebuie să ducă la o **cucerire reușită** cât mai devreme, nu să explice regulile întâi. Se măsoară câți ajung acolo și în cât timp. Ce se explică se explică în timpul jocului, nu înaintea lui.
- **Finalizat:** —
- **Sursă:** `plan.md` §7 (de la linia 168)
- **Commit:** —
- **Produce:** APP-011

#### GRW-004 · Ce vede un jucător care revine a doua zi
- **Status:** ⬜ De făcut
- **Descriere:** Prima zi aduce jucători; a doua îi păstrează.
- **Implementare corectă:** La a doua deschidere trebuie să fie **imediat vizibil** ceva nou: misiunea zilei, seria pornită, Întrebarea Zilei, o provocare primită. Nu într-un meniu — pe primul ecran. Retenția de zi 1 e metrica după care se judecă tot ce e în registrul ăsta.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7.1 (de la linia 326)
- **Commit:** —
- **Produce:** APP-033, WEB-035

---

## Grupa B · Creștere organică

#### GRW-005 · Provocarea către un prieten, ca poartă de intrare
- **Status:** ⬜ De făcut
- **Descriere:** Un link de provocare trimis cuiva care n-are jocul e cel mai ieftin canal de instalare posibil.
- **Implementare corectă:** Invitația se trimite prin sistemul de partajare al telefonului și duce la o **pagină web unde primitorul poate juca imediat**, fără instalare — apoi i se propune aplicația. Legătura profundă trebuie să supraviețuiască instalării: cine instalează după ce a primit o provocare trebuie să ajungă direct în ea, altfel fluxul se rupe exact la utilizatorii noi.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §8.2 (de la linia 364)
- **Commit:** —
- **Produce:** APP-039, WEB-024, GD-017

#### GRW-006 · Cronica de sezon, ca material de partajat
- **Status:** ⬜ De făcut
- **Descriere:** Cardul de recapitulare la final de sezon — mecanica „an în revistă".
- **Implementare corectă:** Generat ca imagine pe server, ca să arate identic oriunde ajunge. Trebuie să fie ceva cu care jucătorul **se laudă**, nu un raport: cifra lui cea mai bună în față, nu o listă completă. Momentul de trimitere e la închiderea sezonului, când toată lumea primește simultan.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.8 (de la linia 743)
- **Commit:** —
- **Produce:** GD-022, ART-017

#### GRW-007 · Replay-ul unei partide spectaculoase
- **Status:** ⬜ De făcut
- **Descriere:** Clip scurt generat automat după o revenire mare sau o victorie strânsă.
- **Implementare corectă:** Pragul de „spectaculos" trebuie **strict** — dacă apare după orice meci, nimeni nu mai partajează. Propunerea de partajare vine imediat, cât timp emoția e caldă, nu într-un meniu de istoric.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.9 (de la linia 743)
- **Commit:** —
- **Produce:** GD-023

#### GRW-008 · Recomandare cu recompensă
- **Status:** ⬜ De făcut
- **Descriere:** Un jucător care aduce un prieten primește ceva; prietenul, la fel.
- **Implementare corectă:** Recompensa se acordă **abia după ce cel invitat joacă efectiv** câteva partide, nu la instalare — altfel se generează conturi false. Doar monedă din joc și cosmetice, niciodată gems, ca să nu devină o cale de fraudă. Limită per cont.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7 (de la linia 326)
- **Commit:** —
- **Produce:** SRV-064, DATA-006

#### GRW-009 · Clasamentele ca argument public
- **Status:** ⬜ De făcut
- **Descriere:** „Cel mai bun din România" e un motiv de a intra pe site chiar fără cont.
- **Implementare corectă:** Clasamentele de țară vizibile public și indexabile. Profilul public al unui jucător de top e o pagină pe care el o va partaja singur. Setările de confidențialitate se respectă: cine s-a ascuns rămâne ascuns.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §10.4 (de la linia 462)
- **Commit:** —
- **Produce:** WEB-012, WEB-013, WEB-040

---

## Grupa C · Comunitate

#### GRW-010 · Program de moderatori din comunitate
- **Status:** ⬜ De făcut
- **Descriere:** La creștere, coada de moderare depășește ce poate face proprietarul singur.
- **Implementare corectă:** Recrutare din jucătorii de la treapta T5 în sus, cu rol limitat: revizuire de întrebări și rapoarte de chat, **fără** acces la conturi, plăți sau date personale. Rolurile există deja în `AdminRole`. Fiecare acțiune a lor trece prin același audit. Se pregătește înainte de a fi nevoie.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §13.2 (de la linia 682)
- **Commit:** —
- **Produce:** ADM-010, CNT-018

#### GRW-011 · Mentorat ca instrument de retenție
- **Status:** ⬜ De făcut
- **Descriere:** Jucătorii noi care primesc un mentor rămân mult mai des decât cei care nu primesc.
- **Implementare corectă:** Potrivire pe limbă, țară și orar. Recompensa mentorului e legată de **progresul real al discipolului**, altfel programul se umple cu mentori pasivi. E și un motiv de a rămâne pentru jucătorii avansați care au terminat conținutul competitiv.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §14.7 (de la linia 743)
- **Commit:** —
- **Produce:** GD-018

#### GRW-012 · Canale de comunitate în afara jocului
- **Status:** ⬜ De făcut
- **Descriere:** Unde vorbesc jucătorii între ei și cu tine, când nu sunt în joc.
- **Implementare corectă:** Un singur canal la început, întreținut bine, nu patru neglijate. Anunțurile de sezon, evenimentele și notele de versiune se postează acolo și în joc simultan. Feedbackul de acolo se întoarce în registre ca task-uri, altfel canalul devine o listă de plângeri fără efect.
- **Finalizat:** —
- **Sursă:** `plan.md` §12 (de la linia 254)
- **Commit:** —
- **Produce:** —

#### GRW-013 · Drumul de la nemulțumire la remediere
- **Status:** ⬜ De făcut
- **Descriere:** Un jucător care întâlnește un bug trebuie să aibă unde să-l spună, din joc.
- **Implementare corectă:** Buton de raportare în setări, care atașează automat versiunea, platforma și ultimele acțiuni — un raport fără context costă trei mesaje înainte să înceapă. Confirmare că a fost primit. Rapoartele intră în aceeași coadă cu tichetele de suport.
- **Finalizat:** —
- **Sursă:** `ai/needdesign.md`, secțiunea Moderation
- **Commit:** —
- **Produce:** WEB-010, APP-051

---

## Grupa D · Lansare și după

#### GRW-014 · Pregătirea magazinului de aplicații
- **Status:** ⬜ De făcut
- **Descriere:** Cum e găsit jocul de cineva care nu-l caută pe nume.
- **Implementare corectă:** Titlu și descriere care conțin termenii pe care lumea îi caută efectiv, în fiecare limbă. Capturile arată jocul real. Prima frază din descriere e singura pe care o citește majoritatea. Se revizuiește după primele săptămâni, pe baza termenilor reali de căutare.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, Faza 6
- **Commit:** —
- **Produce:** APP-049, ART-016

#### GRW-015 · Lansare în valuri, nu deodată
- **Status:** ⬜ De făcut
- **Descriere:** O lansare largă pe un joc netestat la scară arde exact publicul pe care îl atrage.
- **Implementare corectă:** Beta închisă cu un grup mic, apoi beta deschisă, apoi lansare. Fiecare treaptă are un criteriu numeric de trecere: retenție de zi 1, rată de eroare, timp de așteptare la matchmaking. **Harta unui sezon cu prea puțini jucători arată pustie**, deci primul sezon pornește pe o hartă mai mică și crește cu populația.
- **Finalizat:** —
- **Sursă:** `taskmaster.md`, riscuri
- **Commit:** —
- **Produce:** APP-052, DATA-004

#### GRW-016 · Reactivarea jucătorilor pierduți
- **Status:** ⬜ De făcut
- **Descriere:** Cineva care n-a mai intrat de două săptămâni are nevoie de un motiv concret, nu de un „ne lipsești".
- **Implementare corectă:** Notificare cu un fapt: un prieten l-a provocat, sezonul se termină în trei zile, facțiunea lui a pierdut județul lui. **Cel mult una pe săptămână**, dezabonabilă, și niciodată către cine a cerut ștergerea contului. Se măsoară câți se întorc și rămân, nu câți deschid notificarea.
- **Finalizat:** —
- **Sursă:** `owner-plan.md` §7 (de la linia 326)
- **Commit:** —
- **Produce:** SRV-084, DATA-007
