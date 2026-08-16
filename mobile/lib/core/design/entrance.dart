import 'dart:async';

import 'package:flutter/material.dart';

import 'quizrealm_tokens.dart';

/// Intrarea în scenă a unui panou: apare urcând ușor, nu clipind pe loc.
///
/// Întârzierea per element face diferența dintre „ecranul s-a desenat" și
/// „ecranul se construiește în fața ta". E singurul motiv pentru care există:
/// fără decalaj, tot ecranul ar apărea deodată și efectul s-ar pierde.
class EntranceFade extends StatefulWidget {
  const EntranceFade({
    required this.child,
    super.key,
    this.delay = Duration.zero,
    this.offset = 18,
  });

  final Widget child;
  final Duration delay;

  /// Cu cât urcă elementul în timp ce apare, în dp.
  final double offset;

  @override
  State<EntranceFade> createState() => _EntranceFadeState();
}

class _EntranceFadeState extends State<EntranceFade>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: QuizRealmDurations.enter,
  );

  late final Animation<double> _curve = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeOutCubic,
  );

  /// Ținut ca să poată fi anulat: un `Future.delayed` necontrolat supraviețuiește
  /// widget-ului, iar la ieșirea rapidă dintr-un ecran rămân zeci de temporizatoare
  /// care se trezesc pe un arbore deja distrus.
  Timer? _startTimer;

  @override
  void initState() {
    super.initState();
    if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      _startTimer = Timer(widget.delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _startTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curve,
      builder: (context, child) {
        return Opacity(
          opacity: _curve.value,
          child: Transform.translate(
            offset: Offset(0, (1 - _curve.value) * widget.offset),
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}

/// Așază o listă de elemente cu intrări decalate.
///
/// Decalajul e mic intenționat: peste ~70 ms per element, un ecran cu șase
/// panouri ar face jucătorul să aștepte o jumătate de secundă ca să vadă tot.
List<Widget> staggered(
  List<Widget> children, {
  Duration step = const Duration(milliseconds: 55),
  Duration start = Duration.zero,
}) {
  return [
    for (var index = 0; index < children.length; index++)
      EntranceFade(
        delay: start + step * index,
        child: children[index],
      ),
  ];
}

/// Pulsul lent al unui element care cere atenție (butonul principal, o
/// recompensă disponibilă).
class PulseGlow extends StatefulWidget {
  const PulseGlow({
    required this.child,
    super.key,
    this.color = QuizRealmColors.electric,
    this.enabled = true,
    this.radius = 22,
  });

  final Widget child;
  final Color color;
  final bool enabled;
  final double radius;

  @override
  State<PulseGlow> createState() => _PulseGlowState();
}

class _PulseGlowState extends State<PulseGlow>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1900),
  );

  @override
  void initState() {
    super.initState();
    if (widget.enabled) _controller.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(PulseGlow old) {
    super.didUpdateWidget(old);
    if (widget.enabled && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.enabled && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = Curves.easeInOut.transform(_controller.value);
        return DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(QuizRealmRadius.md),
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.16 + 0.20 * t),
                blurRadius: widget.radius * (0.7 + 0.5 * t),
                spreadRadius: 1 + 2 * t,
              ),
            ],
          ),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// Scutură scurt un element — folosit la răspuns greșit.
class ShakeOnChange extends StatefulWidget {
  const ShakeOnChange({
    required this.child,
    required this.trigger,
    super.key,
  });

  final Widget child;

  /// Orice schimbare a valorii pornește scuturarea.
  final Object? trigger;

  @override
  State<ShakeOnChange> createState() => _ShakeOnChangeState();
}

class _ShakeOnChangeState extends State<ShakeOnChange>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 420),
  );

  @override
  void didUpdateWidget(ShakeOnChange old) {
    super.didUpdateWidget(old);
    if (old.trigger != widget.trigger && widget.trigger != null) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        if (!_controller.isAnimating) return child!;
        // Amplitudine care se stinge: patru oscilații, tot mai mici.
        final decay = 1 - _controller.value;
        final shift =
            (_controller.value * 4 * 3.14159).remainder(6.28318) - 3.14159;
        return Transform.translate(
          offset: Offset(shift.sign * decay * 7, 0),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}
