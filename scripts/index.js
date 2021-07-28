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
    const db = dbUtil.connectDatabase((err,client)=>{
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

app.listen(port,()=>{
    console.log("App running on : ",port)
})