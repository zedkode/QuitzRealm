# ADR 0001: Prisma pentru accesul la PostgreSQL

## Context

Bootstrap-ul cere alegerea între Prisma și TypeORM pentru API-ul NestJS. Schema
include relații între utilizatori, întrebări, partide, inventar și rapoarte, iar
schimbările de model trebuie să fie livrate exclusiv prin migrări versionate.

## Decizie

Folosim Prisma ORM 7 cu adaptorul oficial `@prisma/adapter-pg`. Schema Prisma este
sursa de adevăr pentru modelul relațional, iar Prisma Migrate generează și aplică
migrările PostgreSQL. Clientul compatibil CommonJS este generat în pachetul
`@prisma/client`, potrivit scaffold-ului NestJS, și nu se editează manual.

## Consecințe

- Interogările aplicației sunt tipizate strict și urmăresc schema versionată.
- Runtime-ul folosește driverul PostgreSQL standard prin adaptorul Prisma.
- Orice schimbare de schemă necesită o migrare nouă înainte de integrare.
- Generarea clientului devine un pas obligatoriu după instalarea dependențelor.
- Migrările aplicației trăiesc în `backend/api/prisma/migrations`; directorul
  `infra/migrations` rămâne rezervat migrărilor SQL care țin strict de infrastructură.
