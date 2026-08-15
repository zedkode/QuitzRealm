/**
 * Partener de antrenament pentru duelurile locale.
 *
 * Conectează un al doilea jucător real la serviciul de realtime, ca duelul
 * 1v1 să poată fi testat de pe un singur dispozitiv. NU este botul de joc din
 * `plan.md` Faza 2 — este doar o unealtă de dezvoltare, fără dificultăți
 * configurabile și fără integrare în matchmaking-ul de producție.
 *
 * Rulare:
 *   node scripts/sparring-partner.js --email=straja@quizrealm.test --password=...
 *
 * Opțiuni:
 *   --delay=1200       întârzierea răspunsului, în ms (implicit 1500)
 *   --api, --realtime  adresele serviciilor (implicit localhost:3000 / 3001)
 *
 * Partenerul alege la întâmplare: la fel ca orice client, nu primește
 * niciodată răspunsul corect înainte de a răspunde. O „acuratețe” reglabilă ar
 * cere exact informația pe care serverul o ascunde intenționat.
 */
const { io } = require('socket.io-client');

function arg(name, fallback) {
  const match = process.argv.find((value) => value.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : fallback;
}

const apiUrl = arg('api', 'http://localhost:3000');
const realtimeUrl = arg('realtime', 'http://localhost:3001');
const email = arg('email');
const password = arg('password');
const delayMs = Number(arg('delay', '1500'));

if (!email || !password) {
  console.error('Lipsesc --email și --password.');
  process.exit(1);
}

async function login() {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.accessToken) {
    throw new Error(
      `Autentificare eșuată (${response.status}): ${JSON.stringify(payload)}`,
    );
  }
  return payload.accessToken;
}

function chooseAnswer(question) {
  if (question.type === 'NUMERIC') {
    // Fără răspunsul corect, partenerul estimează. Serverul decide oricum.
    return String(Math.floor(Math.random() * 100));
  }
  const options = question.options ?? [];
  if (options.length === 0) return '0';
  return options[Math.floor(Math.random() * options.length)];
}

async function main() {
  const token = await login();
  const socket = io(`${realtimeUrl}/game`, {
    transports: ['websocket'],
    auth: { token },
  });

  socket.on('session:ready', (payload) => {
    console.log(`Partener conectat (${payload.userId}). Intru în coadă…`);
    socket.emit('matchmaking:join', { mode: 'duo' });
  });

  socket.on('match:found', (payload) => {
    console.log(`Meci găsit: ${payload.matchId} (${payload.totalRounds} runde)`);
  });

  socket.on('round:started', (round) => {
    const answer = chooseAnswer(round.question);
    setTimeout(() => {
      socket.emit('round:answer', { matchId: round.matchId, answer });
      console.log(`Runda ${round.roundNumber}: am răspuns „${answer}”.`);
    }, delayMs);
  });

  socket.on('round:result', (result) => {
    console.log(
      `Runda ${result.roundNumber}/${result.totalRounds} — corect: ${result.correctAnswer}`,
    );
  });

  socket.on('match:finished', (payload) => {
    console.log('Partidă încheiată:', JSON.stringify(payload.players));
    console.log('Reintru în coadă pentru un nou duel…');
    socket.emit('matchmaking:join', { mode: 'duo' });
  });

  socket.on('server:error', (error) => console.error('Eroare:', error.message));
  socket.on('match:error', (error) => console.error('Eroare:', error.message));
  socket.on('disconnect', () => console.log('Deconectat.'));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
