/** Database setup for BizTime. */
require('dotenv').config();

const { Client } = require('pg'); //destructure to just grab Client from pg

let DB_URI;
const DB_ROUTE = process.env.DB_ROUTE;

// If we're running in test "mode", use our test DB
if (process.env.NODE_ENV === 'test') {
   DB_URI = `${DB_ROUTE}_test`;
} else {
   DB_URI = DB_ROUTE; //NOTE: could not get the path to work without a username and password | added to .env file | require dotenv above
}

//creating an object that connects to DB_URI above
let db = new Client({
   connectionString: DB_URI,
});

console.log('*Connecting', DB_URI);
db.connect() //starts up the connection | don't need the below, just for testing | above console.log also just for testing
   .then(() => console.log('***Database connected successfully'))
   .catch((err) => console.error('***Database connection ERROR:', err));

module.exports = db;
