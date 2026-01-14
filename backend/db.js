const sql = require('mssql/msnodesqlv8');

function buildConfig(server) {
    return {
        connectionString:
            `Driver={${process.env.DB_DRIVER}};` +
            `Server=${server};` +
            `Database=${process.env.DB_NAME};` +
            `Trusted_Connection=${process.env.DB_TRUSTED_CONNECTION};` +
            `TrustServerCertificate=${process.env.DB_TRUST_CERT};`
    };
}

async function tryConnect(serverName, label) {
    if (!serverName) return null;

    try {
        console.log(`Trying SQL Server (${label}):`, serverName);
        const pool = await sql.connect(buildConfig(serverName));
        console.log(`SQL CONNECTED via ${label}:`, serverName);
        return pool;
    } catch (err) {
        console.error(`Failed (${label}):`, serverName);
        console.error(err.message);
        return null;
    }
}

async function getPool() {
    // Primary
    let pool = await tryConnect(process.env.DB_SERVER, 'PRIMARY');
    if (pool) return pool;

    // Local fallback
    pool = await tryConnect(process.env.DB_SERVER_LOCAL, 'LOCAL');
    if (pool) return pool;

    // Backup fallback
    pool = await tryConnect(process.env.DB_SERVER_BKUP, 'BACKUP');
    if (pool) return pool;

    // Total failure
    console.error('FATAL: Unable to connect to ANY SQL Server');
    process.exit(1);
}

module.exports = { sql, getPool };
