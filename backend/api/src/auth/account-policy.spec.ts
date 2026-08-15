import {
  ageInYears,
  canChangeUsername,
  capabilitiesFor,
  isBelowMinimumAge,
  isMinorAccount,
  isPlausibleBirthDate,
  usernameChangeAvailableAt,
} from './account-policy';

const now = new Date('2026-08-15T12:00:00.000Z');

describe('account policy', () => {
  describe('vârstă', () => {
    it('numără anii pe calendar, nu pe milisecunde', () => {
      expect(ageInYears(new Date('2000-08-15T00:00:00Z'), now)).toBe(26);
      // Cu o zi înainte de aniversare încă nu s-a împlinit anul.
      expect(ageInYears(new Date('2000-08-16T00:00:00Z'), now)).toBe(25);
      expect(ageInYears(new Date('2000-12-31T00:00:00Z'), now)).toBe(25);
    });

    it('respinge conturile sub vârsta minimă', () => {
      expect(isBelowMinimumAge(new Date('2015-01-01T00:00:00Z'), now)).toBe(
        true,
      );
      // Exact 13 ani împliniți: acceptat.
      expect(isBelowMinimumAge(new Date('2013-08-15T00:00:00Z'), now)).toBe(
        false,
      );
    });

    it('tratează 13-15 ani ca minor, 16+ ca major', () => {
      expect(isMinorAccount(new Date('2012-01-01T00:00:00Z'), now)).toBe(true);
      expect(isMinorAccount(new Date('2010-08-15T00:00:00Z'), now)).toBe(false);
    });

    it('fără dată de naștere, contul e tratat ca minor', () => {
      // Alegerea prudentă: restricțiile protejează, absența datei nu dovedește
      // că utilizatorul e major.
      expect(isMinorAccount(null, now)).toBe(true);
    });

    it('respinge date de naștere imposibile', () => {
      expect(isPlausibleBirthDate(new Date('2030-01-01T00:00:00Z'), now)).toBe(
        false,
      );
      expect(isPlausibleBirthDate(new Date('1850-01-01T00:00:00Z'), now)).toBe(
        false,
      );
      expect(isPlausibleBirthDate(new Date('invalid'), now)).toBe(false);
      expect(isPlausibleBirthDate(new Date('1990-05-04T00:00:00Z'), now)).toBe(
        true,
      );
    });
  });

  describe('cooldown la schimbarea username-ului', () => {
    it('un username neschimbat vreodată se poate schimba imediat', () => {
      expect(canChangeUsername(null, now)).toBe(true);
      expect(usernameChangeAvailableAt(null, now)).toBeNull();
    });

    it('blochează 30 de zile după schimbare', () => {
      const changed = new Date('2026-08-01T12:00:00.000Z');
      expect(canChangeUsername(changed, now)).toBe(false);
      expect(usernameChangeAvailableAt(changed, now)).toEqual(
        new Date('2026-08-31T12:00:00.000Z'),
      );
    });

    it('deblochează exact la expirarea ferestrei', () => {
      const changed = new Date('2026-07-16T12:00:00.000Z');
      expect(canChangeUsername(changed, now)).toBe(true);
    });
  });

  describe('capabilități', () => {
    it('emailul neverificat blochează ranked și chat global', () => {
      const caps = capabilitiesFor({
        emailVerifiedAt: null,
        birthDate: new Date('1990-01-01T00:00:00Z'),
        now,
      });
      expect(caps.canPlayRanked).toBe(false);
      expect(caps.canUseGlobalChat).toBe(false);
    });

    it('adultul verificat primește tot', () => {
      const caps = capabilitiesFor({
        emailVerifiedAt: new Date('2026-08-10T00:00:00Z'),
        birthDate: new Date('1990-01-01T00:00:00Z'),
        now,
      });
      expect(caps).toEqual({
        emailVerified: true,
        isMinor: false,
        canPlayRanked: true,
        canUseGlobalChat: true,
        canPostExternalLinks: true,
        dmPermissionLocked: false,
      });
    });

    it('minorul verificat poate juca ranked, dar nu are chat global liber', () => {
      const caps = capabilitiesFor({
        emailVerifiedAt: new Date('2026-08-10T00:00:00Z'),
        birthDate: new Date('2012-01-01T00:00:00Z'),
        now,
      });
      expect(caps.canPlayRanked).toBe(true);
      expect(caps.canUseGlobalChat).toBe(false);
      expect(caps.canPostExternalLinks).toBe(false);
      expect(caps.dmPermissionLocked).toBe(true);
    });
  });
});
