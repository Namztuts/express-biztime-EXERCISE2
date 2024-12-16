process.env.NODE_ENV = 'test'; //tell Node that we're in test "mode" | NOTE: needs to be set before db file
// make sure to install supertest | npm i supertest

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const { json } = require('express');

let testData;
let testCompany;

beforeEach(async () => {
   const companyResult = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ('nv', 'Nvidia', 'We sell things') RETURNING  code, name, description`
   );

   const invoiceResult = await db.query(
      `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) VALUES ('nv', '1244', false, '2024-01-01', null) RETURNING id, comp_code, amt, paid, add_date, paid_date`
   );
   testCompany = companyResult.rows[0];
   const invoiceData = invoiceResult.rows;
   testData = { ...companyResult.rows[0] }; //creates a shallow copy of the object. Works for simple objs like this, as long as the properties themselves don’t contain nested objs

   //NOTE: had to update the add_date field in each invoice to a string to match the response data
   testData.invoices = invoiceData.map((invoice) => {
      return { ...invoice, add_date: invoice.add_date.toISOString() };
   });
});

// deletes all the users in the table after each test
afterEach(async () => {
   await db.query('DELETE FROM invoices');
   await db.query('DELETE FROM companies');
});

// on the actual DB, we would not cut the server because we want the connection to persist with the DB
// when we run tests, we want to end the connection with to the DB after the test| uses the pg package with db.end() | pg also include db.query()
afterAll(async () => {
   await db.end();
});

describe('01 GET /companies', () => {
   test('01-01 Get a list of companies', async () => {
      const response = await request(app).get('/companies');
      expect(response.statusCode).toBe(200); //toBe is a comparison of the exact reference
      expect(response.body).toEqual({ companies: [testCompany] }); //toEqual compares the contents of the array/object
   });
});

describe('02 GET /company/:code', () => {
   test('02-01 Get a single company', async () => {
      const response = await request(app).get(`/companies/${testData.code}`);
      expect(response.statusCode).toBe(200); //toBe is a comparison of the exact reference
      expect(response.body).toEqual({ company: testData }); //toEqual compares the contents of the array/object
   });

   test('02-02 Responds with 404 for invalid id', async () => {
      const response = await request(app).get(`/companies/0`);
      expect(response.statusCode).toBe(404); //toBe is a comparison of the exact reference
   });
});

describe('03 POST /companies', () => {
   test('03-01 Creates a single company', async () => {
      const response = await request(app).post('/companies').send({
         code: 'bk',
         name: 'Burger King',
         description: 'We are farmers',
      });
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
         company: {
            code: 'bk',
            name: 'Burger King',
            description: 'We are farmers',
         },
      });
   });
});

describe('04 PATCH /companies/:code', () => {
   test('04-01 Updates a single company', async () => {
      const response = await request(app)
         .put(`/companies/${testCompany.code}`)
         .send({ name: 'NewNew', description: 'Dookie' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
         company: {
            code: testCompany.code,
            name: 'NewNew',
            description: 'Dookie',
         },
      });
   });

   test('04-02 Responds with 404 for invalid code', async () => {
      const response = await request(app).patch(`/users/wrong`);
      expect(response.statusCode).toBe(404);
   });
});

describe('05 DELETE /companies/:code', () => {
   test.only('05-01 Deletes a single company', async () => {
      const response = await request(app).delete(
         `/companies/${testCompany.code}`
      );
      console.log('RESPONSE', response.body);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ status: 'deleted' }); //checking that our message contains the deleted
   });
});
