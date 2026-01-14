const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { sql, getPool } = require('../db');

/* CREATE USER */
router.post('/create-user', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const pool = await getPool();
    await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('pass', sql.VarChar, hash)
        .input('role', sql.VarChar, role)
        .query(`
            INSERT INTO users (name,email,password_hash,role)
            VALUES (@name,@email,@pass,@role)
        `);

    res.json({ success: true });
});

/* DELETE ATTEMPT */
router.delete('/attempt/:id', async (req, res) => {
    const pool = await getPool();
    await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM attempts WHERE attempt_id=@id');

    res.json({ success: true });
});

module.exports = router;
