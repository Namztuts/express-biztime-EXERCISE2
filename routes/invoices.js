const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const db = require('../db');

// get a list of all invoices
router.get('/', async (request, response, next) => {
   try {
      const results = await db.query('SELECT * FROM invoices');
      return response.json({ invoices: results.rows });
   } catch (error) {
      console.error('Database query error:', error);
      return next(error);
   }
});

// get single invoice based on [id]
router.get('/:id', async (request, response, next) => {
   try {
      const invoiceID = request.params.id; //the :code in the route is held in request.params
      const results = await db.query('SELECT * FROM invoices WHERE id = $1', [
         invoiceID,
      ]);
      // if there is not company with the code provided, throw this error
      if (results.rows.length === 0) {
         throw new ExpressError(
            `Can't find company with code of ${invoiceID}`,
            404
         );
      }
      return response.send({ invoice: results.rows[0] });
   } catch (error) {
      return next(error); //NOTE: getting two error 'messages' if i put an incorrect [code]
   }
});

// create a new invoice
router.post('/', async (request, response, next) => {
   try {
      const { comp_code, amt } = request.body;
      const results = await db.query(
         'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *',
         [comp_code, amt]
      );
      return response.status(201).json({ invoice: results.rows[0] });
   } catch (error) {
      return next(error);
   }
});

// update an invoice based on [id]
router.put('/:id', async (request, response, next) => {
   try {
      const { amt, paid } = request.body;
      const invoiceID = request.params.id;
      let paidDate = null;

      // grabbing the invoice to modify the paid date
      const currentInvoice = await db.query(
         'SELECT paid FROM invoices WHERE id = $1',
         [invoiceID]
      );
      if (currentInvoice.rows.length === 0) {
         throw new ExpressError(
            `Can't update invoice with id of ${invoiceID}`,
            404
         );
      }

      const currentPaidDate = currentInvoice.rows[0].paid_date;
      //if there paying and unpaid invoice, set the date to now | if un-paying, set the date to null | else no change
      if (!currentPaidDate && paid) {
         paidDate = new Date();
      } else if (!paid) {
         paidDate = null;
      } else {
         paidDate = currentPaidDate;
      }

      const results = await db.query(
         'UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *',
         [amt, paid, paidDate, invoiceID]
      );

      return response.send({ invoice: results.rows[0] }); //NOTE: .send is like .json, but .json ensures that it is json
   } catch (error) {
      return next(error);
   }
});

// delete a company based on [id]
router.delete('/:id', async (request, response, next) => {
   try {
      const invoiceID = request.params.id;
      const results = await db.query('DELETE FROM invoices WHERE id = $1', [
         invoiceID,
      ]);
      // if rowCount is zero (which means there were no effected rows/deleted rows)
      if (results.rowCount === 0) {
         throw new ExpressError(
            `Can't find invoice with id of ${invoiceID}`,
            404
         );
      }
      return response.send({ status: 'deleted' });
   } catch (error) {
      return next(error);
   }
});

module.exports = router;
