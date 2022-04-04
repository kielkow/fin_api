import request from 'supertest';
import { hash } from "bcryptjs";
import { v4 as uuid } from 'uuid';
import { Connection } from "typeorm";

import { app } from '../../../../app';
import createConnection from '@shared/infra/typeorm';

let connection: Connection;
describe('Create Statement Controller', () => {
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

    it('should be able to create an statement of deposit from an user', async () => {
        const { body: authInfo } = await request(app).post('/api/v1/sessions').send({
            email: 'admin@finapi.com.br',
            password: 'admin',
        });

        const response = await request(app).post('/api/v1/statements/deposit')
            .set({
                Authorization: `Bearer ${authInfo.token}`,
            })
            .send({
                amount: 100,
                description: 'test of deposit',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.user_id).toEqual(authInfo.user.id);
        expect(response.body.description).toEqual('test of deposit');
        expect(response.body.type).toEqual('deposit');
        expect(response.body.amount).toEqual(100);
    });

    it('should be able to create an statement of withdraw from an user', async () => {
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

        const response = await request(app).post('/api/v1/statements/withdraw')
            .set({
                Authorization: `Bearer ${authInfo.token}`,
            })
            .send({
                amount: 50,
                description: 'test of withdraw',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.user_id).toEqual(authInfo.user.id);
        expect(response.body.description).toEqual('test of withdraw');
        expect(response.body.type).toEqual('withdraw');
        expect(response.body.amount).toEqual(50);
    });
});
