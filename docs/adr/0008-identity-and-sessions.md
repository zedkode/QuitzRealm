# ADR 0008 — Identitate, sesiuni pe dispozitiv și verificare de cont

**Dată:** 2026-08-15
**Status:** Acceptat
**Sursă:** `docs/features-social-progression.md` §1 (login & înregistrare)

## Context

Autentificarea exista, dar cu un model de sesiune de o singură linie:
`users.refresh_token_hash`. Consecință directă — **un cont putea fi conectat pe
un singur dispozitiv**: al doilea login îl deconecta tăcut pe primul. Lipseau
și separarea handle/nume afișat, age gate-ul, verificarea emailului și
resetarea parolei, toate cerute de §1.

## Decizie

1. **Sesiunile devin rânduri proprii** (`user_sessions`), nu o coloană pe
   `users`. Fiecare dispozitiv are sesiunea lui, cu refresh token propriu,
   revocabilă separat. Asta este condiția pentru „sesiuni active listate pe
   cont” (§1.5) și pentru deconectarea forțată din admin panel (§13.2).
   - Migrarea **șterge** `users.refresh_token_hash`: sesiunile existente cad o
     singură dată, iar dispozitivele conectate cer un login nou.
   - Plafon de 10 sesiuni active; peste el cade cea mai puțin recent văzută.
2. **Rotație la fiecare refresh, cu detecție de rejucare.** Regula are trei
   ramuri, iar distincția dintre ele contează:
   - sesiune revocată sau expirată → token mort, **fără cascadă**. Dispozitivul
     pe care tocmai l-ai deconectat mai încearcă o dată; asta nu e un atac și
     nu are voie să te scoată de pe celelalte dispozitive.
   - sesiune activă, hash potrivit → cazul normal.
   - sesiune activă, hash nepotrivit → token-ul e semnat corect, deci a fost
     emis cândva pentru sesiunea asta, dar a fost rotit între timp. Două părți
     dețin tokenuri ale aceleiași sesiuni; nu putem ști care e legitimă, deci
     **cade tot contul**.
   - Refresh token-ul primește un `jti` aleator. Fără el, două rotații în
     aceeași secundă produceau un token **identic** (aceleași revendicări,
     același `iat`), rotația era un no-op și detecția n-avea ce observa.
3. **`username` și `displayName` sunt câmpuri distincte** (§1.2). Handle-ul are
   cooldown de 30 de zile; numele afișat se schimbă liber. Endpointuri separate,
   pentru că eșuează din motive diferite.
4. **Age gate cu dată de naștere** (§1.3): sub 13 ani contul nu se creează;
   13-15 ani e cont de minor, cu chat global și linkuri externe blocate
   indiferent de verificare. **Lipsa datei de naștere se tratează ca minor** —
   restricțiile protejează, iar absența datei nu dovedește că cineva e major.
   - `birth_date` e `DATE`, nu `TIMESTAMP`: ora nu ajută age gate-ul și adaugă
     o dată personală în plus.
   - Data nașterii **nu iese din server**; clientul primește doar consecința ei
     (`capabilities.isMinor`).
5. **Capabilitățile sunt derivate, nu stocate** (`account-policy.ts`), din
   verificarea emailului și vârstă. O regulă schimbată se aplică instant, fără
   migrare și fără riscul ca o coloană cachizată să diveargă.
6. **Tokenurile de email sunt `selector.verifier`**, nu un secret opac.
   Selectorul e indexat și în clar, verifier-ul e hash-at. Fără selector,
   consumarea unui token ar fi cerut o verificare argon2 pentru fiecare token
   activ — lent prin construcție, deci un vector de DoS.
7. **IP-ul sesiunii se păstrează doar ca HMAC.** Ajunge pentru a recunoaște
   același dispozitiv; nu ține o dată personală în clar. Consecință acceptată:
   §1.5 cere „aproximativ locație din IP”, iar asta **nu se poate face** din
   hash. Localizarea rămâne pentru când va exista un provider de geo-IP.
8. **Răspunsurile nu confirmă existența unui cont.** `password-reset/request`
   întoarce 202 și pentru adrese inexistente; altfel endpointul ar fi un
   instrument de enumerare a conturilor.
9. **Resetarea parolei revocă toate sesiunile.** Dacă resetarea a fost cerută
   pentru că cineva a intrat pe cont, atacatorul trebuie dat afară.

10. **Emailurile pleacă prin Resend** (API HTTP, `MAIL_TRANSPORT=resend`), nu
    prin SMTP. Nu adaugă o dependență de bibliotecă și nu ține o conexiune
    deschisă; cheia și expeditorul vin din mediu. Domeniul verificat în contul
    Resend e `mail.dohotstudio.com`, deci `MAIL_FROM` trebuie să fie pe el —
    altfel providerul respinge trimiterea.
    - **Eșecul de livrare nu se propagă** la înregistrare și la cererea de
      resetare. La înregistrare, contul e deja creat, iar un 5xx l-ar face pe
      jucător să creadă că nu are cont. La resetare, un 5xx apărut *doar*
      pentru adresele existente ar transforma endpointul într-un oracol de
      enumerare — exact ce evită răspunsul uniform 202. Eșecul rămâne în loguri.
11. **API-ul servește două pagini HTML** (`GET /auth/verify-email`,
    `GET|POST /auth/reset-password`). Linkul dintr-un email se deschide într-un
    browser: un `GET` care întoarce JSON sau 404 arată ca o defecțiune, chiar
    dacă fluxul JSON de dedesubt e corect. Nu e un frontend — când va exista
    website-ul (§13), rutele se redirectează acolo fără a schimba emailurile.
12. **`canPlayRanked` se aplică la intrarea în coadă**, în `backend/realtime`,
    citind `GET /users/internal/:id/capabilities` la fiecare cerere. Nu din
    tokenul de acces: acela trăiește 15 minute, deci un jucător care tocmai
    și-a confirmat emailul ar aștepta degeaba. Refuzul vine ca
    `matchmaking:rejected`, cu motivul, iar aplicația oferă retrimiterea
    linkului — un jucător blocat trebuie să aibă o cale de ieșire în ecran.

## Ce NU este implementat, deliberat

- **2FA (TOTP)**, captcha la înregistrare, conversia contului de invitat și
  recuperarea manuală prin suport — restul lui §1.1/§1.3/§1.4.
- **Conturile create înainte de age gate rămân fără dată de naștere**, deci sunt
  tratate ca minori. Nu le blochează ranked-ul (`canPlayRanked` ține doar de
  email), dar le va restrânge chatul din §2. `PATCH /users/me/birth-date`
  există; ecranul care îl folosește se face în §2, unde restricția devine
  vizibilă.

## Consecințe

- Jocul poate fi folosit pe telefon și tabletă simultan, fără deconectări
  reciproce — lucru imposibil înainte.
- Un cont compromis se poate închide complet dintr-o singură acțiune, ceea ce
  face implementabil modulul de moderare din §13.
- **Schimbare incompatibilă de API**: `POST /auth/register` cere acum
  `birthDate`. Aplicația mobilă a fost actualizată în același pas; orice alt
  client existent primește 400 până adaugă câmpul.
