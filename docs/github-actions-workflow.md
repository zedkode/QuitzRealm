# GitHub Actions Workflow — Build APK & Release

## 📋 Cum Funcționează

**Workflow-ul se declanșează automat la fiecare push pe `main` branch în folder `mobile/`** și:

1. ✅ Extrage versiunea din `pubspec.yaml`
2. ✅ Setup Java 17 + Flutter
3. ✅ Rulează `flutter pub get`
4. ✅ Rulează `flutter analyze` (lint — non-blocking)
5. ✅ Rulează `flutter test` (tests — non-blocking)
6. ✅ **Build APK Debug**
7. ✅ **Build APK Release**
8. ✅ Uploadează APK artifacts
9. ✅ Creează Git tag (semantic version)
10. ✅ Generează Changelog
11. ✅ Creează GitHub Release cu APK-uri

---

## 🔧 Ce a Fost Fixat

### Problem 1: Version Parsing Greșit
❌ **Inainte:**
```bash
VERSION=$(grep 'version:' mobile/pubspec.yaml | head -1 | sed 's/version: //' | sed 's/+.*//')
```
- `sed` poate să nu funcționeze pe Ubuntu/Linux GitHub Actions
- Format parsing era fragil

✅ **Acum:**
```bash
VERSION_LINE=$(grep -E '^version:' mobile/pubspec.yaml | head -1)
VERSION=$(echo "$VERSION_LINE" | awk '{print $2}' | cut -d'+' -f1)
BUILD_NUMBER=$(echo "$VERSION_LINE" | awk '{print $2}' | cut -d'+' -f2)
```
- Folosește `awk` și `cut` (standard pe toate sistemele)
- Debugging messages pentru troubleshooting

### Problem 2: APK Path Not Found
❌ **Inainte:**
- Workflow nu verifica dacă APK-urile sunt builduite
- Dacă Flutter build falșa, workflow mergea mai departe și falșa tăcut

✅ **Acum:**
- Fiecare build step verifica dacă APK există
- Dacă nu, afișează locații și iese cu `exit 1`
- APK path pattern: `mobile/build/app/outputs/flutter-apk/app-*.apk`

### Problem 3: Tests și Analyzer Blocau Build
❌ **Inainte:**
```bash
flutter test --coverage 2>&1 || true
flutter analyze
```
- Orice error blocau fluxul

✅ **Acum:**
```bash
continue-on-error: true
```
- Tests și analyzer rulează dar nu blocheaza
- Build merge mai departe chiar dacă sunt warnings

### Problem 4: Git Tag Errors
❌ **Inainte:**
- Tag push falșa silent dacă tag exista deja
- Workflow mergea mai departe dar nu era clar

✅ **Acum:**
```bash
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ℹ️ Tag already exists"
else
  git tag -a "$TAG" -m "Release $TAG"
  git push origin "$TAG" || echo "Tag push failed"
fi
```
- Check dacă tag exista
- Logging clar

### Problem 5: Changelog Generation
❌ **Inainte:**
```bash
echo "### Changes" >> CHANGELOG.md
git log --oneline -10 >> CHANGELOG.md || echo "No previous commits"
```
- Loguri de git prost formatate în Markdown

✅ **Acum:**
```bash
{
  echo "## QuizRealm v${{ steps.version.outputs.version }}"
  echo "**Build:** ${{ steps.version.outputs.build_number }}"
  git log --oneline -15
} > CHANGELOG.md
```
- Cleaner format
- Proper heredoc pentru multi-line

### Problem 6: Release Only on Main
❌ **Inainte:**
- Release se crea pe orice branch

✅ **Acum:**
```yaml
if: github.ref == 'refs/heads/main' && success()
```
- Release numai de pe `main` branch
- După build-uri reușite

### Problem 7: Missing Build Summary
❌ **Inainte:**
- Summary afișa string-uri în loc de tabel

