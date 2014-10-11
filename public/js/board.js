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

                html += '<div title="' + x + ',' + y + '" data-cellx="' + x + '" data-celly="' + y + '" class="' + (mine ? ' hasmine ' : '') + 'cell" data-state="' + state + '">' + '</div>';

            }
            html += '</div>';
        }
        html += '</div>';

        var $chunk = $(html);
        return $chunk;
    }

    function updateChunk(chunk) {
        var $chunk = getChunk($chunk);
        var height = chunk.board.states.length;
        var width = chunk.board.states[0].length;

        for(var y = 0; y < height; y++) {
            for(var x = 0; x < width; x++) {
                var $cell = getCell(x, y, chunk.x, chunk.y);
                var newState = chunk.board.states[y][x];
                if (newState === 'revealed') {
                    updateMineStatus($cell, x, y, chunk.x, chunk.y);
                }
                setState($cell, chunk.board.states[y][x]);
            }
        }
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
        var left;
        var right;
        $chunk.on('mousedown', function(e) {
            left = left || event.which === 1;
            right = right || event.which === 3;
            var $cell = $(e.target);

            var chunkX = parseInt($chunk.attr('data-x'));
            var chunkY = parseInt($chunk.attr('data-y'));

            var cellX = parseInt($cell.attr('data-cellx'));
            var cellY = parseInt($cell.attr('data-celly'));

            if (left && right) {
                revealNeighbouringCells(cellX, cellY, chunkX, chunkY);
            } else if (left) {
                revealCell($cell, chunkX, chunkY);
            } else if (right) {
                var newState = getState($cell) === 'flag' ? 'hidden' : 'flag';
                setState($cell, newState);
                updateCellLastModified(cellX, cellY, chunkX, chunkY);
            }

        });

        $chunk.on('mouseup', function(e) {
            left = event.which === 1 ? false : left;
            right = event.which === 3 ? false : right;
        });

        window.oncontextmenu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };
    }

    function updateCellLastModified(cellX, cellY, chunkX, chunkY) {
        //If we haven't loaded anything from the server yet, then we won't have the modified times
        chunks[chunkY][chunkX].board.modified = chunks[chunkY][chunkX].board.modified || {};
        if (!chunks[chunkY][chunkX].board.modified[cellY]) {
            chunks[chunkY][chunkX].board.modified[cellY] = {};
        }
        chunks[chunkY][chunkX].board.modified[cellY][cellX] = Date.now();
    }

    function isCellFlagged(cellX, cellY, chunkX, chunkY) {
        return chunks[chunkY][chunkX].board.state === 'flag';
    }

    function revealCell($cell, chunkX, chunkY) {
        var cellX = parseInt($cell.attr('data-cellx'));
        var cellY = parseInt($cell.attr('data-celly'));

        setRevealed($cell, cellX, cellY, chunkX, chunkY);

        var mineCount = getMineCount(cellX, cellY, chunkX, chunkY);
        if (mineCount === 0) {
            var neighbours = getNeighbouringCells(cellX, cellY, chunkX, chunkY);
            neighbours.forEach(function(cell) {
                var $neighbourCell = getCell(cell.cellX, cell.cellY, cell.chunkX, cell.chunkY);
                if (getState($neighbourCell) === 'hidden') {
                    revealCell($neighbourCell, cell.chunkX, cell.chunkY);
                }
            });
        }

        updateCellLastModified(cellX, cellY, chunkX, chunkY);
    }

    function revealNeighbouringCells(cellX, cellY, chunkX, chunkY) {
        var neighbours = getNeighbouringCells(cellX, cellY, chunkX, chunkY);
        neighbours.forEach(function(thisCell) {
            var $thisCell = getCell(thisCell.cellX, thisCell.cellY, thisCell.chunkX, thisCell.chunkY);
            revealCell($thisCell, thisCell.chunkX, thisCell.chunkY);
        });
    }

    function updateNeighbouringCellsLastModified(cellX, cellY, chunkX, chunkY) {
        var neighbours = getNeighbouringCells(cellX, cellY, chunkX, chunkY);
        neighbours.forEach(function(thisCell) {
            updateCellLastModified(thisCell.cellX, thisCell.cellY, thisCell.chunkX, thisCell.chunkY);
        });
    }


    function updateMineCount($cell, cellX, cellY, chunkX, chunkY) {
        var mineClasses = ['has-one-mine', 'has-two-mines', 'has-three-mines', 'has-four-mines', 'has-five-mines', 'has-six-mines', 'has-seven-mines', 'has-eight-mines']
        var mineCount = getMineCount(cellX, cellY, chunkX, chunkY);
        var mineClass = mineClasses[mineCount - 1];
        $cell.html(mineCount > 0 ? mineCount : '');
        $cell.addClass(mineClass);
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

                var outOfBounds = !chunks[thisChunkY] || !chunks[thisChunkY][thisChunkX];
                if (outOfBounds) {
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

    function setRevealed($cell, cellX, cellY, chunkX, chunkY) {
        if (getState($cell) === 'flag') {
            return;
        }

        setState($cell, 'revealed');
        updateMineStatus($cell, cellX, cellY, chunkX, chunkY);
    }

    function updateMineStatus($cell, cellX, cellY, chunkX, chunkY) {
        var hasMine = chunks[chunkY][chunkX].board.mines[cellY][cellX];
        if (hasMine) {
            $cell.addClass('has-mine');
        } else {
            updateMineCount($cell, cellX, cellY, chunkX, chunkY);
        }
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

    function getChunkLastModifiedTimestamp(chunkX, chunkY) {
        var maxTimeStamp = 0;
        var modificationTimes = chunks[chunkY][chunkX].board.modified;

        modificationTimes.forEach(function (row) {
            modificationTimes.forEach(function (cell) {
                maxTimeStamp = Math.max(cell, maxTimeStamp);
            });
        });

        return maxTimeStamp;
    }

    function saveChunkToServer(chunkX, chunkY, callback) {
        $.post('/save', {chunk: chunks[chunkY][chunkX]}, function() {
            callback()
        });
    }

    function fetchChunk(x, y, callback) {
        $.post('/fetch', {x:x, y:y}, function(chunk) {
            saveChunk(chunk);
            callback(chunk);
        });
    }

    for(var x = 0; x < 10; x++) {
        for(var y = 0; y < 10; y++) {
            fetchChunk(x, y, function(chunk) {
                var $chunk = renderChunk(chunk);
                addChunkToGrid($chunk);
                bindInteraction($chunk);
            });
        }
    }

    var lastUpdatedTime = Date.now();

    setInterval(function() {
        [0,1,2,3,4,5,6,7,8,9].forEach(function(chunkX) {
            [0,1,2,3,4,5,6,7,8,9].forEach(function(chunkY) {
                if(lastUpdatedTime > getChunkLastModifiedTimestamp(chunkX, chunkY)) {
                    fetchChunk(chunkX, chunkY, function(chunk) {
                        updateChunk(chunk);
                    });

                } else {
                    saveChunkToServer(chunkX, chunkY, function() {
                        fetchChunk(chunkX, chunkY, function(chunk) {
                            updateChunk(chunk);
                        });
                    });
                }
            });
        });
        lastUpdatedTime = Date.now();
    }, 10000);

    function debounce(fn, delay) {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    function isScrolledIntoView(elem) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemTop < docViewBottom) && (elemBottom > docViewTop));
    }

    $(window).scroll(debounce(function() {
        $('#minesweeper').find('.chunk').each(function() {
            var $chunk = $(this);
            if (!isScrolledIntoView($chunk)) {
                $chunk.remove();
            }
        })
    }, 500));

});
