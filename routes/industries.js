const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const db = require('../db');
const slugify = require('slugify');
const { request, response } = require('../app');

// get a list of all the industries
router.get('/', async (request, response, next) => {
   // NOTE: each industry should show all the companies within that industry | achieving this with a JOIN query
   try {
      const results = await db.query(`
         SELECT  industries.code AS industry_code, industries.industry AS industry_name, companies.code AS company_code
         FROM industries
         LEFT JOIN industrybabies ON industries.code = industrybabies.ind_code
         LEFT JOIN companies ON industrybabies.comp_code = companies.code;
         `);

      // using reduce to find and then group the campanies into an array
      const industryData = results.rows.reduce((acc, row) => {
         const { industry_code, industry_name, company_code } = row;

         // if the industry is not already in the object, add it
         if (!acc[industry_code]) {
            acc[industry_code] = {
               code: industry_code,
               industry: industry_name,
               companies: [], // initializing the companies array
            };
         }

         // add the company code to the array, if it exists
         if (company_code) {
            acc[industry_code].companies.push(company_code);
         }

         return acc;
      }, {});

      console.log(industryData);
      return response.json({ industries: industryData });
   } catch (error) {
      next(error);
   }
});

// route for creating an industry
router.post('/', async (request, response, next) => {
   try {
      const inputCode = request.body.code;
      const slugCode = slugify(inputCode, { lower: true, strict: true }); // using Slugify again

      const { industry } = request.body;
      const results = await db.query(
         'INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *',
         [slugCode, industry]
      );
      return response.status(201).json({ industry: results.rows[0] }); //status code 201 for created | returning the first object [0]
   } catch (error) {
      return next(error);
   }
});

// associating an industry to a company
router.post('/:compCode/:indCode', async (request, response, next) => {
   try {
      const { compCode, indCode } = request.params;
      const results = await db.query(
         'INSERT INTO industrybabies (comp_code, ind_code) VALUES ($1,$2) RETURNING *',
         [compCode, indCode]
      );
      return response.status(201).json({ company: results.rows[0] });
   } catch (error) {
      next(error);
   }
});

module.exports = router;
