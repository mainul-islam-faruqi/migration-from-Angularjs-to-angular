const User = require('../models/user');
const uuid = require('uuid');

module.exports = function (app, db) {
  db.then(db => {
    app.get('/api/user-details', (req, res) => {
      res.send(db.get('user-details'))
    });

    app.get('/api/users', (req, res) => {
      res.send(db.get('users'))
    });

    app.get('/api/users/:userId', (req, res) => {
      res.send(
        db.get('users')
          .find({ userId: req.params.userId })
      );
    });

    app.put('/api/users/:userId', (req, res) => {
      db.get('users')
        .find({ userId: req.params.userId })
        .assign( { ...req.body } )
        .write()
        .then(user => res.send(user))
    });

    app.delete('/api/users/:userId', (req, res) => {
      db.get('users')
        .remove({ userId: req.params.userId })
        .write()
        .then(res.send())
    });

    app.post('/api/users', (req, res) => {
      db.get('users')
        .push({ ...User, ...req.body, ...{ userId: uuid.v4() } })
        .last()
        .write()
        .then(user => res.send(user))
    });
  });
};
