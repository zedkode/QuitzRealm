# Project TODO

- [x] Audit backendul NestJS existent și contractele REST/Socket.IO reutilizabile pentru web
- [x] Definește design system global dark-fantasy: paletă aur/violet/negru, tipografie, particule, tranziții și stări responsive
- [ ] Construiește shell global cu navigație publică, cont, profil și acces admin condiționat de rol
- [ ] Construiește landing page cu CTA de autentificare/înregistrare și statistici live/near-real-time
- [ ] Integrează autentificarea web prin REST API existent: email/parolă, Google OAuth și TOTP/2FA
- [ ] Construiește lobby browser cu listă de moduri, matchmaking și stare Socket.IO
- [ ] Construiește experiența de meci Duo cu întrebări, timer, scor și hartă teritorială realtime
- [ ] Construiește experiența de meci Classic cu întrebări, timer, scor și hartă teritorială realtime
- [ ] Construiește experiența de meci Blitz cu ritm rapid, timer, scor și hartă teritorială realtime
- [ ] Adaugă stări de conectare, reconectare, eroare, abandon și finalizare meci
- [ ] Construiește profil public cu Prestige Score, achievements, badge-uri, showcase și statistici de joc
- [ ] Construiește leaderboard global ELO cu filtrare pe rank tier și leaderboard de prieteni
- [ ] Construiește Admin Dashboard cu active users, matches/day, achievements unlocked și pending reports
- [ ] Construiește Admin User Management cu listare, ban/unban, force password reset și revocare sesiuni
- [ ] Construiește Admin Chat Moderation cu rapoarte, rezolvare, mute și shadow-ban
- [ ] Construiește Admin Question Management cu review, approve/reject și statistici de catalog
- [ ] Gătește proceduri/admin gating fără a expune acțiuni de administrare utilizatorilor obișnuiți
- [x] Scrie teste Vitest pentru procedurile și componentele critice ale platformei (auth logout și health stats configuration)
- [x] Rulează check, build, test și verificare vizuală desktop/mobile (web desktop verificat; mobile preview rămâne de făcut)
- [ ] Integrează modificările web în repository-ul QuitzRealm și împinge versiunea validată pe branch-ul main

## Validation follow-up

- [ ] Leagă statisticile publice și admin de surse backend reale și elimină valorile hardcodate (landing public stats conectate; Admin Dashboard încă static)
- [ ] Înlocuiește Manus auth cu integrarea REST QuizRealm pentru email/parolă, Google OAuth și TOTP/2FA
- [ ] Adaugă client Socket.IO real pentru lobby, matchmaking, stare conexiune, reconectare, erori și final de meci
- [ ] Separă logic modurile Duo, Classic și Blitz pe date reale server-side
- [ ] Conectează profilul și leaderboard-ul la endpointuri QuizRealm reale, inclusiv leaderboard-ul de prieteni (global/profile conectate; friends view și payload mapping rămân de finalizat)
- [ ] Protejează efectiv ruta /admin și procedurile cu rol admin
- [ ] Implementează operațiile admin reale: user list, ban/unban, force password reset, revoke sessions, report resolution, mute, shadow-ban și question approve/reject

- [ ] Aplică migrația `20260816153000_admin_roles` pe clusterul TiDBCloud după configurarea transportului TLS; `prisma migrate deploy` a fost blocat de conexiunea insecure
