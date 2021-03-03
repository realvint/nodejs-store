const express = require('express')
const app = express()
const mysql = require('mysql')

const connectionDb = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'store'
})

app.listen(3000, function () {
  console.log('node express working on port 3000')
})

app.use(express.static('public'))

app.set('view engine', 'pug')

app.get('/', function (req,res) {
  connectionDb.query(
    'SELECT * FROM goods',
    function (error, result) {
      if (error) throw error
      //console.log(result)
      const goods = {}
      for (let i = 0; i < result.length; i++) {
        goods[result[i]['id']] = result[i]
      }
      //console.log(goods)
      res.render('main', {
        goods : JSON.parse(JSON.stringify(goods))
      })
    }
  )
})