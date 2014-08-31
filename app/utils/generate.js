var STATE = {
    HIDDEN: 'hidden',
    REVEALED: 'revealed',
    FLAG: 'flag'
};

function makeBoard(width, height) {
    var states = [];
    var mines = [];

    for (var x = 0; x < width; x++) {
        var stateRow = [];
        var mineRow = [];
        for (var y = 0; y < height; y++) {
            stateRow.push(STATE.HIDDEN);
            mineRow.push(Math.random(1) > 0.5);
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
