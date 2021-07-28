const express = require('express')
const cors = require('cors')
const dbUtil = require('./databaseConnection')
const app = express(cors())
const dotenv = require('dotenv').config()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000

app.get('/auth',(req,res)=>{
    const username = req.body.username
    const password = req.body.password
    dbUtil.connectDatabase((err,client)=>{
        if(err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.findOne({username, password}).then(result=>{
            if(result!=undefined)
                res.send({authStatus : 1})
            else
                res.send({authStatus : 0})
        })
    })
})

app.post('/createUser',(req,res)=>{
    const username = req.body.username
    const password = req.body.password
    dbUtil.connectDatabase((err,client)=>{
        if(err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.findOne({username}).then(result=>{
            if(result==undefined){
                db.insertOne({username, password, passwords : []}).then(insertResult=>{
                    res.send('User created successfully !')
                })
            }
            else
                res.send("This username is already taken !")
        })
    })
})

app.post('/addPassword',(req,res)=>{
    const utilName = req.body.utilName
    const utilUsername = req.body.utilUsername
    const utilPassword = req.body.utilPassword
    const username = req.body.username
    var passObj = {}
    passObj['utilName'] = utilName
    passObj['utilUsername'] = utilUsername
    passObj['utilPassword'] = utilPassword
    dbUtil.connectDatabase((err,client)=>{
        if(err)
            res.send(err)
        const db = dbUtil.getDb().collection('user-data')
        db.updateOne({ username }, {
            $push: {
                passwords : passObj
            }
        }).then(result => {
            if(result.modifiedCount)
                res.send("Updation successful !")
            else
                res.send("No account found !")
        }).catch(err => {
            res.send(err)
        })
    })
})

app.listen(port,()=>{
    console.log("App running on : ",port)
})