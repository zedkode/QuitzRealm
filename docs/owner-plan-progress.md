# Owner plan — progres de implementare

> Jurnal operațional pentru parcurgerea strictă a `owner-plan.md`. Un punct nu este marcat finalizat până când cerințele lui au cod, test/validare și o cale utilizabilă în aplicație.

## 1. Sistem de login & înregistrare

| Criteriu | Stare | Dovezi / lucru rămas |
|---|---:|---|
| Email + parolă | Implementat | API, parole Argon2, DTO-uri și client mobil existente; build backend și analiza Flutter trec. |
| Google OAuth | Implementat | Backend cu guard OAuth, cod de schimb single-use și endpoint mobil; clientul Flutter deschide browserul sistemului, validează `state` și schimbă codul pe tokenuri. |
| Mod invitat + conversie unică | Implementat | `GuestProgressMigrator` creează/recuperează ID guest securizat, migrează doar progresul campaniei după înregistrare și marchează conversia idempotent; API-ul verifică payload-ul și nu acceptă progres competitiv. |
| 2FA TOTP opțional | Implementat | Secret criptat AES-GCM, coduri recovery Argon2, provocare de 5 minute, endpointuri, ecran de login și configurare în cont; test TOTP RFC-6238 și recovery code. |
| Username unic + display name + cooldown | Implementat | Modelul de date și serviciul Users separă identitățile, cu cooldown de 30 zile. |
| Verificare email pentru ranked/chat | Implementat | Tokenuri single-use, capabilități derivate și blocaj în realtime. |
| Captcha anti-bot | Implementat | Backendul verifică Turnstile prin `CaptchaService`; clientul Flutter afișează `CloudflareTurnstile` în modul de înregistrare și transmite `captchaToken`. Build-urile de producție activează protecția prin `CAPTCHA_REQUIRED=true`, iar build-urile mobile primesc `TURNSTILE_SITE_KEY` și `TURNSTILE_BASE_URL`. |
| Rate limiting IP/device | Implementat | Throttler pe register/login și endpointuri sensibile; `SessionService.assertRegistrationAllowed` combină HMAC IP + eticheta User-Agent într-o fereastră de 24h și limitează crearea de conturi distincte. |
| Age gate / restricții minor | Implementat | Prag minim 13 ani la register; serverul derivă capabilități pentru minori, iar chatul restricționează global/DM/linkurile. |
| Resetare parolă | Implementat | Token de 30 minute, single-use, răspuns uniform anti-enumerare și cerere disponibilă în mobil. |
| Recuperare manuală prin suport | Implementat documentațional | `docs/account-recovery-runbook.md` definește ticket, dovezi independente, perioadă de protecție 72h, revocarea sesiunilor și resetarea controlată a 2FA; execuția rămâne operațională până la livrarea Admin Panel. |
| JWT + refresh + sesiuni revocabile | Implementat | Access 15 minute, refresh 30 zile, rotație/replay detection și sesiuni per dispozitiv. |
| Lista / revocarea sesiunilor în aplicație | Implementat | Ecran de cont cu listă, revocare individuală și deconectare de pe alte dispozitive. |
| Invalidează sesiuni la administrare | Pregătit pentru punctul 13 | `SessionService.revokeAll` există și este folosit de operațiile de securitate; ecranul Admin Panel și integrarea completă a acțiunilor administrative aparțin punctului 13. |

**Verdict curent:** punctul 1 este satisfăcut pentru suprafața de autentificare livrată acum. Singura dependență rămasă este integrarea acțiunilor administrative din punctul 13 cu `SessionService.revokeAll`; aceasta nu blochează autentificarea, dar trebuie verificată din nou la implementarea Admin Panel. Validări efectuate: `flutter analyze`, testele `AuthController` (4/4), `npm run build` și testele `TotpService` (3/3).

## 2. Sistem de chat — global, prieteni și privat, cu protecție bazată pe activitate

| Criteriu | Stare | Dovezi / lucru rămas |
|---|---:|---|
| Chat global efemer | Implementat | Lobby global live în aplicația mobilă; mesajele și istoricul de 24h sunt păstrate în Redis, nu în Postgres. Fluxul este livrat prin Socket.IO, cu raportare prin snapshot pentru mesaje efemere. |
| Chat prieteni persistent | Implementat | Conversații `FRIEND`, istoric paginat, filtrare și livrare live pe `chat:message`. |
| DM către necunoscuți | Implementat | T2+ și email verificat pentru inițiere; setările `everyone/friends_only/nobody`, inbox de cereri și acceptare explicită pentru primul mesaj. |
| Trepte de încredere T0–T8 | Implementat | Pragurile 0/10/50/200/1.000/5.000/15.000/50.000/100.000 sunt server-side; clientul afișează progresul primit de la API. Minorii rămân pe reacții în chat global indiferent de progres. |
| Rate limiting și anti-spam | Implementat | Limitare Redis în global/match, throttling REST pentru mesaje/rapoarte, filtru de limbaj, mascarea profanității, detectare de repetiții și mute automat temporar. |
| Raportare și moderare | Implementat pentru raportare | Rapoartele persistă cu prioritate crescută pentru DM/prieteni; mesajele globale folosesc snapshot. Review-ul administrativ complet este verificat în punctul 13. |
| Shadow-ban global | Implementat infrastructural | Coloana de expirare, istoric privat Redis pentru autor și gateway care nu livrează mesajele sancționate public; test realtime dedicat. Activarea de către moderator este punct de integrare pentru Admin Panel. |
| Blocare universală | Implementat | Blocarea rupe prietenia, ascunde conversațiile și oprește comunicarea în ambele sensuri, inclusiv la livrarea realtime. |
| Prietenii și prezență | Implementat | Cerere/acceptare/refuz/blocare, prezență pentru prieteni și listă în hub-ul mobil game-style. |
| Sugestii de prietenie | Implementat | Jucători întâlniți în partide recente, fără relații/blocări existente și numai cu consimțământ bilateral opt-in; UI mobil pentru preferință și trimiterea cererii. |

**Verdict curent:** punctul 2 este satisfăcut pentru infrastructura de chat și experiența mobilă livrate. Sharding-ul global pe limbă/regiune și panoul de moderare sunt extensii planificate pentru scalare, respectiv punctul 13; fluxul curent păstrează camera globală unică și toate regulile de securitate sunt deja aplicate server-side. Validări efectuate: `npm run build` pentru API și realtime, testele `ChatService` (5/5), `flutter analyze` și testele mobile relevante (36/36).
