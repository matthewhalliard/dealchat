import { neon } from '@neondatabase/serverless';

// Create a SQL client with the Neon serverless driver
export const sql = neon(process.env.DATABASE_URL!);

// Helper function to initialize our database tables
export async function initializeDatabase() {
  try {
    // Create contracts table
    await sql`
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        blob_url TEXT NOT NULL,
        extracted_text TEXT,
        word_count INTEGER,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        analyzed BOOLEAN DEFAULT FALSE
      )
    `;

    // Create contract_analyses table
    await sql`
      CREATE TABLE IF NOT EXISTS contract_analyses (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER REFERENCES contracts(id),
        analysis_type TEXT NOT NULL,
        analysis_result TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create comments table (example from the user's query)
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error };
  }
} 