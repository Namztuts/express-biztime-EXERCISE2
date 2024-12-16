/** BizTime express application. */

const express = require('express');

const app = express();
const ExpressError = require('./expressError');

app.use(express.json());

const companiesRoutes = require('./routes/companies');
// console.log('COMPANIES ROUTE', companiesRoutes);
const invoicesRoutes = require('./routes/invoices');
// console.log('INVOICES ROUTE', invoicesRoutes);
const industryRoutes = require('./routes/industries');
// console.log('INDUSTRIES ROUTE', invoicesRoutes);

app.use('/companies', companiesRoutes);
app.use('/invoices', invoicesRoutes);
app.use('/industries', industryRoutes);

/** 404 handler */
app.use(function (req, res, next) {
   const err = new ExpressError('Not Found', 404);
   return next(err);
});

/** general error handler */
app.use((err, req, res, next) => {
   res.status(err.status || 500);

   return res.json({
      error: err,
      message: err.message,
   });
});

module.exports = app;
