import type { AuthService } from './auth.service';
import { AuthPagesController } from './auth-pages.controller';
import type { LocalizedContentService } from '../localization/localized-content.service';

describe('AuthPagesController localization', () => {
  it('renders the password form in the resolved request language', async () => {
    const auth = {} as AuthService;
    const localizedContent = {
      values: jest.fn().mockResolvedValue({
        'auth.page.reset.form.title': 'Choose a new password',
        'auth.page.reset.form.message':
          'The password must contain at least 10 characters.',
        'auth.page.reset.form.label': 'New password',
        'auth.page.reset.form.submit': 'Save password',
      }),
    } as unknown as LocalizedContentService;
    const controller = new AuthPagesController(auth, localizedContent);

    const html = await controller.resetPasswordPage(
      { locale: 'en' } as never,
      'safe-token',
    );

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Choose a new password');
    expect(html).toContain('New password');
    expect(html).not.toContain('Parolă nouă');
  });
});
