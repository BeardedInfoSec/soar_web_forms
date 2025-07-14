const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: '192.168.128.72', // Replace with your PostgreSQL server's IP
    database: 'soar_web_forms',
    password: 's0aring42', // Replace with your PostgreSQL password
    port: 5432,
});

pool.connect((err, client) => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected to PostgreSQL!');
    client.query('SELECT NOW()', (err, result) => {
        if (err) {
            console.error('Query error:', err);
            return;
        }
        console.log('Current time:', result.rows[0].now);
        pool.end();
    });
});