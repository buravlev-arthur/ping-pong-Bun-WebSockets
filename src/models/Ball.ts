import Player from './Player';
import Game from './Game';
import type { Server } from 'bun';
import {
    ballLimits,
    xPlayersCoords,
    ballPositionTolerance,
    ballInitParams,
    ballChangeSpeedRatio,
    ballSize,
    playerThird,
    playerInitParams,
} from '../const';

export default class Ball {
    private xLimits: { min: number, max: number } = ballLimits.xLimits;
    private yLimits: { min: number, max: number } = ballLimits.yLimits;
    private playersCoords: number[] = xPlayersCoords;
    private initBallCoords = [
        Math.round(this.xLimits.max / 2),
        Math.round(this.yLimits.max / 2)
    ];

    private currentCoords: number[] = [ 0, 0 ];
    private radPi: number = 180;
    private speed: number = 1;
    private degrees: number = 0;

    constructor(
        initCoords: Ball['currentCoords'] = [ 0, 0 ],
        initDegrees: Ball['degrees'] = 0,
        initSpeed: Ball['speed'] = 1
    ) {
        this.currentCoords = initCoords;
        this.speed = initSpeed;
        this.degrees = initDegrees;
    }   

    private getCoordsAlpha(): number[] {
        const rad = this.degrees * (Math.PI / this.radPi);
        const sin = Math.sin(Number(rad.toFixed(5)));
        const cos = Math.cos(Number(rad.toFixed(5)));
        return [
            Math.round(sin * this.speed),
            Math.round(cos * this.speed),
        ]
    }

    private isBallAroundPlayer(
        ballCoords: number[],
        xPlayer: number,
        yPlayerRange: number[],
        degreesRange: number[]
    ): boolean {
        const [ xBall, yBall ] = ballCoords;
        const { degrees } = this;
        const isAroundPlayer = xBall >= (xPlayer - ballPositionTolerance) && xBall <= (xPlayer + ballPositionTolerance);
        const isInsideDegreesRange = degrees > degreesRange[0] && degrees < degreesRange[1];
        const isInsideYRange = yBall >= yPlayerRange[0] && yBall <= (yPlayerRange[1] - ballSize);
        return isAroundPlayer && isInsideDegreesRange && isInsideYRange;
    }

    private getStickedBallToPlayers(
            ballCoords: number[],
            leftPlayerCoordsRange: number[],
            rightPlayerCoordsRange: number[]
        ): number {
        const [ xBall ] = ballCoords;
        const [ xPlayerLeft, xPlayerRight ] = this.playersCoords;
        if (this.isBallAroundPlayer(ballCoords, xPlayerLeft, leftPlayerCoordsRange, [this.radPi, this.radPi * 2])) {
            return xPlayerLeft;
        }
        if (this.isBallAroundPlayer(ballCoords, xPlayerRight, rightPlayerCoordsRange, [0, this.radPi])) {
            return xPlayerRight;
        }
        return xBall;
    }

    getCoords(): { x: number, y: number } {
        const [ x, y ] = this.currentCoords;
        return { x, y };
    }

    setBallData(
        coords: Ball['currentCoords'],
        degress: Ball['degrees'],
        speed?: Ball['speed']
    ): void {
        this.currentCoords = coords ?? [ 0, 0 ];
        this.degrees = degress ?? 0;
        this.speed = speed ?? this.speed;
    }

    changeBallSpeed(player: Player): number {
        return player.isMoving()
        ? this.speed * ballChangeSpeedRatio
        : Math.max(this.speed / ballChangeSpeedRatio, ballInitParams.speed);
    }

    getRandomAngle(): number {
        return 45 + (Math.round(Math.random() * 20) - 10);
    }

    isBallHitsToPlayer(xPlayer: number, yPlayerRange: number[]): boolean {
        const [ x, y ] = this.currentCoords;
        return (x == xPlayer) && (y >= yPlayerRange[0] && y <= (yPlayerRange[1] - ballSize));
    }

    addPointAndReset(
        game: Game,
        playerIndex: number,
        degrees: number,
        server: Server,
        channel: string
    ): void {
        const players = game.getAllPlayers();
        players[playerIndex].addPoint();
        if (players[playerIndex].isWinner()) {
            game.resetGameProcess();
            game.restartGameProcess(server, channel);
        } else {
            players.forEach((player) => player.resetPlayer(playerInitParams.racketCoordY));
            this.setBallData(this.initBallCoords, degrees, ballInitParams.speed);
            game.pauseGameProcess();
        }
    }

