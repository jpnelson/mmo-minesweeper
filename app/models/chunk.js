var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ChunkSchema = new Schema({
    x: Number,
    y: Number,
    board: {
      states: Array,
      mines: Array,
      modified: Array
    }
});

mongoose.model('Chunk', ChunkSchema);
