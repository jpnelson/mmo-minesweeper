$(function() {
    var $minesweeper = $('#minesweeper');
    var chunks = {};

    function renderChunk(chunk) {
        var html = '';
        var height = chunk.board.states.length;
        var width = chunk.board.states[0].length;

        var chunkX = chunk.x;
        var chunkY = chunk.y;

        var html = '<div class="chunk" data-x="' + chunkX + '" data-y="' + chunkY + '" >';

        for(var x = 0; x < width; x++) {
            html += '<div class="row">';
            for(var y = 0; y < height; y++) {
                var state = chunk.board.states[y][x];
                var mine = chunk.board.mines[y][x];

                html += '<div data-cellx="' + x + '" data-celly="' + y + '" class="cell" data-state="' + state + '">' + '</div>';

            }
            html += '</div>';
        }
        html += '</div>';

        var $chunk = $(html);
        return $chunk;
    }

    function saveChunk(chunk) {
        if (!chunks[chunk.y]) {
            chunks[chunk.y] = {};
        }
        chunks[chunk.y][chunk.x] = chunk;
    }

    function addChunkToGrid($chunk) {
        var y = $chunk.attr('data-y');
        var x = $chunk.attr('data-x');

        $minesweeper.append($chunk);

        $chunk.css({
            position: 'absolute',
            left: x * $chunk.outerWidth(),
            top: y * $chunk.outerHeight()
        });
    }

    function getChunk(x, y) {
        var $chunk = $('.chunk[data-x="' + x + '"][data-y="' + y + '"]');
        if (!$chunk.length) {
            return undefined;
        } else {
            return $chunk;
        }
    }

    function bindInteraction($chunk) {
        $chunk.on('mousedown', function(e) {
            var left = event.which === 1;
            var right = event.which === 3;
            var $cell = $(e.target);
            if (left) {
                setRevealed($cell)
            } else if (right) {
                var newState = getState($cell) === 'flag' ? 'hidden' : 'flag';
                setState($cell, newState);
            }
        });

        window.oncontextmenu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };


    }

    function setRevealed($cell) {
        setState($cell, 'revealed');
    }

    function setFlagged($cell) {
        setState($cell, 'flag');
    }

    function getState($cell) {
        return $cell.attr('data-state');
    }

    function setState($cell, state) {
        if (getState($cell) === 'flag' && state !== 'hidden') {
            return;
        }

        if (getState($cell) !== 'revealed') {
            $cell.attr('data-state', state);
        }

    }

    function getAdjacentMineCount($cell) {

    }

    for(var x = 0; x < 5; x++) {
        for(var y = 0; y < 5; y++) {
            $.post('/fetch', {x:x, y:y}, function(chunk) {
                saveChunk(chunk);
                var $chunk = renderChunk(chunk);
                addChunkToGrid($chunk);
                bindInteraction($chunk);
            });
        }
    }

});
