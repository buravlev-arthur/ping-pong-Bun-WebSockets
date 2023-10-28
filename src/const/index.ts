// server
export const defaultPort = 3577;
export const host = 'ws://localhost';

// field
export const fieldParams = {
    width: 800,
    height: 500,
    borderWeight: 10,
};

// ball
export const ballSize = 10;
export const ballInitParams = {
    coords: [50, 240],
    degrees: 270,
    speed: 5,
};
export const ballLimits = {
    xLimits: {
        min: 0,
        max: fieldParams.width - fieldParams.borderWeight
    },
    yLimits: {
        min: 0,
        max: fieldParams.height - fieldParams.borderWeight
    }
}
export const ballPositionTolerance = 10;
export const ballChangeSpeedRatio = 1.2;

// players
export const playerSize = 100;
export const playerThird = playerSize / 3;
export const playerWeight = 10;
export const playerIndent = 40;
export const xPlayersCoords = [
    playerIndent + playerWeight,
    fieldParams.width - fieldParams.borderWeight - playerIndent - playerWeight
];
export const playerInitParams = {
    speed: 10,
    racketCoordY: 200,
};
export const maxPlayers = 2;
export const playerYLimits = {
    min: 0,
    max: fieldParams.height - playerSize
}

// game
export const loopTimeout = 10;
export const pauseTimeout = 2000;
export const secBeforeNewGame = 4;
export const maxPoints = 10;


// messages
export const messages = {
    isInProcess: 'The game is in proccess already',
    waiting2ndPlayer: 'Waiting for 2nd player...',
    serverIsRunning: 'WebSocket server is running on:',
    newGame: 'New game in:', 
}


