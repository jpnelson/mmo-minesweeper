var generate = require('../utils/generate');
var express = require('express');
var mongoose = require('mongoose');
var Board = mongoose.model('Board');
var router = express.Router();


module.exports = function (app) {
  app.use('/fetch', router);
};

router.post('/', function (req, res, next) {
    var board;

    Board.find().exec(function(error, results) {
        board = results.length && results[0];

        if (!board) {
            var newBoard = generate(50, 30);

            board = new Board(newBoard);
            board.save();
        }
        res.json(board);


    });

});
