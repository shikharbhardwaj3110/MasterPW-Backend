const express = require('express')
const cors = require('cors')
const dbUtil = require('./databaseConnection')
const jwtUtil = require('./webToken')
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

app.get('/getPasswords', jwtUtil.verifyToken, (req, res) => {
    const username = req.user.username
    var project = {}
    project['passwords'] = 1
    dbUtil.connectDatabase((err, client) => {
        if(err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.findOne({username}, {projection : project}).then(result => {
            res.json(result)
        })
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
                var signedTokenMain
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

app.post('/addPassword', (req, res) => {
    const utilName = req.body.utilName
    const utilUsername = req.body.utilUsername
    const utilPassword = req.body.utilPassword
    const username = req.body.username
    var passObj = {}
    passObj['utilName'] = utilName
    passObj['utilUsername'] = utilUsername
    passObj['utilPassword'] = utilPassword
    passObj['timestamp'] = new Date().toLocaleString()
    dbUtil.connectDatabase((err, client) => {
        if (err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.updateOne({ username }, {
            $push: {
                passwords: passObj
            }
        }).then(result => {
            if (result.modifiedCount)
                res.send("Updation successful !")
            else
                res.send("No account found !")
        }).catch(err => {
            res.send(err)
        })
    })
})

app.listen(port, () => {
    console.log("App running on : ", port)
})