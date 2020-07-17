const express = require('express')
const bodyParser = require('body-parser')
const swaggerUi = require('swagger-ui-express')
const swaggerJSDoc = require('swagger-jsdoc');

const app = express()

// Require API routes
const batteries = require('./routes/batteries.js')

// Swagger setup
const swaggerDefinition = {
  info: {
    title: 'Battery Monitor',
    version: '1.0.0',
  },
  basePath: '/api'
}
const options = {
  swaggerDefinition,
  apis: ['./server/api/routes/*.js']
}
const swaggerSpec = swaggerJSDoc(options)

// Middlware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Import API Routes
app.use(batteries)

module.exports = {
  path: '/api',
  handler: app
}