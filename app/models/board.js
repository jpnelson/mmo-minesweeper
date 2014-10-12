var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var BoardSchema = new Schema({
      states: Array,
      mines: Array,
      modified: Array
});

mongoose.model('Board', BoardSchema);
