const express = require('express')
const cors = require('cors')
const dbUtil = require('./databaseConnection')
const jwtUtil = require('./webToken')
const emailUtil = require('./emailUtil')
const path = require('path')
const dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

const filePath = path.join(__dirname, '../public')

const port = process.env.PORT || 3001

app.get('/', (req, res) => {
    const token = req.headers.authorization
    //console.log(token)
    if (token == undefined) {
        res.sendFile('index.html', { root: filePath })
    }
    else {
        jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
            //console.log(decoded)
            if (err)
                res.sendStatus(403)
            else {
                //console.log(decoded)
                res.sendFile('dashboard.html', { root: filePath })
            }
        })
    }
})


app.post('/auth', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.findOne({ username, password }).then(result => {
            if (result != undefined) {
                jwtUtil.signToken(username, token => {
                    res.send({token, username})
                })
            }
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

app.post('/resetPasswordLink', (req, res) => {
    const email = req.body.email
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')

        let randomToken = uuidv4()
        const resetUrl = 'http://localhost:3000/passwordReset/?token=' + randomToken
        console.log(resetUrl)

        dbUtil.connectDatabase((err, client) => {
            if (err)
                res.send(err)
            else {
                const db = dbUtil.getDb().collection('user-data')
                db.updateOne({ email }, { $set: { "resetToken": randomToken } })
                res.send("Email sent !")
            }
        })


        emailUtil.sendEmail(email, resetUrl)

    })
})

app.post('/passwordReset', (req, res) => {
    //const filePath = path.resolve(__dirname + '../' + )
    const token = req.query.token
    if (token == "" || token == undefined)
        res.sendStatus(404)
    console.log(token)
    const password = req.body.password
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        else {
            const db = dbUtil.getDb().collection('user-data')
            db.findOne({ resetToken: token }, (err, items) => {
                if (err)
                    res.send("Error finding token in db !")
                else {
                    if (items == undefined)
                        res.sendStatus(404)
                    else {
                        console.log(items)
                        db.updateOne({ resetToken: token }, { $set: { "password": password, "resetToken": "" } })
                    }
                }
            })
        }
    })
})

/*
app.post('/resetPasswordFinal', jwtUtil.verifyToken, (req, res) => {
    console.log(req)
    console.log("Inside reset password final body ")
    const password = req.body.password
    console.log("Password recvd : ", password)
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        else {
            const db = dbUtil.getDb().collection('user-data')
            db.updateOne({ email: req.user.username }, { $set: { "password": password } })
        }
    })
})
*/

app.get('/getPasswords/sort/:id', jwtUtil.verifyToken, async (req, res) => {
    const username = req.user.username
    const sortId = req.params.id
    console.log(req)
    if(sortId==undefined)
        sortId=1
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