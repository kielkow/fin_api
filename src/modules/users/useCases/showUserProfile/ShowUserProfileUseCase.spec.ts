import { InMemoryUsersRepository } from '@modules/users/repositories/in-memory/InMemoryUsersRepository';
import { AppError } from '@shared/errors/AppError';
import { AuthenticateUserUseCase } from '../authenticateUser/AuthenticateUserUseCase';

import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { ICreateUserDTO } from '../createUser/ICreateUserDTO';
import { ShowUserProfileUseCase } from './ShowUserProfileUseCase';

let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;

describe('Show User Profile', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(
      usersRepositoryInMemory,
    );
    authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepositoryInMemory,
    );
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  });

  it('should be able to show an user profile', async () => {
    const user: ICreateUserDTO = {
      name: 'jonh doe',
      email: 'jonhdoe@email.com',
      password: '123456',
    };

    await createUserUseCase.execute(user);

    const authenticationInfo = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    const userInfo = await showUserProfileUseCase.execute(
      authenticationInfo.user.id
    );

    expect(userInfo).toHaveProperty('id');
    expect(userInfo).toHaveProperty('name');
    expect(userInfo).toHaveProperty('email');
    expect(userInfo.name).toEqual('jonh doe');
    expect(userInfo.email).toEqual('jonhdoe@email.com');
  });

  it('should not be able to show an user profile with invalid token', async () => {
    expect(async () => {
      await showUserProfileUseCase.execute('invalid-token');
    }).rejects.toBeInstanceOf(AppError);
  });
});
