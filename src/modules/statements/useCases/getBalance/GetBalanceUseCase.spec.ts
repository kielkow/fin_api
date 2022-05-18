import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";

import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";

import { ICreateUserDTO } from "@modules/users/useCases/createUser/ICreateUserDTO";
import { AppError } from "@shared/errors/AppError";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";

import { GetBalanceUseCase } from "./GetBalanceUseCase";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let getBalanceUseCase: GetBalanceUseCase;
let createStatementUseCase: CreateStatementUseCase;

let usersRepositoryInMemory: InMemoryUsersRepository;
let statementsRepositoryInMemory: InMemoryStatementsRepository;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer'
}

describe('Get Balance', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepositoryInMemory,
    );

    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    getBalanceUseCase =  new GetBalanceUseCase(
      statementsRepositoryInMemory, 
      usersRepositoryInMemory
    );
    createStatementUseCase = new CreateStatementUseCase(
      usersRepositoryInMemory, 
      statementsRepositoryInMemory
    );
  });

  it('should be able to get user balance', async () => {
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

    const balances = await getBalanceUseCase.execute({
      user_id: authenticationInfo.user.id
    });

    expect(balances).toHaveProperty('balance');
    expect(balances).toHaveProperty('statement');

    expect(balances.balance).toEqual(100);
    expect(balances.statement.length).toEqual(1);
  });

  it('should not be able to get user balance with invalid id', async () => {
    expect(async () => {
      await getBalanceUseCase.execute({ user_id: 'invalid-id' });
    }).rejects.toBeInstanceOf(AppError);
  });
});
