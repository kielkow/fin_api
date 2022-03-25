import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";

import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";

import { ICreateUserDTO } from "@modules/users/useCases/createUser/ICreateUserDTO";
import { AppError } from "@shared/errors/AppError";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Create an Statement', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepositoryInMemory,
    );

    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    createStatementUseCase = new CreateStatementUseCase(
      usersRepositoryInMemory, 
      statementsRepositoryInMemory
    );
  });

  it('should be able to create an statement', async () => {
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

    const statement = await createStatementUseCase.execute({
      user_id: authenticationInfo.user.id,
      amount: 100,
      description: 'test',
      type: OperationType.DEPOSIT
    });

    expect(statement).toHaveProperty('id');
    expect(statement.user_id).toEqual(authenticationInfo.user.id);
    expect(statement.description).toEqual('test');
    expect(statement.type).toEqual('deposit');
  });

  it('should not be able to create an statement for nonexistent user', async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: 'invalid-id',
        amount: 100,
        description: 'test',
        type: OperationType.DEPOSIT
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to withdraw with insufficient balance', async () => {
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

    await createStatementUseCase.execute({
      user_id: authenticationInfo.user.id,
      amount: 100,
      description: 'test',
      type: OperationType.DEPOSIT
    });

    expect(async () => {
      await createStatementUseCase.execute({
        user_id: authenticationInfo.user.id,
        amount: 1000,
        description: 'test',
        type: OperationType.WITHDRAW
      });
    }).rejects.toBeInstanceOf(AppError);
  });
});
