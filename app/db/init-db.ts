"use server"

import mysql from "mysql2/promise"

// Configure the local MySQL connection
const pool = mysql.createPool({
  host: "localhost", // Replace with your database host
  user: "root", // Replace with your MySQL username
  password: "", // Replace with your MySQL password
  database: "invoice_generator", // Replace with your database name
  port: 3306, // Replace with your MySQL port if different
})

export async function initializeDatabase() {
  const connection = await pool.getConnection()
  try {
    // Check if tables already exist
    const tablesExist = await checkTablesExist(connection)

    if (!tablesExist) {
      // Create invoices table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          invoice_number VARCHAR(50) NOT NULL,
          invoice_date DATE NOT NULL,
          due_date DATE NOT NULL,
          
          -- Company information
          company_name VARCHAR(255) NOT NULL,
          company_address TEXT NOT NULL,
          company_email VARCHAR(255) NOT NULL,
          company_phone VARCHAR(50) NOT NULL,
          
          -- Client information
          client_name VARCHAR(255) NOT NULL,
          client_address TEXT NOT NULL,
          client_email VARCHAR(255) NOT NULL,
          
          -- Additional information
          notes TEXT,
          total_amount DECIMAL(10, 2) NOT NULL,
          status VARCHAR(50) DEFAULT 'draft',
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      // Create line_items table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS line_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          invoice_id INT NOT NULL,
          description TEXT NOT NULL,
          quantity INT NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          
          -- Foreign key constraint
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      // Create index for faster lookups
      await connection.query(`
        CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON line_items(invoice_id)
      `)

      return { success: true, message: "Database tables created successfully" }
    }

    return { success: true, message: "Database tables already exist" }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, message: "Failed to initialize database", error }
  } finally {
    connection.release()
  }
}

async function checkTablesExist(connection: any) {
  try {
    // Check if invoices table exists
    const [rows] = await connection.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'invoices'
    `)
    return rows[0].count > 0
  } catch (error) {
    console.error("Error checking if tables exist:", error)
    return false
  }
}
