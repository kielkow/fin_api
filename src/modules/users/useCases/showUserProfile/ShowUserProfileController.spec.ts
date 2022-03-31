import request from 'supertest';
import { hash } from "bcryptjs";
import { v4 as uuid } from 'uuid';
import { Connection } from "typeorm";

import { app } from '../../../../app';
import createConnection from '@shared/infra/typeorm';

let connection: Connection;
describe('Show User Profile Controller', () => {
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

    it('should be able to show a user profile', async () => {
        const { body: authInfo } = await request(app).post('/api/v1/sessions').send({
            email: 'admin@finapi.com.br',
            password: 'admin',
        });

        const response = await request(app).get('/api/v1/profile').set({
            Authorization: `Bearer ${authInfo.token}`,
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toEqual('admin');
        expect(response.body.email).toEqual('admin@finapi.com.br');
    });
});
