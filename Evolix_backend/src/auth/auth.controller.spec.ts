import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    changePassword: jest.Mock;
    deactivateAccount: jest.Mock;
    me: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      changePassword: jest.fn(),
      deactivateAccount: jest.fn(),
      me: jest.fn(),
    };

    controller = new AuthController(authService as any);

    jest.clearAllMocks();
  });

  it('delegates register requests to the auth service', async () => {
    authService.register.mockResolvedValue({ token: 'token', user: { id: '1' } });

    const result = await controller.register({ username: 'alice', email: 'alice@example.com', password: 'secret123' });

    expect(authService.register).toHaveBeenCalledWith('alice', 'alice@example.com', 'secret123');
    expect(result).toEqual({ token: 'token', user: { id: '1' } });
  });

  it('delegates password changes using the authenticated user id', async () => {
    authService.changePassword.mockResolvedValue({ message: 'Password updated successfully' });

    const result = await controller.changePassword({ user: { sub: 7 } } as any, {
      currentPassword: 'old-secret',
      newPassword: 'new-secret',
    });

    expect(authService.changePassword).toHaveBeenCalledWith(7, 'old-secret', 'new-secret');
    expect(result).toEqual({ message: 'Password updated successfully' });
  });
});
