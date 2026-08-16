# ADR 0009 — Adoptarea `owner-plan.md` și remedierea diferențelor existente

**Status:** Acceptat pentru continuarea Fazei 2  
**Data:** 2026-08-15  
**Sursă:** `owner-plan.md` §7, §12 și §16

## Context

`owner-plan.md` a fost adăugat după implementarea campaniei offline și a motorului
Duo. Starea existentă are două diferențe față de documentul proprietarului:

- motorul realtime folosește tipuri și cozi hardcodate `DUO`, în timp ce §12 cere
  un model generic `N=2..8` încă din Faza 2;
- aplicația are o campanie solo secvențială aprobată anterior prin ADR 0004, iar
  §7 spune că progresia nouă trebuie să fie multiplayer/account-level, nu o nouă
  campanie pe niveluri.

Ștergerea campaniei ar elimina conținut funcțional cerut explicit anterior, iar
construirea camerelor private peste motorul Duo ar adânci datoria tehnică.

## Decizie

1. `owner-plan.md` devine referința pentru orice dezvoltare nouă; `plan.md` și
   `init.md` îl indică fără a-i duplica specificația.
2. Campania offline existentă se păstrează până la o decizie explicită a
   proprietarului, dar nu este extinsă. Progresia nouă folosește termenul „nivel
   de cont/online”.
3. Înainte de partide private și boți, motorul de meci va primi o configurație
   generică pentru 2–8 participanți, păstrând modul Duo ca profil compatibil.
4. Diferențele rămase din Faza 2 sunt vizibile în `passed.md`; nu sunt declarate
   implicit rezolvate de chatul de meci.

## Consecințe

- Nu se schimbă stack-ul și nu se rescrie acum gameplay-ul funcțional.
- Următorul task este o refactorizare verificabilă a contractului de meci, nu
  implementarea directă a unei camere private Duo-only.
- Migrarea trebuie să păstreze compatibilitatea clientului actual și validarea
  exclusiv server-side a scorului și răspunsurilor.
