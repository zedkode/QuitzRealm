import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/entrance.dart';
import '../../core/design/game_buttons.dart';
import '../../core/design/game_controls.dart';
import '../../core/design/gold_frame.dart';
import '../../core/design/quizrealm_bottom_navigation.dart';
import '../../core/design/quizrealm_scaffold.dart';
import '../../core/design/quizrealm_tokens.dart';
import '../../data/pack/owner_question_pack_catalog.dart';
import '../categories/category_picker_grid.dart';
import '../../l10n/app_localizations.dart';
import '../title/widgets/home_navigation.dart';
import 'training_controller.dart';

/// Alegerea categoriilor pentru o rundă de antrenament.
///
/// Toate cele 20 de categorii sunt jucabile de la început. Nu se deblochează
/// una prin alta: `owner-plan.md` §7.3 interzice progresul secvențial prin
/// conținut, iar un mod de antrenament închis ar contrazice și scopul lui din
/// `plan.md` §6 — onboarding și testarea băncii de întrebări.
class TrainingSetupScreen extends ConsumerStatefulWidget {
  const TrainingSetupScreen({super.key});

  @override
  ConsumerState<TrainingSetupScreen> createState() =>
      _TrainingSetupScreenState();
}

class _TrainingSetupScreenState extends ConsumerState<TrainingSetupScreen> {
  TrainingLength _length = TrainingLength.medium;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final selection = ref.watch(categorySelectionProvider);
    final controller = ref.read(categorySelectionProvider.notifier);
    final progress = ref.watch(categoryProgressProvider);

    return QuizRealmScaffold(
      backdropAsset: 'assets/game/realm_map_v2.png',
      backdropOpacity: 0.24,
      backdropAccent: QuizRealmColors.electric,
      title: l10n.trainingTitle,
      onBack: () => context.canPop() ? context.pop() : context.go('/'),
      bottomNavigation: HomeNavigation(
        current: QuizRealmTab.campaign,
        l10n: l10n,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: staggered([
          Text(
            l10n.trainingSubtitle,
            textAlign: TextAlign.center,
            style: QuizRealmTypography.bodySecondary,
          ),
          const DiamondDivider(),
          _LengthPicker(
            length: _length,
            onChanged: (value) => setState(() => _length = value),
            l10n: l10n,
          ),
          const SizedBox(height: QuizRealmSpacing.panelGap),
          Row(
            children: [
              Expanded(
                child: SecondaryGameButton(
                  key: const Key('training-select-all'),
                  label: l10n.trainingSelectAll,
                  onPressed: selection.isEmpty ? null : controller.selectAll,
                ),
              ),
            ],
          ),
          const SizedBox(height: QuizRealmSpacing.sm),
          Text(
            selection.isEmpty
                ? l10n.trainingAllSelected(ownerQuestionPacks.length)
                : l10n.trainingSelectedCount(selection.length),
            textAlign: TextAlign.center,
            style: QuizRealmTypography.bodySecondary.copyWith(
              color: QuizRealmColors.textAccent,
            ),
          ),
          const SizedBox(height: QuizRealmSpacing.md),
          CategoryPickerGrid(
            selected: selection,
            onToggle: controller.toggle,
            progress: progress,
            l10n: l10n,
          ),
          const SizedBox(height: QuizRealmSpacing.lg),
          PrimaryGameButton(
            key: const Key('training-start'),
            label: l10n.trainingStart,
            emphasized: true,
            onPressed: () {
              final codes = controller.effective.toList()..sort();
              context.push(
                '/antrenament/runda?c=${codes.join(',')}'
                '&n=${_length.questionCount}',
              );
            },
          ),
        ]),
      ),
    );
  }
}

class _LengthPicker extends StatelessWidget {
  const _LengthPicker({
    required this.length,
    required this.onChanged,
    required this.l10n,
  });

  final TrainingLength length;
  final ValueChanged<TrainingLength> onChanged;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      title: l10n.trainingLength,
      child: Center(
        child: GameTabBar<TrainingLength>(
          selected: length,
          onSelect: onChanged,
          options: [
            GameTabOption(
              value: TrainingLength.short,
              label: '${l10n.trainingLengthShort} · '
                  '${TrainingLength.short.questionCount}',
            ),
            GameTabOption(
              value: TrainingLength.medium,
              label: '${l10n.trainingLengthMedium} · '
                  '${TrainingLength.medium.questionCount}',
            ),
            GameTabOption(
              value: TrainingLength.long,
              label: '${l10n.trainingLengthLong} · '
                  '${TrainingLength.long.questionCount}',
            ),
          ],
        ),
      ),
    );
  }
}
