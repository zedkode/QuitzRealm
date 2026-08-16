/// Cum se împacă preferințele de categorii ale mai multor jucători.
///
/// Funcție pură, ca regula să poată fi verificată fără Redis și fără socket —
/// e o decizie de joc, nu un detaliu de transport.

/// Categoriile pe care le acceptă **toți** participanții.
///
/// Reguli, în ordine:
/// 1. Cine n-a ales nimic acceptă orice, deci nu restrânge pe nimeni.
/// 2. Între cei care au ales, se ia **intersecția**, nu reuniunea: dacă unul a
///    bifat doar „Istorie”, n-are de ce să primească întrebări de sport.
/// 3. Dacă intersecția e goală, partida merge pe toate categoriile. Altfel doi
///    jucători cu preferințe disjuncte ar ajunge într-un meci fără întrebări —
///    mai rău decât un meci cu categorii pe care nu le-au cerut.
///
/// Lista goală înseamnă „toate categoriile”.
export function agreeOnCategories(
  selections: readonly (readonly string[])[],
): string[] {
  const withPreference = selections.filter(
    (selection) => selection.length > 0,
  );
  if (withPreference.length === 0) return [];

  let agreed = new Set(withPreference[0]);
  for (const selection of withPreference.slice(1)) {
    const other = new Set(selection);
    agreed = new Set([...agreed].filter((code) => other.has(code)));
  }
  // Ordonat, ca aceeași selecție să producă mereu aceeași listă — util la
  // depanare și la compararea stărilor de partidă.
  return [...agreed].sort();
}
