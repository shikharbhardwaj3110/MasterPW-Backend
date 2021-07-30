const express = require('express')
const cors = require('cors')
const dbUtil = require('./databaseConnection')
const jwtUtil = require('./webToken')
const emailUtil = require('./emailUtil')
const app = express(cors())
const dotenv = require('dotenv').config()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000

app.get('/auth', jwtUtil.verifyToken, (req, res) => {
    const username = req.body.username
    const password = req.body.password
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.findOne({ username, password }).then(result => {
            if (result != undefined)
                res.send({ authStatus: 1 })
            else
                res.send({ authStatus: 0 })
        })
    })
})

app.post('/logOut', jwtUtil.verifyToken, (req, res) => {
    //console.log(req.headers.authorization.split(' ')[1])
    //console.log(req)
    //res.send('logout')

})

app.delete('/deletePassword', jwtUtil.verifyToken, (req, res) => {
    res.send('delete password')
})

app.post('/resetPassword', (req, res) => {
    const email = req.body.email
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')

        jwtUtil.signToken(email, token => {
            console.log(token)
            const resetUrl = 'http://localhost:3000/passwordReset?token='+token
            emailUtil.sendEmail(email, resetUrl)
        })
    })
})



app.get('/getPasswords/sort/:id', jwtUtil.verifyToken, async (req, res) => {
    const username = req.user.username
    const sortId = req.params.id
    dbUtil.connectDatabase(async (err, client) => {
        if (err)
            res.send(err)
        else {
            const db = dbUtil.getDb().collection('password-data')
            const cursor = db.find({ username }).sort({ "timestamp": sortId })
            //const cursor = db.collection.find( { $query: { username }, $orderby: { timestamp : -1 } } )
            const allValues = await cursor.toArray();
            res.json(allValues)
        }
    })
    //res.send('passwords')
})

app.post('/createUser', (req, res) => {
    const email = req.body.email
    const username = req.body.username
    const password = req.body.password
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.findOne({ $or: [{ email }, { username }] }).then(result => {
            if (result == undefined) {
                jwtUtil.signToken(username, token => {
                    console.log(token)
                    db.insertOne({ username, password, email, token, passwords: [] }).then(insertResult => {
                        res.json({ token })
                    })
                })
            }
            else
                res.send("User is already registered !")
        })
    })
})

app.post('/addPassword', jwtUtil.verifyToken, (req, res) => {
    const username = req.user.username
    const utilName = req.body.utilName
    const utilUsername = req.body.utilUsername
    const utilPassword = req.body.utilPassword
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        const db = dbUtil.getDb().collection('password-data')
        db.insertOne({ username, utilName, utilUsername, utilPassword, timestamp: Math.floor(new Date().getTime() / 1000) }, (err, items) => {
            if (err)
                res.send(err)
            else {
                console.log(items)
                res.send('Insertion successful !')
            }
        })
    })
})

app.listen(port, () => {
    console.log("App running on : ", port)
})