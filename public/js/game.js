require(['/js/board.js', '/components/jquery/dist/jquery.js'], function(board) {
    $(function() {
        var $minesweeper = $('#minesweeper');
        var board = {};

        var WIDTH = 50;
        var HEIGHT = 30;

        function renderBoard() {
            var html = '<div class="board">';

            for(var y = 0; y < HEIGHT; y++) {
                html += '<div class="row">';
                for(var x = 0; x < WIDTH; x++) {
                    var state = board.states[y][x];
                    var mine = board.mines[y][x];

                    html += '<div title="' + x + ',' + y + '" data-x="' + x + '" data-y="' + y + '" class="' + (mine ? ' hasmine ' : '') + 'cell" data-state="' + state + '">' + '</div>';
                }
                html += '</div>';
            }
            html += '</div>';

            $minesweeper.append($(html));
        }

        function synchroniseBoardMarkup() {
            for(var y = 0; y < HEIGHT; y++) {
                for(var x = 0; x < WIDTH; x++) {
                    var $cell = getCellElement(x, y);
                    var newState = board.states[y][x];
                    if (newState === 'revealed') {
                        revealCell(x, y);
                    } else if (newState === 'flag') {
                        //TODO flag markup
                    }
                }
            }
        }

        function getCellElement(x, y) {
            return $minesweeper.find('.cell[data-x="' + x + '"][data-y="' + y + '"]');
        }

        function bindInteraction() {
            var left;
            var right;
            $minesweeper.on('mousedown', function(e) {
                left = left || event.which === 1;
                right = right || event.which === 3;
                var $cell = $(e.target);

                var x = parseInt($cell.attr('data-x'));
                var y = parseInt($cell.attr('data-y'));

                if (left && right) {
                    revealNeighbouringCells(x, y);
                } else if (left) {
                    revealCell(x, y);
                } else if (right) {
                    var oldState = getState(x, y);
                    if (oldState === 'revealed') {
                        return;
                    }

                    var newState = oldState === 'flag' ? 'hidden' : 'flag';
                    setState(x, y, newState);
                    updateCellLastModified(x, y);
                }

            });

            $minesweeper.on('mouseup', function(e) {
                left = event.which === 1 ? false : left;
                right = event.which === 3 ? false : right;
            });

            window.oncontextmenu = function(event) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            };
        }

        function getState(x, y) {
            return getCellElement(x, y).attr('data-state');
        }

        function setState(x, y, state) {
            var $cell = getCellElement(x, y);

            if (getState(x, y) === 'flag' && state !== 'hidden') {
                return;
            }

            $cell.attr('data-state', state);

            board.states[y][x] = state;
        }

        function updateCellLastModified(x, y) {
            board.modified[y][x] = Date.now();
        }

        function revealCell(x, y) {
            if (getState(x, y) === 'flag') {
                return;
            }

            setState(x, y, 'revealed');
            revealMineCount(x, y);

            var mineCount = getMineCount(x, y);
            if (mineCount === 0) {
                var neighbours = getNeighbouringCells(x, y);
                neighbours.forEach(function(neighbour) {
                    if (getState(neighbour.x, neighbour.y) === 'hidden') {
                        revealCell(neighbour.x, neighbour.y);
                    }
                });
            }
            revealMineCount(x, y);
            updateCellLastModified(x, y);
        }

        function revealNeighbouringCells(x, y) {
            var neighbours = getNeighbouringCells(x, y);
            neighbours.forEach(function(cell) {
                revealCell(cell.x, cell.y);
            });
        }

        function revealMineCount(x, y) {
            if (cellHasMine(x, y)) {
                getCellElement(x, y).addClass('has-mine');
                return;
            }
            var mineClasses = ['has-one-mine', 'has-two-mines', 'has-three-mines', 'has-four-mines', 'has-five-mines', 'has-six-mines', 'has-seven-mines', 'has-eight-mines']
            var mineCount = getMineCount(x, y);
            var mineClass = mineClasses[mineCount - 1];
            var $cell = getCellElement(x, y);
            $cell.html(mineCount > 0 ? mineCount : '');
            $cell.addClass(mineClass);
        }

        function getMineCount(x, y) {
            var neighbours = getNeighbouringCells(x, y);

            var cellsWithMines = 0;
            neighbours.forEach(function(cell) {
                if (cellHasMine(cell.x, cell.y)) {
                    cellsWithMines++;
                }
            });

            return cellsWithMines;

        }

        function getNeighbouringCells(x, y) {
            var neighbours = [];
            for (var dx = -1; dx <= 1; dx++) {
                for (var dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) {
                        continue;
                    }

                    var thisX = x + dx;
                    var thisY = y + dy;

                    if (thisX > WIDTH || thisX < 0) {
                        continue;
                    }

                    if (thisY > HEIGHT || thisY < 0) {
                        continue;
                    }

                    neighbours.push({
                        x: thisX,
                        y: thisY
                    });
                }
            }

            return neighbours;
        }

        function cellHasMine(x, y) {
            return board.mines[y][x] === true;
        }

        function save(callback) {
            $.post('/save', {board: board}, function(board) {
                callback(board);
            });
        }

        function fetch(callback) {
            $.post('/fetch', function(board) {
                callback(board);
            });
        }

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

        function init() {
            fetch(function (serverBoard) {
                board = serverBoard;
                console.log(board.mines);
                renderBoard();
            });

            bindInteraction();

            setInterval(function () {
                save(function (board) {

                });
            }, 2000);

        }

        init();
    });
});
