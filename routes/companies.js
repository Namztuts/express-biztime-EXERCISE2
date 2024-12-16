const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const db = require('../db');
const slugify = require('slugify');

// get all companies
router.get('/', async (request, response, next) => {
   try {
      const results = await db.query('SELECT * FROM companies');
      console.log('COMPANIES QUERY', results.rows); //making a query to the DB | NOTE: have to make the request with Insomnia before this logs to the terminal
      return response.json({ companies: results.rows });
   } catch (error) {
      console.error('Database query error:', error);
      return next(error);
   }
});

// get single company and all their invoices based on [code]
router.get('/:code', async (request, response, next) => {
   try {
      const companyCode = request.params.code; //the :code in the route is held in request.params
      const companyResults = await db.query(
         'SELECT * FROM companies WHERE code = $1',
         [companyCode]
      );
      const invoiceResults = await db.query(
         'SELECT * FROM invoices WHERE comp_code = $1',
         [companyCode]
      );
      // NOTE: come back to this because i can't think | refresh my brain on JOINs
      const industryResults = await db.query(
         `SELECT industries.industry FROM industries
         JOIN industrybabies ON industries.code = industrybabies.ind_code
         WHERE industrybabies.comp_code = $1`,
         [companyCode]
      );

      // if there is not company with the code provided, throw this error
      if (companyResults.rows.length === 0) {
         throw new ExpressError(
            `Can't find company with code of ${companyCode}`,
            404
         );
      }
      const companyData = companyResults.rows[0];
      const invoiceData = invoiceResults.rows;
      const industryData = industryResults.rows.map((row) => row.industry);
      // adds an 'invoices' item to hold all of the invoices in the same object
      companyData.invoices = invoiceData.map((invoice) => invoice);
      companyData.industries = industryData;

      return response.send({
         company: companyData,
      });
   } catch (error) {
      return next(error); //NOTE: getting two error 'messages' if i put an incorrect [code]
   }
});

// create a new company
router.post('/', async (request, response, next) => {
   try {
      const inputCode = request.body.code; //grabbing just the code from the body
      const slugCode = slugify(inputCode, { lower: true, strict: true }); //cleaning up the code from spaces/special characters/and uppercase letters

      const { name, description } = request.body; //desctructuring | body being parsed with JSON
      const results = await db.query(
         'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *',
         [slugCode, name, description]
      ); //NOTE: when INSERTING into a table, it does not return anything back to us with results.row | so we use a RETURNING clause at the end of the query
      return response.status(201).json({ company: results.rows[0] }); //status code 201 for created | returning the first object [0]
   } catch (error) {
      return next(error);
   }
});

// update a company based on [code]
router.put('/:code', async (request, response, next) => {
   try {
      const { name, description } = request.body;
      const companyCode = request.params.code;
      const results = await db.query(
         'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *',
         [name, description, companyCode]
      );
      //NOTE: to cover more bases, would add logic in here so that we can update just name or just type instead of needing both (which is how it is now)
      if (results.rows.length === 0) {
         throw new ExpressError(
            `Can't update company with code of ${companyCode}`,
            404
         );
      }
      return response.send({ company: results.rows[0] }); //NOTE: .send is like .json, but .json ensures that it is json
   } catch (error) {
      return next(error);
   }
});

// delete a company based on [code]
router.delete('/:code', async (request, response, next) => {
   try {
      const companyCode = request.params.code;
      const results = await db.query('DELETE FROM companies WHERE code = $1', [
         companyCode,
      ]);
      // if rowCount is zero (which means there were no effected rows/deleted rows)
      if (results.rowCount === 0) {
         throw new ExpressError(
            `Can't find company with code of ${companyCode}`,
            404
         );
      }
      return response.send({ status: 'deleted' });
   } catch (error) {
      return next(error);
   }
});

module.exports = router;
