/**
 * This code is based on a tutorial found here: https://bl.ocks.org/cagrimmett/07f8c8daea00946b9e704e3efcbd5739
 *
 * Thanks Chuck!
 */

const WIDTH = 25;
const HEIGHT = 25;
const NUM_ROW = 20;
const NUM_COL = 50;
const GRID_WIDTH = WIDTH * NUM_COL;
const GRID_HEIGHT = HEIGHT * NUM_ROW
const ORANGE_COLOR = "#FFA500";
const PINK_COLOR = "#F2ACB9";
const BLUE_COLOR = "#6ca0dc";

function initializeGameBoard() {
    data = [];
    xpos = 0;
    ypos = 0;

    for (let row = 0; row < NUM_ROW; row++) {
        data.push([]);
        for (let column = 0; column < NUM_COL; column++) {
            data[row].push({
                x: xpos,
                y: ypos,
                width: WIDTH,
                height: HEIGHT,
                alive: 0,
                new_alive: 0,
                x_index: column,
                y_index: row
            })
            // increment the x position. I.e. move it over by width variable
            xpos += WIDTH;
        }
        xpos = 0;
        // increment the y position for the next row. Move it down by our height variable
        ypos += HEIGHT;
    }
    return data;
}

// Initialize the grid.  This contains all of our cells
let gridData = initializeGameBoard();

// These variables contain the gridInterval timer, which is used to update the simulation state, and a boolean
// flag if the game is active.  If the game is active, users will not be able to click a cell in the simuluation
// to toggle its state.
let gridInterval = null;
let gameActive = false;
// Cell color initially set to orange, this will be toggled to pink once the announcement is done
let cellColor = ORANGE_COLOR;

// the countdown will start on the last game state that we have
let currentStep = simulationState.length - 1
// while countdown active is true, we will run in reverse,
// playing the recorded data to make the announcement.
let countdownActive = true;

let countdownInterval = setInterval(function () {

    if (!dateExpired) {
        // we don't do anything until the countdown timer has reached
        // zero, so if that isn't the case, just return.  This value
        // Is set in the main HTML file.
        return;
    }

    if (currentStep === 0) {
        cellColor = PINK_COLOR;
        restoreSimulationState(currentStep)
        clearInterval(countdownInterval);
        countdownActive = false;
        // We can also set the two button rows to visible to allow people to interact with the announcement.
        document.getElementById("button-row-1").hidden = false;
        document.getElementById("button-row-2").hidden = false;
    } else {
        if (currentStep === 1) {
            // A little fakeout :)
            cellColor = BLUE_COLOR;
        }
        restoreSimulationState(currentStep);
        decrementCurrentStep();
    }
}, 500);

function updateGameBoard(data) {
    function getAliveNeighbors(x, y) {
        let aliveNeighbors = 0
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    // we don't count the cell itself when checking for alive neighbors
                    continue;
                }
                let nx = x + i;
                let ny = y + j;
                if (nx >= 0 && nx < NUM_COL && ny >= 0 && ny < NUM_ROW) {
                    aliveNeighbors += data[ny][nx].alive
                }
            }
        }
        return aliveNeighbors
    }

    for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[0].length; x++) {
            let cell = data[y][x];
            let neighbors = getAliveNeighbors(x, y);
            // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
            // Any live cell with more than three live neighbours dies, as if by overpopulation.
            if (neighbors < 2 || neighbors > 3) {
                // If the cell we're looking at is alive, we need to set it to dead
                cell.new_alive = 0;
            }
            // if exactly 2 neighbors, remain stable.  If cell is dead it stays dead, if alive, it remains alive.
            if (neighbors === 2) {
                cell.new_alive = cell.alive;
            }
            //Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
            if (neighbors === 3) {
                // If the cell we're looking at is dead, we need to set it to alive
                cell.new_alive = 1;
            }
        }
    }
    // Now that we have updated all the new_alive values, lets copy
    // the new alive value to alive, and change colors if needed
    for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[0].length; x++) {
            let cell = data[y][x];
            // We only need to swap the color if we've gone from alive to dead, or dead to alive.
            if (cell.new_alive === 1 && cell.alive === 0) {
                setCellAliveColor(cell);
            }
            if (cell.new_alive === 0 && cell.alive === 1) {
                setCellDeadColor(cell);
            }
            cell.alive = cell.new_alive;
        }
    }
    // Now that we have all the new alive states, let's capture this step.
    recordGameState();
    // We don't really need to return data, but let's do it anyway
    return data;
}

