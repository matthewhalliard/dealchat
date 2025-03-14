import { sql } from '@vercel/postgres';

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
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create contract_analyses table
    await sql`
      CREATE TABLE IF NOT EXISTS contract_analyses (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER REFERENCES contracts(id),
        analysis_type TEXT NOT NULL,
        analysis_result TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Database schema initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error };
  }
} 