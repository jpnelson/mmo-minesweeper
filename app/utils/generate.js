var STATE = {
    HIDDEN: 'hidden',
    REVEALED: 'revealed',
    FLAG: 'flag'
};

function makeBoard(width, height) {
    var states = [];
    var mines = [];

    for (var y = 0; y < height; y++) {
        var stateRow = [];
        var mineRow = [];
        for (var x = 0; x < width; x++) {
            stateRow.push(STATE.HIDDEN);
            mineRow.push(Math.random(1) > 0.8);
        }
        states.push(stateRow);
        mines.push(mineRow);
    }

    return {
        states: states,
        mines: mines
    };
}

module.exports = makeBoard;
