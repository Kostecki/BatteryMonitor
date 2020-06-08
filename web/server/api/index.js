const express = require('express')
const bodyParser = require('body-parser')

const app = express()

// Require API routes
const batteries = require('./routes/batteries.js')

// Middlware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Import API Routes
app.use(batteries)

module.exports = {
  path: '/api',
  handler: app
}