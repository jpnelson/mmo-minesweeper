$(function() {
    var $minesweeper = $('#minesweeper');
    var chunks = {}

    function renderChunk(chunk) {
        var html = '';
        var height = chunk.board.states.length;
        var width = chunk.board.states[0].length;

        var chunkX = chunk.x;
        var chunkY = chunk.y;

        var html = '<div class="chunk" data-x="' + chunkX + '" data-y="' + chunkY + '" >';

        for(var y = 0; y < height; y++) {
            html += '<div class="row">';
            for(var x = 0; x < width; x++) {
                var state = chunk.board.states[y][x];
                var mine = chunk.board.mines[y][x];
                var cellContents = '';
                html += '<div data-cellx="' + x + '" data-celly="' + y + '" class="' + (mine ? ' hasmine ' : '') + 'cell" data-state="' + state + '">' + cellContents + '</div>';

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
        var y = parseInt($chunk.attr('data-y'));
        var x = parseInt($chunk.attr('data-x'));

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

    function getCell(cellX, cellY, chunkX, chunkY) {
        var $chunk = getChunk(chunkX, chunkY);
        if ($chunk) {
            var $cell = $chunk.find('.cell[data-cellx="' + cellX + '"][data-celly="' + cellY + '"]');
            return $cell;
        }
    }

    function bindInteraction($chunk) {
        $chunk.on('mousedown', function(e) {
            var left = event.which === 1;
            var right = event.which === 3;
            var $cell = $(e.target);

            var chunkX = parseInt($chunk.attr('data-x'));
            var chunkY = parseInt($chunk.attr('data-y'));

            if (left) {
                revealCell($cell, chunkX, chunkY);
            } else if (right) {
                var newState = getState($cell) === 'flag' ? 'hidden' : 'flag';
                setState($cell, newState);
            }

            saveChunkToServer(chunkX, chunkY);
        });

        window.oncontextmenu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };


    }

    function saveChunkToServer(chunkX, chunkY) {
        $.post('/save', {chunk: chunks[chunkY][chunkX]}, function() {
            console.log('Saved to server');
        });
    }

    function fetchChunk(x, y, callback) {
        $.post('/fetch', {x:x, y:y}, function(chunk) {
            callback(chunk);
        });
    }

    function revealCell($cell, chunkX, chunkY) {
        var cellX = parseInt($cell.attr('data-cellx'));
        var cellY = parseInt($cell.attr('data-celly'));

        var mineCount = getMineCount(cellX, cellY, chunkX, chunkY);
        var neighbours = getNeighbouringCells(cellX, cellY, chunkX, chunkY);

        setRevealed($cell, chunkX, chunkY)
        $cell.html(mineCount > 0 ? mineCount : '')

        if (mineCount === 0) {
            neighbours.forEach(function(cell) {
                var $neighbourCell = getCell(cell.cellX, cell.cellY, cell.chunkX, cell.chunkY);
                if (getState($neighbourCell) === 'hidden') {
                    revealCell($neighbourCell, cell.chunkX, cell.chunkY);
                }
            });
        }
    }

    function getNeighbouringCells(cellX, cellY, chunkX, chunkY) {
        var chunkHeight = chunks[chunkY][chunkX].board.mines[0].length;
        var chunkWidth = chunks[chunkY][chunkX].board.mines.length;

        var neighbours = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }

                var thisCellX = cellX + dx;
                var thisCellY = cellY + dy;
                var thisChunkX = chunkX;
                var thisChunkY = chunkY;

                if (thisCellX < 0) {
                    thisChunkX--;
                    thisCellX = chunkWidth - 1;
                }
                if (thisCellX >= chunkWidth) {
                    thisChunkX++;
                    thisCellX = 0;
                }
                if (thisCellY < 0) {
                    thisChunkY--;
                    thisCellY = chunkHeight - 1;
                }
                if (thisCellY >= chunkHeight) {
                    thisChunkY++;
                    thisCellY = 0;
                }

                if (thisChunkX < 0 || thisChunkY < 0) {
                    continue;
                }
                var cell = {
                    cellX: thisCellX,
                    cellY: thisCellY,
                    chunkX: thisChunkX,
                    chunkY: thisChunkY,
                    mine: chunks[thisChunkY][thisChunkX].board.mines[thisCellY][thisCellX],
                    state: chunks[thisChunkY][thisChunkX].board.states[thisCellY][thisCellX]
                }
                neighbours.push(cell);
            }
        }

        return neighbours;
    }

    function getMineCount(cellX, cellY, chunkX, chunkY) {
        var cellsWithMines = 0;

        var neighbours = getNeighbouringCells(cellX, cellY, chunkX, chunkY);

        neighbours.forEach(function(cell) {
            if (cell.mine) {
                cellsWithMines++;
            }
        });

        return cellsWithMines;

    }

    function setRevealed($cell) {
        setState($cell, 'revealed');
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

            var chunkX = parseInt($cell.closest('.chunk').attr('data-x'));
            var chunkY = parseInt($cell.closest('.chunk').attr('data-y'));
            var cellX = parseInt($cell.attr('data-cellx'));
            var cellY = parseInt($cell.attr('data-celly'));
            chunks[chunkY][chunkX].board.states[cellY][cellX] = state;
        }

    }

    for(var x = 0; x < 5; x++) {
        for(var y = 0; y < 5; y++) {
            fetchChunk(x, y, function(chunk) {
                var $chunk = renderChunk(chunk);
                addChunkToGrid($chunk);
                bindInteraction($chunk);
            });
        }
    }

});
