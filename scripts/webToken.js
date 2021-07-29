const jwt = require('jsonwebtoken')
const dotenv = require('dotenv').config()

signToken = async (username, callback) => {
    console.log(process.env.JWT_SECRET)
    console.log(username)
    const token = await jwt.sign({ username }, process.env.JWT_SECRET)
    callback(token)
}

verifyToken = (req, res, next) => {
    jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
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