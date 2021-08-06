const jwt = require('jsonwebtoken')
const dotenv = require('dotenv').config()

signToken = async (username, callback) => {
    console.log(process.env.JWT_SECRET)
    console.log(username)
    const token = await jwt.sign({ username }, process.env.JWT_SECRET)
    callback(token)
}

verifyToken = (req, res, next) => {
    //console.log(req)
    //console.log(req.headers.authorization)
    //console.log(req)
    var token
    if(req.headers.authorization==undefined)
        token = req.query.token
    else
        token = req.headers.authorization.split(' ')[1]
    //const token = req.headers.authorization.split(' ')[1] || req.params.token
    console.log("Token recvd : " , token)
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err)
            res.sendStatus(403)
        else {
            console.log(decoded)
            req.user = decoded
            next()
        }
    })
}

module.exports = { signToken, verifyToken }