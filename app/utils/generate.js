var STATE = {
    HIDDEN: 'hidden',
    REVEALED: 'revealed',
    FLAG: 'flag'
};

function makeBoard(width, height) {
    var states = [];
    var mines = [];
    var modified = [];

    for (var y = 0; y < height; y++) {
        var stateRow = [];
        var mineRow = [];
        var modifiedRow = [];

        for (var x = 0; x < width; x++) {
            stateRow.push(STATE.HIDDEN);
            mineRow.push(Math.random(1) > 0.7);
            modifiedRow.push(Date.now());
        }
        states.push(stateRow);
        mines.push(mineRow);
        modified.push(modifiedRow);
    }

    console.log(mines);

    return {
        states: states,
        mines: mines,
        modified: modified
    };
}

module.exports = makeBoard;
