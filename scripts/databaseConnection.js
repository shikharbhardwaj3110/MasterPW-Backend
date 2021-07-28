const { MongoClient } = require('mongodb')
const dotenv = require('dotenv').config()

const uri = process.env.URI
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

var _db;

connectDatabase = (callback) => {
    client.connect(err => {
        _db = client.db(process.env.DB_NAME)
        return callback(err)
  });
}

getDb = () => {
    return _db;
}  

module.exports = {connectDatabase,getDb}
