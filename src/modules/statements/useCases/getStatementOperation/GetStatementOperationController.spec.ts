import request from 'supertest';
import { hash } from "bcryptjs";
import { v4 as uuid } from 'uuid';
import { Connection } from "typeorm";

import { app } from '../../../../app';
import createConnection from '@shared/infra/typeorm';

let connection: Connection;
describe('Get Statement Operation Controller', () => {
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

    it('should be able to get info about an statement operation', async () => {
        const { body: authInfo } = await request(app).post('/api/v1/sessions').send({
            email: 'admin@finapi.com.br',
            password: 'admin',
        });

        const { body: statement } = await request(app).post('/api/v1/statements/deposit')
            .set({
                Authorization: `Bearer ${authInfo.token}`,
            })
            .send({
                amount: 100,
                description: 'test of deposit',
            });

        const response = await request(app).get(`/api/v1/statements/${statement.id}`).set({
            Authorization: `Bearer ${authInfo.token}`,
        });

        expect(response.body).toHaveProperty('id');
        expect(response.body.user_id).toEqual(authInfo.user.id);
        expect(response.body.description).toEqual('test of deposit');
        expect(response.body.type).toEqual('deposit');
        expect(Number(response.body.amount)).toEqual(100);
    });

    it('should not be able to get info about an statement operation that non exists', async () => {
        const { body: authInfo } = await request(app).post('/api/v1/sessions').send({
            email: 'admin@finapi.com.br',
            password: 'admin',
        });

        const response = await request(app).get(`/api/v1/statements/45a8869b-b144-40c9-9d55-7f438f4a26c4`).set({
            Authorization: `Bearer ${authInfo.token}`,
        });


        expect(response.status).toEqual(404);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toEqual('Statement not found');
    });
});
