const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const port = 3000

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'db', 'data.db'));


app.set('view engine', 'ejs')
app.use(express.static('public'))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    const { page = 1, name, height, weight, startdate, enddate, married, operator } = req.query;

    const limit = 5
    const offset = (page - 1) * limit

    const queries = []
    const params = []
    const basketParams = []

    if (name) {
        queries.push(`name LIKE '%' || ? || '%'`)
        params.push(name)
        basketParams.push(name)
    }

    if (height) {
        queries.push(`height =?`)
        params.push(height)
        basketParams.push(height)
    }

    if (weight) {
        queries.push(`weight =?`)
        params.push(weight)
        basketParams.push(weight)
    }

    if (startdate && enddate) {
        queries.push(`birthdate BETWEEN ? AND ?`)
        params.push(startdate, enddate)
        basketParams.push(startdate, enddate)
    } else if (startdate) {
        queries.push(`birthdate >=?`)
        params.push(startdate)
        basketParams.push(startdate)
    } else if (enddate) {
        queries.push(`birthdate <=?`)
        params.push(enddate)
        basketParams.push(enddate)
    }

    if (married) {
        queries.push(`married =?`)
        params.push(married)
        basketParams.push(married)
    }


    let sql = 'SELECT * FROM data'
    let sqlcount = 'SELECT COUNT(*) as total FROM data'

   
    if (queries.length > 0) {
        sql += ` WHERE ${queries.join(` ${operator} `)}`
        sqlcount += ` WHERE ${queries.join(` ${operator} `)}`
    }

    sql += ` ORDER BY id DESC limit ? offset ? `
    params.push(limit, offset)

    db.get(sqlcount, basketParams, (err, data) => {
        if (err) { res.send(err) }
        else {
            const total = data.total
            const pages = Math.ceil(total / limit)

            db.all(sql, params, function (err, data) {
                if (err) { res.send(err) }
                else {
                    res.render('list', { data, query: req.query, pages, offset, page, url: req.url })
                }
            })
        }
    })
})

app.get('/add', (req, res) => {
    res.render('add')
})

app.post('/add', (req, res) => {
    const marriedValue = (req.body.married === 'true')

    db.run('INSERT INTO data(name, height, weight, birthdate, married) VALUES (?, ?, ?, ?, ?)', [req.body.name, req.body.height, req.body.weight, req.body.birthdate, marriedValue], function (err) {
        if (err) return res.send(err)
        res.redirect('/')
    })
})

app.get('/edit/:id', (req, res) => {
    const id = req.params.id
    db.get('SELECT * FROM data WHERE id = ?', [id], (err, data) => {
        data.married = data.married === 1
        res.render('edit', { dataEdit: data })
    })
})

app.post('/edit/:id', (req, res) => {
    const id = req.params.id
    const marriedValue = (req.body.married === 'true')
    db.run('UPDATE data SET name=?, height=?, weight=?, birthdate=?, married=? WHERE id = ?', [req.body.name, req.body.height, req.body.weight, req.body.birthdate, marriedValue, id], (err, data) => {
        if (err) return res.send(err)
        res.redirect('/')
    })
})

app.get("/delete/:id", (req, res) => {
    const id = req.params.id
    db.run("DELETE FROM data WHERE id = ?", [id], (err) => {
        if (err) return res.send(err);
        res.redirect("/");
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})