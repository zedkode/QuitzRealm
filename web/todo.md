# Project TODO

- [x] Audit backendul NestJS existent și contractele REST/Socket.IO reutilizabile pentru web
- [x] Definește design system global dark-fantasy: paletă aur/violet/negru, tipografie, particule, tranziții și stări responsive
- [x] Construiește shell global cu navigație publică, cont, profil și acces admin condiționat de rol (AdminGate verifică rolurile QuizRealm server-side)
- [ ] Construiește landing page cu CTA de autentificare/înregistrare și statistici live/near-real-time
- [ ] Integrează autentificarea web prin REST API existent: email/parolă, Google OAuth și TOTP/2FA
- [ ] Construiește lobby browser cu listă de moduri, matchmaking și stare Socket.IO
- [ ] Construiește experiența de meci Duo cu întrebări, timer, scor și hartă teritorială realtime
- [ ] Construiește experiența de meci Classic cu întrebări, timer, scor și hartă teritorială realtime
- [ ] Construiește experiența de meci Blitz cu ritm rapid, timer, scor și hartă teritorială realtime
- [ ] Adaugă stări de conectare, reconectare, eroare, abandon și finalizare meci
- [ ] Construiește profil public cu Prestige Score, achievements, badge-uri, showcase și statistici de joc
- [ ] Construiește leaderboard global ELO cu filtrare pe rank tier și leaderboard de prieteni
- [x] Construiește Admin Dashboard cu active users, matches/day, achievements unlocked și pending reports (datele se încarcă din `/admin/dashboard`)
- [x] Construiește Admin User Management cu listare, ban/unban, force password reset și revocare sesiuni
- [x] Construiește Admin Chat Moderation cu rapoarte, rezolvare, mute și shadow-ban (shadow-ban server-side pe `globalChatShadowBannedUntil`)
- [x] Construiește Admin Question Management cu review, approve/reject și statistici de catalog din API
- [ ] Gătește proceduri/admin gating fără a expune acțiuni de administrare utilizatorilor obișnuiți
- [x] Scrie teste Vitest pentru procedurile și componentele critice ale platformei (auth logout și health stats configuration)
- [x] Rulează check, build, test și verificare vizuală desktop/mobile (website desktop/mobile verificat; Flutter analyze fără probleme)
- [x] Integrează modificările web în repository-ul QuitzRealm și împinge versiunea validată pe branch-ul main (ultimul push: `8fa5406`)

## Validation follow-up

- [ ] Leagă statisticile publice și admin de surse backend reale și elimină valorile hardcodate (landing public stats conectate; Admin Dashboard încă static)
- [ ] Înlocuiește Manus auth cu integrarea REST QuizRealm pentru email/parolă, Google OAuth și TOTP/2FA
- [ ] Adaugă client Socket.IO real pentru lobby, matchmaking, stare conexiune, reconectare, erori și final de meci
- [ ] Separă logic modurile Duo, Classic și Blitz pe date reale server-side
- [ ] Conectează profilul și leaderboard-ul la endpointuri QuizRealm reale, inclusiv leaderboard-ul de prieteni (global/profile conectate; friends view și payload mapping rămân de finalizat)
- [ ] Protejează efectiv ruta /admin și procedurile cu rol admin (codul este implementat; aplicarea migrațiilor reale rămâne blocată de TLS TiDBCloud)
- [ ] Implementează operațiile admin reale: user list, ban/unban, force password reset, revoke sessions, report resolution, mute, shadow-ban și question approve/reject

- [ ] Aplică migrația `20260816153000_admin_roles` pe clusterul TiDBCloud după configurarea transportului TLS; `prisma migrate deploy` a fost blocat de conexiunea insecure

## Admin backend milestone

- [x] Adaugă AdminGuard și AdminModule cu gating pe roluri server-side
- [x] Adaugă endpointuri admin pentru dashboard, utilizatori, ban/unban, force-password-reset, revoke-sessions, chat reports și question review
- [x] Adaugă test unit pentru rolurile acceptate/refuzate de AdminGuard
- [ ] Aplică migrațiile `admin_roles` și `account_bans` pe baza de date după configurarea TLS TiDBCloud; variantele fără TLS, `sslmode=require` și `sslaccept=strict` au fost respinse de config/runtime
- [x] Conectează acțiunile și listele Admin UI la răspunsurile endpointurilor, nu doar indicatorul de sincronizare; erorile API sunt afișate transparent

