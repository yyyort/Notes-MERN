require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const { logger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDb = require('./config/dbConn')
const mongoose = require('mongoose')
const { logEvents } = require('./middleware/logger')
const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)

connectDb()

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())

app.use(cookieParser())
/* 
    static files
*/
app.use('/', express.static(path.join(__dirname, 'public')))

/* 
    routes
*/
app.use('/', require('./routes/root'))
app.use('/users', require('./routes/userRoutes'))
app.use('/notes', require('./routes/noteRoutes'))

/* 
    send 404 error if req is not found
*/
app.all('*', (req,res) => {
    res.status(404)
    //for page
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    //for api
    } else if (req.accepts('json')) {
        res.json({
            message: '404 not found'
        })
    //anything else
    } else {
        res.type('txt').send('404 not found')
    }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('connected to mongoDB')
    app.listen(PORT, () => console.log(`Server running in ${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})