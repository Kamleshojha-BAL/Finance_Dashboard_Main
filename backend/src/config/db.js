import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "192.168.3.62",
  user: "corpappdb",
  password: "Baldev@123",
  database: "balcorpdb",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;