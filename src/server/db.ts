import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
    host: process.env.PG_HOST ,
    port: Number(process.env.PG_PORT) ,
    user: process.env.PG_USER ,
    password: process.env.PG_PASSWORD ,
    database: process.env.PG_DATABASE
})

export async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Connected! Server time: ", res.rows[0])
    return res.rows[0]
  } catch (err) {
    console.log("Error connecting: ", err)
  }
}