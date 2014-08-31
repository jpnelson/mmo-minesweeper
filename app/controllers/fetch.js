var generate = require('../utils/generate');
var express = require('express');
var mongoose = require('mongoose');
var Chunk = mongoose.model('Chunk');
var router = express.Router();


module.exports = function (app) {
  app.use('/fetch', router);
};

router.post('/', function (req, res, next) {
    var x = req.param('x');
    var y = req.param('y');

    if ((x === undefined) || (y === undefined)) {
        var err = new Error('x and y parameters must be specified');
        err.status = 400;
        next(err);
    }

    var chunk;

    Chunk.find({x: x, y: y}).exec(function(error, results) {
        chunk = results.length && results[0];

        if (!chunk) {
            var newBoard = generate(5,5);

            chunk = new Chunk({
                x: x,
                y: y,
                board: newBoard
            });
            chunk.save();
        }

        res.json(chunk);


    });

});
