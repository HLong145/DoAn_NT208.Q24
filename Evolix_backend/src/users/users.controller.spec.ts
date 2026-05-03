import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    searchUsers: jest.Mock;
    getProfileByHandle: jest.Mock;
    getSuggestions: jest.Mock;
    updateMyProfile: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      searchUsers: jest.fn(),
      getProfileByHandle: jest.fn(),
      getSuggestions: jest.fn(),
      updateMyProfile: jest.fn(),
      findOne: jest.fn(),
    };

    controller = new UsersController(usersService as any);

    jest.clearAllMocks();
  });

  it('delegates search queries to the user service', async () => {
    usersService.searchUsers.mockResolvedValue([{ id: 1, username: 'alice', email: 'alice@example.com' }]);

    const result = await controller.search('ali');

    expect(usersService.searchUsers).toHaveBeenCalledWith('ali');
    expect(result).toEqual([{ id: 1, username: 'alice', email: 'alice@example.com' }]);
  });

  it('delegates profile updates to the user service', async () => {
    usersService.updateMyProfile.mockResolvedValue({ user: { id: 1, name: 'Alice' } });

    const result = await controller.updateMyProfile({ user: { sub: 1 } } as any, { name: 'Alice' });

    expect(usersService.updateMyProfile).toHaveBeenCalledWith(1, { name: 'Alice' });
    expect(result).toEqual({ user: { id: 1, name: 'Alice' } });
  });
});