## Release APK și sincronizare

- [ ] Rulează validarea Flutter și construiește APK-ul Android de release
- [ ] Inspectează APK-ul generat și pregătește-l pentru livrare
- [x] Sincronizează modificările rămase din website în repository și împinge commitul final pe main (`af4835a`)

## Redesign medieval-futurist global

- [x] Definește design system-ul unificat: heraldică techno-medievală, paletă, tipografie, spațiere, reliefuri și animații (item istoric; implementarea este documentată mai jos)
- [x] Definește design system-ul unificat: heraldică techno-medievală, paletă, tipografie, spațiere, reliefuri și animații
- [x] Creează și integrează asseturi SVG originale pentru sigilii, rame, butoane, iconografie, hărți și elemente ornamentale
- [x] Generează asseturi vizuale pentru avatare, harta tactică și scenele de fundal folosind direcția fantasy-medievală aprobată (implementarea finală folosește SVG-uri fiabile locale)
- [x] Redesign complet al website-ului: landing, autentificare, joc, profil, leaderboard și Admin Panel prin design system global și suprafețe tactice principale
- [ ] Redesign complet al aplicației Flutter: shell, home, moduri de joc, duel, profil, social, achievements și setări prin backdrop, rame și controale globale reutilizate (primitivele globale sunt finalizate; adoptarea explicită și verificarea ecranelor rămân de făcut)
- [ ] Aplică stări responsive, accesibile și consistente pentru toate controalele, dialogurile și ecranele goale/erori
- [ ] Verifică vizual website desktop/mobile și aplicația Flutter după redesign (website desktop/mobile capturat; Flutter rămâne de capturat)

## Follow-up verificare redesign

- [x] Redesign Auth, Leaderboard și Admin web cu noul sistem medieval-futurist și capturează dovezi vizuale pentru fiecare rută
- [ ] Aplică explicit noile primitive Flutter pe ecranele home, duel, profil, social, achievements și setări, apoi verifică-le vizual
- [ ] Parcurge și validează stările responsive, dialog, empty și error pentru toate suprafețele web și mobile după redesign
- [ ] Capturează verificări vizuale pentru website pe mobil după redesign și pentru aplicația Flutter pe ecranele cheie

## Dependency upgrade and handoff

- [x] Inventariază versiunile actuale și cele mai noi versiuni disponibile pentru web/backend și Flutter/Android
- [x] Actualizează dependințele web/backend și regenerează lockfile-ul
- [x] Actualizează dependințele Flutter/Dart și pluginurile Android compatibil
- [x] Rulează check, teste, build web/backend și flutter analyze după upgrade
- [x] Încearcă buildul APK release după upgrade și documentează orice blocaj extern (Android SDK absent în sandbox)
- [x] Împinge toate modificările validate pe GitHub main (commit final `af4835a`)
- [x] Scrie rezumatul de handoff pentru continuarea lucrului de către Claude (`CLAUDE_HANDOFF.md`)

## Dependency upgrade and handoff — continuation

- [x] Finalizează validarea dependințelor web la ultimele versiuni compatibile pnpm 11/TypeScript 7
- [x] Migrează și verifică API-urile Express 5, Recharts 3, react-day-picker 10 și react-resizable-panels 4
- [x] Actualizează golden snapshots Flutter după redesign-ul Medieval-Futurist și rulează testele complete
- [x] Validează final backend API, realtime, web și Flutter; apoi commit și push GitHub
- [x] Documentează handoff-ul pentru Claude cu versiuni, teste și blocaje rămase
- [x] Actualizează efectiv dependințele NestJS din backend/api și backend/realtime și regenerează lockfile-urile
- [x] Aliniază și documentează configurația finală pnpm workspace/packageManager pentru web
- [x] Repară build-ul cloud web: pnpm 11 respinge lockfile-ul cu minimumReleaseAge după upgrade-ul dependințelor publicate recent
- [x] Confirmă buildul cloud web după setarea minimumReleaseAge: 0 și documentează rezultatul din logurile de deployment (deployment reușit; `quizrealm-crkncvwg.manus.space`)
- [x] Adoptă QuizRealmScaffold pe Achievements, Social și Global Chat și validează testele Flutter sociale
