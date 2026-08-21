/// Pachetul comun e consumat de două aplicații Vite, dar nu depinde el însuși
/// de Vite. Declarația minimă de aici îi dă tipul pentru variabilele de mediu
/// injectate la build, fără să tragă tot toolchain-ul ca dependință.
interface ImportMetaEnv {
  readonly VITE_QUIZREALM_API_URL?: string;
  readonly VITE_QUIZREALM_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
