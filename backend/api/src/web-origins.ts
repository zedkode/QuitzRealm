/// Originile browser cărora li se permite să apeleze API-ul (panoul web).
/// `WEB_APP_ORIGINS` e o listă separată prin virgulă, ex.:
///   WEB_APP_ORIGINS=https://quizrealm.dohotstudio.com,http://localhost:5173
/// Lipsa variabilei înseamnă „niciun browser”, nu „oricine”.
export function webAppOrigins(): string[] {
  return (process.env.WEB_APP_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
