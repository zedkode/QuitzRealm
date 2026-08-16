/// Originile browser acceptate la handshake-ul Socket.IO (panoul web).
/// `WEB_APP_ORIGINS` e o listă separată prin virgulă. Fără variabilă păstrăm
/// `false` — exact comportamentul de dinainte de panoul web: aplicația mobilă
/// nu trimite `Origin`, deci nu e afectată.
export function socketCorsOrigin(): string[] | false {
  const origins = (process.env.WEB_APP_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return origins.length > 0 ? origins : false;
}
