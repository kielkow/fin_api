import request from 'supertest';
import { hash } from "bcryptjs";
import { v4 as uuid } from 'uuid';
import { Connection } from "typeorm";

import { app } from '../../../../app';
import createConnection from '@shared/infra/typeorm';

let connection: Connection;
describe('Authenticate User Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuid();
    const password = await hash('admin', 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at ) 
        values('${id}', 'admin', 'admin@finapi.com.br', '${password}', 'now()')
      `,
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to create a new session', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email: 'admin@finapi.com.br',
      password: 'admin',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('name');
    expect(response.body.user).toHaveProperty('email');
  });
});
