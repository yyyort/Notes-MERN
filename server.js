const express = require('express')
const app = express()
const path = require('path')
const { logger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')

const PORT = process.env.PORT || 3500

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

app.listen(PORT, () => console.log(`Server running in ${PORT}`))
