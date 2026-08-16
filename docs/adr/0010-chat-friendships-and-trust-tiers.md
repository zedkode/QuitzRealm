# ADR 0010 — Chat, prietenii și trepte de încredere

**Dată:** 2026-08-15
**Status:** Acceptat
**Sursă:** `owner-plan.md` §2 (chat global / prieteni / privat, trepte de
încredere, protecții comune, sistem de prietenie)

## Context

§2 cere trei canale de chat cu reguli diferite, nouă trepte de încredere bazate
pe activitate reală, protecții comune (rate limiting, filtru de limbaj, spam,
raportare, blocare) și un sistem de prietenie sub toate acestea. Nimic din
astea nu exista.

## Decizie

1. **Treptele de încredere se calculează din răspunsuri corecte cumulate**,
   ținute denormalizat în `users.correct_answers`. Contorul crește **în aceeași
   tranzacție cu partida**, din datele validate de `backend/realtime` — un
   contor care poate crește fără o partidă în spate ar fi exact ce încearcă
   §2.5 să prevină. Alternativa (un `COUNT` peste `match_events`) ar fi pus o
   agregare pe fiecare mesaj de chat.
2. **Pragurile trăiesc într-un singur loc pe server** (`chat/trust-tier.ts`) și
   se expun prin `GET /chat/trust`. Aplicația afișează „mai ai X răspunsuri
   corecte”, dar nu calculează nimic — §2.5 cere explicit ca pragurile să nu fie
   hardcodate în client. Editarea din admin panel vine cu §13; până atunci se
   schimbă aici.
3. **Minoritatea taie chatul global indiferent de treaptă.** Un cont de minor cu
   100.000 de răspunsuri corecte tot primește doar reacții presetate, și are
   DM-urile fixate pe `friends_only`. Restricțiile de protecție nu se câștigă
   prin joc.
4. **Chatul cu prietenii e deschis de la T0.** Relația e deja consimțită
   reciproc; nu are ce dovedi cineva ca s-o merite. Treptele apără canalele spre
   necunoscuți, nu conversațiile acceptate de ambele părți.
5. **Prietenia e un rând cu perechea normalizată** (`user_id_a < user_id_b`).
   Fără normalizare, A→B și B→A ar fi două rânduri pentru aceeași relație și
   s-ar putea contrazice. O cerere inversă pe o cerere existentă **devine
   acceptare**: amândoi și-au exprimat consimțământul.
6. **Blocarea e direcțională și stă separat** (`user_blocks`), nu în
   `friendships` — abatere conștientă de la schița din §2.9, unde `blocked` era
   o stare a prieteniei. Acolo perechea e normalizată, deci s-ar pierde *cine pe
   cine* a blocat. Efectul se aplică însă **în ambele sensuri**: cel blocat nu
   mai poate scrie, iar conversația dispare din listă la cel care a blocat.
   Mesajele de refuz sunt neutre — „te-a blocat” ar transforma blocarea într-o
   notificare pentru cel blocat.
7. **Chatul global e efemer, în Redis** (100 de mesaje, TTL 24 h), nu în
   Postgres (§2.8). Un raport pe un mesaj global **copiază conținutul** în
   `chat_reports.content_snapshot`: altfel raportul ar rămâne fără dovadă după
   expirare.
8. **Blocarea se aplică la livrare, nu la afișare.** Mesajul global nu pleacă
   deloc către perechile blocate (`except` pe camerele lor personale). Un filtru
   în client ar însemna că mesajul a ajuns oricum acolo.
9. **Cererea de mesaj acceptă un singur mesaj** până e acceptată. Fără limită,
   coada de cereri ar deveni un canal de hărțuire cu firul închis. Iar acceptul
   îl dă **destinatarul**, verificat după cine a scris primul mesaj.
10. **Realtime nu atinge baza de date.** `chat:send` trece prin
    `POST /chat/internal/messages`, deci socket-ul și REST-ul folosesc exact
    aceleași verificări. Două căi cu logică proprie ar diverge tocmai la
    regulile care contează.
11. **Rate limiting-ul de chat global stă în Redis**, nu în memoria procesului:
    cu mai multe instanțe, un contor local ar înmulți limita cu numărul de
    noduri.
12. **Filtrul de limbaj maschează cuvântul, nu mesajul.** Restul frazei rămâne
    vizibil, pentru că destinatarul are nevoie de context ca să decidă dacă
    raportează. Normalizarea (diacritice, „leet”, litere repetate, punctuație)
    se aplică **și rădăcinilor**, altfel `asshole` n-ar mai corespunde propriului
    tipar după colapsarea literelor duble.
13. **Spamul duce la mut automat scurt** (10 minute), calculat din mesajele
    recente din bază, nu dintr-o stare în memorie. E o frână, nu o pedeapsă —
    pedepsele vin din moderare, după raport.
14. **Rapoartele din DM și de la prieteni urcă în coadă.** Hărțuirea în context
    privat e mai greu de observat din afară decât cea din chatul public (§2.6).
    Rapoartele veteranilor (T4+, T7+) cântăresc în plus.

## Ce NU este implementat, deliberat

- **Livrarea prin socket a mesajelor directe în aplicație.** Serverul emite
  `chat:message` și `friends:presence`, iar contractul e documentat în
  `EVENTS.md`, dar clientul Flutter nu e legat încă la ele: `realtime_client.dart`
  era în curs de modificare pentru chatul de meci. Până atunci, ecranul de
  conversație **reîmprospătează firul la 4 secunde cât e deschis** — un chat în
  care mesajul celuilalt apare abia la redeschidere n-ar fi un chat. Este o
  soluție intermediară explicită, nu forma finală.
- **Shadow-ban** pentru recidiviști și **coada de moderare umană** — depind de
  admin panel (§13).
- **Imagini și GIF-uri** (T4+ în §2.5): nu există încă niciun canal de upload și
  nicio moderare automată de imagine. A le permite fără astea ar deschide exact
  vectorul pe care treptele îl închid.
- **Sharding pe limbă/regiune** al camerei globale (§2.2): un singur flux e
  suficient la volumul actual, iar cheia din Redis e deja pregătită pentru mai
  multe camere.
- **Sugestii de prieteni** din jucătorii întâlniți recent (§2.7).
- **Ecranul pentru completarea datei de naștere** la conturile create înainte de
  age gate. `PATCH /users/me/birth-date` există, dar fără el conturile vechi
  rămân tratate ca minori, deci fără chat global. Este primul lucru de făcut în
  continuare.

## Consecințe

- Un jucător nou nu poate scrie străinilor: nici în lobby-ul public (cere T2),
  nici în DM (cere T2 + setarea destinatarului). Farmul de conturi pentru spam
  devine costisitor, pentru că moneda de intrare e activitatea reală.
- Ce a scris cineva rămâne verificabil după un raport, chiar dacă mesajul era
  efemer.
- **Schimbare de contract intern**: `POST /matches/results` acceptă acum
  `correctAnswers` per jucător. Câmpul are implicit `0`, deci clienții vechi nu
  se rup — dar nici nu contribuie la trepte până trimit valoarea.
