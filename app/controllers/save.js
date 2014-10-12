var generate = require('../utils/generate');
var express = require('express');
var mongoose = require('mongoose');
var Board = mongoose.model('Board');
var router = express.Router();


module.exports = function (app) {
  app.use('/save', router);
};

function merge(clientBoard, serverBoard) {
    var width = serverBoard.states[0].length;
    var height = serverBoard.states.length;
    var mergeResult = serverBoard;

    for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
            var serverState = serverBoard.states[y][x];
            var clientState = clientBoard.states[y][x];

            if (serverState === 'revealed') {
                continue;
            } else {
                var shouldTakeClient = (clientState === 'revealed') || (chunkClient.board.modified[y][x] > chunkServer.board.modified[y][x]);
                if (shouldTakeClient) {
                    mergeResult.board.states[y][x] = chunkClient.board.states[y][x];
                    mergeResult.board.modified[y][x] = chunkClient.board.modified[y][x];
                }
            }
        }
    }

    return mergeResult;
}

router.post('/', function (req, res, next) {
    var clientBoard = req.param('board');
    Board.find().exec(function(error, results) {
        var serverBoard = results.length && results[0];
        if (!serverBoard) {
            res.send(400);
        }
        serverBoard = merge(clientBoard, serverBoard);
        //Turn from mongoose object into regular object
        serverBoard = serverBoard.toObject();
        delete serverBoard._id;

        Board.update({}, serverBoard, function(err, numberAffected, rawResponse) {
            res.json(serverBoard);
        });
    });

});
