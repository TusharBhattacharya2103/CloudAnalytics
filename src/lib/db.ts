import mysql from "mysql2/promise";

const required = ["DB_HOST", "DB_USER", "DB_DATABASE"] as const;
for (const key of required) if (!process.env[key]) throw new Error(`Missing required database setting: ${key}`);

export const db = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD || "", database: process.env.DB_DATABASE, waitForConnections: true, connectionLimit: 10, timezone: "Z", dateStrings: true });
