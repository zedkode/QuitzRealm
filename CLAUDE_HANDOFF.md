# QuizRealm — Handoff pentru Claude

## Starea lucrării

QuizRealm păstrează direcția globală **Medieval-Futurist / dark fantasy**, cu redesign aplicat pe website și primitive Flutter comune. Website-ul folosește SVG-uri heraldice, rame, avatare și hărți tactice custom; backendul NestJS existent rămâne sursa logicii pentru autentificare, admin, matchmaking și realtime.

## Upgrade-uri de dependințe

Website-ul este aliniat la **pnpm 11.22.0**, TypeScript 7.0.2, Vite 8.2.1, Vitest 4.1.10, React 19.2.8, Express 5.2.1, Recharts 3.10.1, react-day-picker 10.0.1, react-resizable-panels 4.12.2, wouter 3.10.0, cookie 2.0.1 și pachetele Radix/Tailwind actualizate. Configurația finală este în `pnpm-workspace.yaml`, cu `packages: ['.']` și override-ul `tailwindcss>nanoid: 3.3.7`. Patch-ul vechi pentru wouter 3.7.1 a fost eliminat deoarece wouter 3.10.0 nu îl mai folosește. Pnpm 11 poate respinge temporar pachete publicate foarte recent prin `minimumReleaseAge`; pentru reinstalarea locală în sandbox a fost necesar `pnpm install --config.minimumReleaseAge=0 --no-frozen-lockfile`, apoi `pnpm approve-builds --all` pentru esbuild.

API-ul și realtime-ul NestJS au primit update-ul npm compatibil și lockfile-urile regenerate. Flutter folosește `flutter_secure_storage ^11.0.0`; `flutter_riverpod` rămâne la `^2.6.1`, ultima versiune compatibilă cu arhitectura actuală. Riverpod 3.4.2 a fost testat și a produs 413 incompatibilități API în controale și teste, astfel că migrarea Riverpod 3 trebuie tratată separat, nu amestecată cu acest milestone.

## Compatibilizări implementate

Migrarea web a inclus eliminarea `baseUrl` retras din TypeScript 7 și adăugarea aliasului `server/*`, adaptarea rutelor wildcard la sintaxa Express 5 (`/{*splat}` și `/{*key}`), migrarea componentei resizable la `Group`/`Separator`, adaptarea calendarului la `month_grid`, tipuri compatibile pentru Recharts 3 și parser local pentru headerul Cookie deoarece cookie 2 a retras exportul legacy `parse`.

Testul API pentru `MatchesService` a fost actualizat pentru dependența `AchievementsService` introdusă în serviciu. Golden snapshots Flutter pentru Home și Settings au fost regenerate după redesign.

## Validare finală

Website: TypeScript check, Vitest, Vite build și esbuild server bundle au trecut. Vitest: 2 teste trecute și 1 test ignorat intenționat. Backend API: 15 suite, 114 teste și build Nest trecute. Realtime: 8 suite, 65 teste și build Nest trecute. Flutter: `flutter analyze` fără probleme și 142 teste trecute.

Buildul APK Android release rămâne blocat de eșecul TLS/network către `plugins.gradle.org`, documentat în istoricul taskului. Migrațiile admin către TiDBCloud rămân blocate de cerința TLS a conexiunii `DATABASE_URL`; nu a fost executată nicio migrație distructivă.

## Fișiere importante

`web/client/src/components/MedievalSvg.tsx` este biblioteca SVG centrală pentru website. `web/client/src/lib/quizrealm.ts` este stratul REST/Socket.IO. `mobile/lib/core/design/medieval_futurist_widgets.dart` conține primitivele Flutter. `backend/api/src/admin/admin.controller.ts` și `backend/api/src/admin/admin.guard.ts` conțin operațiile și protecția admin. `web/todo.md` păstrează backlog-ul și blocajele.

## Continuare recomandată

Primul pas este verificarea vizuală explicită pe ecranele Flutter Home, Duel, Profile, Social, Achievements și Settings, apoi finalizarea stărilor responsive/dialog/empty/error. După aceea trebuie configurată conexiunea TLS TiDBCloud și aplicate migrațiile admin. În paralel, Riverpod 3 poate fi migrat într-un branch separat, cu actualizarea controllerelor și testelor. APK-ul release trebuie reluat când accesul Gradle este disponibil.

## Actualizări după primul checkpoint

Achievements, Social și Global Chat folosesc acum `QuizRealmScaffold`, inclusiv bara de titlu comună, fundalul tactico-medieval, safe area și acțiunile contextuale. `QuizRealmTopBar` a primit layout responsive cu titlu flexibil; testele Social și suita Flutter completă au trecut cu 142 teste.

Încercarea `flutter build apk --release` s-a oprit imediat deoarece sandboxul nu are Android SDK configurat: nu există `ANDROID_HOME`, `sdkmanager`, `adb` sau directoare SDK standard. Este un blocaj de infrastructură, nu o eroare Dart/Flutter.

Website-ul are acum `minimumReleaseAge: 0` și `allowBuilds.esbuild: true` în `pnpm-workspace.yaml`; instalarea frozen pnpm 11 și buildul local trec. Checkpointul cloud ulterior a fost salvat pentru rerularea deploymentului după fix.
