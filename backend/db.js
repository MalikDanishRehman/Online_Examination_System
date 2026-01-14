const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    connectionString:
        `Driver={${process.env.DB_DRIVER}};` +
        `Server=${process.env.DB_SERVER};` +
        `Database=${process.env.DB_NAME};` +
        `Trusted_Connection=${process.env.DB_TRUSTED_CONNECTION};` +
        `TrustServerCertificate=${process.env.DB_TRUST_CERT};`
};

async function getPool() {
    return await sql.connect(dbConfig);
}

module.exports = { sql, getPool };
