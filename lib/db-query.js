const config = require("./config");
const { Client } = require('pg');

const isProduction = (config.NODE_ENV === "production");
const CONNECTION = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
};

const logQuery = (statement, parameters) => {
  let timeStamp = new Date();
  let formattedTimeStamp = timeStamp.toString().substring(4, 24);
  console.log(formattedTimeStamp, statement, parameters);
};

module.exports = {
  async dbQuery(statement, ...values) {
    let client = new Client(CONNECTION);

    await client.connect();
    logQuery(statement, values);
    let result = await client.query(statement, values);
    await client.end();

    return result;
  }
}