    strictCoordByBorders(
        coord: number,
        limits: { min: number, max: number }
    ): number {
        return Math.min(Math.max(coord, limits.min), limits.max);
    }

    isBallInAngle(): number | boolean {
        const [ x, y ] = this.currentCoords;
        if (x == this.xLimits.min && y == this.yLimits.min) {
            return this.radPi / 4;
        } 
        else if (x == this.xLimits.min && y == this.yLimits.max) {
            return this.radPi / 4 * 3;
        }
        else if (x == this.xLimits.max && y == this.yLimits.max) {
            return this.radPi / 4 * 5;
        }
        else if (x == this.xLimits.max && y == this.yLimits.min) {
            return this.radPi / 4 * 7;
        }
        return false;
    }

    isBallOnTopBottomBorder(): number | boolean {
        const [ , y ] = this.currentCoords;
        if (y == this.yLimits.min || y == this.yLimits.max) {
            return this.degrees <= this.radPi
                ? this.radPi - this.degrees
                : this.radPi * 3 - this.degrees;
        }
        return false;
    }

    setBallAgainstPlayer(game: Game, playerIndex: number, playerCoordsRange: number[]): void {
        let shift = 0;
        const player = game.getAllPlayers()[playerIndex];
        const [ , y ] = this.currentCoords;
        const random = this.getRandomAngle();
        if (y < (playerCoordsRange[0] + playerThird)) {
            shift = !playerIndex ? (shift + random) : (shift - random);
        } else if (y > (playerCoordsRange[1] - playerThird)) {
            shift = !playerIndex ? (shift - random) : (shift + random)
        }
        const newDegress = this.radPi * 2 - this.degrees + shift;
        const newSpeed = this.changeBallSpeed(player);
        this.setBallData(
            [ this.playersCoords[playerIndex], this.currentCoords[1] ],
            newDegress,
            newSpeed
        );
    }

    moveBall(
        game: Game,
        server: Server,
        channel: string
    ): void {
        const [ x, y ] = this.currentCoords;
        const [ leftPlayer, rightPlayer ] = game.getAllPlayers();
        const leftPlayerCoordsRange = leftPlayer.getPlayerCoordsRange();
        const rightPlayerCoordsRange = rightPlayer.getPlayerCoordsRange();

        if (!leftPlayer || !rightPlayer || !game) return;

        const degreesAgainstCorner = this.isBallInAngle();
        const degreesAgainstTopBottomBorders = this.isBallOnTopBottomBorder();
        if (degreesAgainstCorner) {
            this.degrees = degreesAgainstCorner as number;
        }
        // if the ball is on top or bottom borders
        else if (degreesAgainstTopBottomBorders !== false) {
            this.degrees = degreesAgainstTopBottomBorders as number;
        }
        // if the ball around a left player
        else if (this.isBallHitsToPlayer(this.playersCoords[0], leftPlayerCoordsRange)) {
            this.setBallAgainstPlayer(game, 0, leftPlayerCoordsRange);
        }
        // if the ball around a right player
        else if (this.isBallHitsToPlayer(this.playersCoords[1], rightPlayerCoordsRange)) {
            this.setBallAgainstPlayer(game, 1, rightPlayerCoordsRange);
        }
        // if the ball has leaved the field (to left)
        else if ( x === this.xLimits.min ) {
            this.addPointAndReset(game, 1, this.radPi * 1.5, server, channel);
        }
        // if the ball has leaved the field (to right)
        else if ( x === this.xLimits.max ) {
            this.addPointAndReset(game, 0, this.radPi / 2, server, channel);
        }

        const [ alphaX, alphaY ] = this.getCoordsAlpha();
        const [ currentX, currentY ] = this.currentCoords;
        const xBorderStricted = this.strictCoordByBorders(currentX + alphaX, this.xLimits);
        const yBorderStricted = this.strictCoordByBorders(currentY + alphaY, this.yLimits);
        this.currentCoords = [
            this.getStickedBallToPlayers(
                [ xBorderStricted, yBorderStricted ],
                leftPlayerCoordsRange,
                rightPlayerCoordsRange
            ),
            yBorderStricted
        ];
    }
}