function setCellAliveColor(cell) {
    d3.select("#cell_" + cell.x_index + "_" + cell.y_index).style("fill", cellColor);
}

function setCellDeadColor(cell) {
    d3.select("#cell_" + cell.x_index + "_" + cell.y_index).style("fill", "#fff");
}

function playSimulation() {
    // Our initial state needs to be captured, so we'll do that here.
    recordGameState();
    // Updates the game board, i.e a tick of time in the Game Of Life Simulation
    gridInterval = setInterval(function () {
        gridData = updateGameBoard(gridData)
    }, 500);
    // Set the game to active, so we have an easy way of identifying this.
    gameActive = true;
}

function pauseSimulation() {
    if (gridInterval != null) {
        // Clear the interval that's updating the game state.
        clearInterval(gridInterval);
        gridInterval = null;
        // Set game active to false, so we can easily identify the game isn't running.
        gameActive = false;
    }
}

function resetSimulation() {
    // Resetting the simulation should also pause the simulation, allowing the player to enter new data.
    pauseSimulation();
    // Let's also restore the initial state of the game board.
    if (simulationState.length !== 0) {
        restoreSimulationState(0);
    }
    // Clear the stored simulation state
    simulationState = Array()
    //Set the current step back to zero
    updateStep(0);
}

// recordGameState should be called after every update step, and when the play button is pressed.  It checks to see
// if the board is clear, and if it isn't it records the state and increments the current step.  If the board game is
// clear, then nothing will happen in subsequent steps, so we stop counting which step we're on, and stop recording
// the data.
function recordGameState() {
    if (!isBoardGameClear()) {
        simulationState.push(captureSimulationState());
        incrementCurrentStep();
    }
}

function captureSimulationState() {
    let gameData = Array();
    for (let y = 0; y < gridData.length; y++) {
        let rowData = Array();
        for (let x = 0; x < gridData[0].length; x++) {
            rowData.push(gridData[y][x].alive);
        }
        gameData.push(rowData);
    }
    return gameData;
}

function restoreSimulationState(step) {
    let currentGameState = simulationState[step]
    for (let y = 0; y < gridData.length; y++) {
        for (let x = 0; x < gridData[0].length; x++) {
            let cell = gridData[y][x];
            if (currentGameState[y][x] === 1) {
                cell.alive = 1
                setCellAliveColor(cell);
            } else {
                cell.alive = 0
                setCellDeadColor(cell);
            }
        }
    }
}

function isBoardGameClear() {
    for (let y = 0; y < gridData.length; y++) {
        for (let x = 0; x < gridData[0].length; x++) {
            let cell = gridData[y][x];
            if (cell.alive === 1) {
                return false;
            }
        }
    }
    return true;
}

function incrementCurrentStep() {
    currentStep++;
    document.getElementById("stepParagraph").innerHTML = "Step " + currentStep;
}

function decrementCurrentStep() {
    currentStep--;
    document.getElementById("stepParagraph").innerHTML = "Step " + currentStep;
}

function updateStep(step) {
    currentStep = step;
    document.getElementById("stepParagraph").innerHTML = "Step " + currentStep;
}

// This method is only used by the developer, me!  This is used to print out the state of a simulation, so
// I can copy it down and include it in the code, so we can run it backwards for the announcement.
function printSimulationState() {
    console.log(JSON.stringify(simulationState));
}

var grid = d3.select("#grid")
    .append("svg")
    .attr("width", GRID_WIDTH + "px")
    .attr("height", GRID_HEIGHT + "px");

var row = grid.selectAll(".row")
    .data(gridData)
    .enter().append("g")
    .attr("class", "row");

var column = row.selectAll(".square")
    .data(function (d) {
        return d;
    })
    .enter().append("rect")
    .attr("class", "square")
    .attr("x", function (d) {
        return d.x;
    })
    .attr("y", function (d) {
        return d.y;
    })
    .attr("width", function (d) {
        return d.width;
    })
    .attr("height", function (d) {
        return d.height;
    })
    .attr("id", function (d) {
        return "cell_" + d.x_index + "_" + d.y_index
    })
    .style("fill", "#fff")
    .style("stroke", "#222")
    .on('click', function (cell) {
        if (gameActive) {
            // You can only click to change the
            // state of a cell when the game isn't active.
            return;
        }
        cell.alive = cell.alive === 1 ? 0 : 1
        if (cell.alive) {
            setCellAliveColor(cell);
        } else {
            setCellDeadColor(cell);
        }
    });