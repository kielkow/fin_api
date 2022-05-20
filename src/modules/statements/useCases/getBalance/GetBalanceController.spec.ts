import request from 'supertest';
import { hash } from "bcryptjs";
import { v4 as uuid } from 'uuid';
import { Connection } from "typeorm";

import { app } from '../../../../app';
import createConnection from '@shared/infra/typeorm';

let connection: Connection;
describe('Get Balance Controller', () => {
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

    it('should be able to get a balance from an user', async () => {
        const { body: authInfo } = await request(app).post('/api/v1/sessions').send({
            email: 'admin@finapi.com.br',
            password: 'admin',
        });

        await request(app).post('/api/v1/statements/deposit')
            .set({
                Authorization: `Bearer ${authInfo.token}`,
            })
            .send({
                amount: 100,
                description: 'test of deposit',
            });

        const response = await request(app).get('/api/v1/statements/balance').set({
            Authorization: `Bearer ${authInfo.token}`,
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('balance');
        expect(response.body).toHaveProperty('statement');
        expect(response.body.statement.length).toEqual(1);
        expect(response.body.statement[0].amount).toEqual(100);
        expect(response.body.statement[0].description).toEqual('test of deposit');
        expect(response.body.statement[0].type).toEqual('deposit');
        expect(response.body.statement[0].sender_id).toEqual(null);
        expect(response.body.balance).toEqual(100);
    });
});
