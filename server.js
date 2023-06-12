const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express()
const port = 3000

const db = new sqlite3.Database('data.db', (err) => {
  if (err) {
    console.log(err.message);
    throw err;
  }
  console.log('Connected to the SQLite database.')
});


app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))


app.get('/', (req, res) => {
  const url = req.url == '/' ? '/?page=1' : req.url


  let sql = 'SELECT COUNT (*) AS count FROM data'
  const params = []


  const sqlsearch = []

  if (req.query.id && req.query.checkboxid) {
    params.push(req.query.id)
    sqlsearch.push(`id = $${params.length}`)
  }

  if (req.query.String && req.query.checkboxString) {
    params.push(`%${req.query.String}%`);
    sqlsearch.push(`String LIKE $${params.length}`)
  }

  if (req.query.Integer && req.query.checkboxInteger) {
    params.push(req.query.Integer)
    sqlsearch.push(`Integer = $${params.length}`)
  }

  if (req.query.Float && req.query.checkboxFloat) {
    params.push(req.query.Float)
    sqlsearch.push(`Float = $${params.length}`)
  }

  if (req.query.startDate && req.query.endDate && req.query.checkboxDate) {
    params.push(req.query.startDate, req.query.endDate)
    sqlsearch.push(`Date BETWEEN $${params.length - 1} AND $${params.length}`)
  }

  if (req.query.Boolean && req.query.checkboxBoolean) {
    params.push(req.query.Boolean)
    sqlsearch.push(`Boolean = $${params.length}`)
  }

  if (params.length > 0) {
    sql += ` WHERE ${sqlsearch.join(' AND ')}`
  }

  db.get(sql, params, (err, data) => {
    // console.log(data)
    const page = req.query.page || 1
    const limit = 3
    const offset = (page - 1) * limit
    const pages = Math.ceil(data.count / limit)

    sql = 'SELECT * FROM data'
    if (params.length > 0) {
      sql += ` WHERE ${sqlsearch.join(' AND ')}`
    }

    params.push(limit, offset)
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`


    db.all(sql, params, (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).send('Internal Server Error')
      } else {
        res.render('index', { data: rows, pages, page, offset, query: req.query, url })
      }
    })
  })
})

app.get('/add', (req, res) => {
  res.render('add')
})



app.post('/add', (req, res) => {
  const { String, Integer, Float, Date, Boolean } = req.body

  const query = 'INSERT INTO data (String, Integer, Float, Date, Boolean) VALUES (?,?,?,?,?)'
  const values = [String, Integer, Float, Date, Boolean]

  db.run(query, values, (err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/')
    }
  })
})


app.get('/hapus/:id', (req, res) => {
  const query = 'DELETE FROM data WHERE id = ?'
  const id = req.params.id
  const values = [id]

  db.run(query, values, (err) => {
    if (err) {
      console.error(err);
    } else {
      res.redirect('/')
    }
  })
})


app.get('/ubah/:id', (req, res) => {
  const query = 'SELECT * FROM data WHERE id = ?'
  const id = req.params.id
  const values = [id]

  db.get(query, values, (err, row) => {
    if (err) {
      console.log(err);
    } else {
      res.render('edit', { item: row })
    }
  })
})

app.post('/ubah/:id', (req, res) => {
  const id = req.params.id
  const { String, Integer, Float, Date, Boolean } = req.body

  const query = 'UPDATE data SET String = ?, Integer = ?, Float = ?, Date = ?, Boolean = ? WHERE id = ?'
  const values = [String, Integer, Float, Date, Boolean, id]

  db.run(query, values, (err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/')
    }
  })
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

