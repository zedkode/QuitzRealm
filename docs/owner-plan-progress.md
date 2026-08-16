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
