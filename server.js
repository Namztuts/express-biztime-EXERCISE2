/** Server startup for BizTime. */

const app = require('./app');

app.listen(3000, function () {
   console.log('*Server started at port 3000');
});
