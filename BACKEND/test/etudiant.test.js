import { connect, clear, close } from './setup.js';
import {beforeAll, afterEach, afterAll, describe} from '@jest/globals';
import app from '../index.js';
import request from 'supertest';
import Etudiant from '../modeles/etudiants.js';


beforeAll(async function () {
   await connect();
});

afterEach(async function () {
   await clear();
});

afterAll(async function () {
   await close();
});

describe('Etudiant API Tests', () => {
    it('POST /etudiants -  creer un etudiant', async () => {
        const res = await request(app)
            .post('/etudiants')
            .send({
                id: 20,
                nom: 'Doe',
                prenom: 'John',
                mail: 'john@gg.co',
                matieres: [ 'Math', 'Physique']
            });
        expect(res.statusCode).toEqual(200);
        const etudiant = await Etudiant.findOne({ id: 20 });
        expect(etudiant).not.toBeNull();
        expect(etudiant.nom).toBe('Doe');
        expect(etudiant.prenom).toBe('John');
        expect(etudiant.matieres).toContain('Math');
    });
    it('GET /etudiants -  recuperer tous les etudiants', async () => {
        await Etudiant.create([
            { id: 21, nom: 'Smith', prenom: 'Anna', mail: 'anna@gg.co', matieres: [ 'Math', 'Chimie'] }
        ]);
        const res = await request(app).get('/etudiants');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].nom).toBe('Smith');
    });
    it('GET /etudiants/:id -  recuperer un etudiant par id', async () => {
        await Etudiant.create({ id: 22, nom: 'Brown', prenom: 'Charlie', mail: 'charlie@gg.co', matieres: [ 'Math', 'Biologie'] });
        const res = await request(app).get('/etudiants/22');
        expect(res.statusCode).toEqual(200);
        expect(res.body.nom).toBe('Brown');
    });
    it('PUT /etudiants/:id -  mettre a jour un etudiant', async () => {
        await Etudiant.create({ id: 23, nom: 'White', prenom: 'Eve', mail: 'eve@gg.co', matieres: [ 'Math', 'Informatique'] });
        const res = await request(app).put('/etudiants/23').send({ nom: 'White', prenom: 'Eve', mail: 'eve@gg.co', matieres: [ 'Math', 'Informatique', 'Anglais'] });
        expect(res.statusCode).toEqual(200);
        const etudiant = await Etudiant.findOne({ id: 23 });
        expect(etudiant.matieres).toContain('Anglais');
    });
    it('DELETE /etudiants/:id -  supprimer un etudiant', async () => {
        await Etudiant.create({ id: 24, nom: 'Black', prenom: 'Frank', mail: 'frank@gg.co', matieres: [ 'Math', 'Histoire'] });
        const res = await request(app).delete('/etudiants/24');
        expect(res.statusCode).toEqual(200);
        const etudiant = await Etudiant.findOne({ id: 24 });
        expect(etudiant).toBeNull();
    });
})