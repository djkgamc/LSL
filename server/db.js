const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lsl_mmorpg',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database...');

    // Create players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        name VARCHAR(255) PRIMARY KEY,
        score INTEGER DEFAULT 0,
        bumped_targets TEXT[] DEFAULT '{}',
        last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        social_platform VARCHAR(50),
        social_handle VARCHAR(255)
      );
      
      -- Add columns if they don't exist (migration for existing DB)
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE players ADD COLUMN social_platform VARCHAR(50);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE players ADD COLUMN social_handle VARCHAR(255);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Create chat_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(255),
        message TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  initDB
};
