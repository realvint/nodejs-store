const express = require('express')
const app = express()
const mysql = require('mysql')
const nodemailer = require('nodemailer')

const connectionDb = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'store'
})

app.use(express.json())

app.listen(3000, function () {
  console.log('node express working on port 3000')
})

app.use(express.static('public'))

app.set('view engine', 'pug')

app.get('/', function (req, res) {
  let cat = new Promise(function (resolve, reject) {
    connectionDb.query(
      "select id,name, cost, image, category from (select id,name,cost,image,category, " +
      "if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   " +
      "from goods, ( select @curr_category := '' ) v ) goods where ind < 3",
      function (error, result, field) {
        if (error) return reject(error)
        resolve(result)
      }
    )
  })
  let catDescription = new Promise(function (resolve, reject) {
    connectionDb.query(
      "SELECT * FROM category",
      function (error, result, field) {
        if (error) return reject(error)
        resolve(result)
      }
    )
  })
  Promise.all([cat, catDescription]).then(function (value) {
    res.render('index', {
      goods: JSON.parse(JSON.stringify(value[0])),
      cat: JSON.parse(JSON.stringify(value[1])),
    })
  })
})


app.get('/categories', function ( req, res) {
  const categoryId = req.query.id

  const cat = new Promise (function (resolve, reject){
    connectionDb.query(
      'SELECT * FROM category WHERE id=' + categoryId,
      function (error, result) {
        if (error) reject(error)
        resolve(result)
      })
  })
  const goods = new Promise (function (resolve, reject){
    connectionDb.query(
      'SELECT * FROM goods WHERE category=' + categoryId,
      function (error, result) {
        if (error) reject(error)
        resolve(result)
      })
  })
  Promise.all([cat, goods]).then(function (value){

    res.render('categories', {
      cat: JSON.parse(JSON.stringify(value[0])),
      goods: JSON.parse(JSON.stringify(value[1]))
    })
  })
})

app.get('/goods', function (req,res) {
  connectionDb.query('SELECT * FROM goods WHERE id='+req.query.id, function (error, result, fields){
    if (error) throw error
    res.render('goods', {goods: JSON.parse(JSON.stringify(result))})
  })
})

app.get('/order', function (req,res) {
    res.render('order')
})

app.post('/get-category-list', function (req,res) {
  connectionDb.query('SELECT id, category FROM category', function (error, result, fields) {
    if (error) throw error
    res.json(result)
  })
})

app.post('/get-goods-info', function (req,res) {
  if (req.body.key.length !== 0) {
    connectionDb.query('SELECT id, name, cost FROM goods WHERE id IN ('+req.body.key.join(',')+')', function (error, result, fields) {
      if (error) throw error
      let goods = {}
      for (let i = 0; i < result.length; i++) {
        goods[result[i]['id']] = result[i]
      }
      res.json(goods)
    })
  } else {
    res.send('0')
  }
})

app.post('/finish-order', function (req, res){
  if (req.body.key.length !==0) {
    let key = Object.keys(req.body.key)
      connectionDb.query(
        'SELECT id, name, cost FROM goods WHERE id IN (' + key.join(',')+')', function (error, result, fields){
          if (error) throw error
            sendEmail(req.body, result).catch(console.error)
            res.send('1')
        })
    } else {
      res.send('1')
    }
})

async function sendEmail(data, result) {
  let res = '<h3>Новый заказ</h3>'
  let total = 0
  for (let i = 0; i< result.length; i++){
    res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} шт.т - ${result[i]['cost'] *data.key[result[i]['id']]} руб.</p>`
    total += result[i]['cost'] *data.key[result[i]['id']]
  }
  console.log(res)
  res += '<hr>'
  res += `Итого: ${total} руб.`
  res += `<hr> Телефон: ${data.phone}`
  res += `<hr> Имя: ${data.username}`
  res += `<hr> Адрес: ${data.address}`
  res += `<hr> Почта: ${data.email}`
  let testAccount = await nodemailer.createTestAccount()

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  })
  let mailOption = {
    from: '<test@rem69.ru>',
    to: 'test@rem69.ru,'+data.email,
    subject: 'магазин',
    text: 'заказик',
    html: res
  }
  let info = await transporter.sendMail(mailOption)
  console.log("MessageSent: %s", info.messageId)
  console.log("PreviewSent: %s", nodemailer.getTestMessageUrl(info))
  return true
}