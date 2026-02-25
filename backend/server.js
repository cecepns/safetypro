const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')
const jwt = require('jsonwebtoken')

dotenv.config()

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'safetypro',
  waitForConnections: true,
  connectionLimit: 10,
})

async function query(sql, params) {
  const [rows] = await pool.query(sql, params)
  return rows
}

const JWT_SECRET = process.env.JWT_SECRET || 'safetypro-dev-secret'
const JWT_EXPIRES_IN = '8h'

function auth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  } catch (err) {
    console.error('Auth error', err)
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' })
  }

  try {
    const rows = await query(
      'SELECT id, username, password, full_name, role FROM users WHERE username = ? LIMIT 1',
      [username],
    )

    if (!rows.length || rows[0].password !== password) {
      return res.status(401).json({ message: 'Username atau password salah' })
    }

    const user = rows[0]

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('POST /api/login error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// Dashboard summary
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const rows = await query(
      `
      SELECT
        COUNT(*) AS totalAssets,
        SUM(CASE WHEN kondisi = 'layak' THEN 1 ELSE 0 END) AS goodCondition,
        SUM(CASE WHEN kondisi IN ('perlu_perbaikan','rusak_total') THEN 1 ELSE 0 END) AS needsService
      FROM apd_assets
    `,
    )

    res.json(rows[0] || { totalAssets: 0, goodCondition: 0, needsService: 0 })
  } catch (err) {
    console.error('GET /api/dashboard error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Master data - departments
app.get('/api/departments', auth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, code, created_at FROM departments ORDER BY name ASC',
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/departments error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/departments', auth, async (req, res) => {
  const { name, code } = req.body
  if (!name || !code) {
    return res.status(400).json({ message: 'Nama dan kode departemen wajib' })
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO departments (name, code) VALUES (?, ?)',
      [name, code],
    )
    // created_at menggunakan DEFAULT CURRENT_TIMESTAMP di database
    const created = await query(
      'SELECT id, name, code, created_at FROM departments WHERE id = ?',
      [result.insertId],
    )
    res.status(201).json(created[0])
  } catch (err) {
    console.error('POST /api/departments error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.delete('/api/departments/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ message: 'ID departemen tidak valid' })
  }

  try {
    const existing = await query(
      'SELECT id FROM departments WHERE id = ? LIMIT 1',
      [id],
    )
    if (!existing.length) {
      return res.status(404).json({ message: 'Departemen tidak ditemukan' })
    }

    await pool.query('DELETE FROM departments WHERE id = ?', [id])
    return res.json({ message: 'Departemen berhasil dihapus' })
  } catch (err) {
    // Jika masih direferensikan oleh apd_assets atau inspection_logs
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({
        message:
          'Departemen tidak dapat dihapus karena masih digunakan oleh data APD atau log inspeksi',
      })
    }
    console.error('DELETE /api/departments/:id error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// Distinct APD names
app.get('/api/apd-names', auth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT DISTINCT nama_apd AS namaApd FROM apd_assets ORDER BY nama_apd ASC',
    )
    res.json(rows.map((r) => r.namaApd))
  } catch (err) {
    console.error('GET /api/apd-names error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// APD tags for dropdown
app.get('/api/apd-tags', auth, async (req, res) => {
  const { departmentId, namaApd } = req.query
  if (!departmentId || !namaApd) {
    return res.status(400).json({
      message: 'departmentId dan namaApd wajib diisi',
    })
  }
  try {
    const rows = await query(
      `
      SELECT id, tag_id
      FROM apd_assets
      WHERE department_id = ? AND nama_apd = ?
      ORDER BY tag_id ASC
    `,
      [Number(departmentId), namaApd],
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/apd-tags error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Batch registration of new APD
app.post('/api/batch-registration', auth, async (req, res) => {
  const { departmentId, namaApd, jumlahUnit, lokasi } = req.body
  const deptId = Number(departmentId)
  const qty = Number(jumlahUnit)

  if (!deptId || !namaApd || !qty || qty <= 0) {
    return res.status(400).json({
      message: 'departmentId, namaApd, dan jumlahUnit > 0 wajib diisi',
    })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [deptRows] = await conn.query(
      'SELECT code FROM departments WHERE id = ?',
      [deptId],
    )
    if (deptRows.length === 0) {
      await conn.rollback()
      conn.release()
      return res.status(400).json({ message: 'Departemen tidak ditemukan' })
    }
    const deptCode = deptRows[0].code
    const firstLetter =
      namaApd && namaApd.trim() ? namaApd.trim().charAt(0).toUpperCase() : 'X'

    const [countRows] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM apd_assets WHERE department_id = ? AND nama_apd = ?',
      [deptId, namaApd],
    )
    const existingCount = countRows[0].cnt || 0
    const startIndex = existingCount + 1

    const values = []
    const createdTags = []
    for (let i = 0; i < qty; i += 1) {
      const number = startIndex + i
      const tag = `APD-${deptCode}-${firstLetter}-${number}`
      values.push([deptId, namaApd, tag, lokasi || null])
      createdTags.push(tag)
    }

    await conn.query(
      'INSERT INTO apd_assets (department_id, nama_apd, tag_id, lokasi) VALUES ?',
      [values],
    )

    await conn.commit()
    conn.release()

    res.status(201).json({
      message: 'Batch registration berhasil',
      created: qty,
      tags: createdTags,
    })
  } catch (err) {
    await conn.rollback()
    conn.release()
    console.error('POST /api/batch-registration error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Inventaris APD
app.get('/api/inventaris', auth, async (req, res) => {
  const { departmentId, namaApd } = req.query
  const params = []
  let where = 'WHERE 1=1 '

  if (departmentId) {
    where += 'AND a.department_id = ? '
    params.push(Number(departmentId))
  }
  if (namaApd) {
    where += 'AND a.nama_apd LIKE ? '
    params.push(`%${namaApd}%`)
  }

  try {
    const rows = await query(
      `
      SELECT
        a.id,
        a.nama_apd,
        a.tag_id,
        a.kondisi,
        a.lokasi,
        a.last_inspection_at,
        d.name AS department_name,
        d.code AS department_code,
        (SELECT l.verifikasi_k3l
         FROM inspection_logs l
         WHERE l.tag_id = a.tag_id
         ORDER BY l.inspected_at DESC
         LIMIT 1) AS verifikasi_k3l
      FROM apd_assets a
      JOIN departments d ON d.id = a.department_id
      ${where}
      ORDER BY d.name ASC, a.nama_apd ASC, a.tag_id ASC
    `,
      params,
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/inventaris error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update Verifikasi K3L untuk inspeksi terakhir asset (dipanggil dari halaman Inventaris)
app.patch('/api/inventaris/:id/verifikasi-k3l', auth, async (req, res) => {
  const id = Number(req.params.id)
  const { verifikasiK3L } = req.body
  if (!id) {
    return res.status(400).json({ message: 'ID asset tidak valid' })
  }

  try {
    const assets = await query(
      'SELECT id, tag_id FROM apd_assets WHERE id = ? LIMIT 1',
      [id],
    )
    if (!assets.length) {
      return res.status(404).json({ message: 'Asset APD tidak ditemukan' })
    }
    const tagId = assets[0].tag_id

    const logs = await query(
      `SELECT id FROM inspection_logs
       WHERE tag_id = ?
       ORDER BY inspected_at DESC
       LIMIT 1`,
      [tagId],
    )
    if (!logs.length) {
      return res.status(400).json({
        message: 'Belum ada data inspeksi untuk asset ini. Input inspeksi dulu.',
      })
    }

    await pool.query(
      'UPDATE inspection_logs SET verifikasi_k3l = ? WHERE id = ?',
      [verifikasiK3L != null ? String(verifikasiK3L).trim() || null : null, logs[0].id],
    )
    return res.json({ message: 'Verifikasi K3L berhasil disimpan' })
  } catch (err) {
    console.error('PATCH /api/inventaris/:id/verifikasi-k3l error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

app.delete('/api/inventaris/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ message: 'ID asset tidak valid' })
  }

  try {
    const existing = await query(
      'SELECT id FROM apd_assets WHERE id = ? LIMIT 1',
      [id],
    )
    if (!existing.length) {
      return res.status(404).json({ message: 'Asset APD tidak ditemukan' })
    }

    await pool.query('DELETE FROM apd_assets WHERE id = ?', [id])
    return res.json({ message: 'Asset APD berhasil dihapus' })
  } catch (err) {
    if (
      err.code === 'ER_ROW_IS_REFERENCED_2' ||
      err.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(400).json({
        message:
          'Asset tidak dapat dihapus karena sudah memiliki log inspeksi (riwayat).',
      })
    }
    console.error('DELETE /api/inventaris/:id error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// Log riwayat inspeksi
app.get('/api/logs', auth, async (req, res) => {
  const { departmentId } = req.query
  const params = []
  let where = 'WHERE 1=1 '

  if (departmentId) {
    where += 'AND l.department_id = ? '
    params.push(Number(departmentId))
  }

  try {
    const rows = await query(
      `
      SELECT
        l.id,
        l.inspected_at,
        l.inspector_name,
        d.name AS department_name,
        d.code AS department_code,
        l.item_name,
        l.tag_id,
        l.lokasi,
        l.kondisi,
        l.verifikasi_k3l,
        l.remarks
      FROM inspection_logs l
      JOIN departments d ON d.id = l.department_id
      ${where}
      ORDER BY l.inspected_at DESC
    `,
      params,
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/logs error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update Verifikasi K3L untuk satu log inspeksi (dipanggil dari Log Riwayat)
app.patch('/api/logs/:id/verifikasi-k3l', auth, async (req, res) => {
  const id = Number(req.params.id)
  const { verifikasiK3L } = req.body
  if (!id) {
    return res.status(400).json({ message: 'ID log tidak valid' })
  }

  try {
    const existing = await query(
      'SELECT id FROM inspection_logs WHERE id = ? LIMIT 1',
      [id],
    )
    if (!existing.length) {
      return res.status(404).json({ message: 'Log inspeksi tidak ditemukan' })
    }

    await pool.query(
      'UPDATE inspection_logs SET verifikasi_k3l = ? WHERE id = ?',
      [verifikasiK3L != null ? String(verifikasiK3L).trim() || null : null, id],
    )
    return res.json({ message: 'Verifikasi K3L berhasil disimpan' })
  } catch (err) {
    console.error('PATCH /api/logs/:id/verifikasi-k3l error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

// Input inspeksi
app.post('/api/inspections', auth, async (req, res) => {
  const {
    inspectorName,
    lokasiKerja,
    departmentId,
    jenisApd,
    tagId,
    statusTemuan,
    remarks,
    verifikasiK3L,
  } = req.body

  if (
    !inspectorName ||
    !lokasiKerja ||
    !departmentId ||
    !jenisApd ||
    !tagId ||
    !statusTemuan
  ) {
    return res.status(400).json({ message: 'Field wajib ada yang kosong' })
  }

  const deptId = Number(departmentId)

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(
      `
      INSERT INTO inspection_logs
        (inspector_name, department_id, item_name, tag_id, lokasi, kondisi, verifikasi_k3l, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        inspectorName,
        deptId,
        jenisApd,
        tagId,
        lokasiKerja,
        statusTemuan,
        verifikasiK3L || null,
        remarks || null,
      ],
    )

    await conn.query(
      `
      UPDATE apd_assets
      SET kondisi = ?, last_inspection_at = NOW(), lokasi = ?
      WHERE tag_id = ?
    `,
      [statusTemuan, lokasiKerja, tagId],
    )

    await conn.commit()
    conn.release()
    res.status(201).json({ message: 'Inspeksi berhasil disimpan' })
  } catch (err) {
    await conn.rollback()
    conn.release()
    console.error('POST /api/inspections error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

const port = Number(process.env.PORT || 4000)

app.listen(port, () => {
  console.log(`SAFETYPRO backend listening on http://localhost:${port}`)
})

