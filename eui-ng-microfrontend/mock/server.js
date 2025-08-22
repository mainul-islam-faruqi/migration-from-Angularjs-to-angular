const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('mock/db/db.json');
const db = low(adapter);
const port = 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
// const cors = require('cors');
// if needed to be reached from another localhost server for local testing a distributed app f.e.
// app.use(cors({
//     origin: 'http://127.0.0.1:8080',
//     credentials: true,
// }));

require('./app/routes')(app, db);

app.listen(port, () => {
    console.log('We are live on ' + port);
});
