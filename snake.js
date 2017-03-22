const DEBUG = true;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Width/height of grid in block units.
const gridWidth = 50;
const gridHeight = 40;

// Width/height of block in pixels.
const blockDim = 10;

// Controls the speed of the game.
const speed = 100;

const keyCodes = {
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40
};

const initialState = {
  isGameOver: false,
  isPaused: false,
  score: 0,
  // List of blocks comprising the snake body.
  snake: [3, 2, 1, 0].map(x => ({ x, y: gridHeight / 2, dir: keyCodes.RIGHT })),
  pivots: {}
};

let state;
const resetState = () => {
  state = JSON.parse(JSON.stringify(initialState));
  document.getElementById('gameover').style.display = 'none';
};

const coordToIdx = (x, y) => y * gridWidth + x;
const idxToCoord = idx => ({
  x: idx % gridWidth,
  y: Math.floor(idx / gridWidth)
});

const drawBlock = (x, y, color) => {
  ctx.beginPath();
  ctx.rect(x * blockDim, y * blockDim, blockDim, blockDim);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
};

const drawSnake = () => {
  const { snake } = state;
  snake.forEach(({ x, y }) => drawBlock(x, y, 'blue'));
};

const updateSnake = () => {
  const { interval, food, snake, pivots } = state;
  const translate = {
    [keyCodes.LEFT]:  ({ x, y, dir }) => ({ x: x - 1, y,	dir }),
    [keyCodes.RIGHT]: ({ x, y, dir }) => ({ x: x + 1, y,	dir }),
    [keyCodes.DOWN]:  ({ x, y, dir }) => ({ x,	      y: y + 1, dir }),
    [keyCodes.UP]:    ({ x, y, dir }) => ({ x,	      y: y - 1, dir })
  };

  const grow = {
    [keyCodes.LEFT]: translate[keyCodes.RIGHT],
    [keyCodes.RIGHT]: translate[keyCodes.LEFT],
    [keyCodes.DOWN]: translate[keyCodes.UP],
    [keyCodes.UP]: translate[keyCodes.DOWN]
  };

  const newSnake = snake.map(block => {
    const { x, y } = block;
    const dir = pivots[coordToIdx(x, y)] || block.dir;
    return translate[dir]({ x, y, dir });
  });

  // Boundary detection.
  const { x, y } = newSnake[0];
  if (x < 0
    || y < 0
    || x >= gridWidth
    || y >= gridHeight
    // Self intersection
    || newSnake.find(({ x: ox, y: oy }, idx) => idx !== 0 && x === ox && y === oy)) {
    endGame();
  }

  if (x === food.x && y === food.y) {
    const tail = newSnake[newSnake.length - 1];
    newSnake.push(grow[tail.dir](tail));
    state.score++;
    updateScore();
    spawnFood();
  }

  updatePivots();
  state.snake = newSnake;
};

const updateScore = () => {
  document.getElementById('score').textContent = state.score;
};

const spawnFood = () => {
  let x, y;
  const { snake } = state;

  do {
    x = Math.floor(Math.random() * gridWidth);
    y = Math.floor(Math.random() * gridHeight);
  } while (!!snake.find(({ x: ox, y: oy }) => x === ox && y === oy));
  state.food = { x, y };
};

const updatePivots = () => {
  const { pivots, snake } = state;

  // Remove the pivot after the last block of the snake has passed thru it.
  const { x, y } = snake[snake.length - 1];
  const idx = coordToIdx(x, y);
  if (pivots[idx]) {
    delete pivots[idx];
  }
};

const drawPivots = () => {
  const { pivots } = state;
  Object.keys(pivots).forEach(idx => {
    const { x, y } = idxToCoord(idx);
    drawBlock(x, y, 'red');
  });
};

const drawFood = () => {
  const { food: { x, y } } = state;
  drawBlock(x, y, 'blue');
};

const draw = () => {
  // console.log('BEFORE DRAW:', snake);
  drawSnake();
  drawFood();

  DEBUG && drawPivots();
};

const update = () => {
  updateSnake();
};

const loop = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  update();
};

const resumeGame = () => {
  state.isPaused = false;
  state.interval = setInterval(loop, speed);
  document.getElementById('paused').style.display = 'none';
};

const pauseGame = () => {
  state.isPaused = true;
  clearInterval(state.interval);
  document.getElementById('paused').style.display = 'block';
};

const endGame = () => {
  state.isGameOver = true;
  clearInterval(state.interval);
  document.getElementById('gameover').style.display = 'block';
};

const init = () => {
  resetState();
  updateScore();
  spawnFood();
  resumeGame();
};

canvas.style.backgroundColor = 'rgba(211, 211, 211, 1)';
init();

document.addEventListener('keydown', ({ keyCode }) => {
  switch (keyCode) {
    case keyCodes.SPACE:
      if (state.isGameOver) {
	init();
	break;
      }

      if (!state.isPaused) {
	pauseGame();
      } else {
	resumeGame();
      }
      break;

    case keyCodes.DOWN:
    case keyCodes.LEFT:
    case keyCodes.RIGHT:
    case keyCodes.UP: {
      const { pivots, snake } = state;
      const { x, y } = snake[0];
      pivots[coordToIdx(x, y)] = keyCode;
      break;
    }
  }
});
