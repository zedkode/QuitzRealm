import 'package:flutter/material.dart';

import '../../core/design/gold_frame.dart';
import '../../core/design/quizrealm_tokens.dart';
import '../../data/pack/owner_question_pack_catalog.dart';
import '../../domain/training/category_progress.dart';
import '../../l10n/app_localizations.dart';
import '../training/category_presentation.dart';

/// Grila celor 20 de categorii, cu bifare multiplă.
///
/// Aceeași grilă servește antrenamentul și pregătirea unui meci: dacă fiecare
/// ecran ar avea versiunea lui, cele două s-ar despărți vizual la prima
/// modificare, iar jucătorul ar învăța de două ori același lucru.
class CategoryPickerGrid extends StatelessWidget {
  const CategoryPickerGrid({
    required this.selected,
    required this.onToggle,
    required this.l10n,
    super.key,
    this.progress,
    this.crossAxisCount = 3,
  });

  /// Codurile bifate. **Gol înseamnă „toate"**, la fel ca pe server.
  final Set<String> selected;
  final ValueChanged<String> onToggle;
  final AppLocalizations l10n;

  /// Progresul pe categorii, când ecranul vrea să-l arate. Într-un meci nu are
  /// ce căuta: măiestria e o chestiune de antrenament, nu un criteriu de duel.
  final CategoryProgress? progress;
  final int crossAxisCount;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: ownerQuestionPacks.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: QuizRealmSpacing.sm,
        crossAxisSpacing: QuizRealmSpacing.sm,
        // Cartonașul are iconiță, nume și, opțional, bara de măiestrie; sub 0.8
        // se înghesuie, peste 0.95 rămâne gol.
        childAspectRatio: progress == null ? 0.94 : 0.86,
      ),
      itemBuilder: (context, index) {
        final definition = ownerQuestionPacks[index];
        return CategoryTile(
          code: definition.code,
          selected: selected.contains(definition.code),
          allSelected: selected.isEmpty,
          stat: progress?.statFor(definition.code),
          onTap: () => onToggle(definition.code),
          l10n: l10n,
        );
      },
    );
  }
}

/// Cartonașul unei categorii.
class CategoryTile extends StatelessWidget {
  const CategoryTile({
    required this.code,
    required this.selected,
    required this.allSelected,
    required this.onTap,
    required this.l10n,
    super.key,
    this.stat,
  });

  final String code;
  final bool selected;

  /// Când nimic nu e bifat, runda le ia pe toate — deci toate arată active.
  final bool allSelected;
  final CategoryStat? stat;
  final VoidCallback onTap;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final active = selected || allSelected;
    final label = CategoryPresentation.label(l10n, code);
    final mastery = stat;

    return Semantics(
      button: true,
      selected: selected,
      label: mastery == null
          ? label
          : '$label. ${CategoryPresentation.masteryLabel(l10n, mastery.tier)}',
      child: ExcludeSemantics(
        child: GoldFrame(
          key: Key('category-tile-$code'),
          onTap: onTap,
          corners: false,
          padding: const EdgeInsets.all(QuizRealmSpacing.sm),
          fill: active
              ? QuizRealmColors.surfaceSelected
              : QuizRealmColors.surfacePanel,
          borderWidth: selected
              ? QuizRealmBorders.emphasis
              : QuizRealmBorders.hairline,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Expanded(
                child: AnimatedOpacity(
                  duration: QuizRealmDurations.state,
                  opacity: active ? 1 : 0.45,
                  child: Image.asset(
                    CategoryPresentation.iconAsset(code),
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  label,
                  maxLines: 1,
                  style: QuizRealmTypography.bodySecondary.copyWith(
                    fontSize: 11,
                    color: active
                        ? QuizRealmColors.textPrimary
                        : QuizRealmColors.textMuted,
                  ),
                ),
              ),
              if (mastery != null) ...[
                const SizedBox(height: 3),
                // Bara de măiestrie nu blochează nimic; arată doar cât ai adunat.
                ClipRRect(
                  borderRadius: BorderRadius.circular(QuizRealmRadius.sm),
                  child: LinearProgressIndicator(
                    value: mastery.tierProgress,
                    minHeight: 4,
                    backgroundColor: QuizRealmColors.backgroundDeep,
                    valueColor: AlwaysStoppedAnimation(_tierColor(mastery.tier)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  static Color _tierColor(MasteryTier tier) => switch (tier) {
    MasteryTier.none => QuizRealmColors.textMuted,
    MasteryTier.bronze => const Color(0xFFB87333),
    MasteryTier.silver => const Color(0xFFC0C8D4),
    MasteryTier.gold => QuizRealmColors.goldBright,
  };
}
