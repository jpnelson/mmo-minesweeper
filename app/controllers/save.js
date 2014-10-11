var generate = require('../utils/generate');
var express = require('express');
var mongoose = require('mongoose');
var Chunk = mongoose.model('Chunk');
var router = express.Router();


module.exports = function (app) {
  app.use('/save', router);
};

function merge(chunkClient, chunkServer) {
    var width = chunkServer.board.states[0].length;
    var height = chunkServer.board.states.length;
    var mergeResult = chunkServer;

    for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
            var serverState = chunkServer.board.states[y][x];

            if (serverState === 'revealed') {
                continue;
            } else {
                console.log('Client: ' + chunkClient.board.modified[y][x]);
                console.log('Server: ' + chunkServer.board.modified[y][x]);
                var shouldTakeClient = (chunkClient.board.modified[y][x] > chunkServer.board.modified[y][x]);
                if (shouldTakeClient) {
                    console.log('TAKING CLIENT');
                    mergeResult.board.states[y][x] = chunkClient.board.states[y][x];
                    mergeResult.board.modified[y][x] = chunkClient.board.modified[y][x];
                } else {
                    console.log('TAKING SERVER');
                }
            }
        }
    }

    return mergeResult;
}

router.post('/', function (req, res, next) {
    var clientChunk = req.param('chunk');
    var query = {x: clientChunk.x, y: clientChunk.y};
    Chunk.find(query).exec(function(error, results) {
        var serverChunk = results.length && results[0];
        if (!serverChunk) {
            res.send(400);
        }
        serverChunk = merge(clientChunk, serverChunk);
        //Turn from mongoose object into regular object
        serverChunk = serverChunk.toObject();
        delete serverChunk._id;

        Chunk.update(query, serverChunk, function(err, numberAffected, rawResponse) {
            res.send(200);
        });
    });

});
