import {
  BIO_MAX_LENGTH,
  canChangeRegion,
  canPublishLinks,
  checkBio,
  checkLink,
  checkStatusEmoji,
  checkStatusText,
  isAllowedLinkHost,
  isSupportedCountry,
  regionChangeAvailableAt,
} from './profile-content';

describe('checkBio', () => {
  it('acceptă un text obișnuit', () => {
    expect(checkBio('Joc de trei ani. Istorie și geografie.').ok).toBe(true);
  });

  it('acceptă exact limita și respinge un caracter peste', () => {
    expect(checkBio('a'.repeat(BIO_MAX_LENGTH)).ok).toBe(true);
    expect(checkBio('a'.repeat(BIO_MAX_LENGTH + 1))).toEqual({
      ok: false,
      reason: 'too_long',
    });
  });

  it('respinge profanitatea în loc s-o mascheze', () => {
    // Spre deosebire de chat: o biografie mascată n-are destinatar care s-o
    // citească, iar autorul e singurul care o poate repara.
    expect(checkBio('sunt un idiot')).toEqual({
      ok: false,
      reason: 'profanity',
    });
  });

  it('respinge linkurile scrise în text', () => {
    // Altfel ar ocoli verificarea de domeniu din câmpul de linkuri.
    expect(checkBio('vezi https://exemplu-necunoscut.tk/oferta')).toEqual({
      ok: false,
      reason: 'contains_link',
    });
    expect(checkBio('scrie-mi pe exemplu.xyz')).toEqual({
      ok: false,
      reason: 'contains_link',
    });
  });

  it('acceptă un text gol — a-ți șterge biografia e o acțiune validă', () => {
    expect(checkBio('').ok).toBe(true);
  });
});

describe('checkStatusText', () => {
  it('acceptă un status scurt', () => {
    expect(checkStatusText('Antrenez pentru sezonul nou').ok).toBe(true);
  });

  it('respinge un status prea lung', () => {
    expect(checkStatusText('x'.repeat(81)).reason).toBe('too_long');
  });
});

describe('checkStatusEmoji', () => {
  it('acceptă un emoji', () => {
    expect(checkStatusEmoji('🔥').ok).toBe(true);
  });

  it('acceptă un emoji compus din mai multe puncte de cod', () => {
    // Steagurile și emoji-urile cu modificatori depășesc un singur caracter;
    // o verificare pe lungime de 1 le-ar respinge pe toate.
    expect(checkStatusEmoji('👨‍💻').ok).toBe(true);
  });

  it('respinge text strecurat în locul emoji-ului', () => {
    expect(checkStatusEmoji('hai')).toEqual({
      ok: false,
      reason: 'invalid_emoji',
    });
    expect(checkStatusEmoji('🔥 acum')).toEqual({
      ok: false,
      reason: 'invalid_emoji',
    });
  });
});

describe('checkLink', () => {
  it('acceptă un profil de pe o platformă cunoscută', () => {
    const result = checkLink('YouTube', 'https://www.youtube.com/@cineva');
    expect(result.ok).toBe(true);
    expect(result.host).toBe('youtube.com');
  });

  it('acceptă un subdomeniu al unei gazde permise', () => {
    expect(checkLink('Steam', 'https://steamcommunity.com/id/x').ok).toBe(true);
  });

  it('respinge http simplu', () => {
    expect(checkLink('Site', 'http://youtube.com/x').reason).toBe(
      'insecure_scheme',
    );
  });

  it('respinge schemele care nu sunt adrese web', () => {
    expect(checkLink('X', 'javascript:alert(1)').reason).toBe(
      'insecure_scheme',
    );
    expect(checkLink('X', 'data:text/html,<b>x</b>').reason).toBe(
      'insecure_scheme',
    );
  });

  it('respinge credențialele din URL chiar pe o gazdă permisă', () => {
    // `https://youtube.com@atacator.example` arată ca YouTube pentru un ochi
    // grăbit, dar duce în altă parte.
    expect(
      checkLink('YouTube', 'https://youtube.com:x@atacator.example/').reason,
    ).toBe('has_credentials');
  });

  it('respinge o gazdă care doar conține numele unei platforme permise', () => {
    expect(checkLink('X', 'https://youtube.com.atacator.example/').reason).toBe(
      'host_not_allowed',
    );
    expect(checkLink('X', 'https://notyoutube.com/').reason).toBe(
      'host_not_allowed',
    );
  });

  it('respinge un domeniu necunoscut', () => {
    expect(checkLink('Blog', 'https://blogul-meu.example/').reason).toBe(
      'host_not_allowed',
    );
  });

  it('respinge un URL nevalid', () => {
    expect(checkLink('X', 'nu e un url').reason).toBe('malformed');
  });

  it('respinge o etichetă goală', () => {
    expect(checkLink('   ', 'https://youtube.com/x').reason).toBe(
      'label_too_long',
    );
  });
});

describe('isAllowedLinkHost', () => {
  it('tratează www. și punctul final ca aceeași gazdă', () => {
    expect(isAllowedLinkHost('www.x.com')).toBe(true);
    expect(isAllowedLinkHost('X.COM.')).toBe(true);
  });
});

describe('canPublishLinks', () => {
  it('cere și capabilitățile contului, și treapta T3', () => {
    expect(canPublishLinks({ canPostExternalLinks: true, trustTier: 3 })).toBe(
      true,
    );
    expect(canPublishLinks({ canPostExternalLinks: true, trustTier: 2 })).toBe(
      false,
    );
    expect(canPublishLinks({ canPostExternalLinks: false, trustTier: 8 })).toBe(
      false,
    );
  });
});

describe('schimbarea țării', () => {
  const now = new Date('2026-08-16T12:00:00Z');

  it('un cont care n-a schimbat niciodată poate schimba acum', () => {
    expect(canChangeRegion(null, now)).toBe(true);
    expect(regionChangeAvailableAt(null, now)).toBeNull();
  });

  it('blochează schimbarea în interiorul ferestrei de 90 de zile', () => {
    const changed = new Date('2026-07-01T12:00:00Z');
    expect(canChangeRegion(changed, now)).toBe(false);
    expect(regionChangeAvailableAt(changed, now)).toEqual(
      new Date('2026-09-29T12:00:00Z'),
    );
  });

  it('deblochează după expirarea ferestrei', () => {
    expect(canChangeRegion(new Date('2026-01-01T12:00:00Z'), now)).toBe(true);
  });
});

describe('isSupportedCountry', () => {
  it('acceptă indiferent de scrierea codului', () => {
    expect(isSupportedCountry('ro')).toBe(true);
    expect(isSupportedCountry('RO')).toBe(true);
  });

  it('respinge un cod care nu e în listă', () => {
    expect(isSupportedCountry('ZZ')).toBe(false);
  });
});