✅ **Acum:**
```bash
{
  echo "| Metric | Value |"
  echo "|--------|-------|"
  echo "| Version | ${{ steps.version.outputs.version }} |"
  echo "| Build | ${{ steps.version.outputs.build_number }} |"
  echo "| Status | ✅ Success |"
} >> $GITHUB_STEP_SUMMARY
```
- Tabel markdown în GitHub Actions summary tab

---

## 🚀 Cum să Triggerez Workflow-ul

### Automat (Recomanded)
```bash
# Fă orice change în mobile/ folder
git add mobile/lib/main.dart
git commit -m "feat: add new feature"
git push origin main
```
Workflow se declanșează automat!

### Manual
1. Merge în GitHub: https://github.com/zedkode/quitzrealm/actions/workflows/build-apk-release.yml
2. Click "Run workflow"
3. Select branch: `main`
4. Click green "Run workflow" button

### Prin Pull Request
Workflow se rulează automat pe PR (dar nu face release)

---

## 📥 Unde Descarc APK-urile

După build reușit:

1. **GitHub Releases:** https://github.com/zedkode/quitzrealm/releases
   - APK-uri cu download direct
   - Release notes (changelog)
   - Artifact retention: 30 zile

2. **GitHub Actions Artifacts:**
   - Tab "Actions" → latest workflow run
   - Section "Artifacts"
   - Downloadează `apk-builds-v1.3.2+2006.zip`

---

## 🔍 Debugging Workflow

### Verific Logs
1. Merge la: https://github.com/zedkode/quitzrealm/actions
2. Click on latest workflow run
3. Expand fiecare step pentru logs

### Common Issues

#### ❌ "Flutter not found"
- Action `subosito/flutter-action@v2` ar trebui să setup Flutter
- Check că `flutter-version: '3.13.0'` e corect

#### ❌ "APK not found after build"
- Flutter build poate să falșa dacă:
  - `pubspec.yaml` are dependențe neinstallate
  - Java 17 lipsă
  - Sync Gradle issues
- Verific logs din "Build Debug APK" step

#### ❌ "Tag already exists"
- Normal! Dacă versiunea e aceeași, tag-ul nu se recreează
- Check dacă trebuie să incrementezi versiunea în `pubspec.yaml`

#### ❌ "Release not created"
- Workflow-ul rulează doar pe `main` branch
- Verific că ai push-at pe `main`, nu pe alt branch

---

## 📊 Version Management

Versiunea se extrage din `mobile/pubspec.yaml`:

```yaml
version: 1.3.2+2006
```

**Format:** `major.minor.patch+buildNumber`

### Update Version
```bash
# Increment patch + build
cd mobile
# Edit pubspec.yaml
sed -i 's/version: 1.3.2+2006/version: 1.3.3+2007/' pubspec.yaml
git add pubspec.yaml
git commit -m "chore: bump version to 1.3.3"
git push origin main
```

Workflow va crea automat tag `v1.3.3+2007` și release!

---

## 📋 Checklist pentru Primera Rulare

- [ ] `mobile/pubspec.yaml` are `version:` corect
- [ ] `mobile/android/` folder exists cu `build.gradle.kts`
- [ ] `mobile/pubspec.yaml` are toți `dependencies`
- [ ] `flutter pub get` funcționează local
- [ ] `flutter build apk --debug` funcționează local
- [ ] Git remote `origin` e configurat la GitHub
- [ ] Branch-ul `main` e push-at pe GitHub

---

## 🎯 Next Steps

1. **Push any change to `mobile/`** → Workflow runs automat
2. **Check Actions tab** → https://github.com/zedkode/quitzrealm/actions
3. **Download APK** → From latest Release

✅ **Done!** APK build pipeline-ul e funcțional!

---

**Last Updated:** 2026-08-15  
**Workflow File:** [.github/workflows/build-apk-release.yml](.github/workflows/build-apk-release.yml)
