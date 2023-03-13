const config = require("./config");
const { Client } = require('pg');

const isProduction = (config.NODE_ENV === "production");
const CONNECTION = {
  connectionString: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

const logQuery = (statement, parameters) => {
  let timeStamp = new Date();
  let formattedTimeStamp = timeStamp.toString().substring(4, 24);
  console.log(formattedTimeStamp, statement, parameters);
};

module.exports = {
  async dbQuery(statement, ...values) {
    let client = new Client({
      host: "/var/run/postgresql",
      port: 5432,
      user: "henmo",
      database: "todo-lists"
    });

    await client.connect();
    logQuery(statement, values);
    let result = await client.query(statement, values);
    await client.end();

    return result;
  }
}