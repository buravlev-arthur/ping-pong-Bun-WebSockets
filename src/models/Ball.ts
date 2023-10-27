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

    private getStickedBallToPlayers(
            ballCoords: number[],
            leftPlayerCoordsRange: number[],
            rightPlayerCoordsRange: number[], 
            ballSize: number
        ): number {
        const [ x, y ] = ballCoords;
        const [ xPlayerLeft, xPlayerRight ] = this.playersCoords;
        const degrees = this.degrees;

        if (
            ((x >= (xPlayerLeft - ballPositionTolerance) && x <= (xPlayerLeft + ballPositionTolerance)))
            && (degrees > this.radPi && degrees < this.radPi * 2)
            && (y >= leftPlayerCoordsRange[0] && y <= (leftPlayerCoordsRange[1] - ballSize))
        ) {
            return xPlayerLeft;
        }
        if (
            (x >= (xPlayerRight - ballPositionTolerance) && x <= (xPlayerRight + ballPositionTolerance))
            && (degrees > 0 && degrees < this.radPi)
            && (y >= rightPlayerCoordsRange[0] && y <= (rightPlayerCoordsRange[1] - ballSize))
        ) {
            return xPlayerRight;
        }
        return x;
    }

    getCoords(): { x: number, y: number } {
        const [ x, y ] = this.currentCoords;
        return { x, y };
    }

    setBallData(
        coords: Ball['currentCoords'],
        degress: Ball['degrees'],
        speed?: Ball['speed']
    ) {
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

    moveBall(
        game: Game,
        server: Server,
        channel: string
    ): void {
        const [ leftPlayer, rightPlayer ] = game.getAllPlayers();
        const [ x, y ] = this.currentCoords;
        const leftPlayerCoordsRange = leftPlayer.getPlayerCoordsRange();
        const rightPlayerCoordsRange = rightPlayer.getPlayerCoordsRange();
        const initBallCoords = [
            Math.round(this.xLimits.max / 2),
            Math.round(this.yLimits.max / 2)
        ];

        if (!leftPlayer || !rightPlayer || !game) {
            return;
        }

        // if the ball is on same angle
        if (x == this.xLimits.min && y == this.yLimits.min) {
            this.degrees = this.radPi / 4;
        } 
        else if (x == this.xLimits.min && y == this.yLimits.max) {
            this.degrees = this.radPi / 4 * 3;
        }
        else if (x == this.xLimits.max && y == this.yLimits.max) {
            this.degrees = this.radPi / 4 * 5;
        }
        else if (x == this.xLimits.max && y == this.yLimits.min) {
            this.degrees = this.radPi / 4 * 7;
        }
        // if the ball is on top or bottom borders
        else if (y == this.yLimits.min || y == this.yLimits.max) {
            this.degrees = this.degrees <= this.radPi
                ? this.radPi - this.degrees
                : this.radPi * 3 - this.degrees;
        }
        // if the ball around a left player
        else if (
                (x == this.playersCoords[0])
                && (y >= leftPlayerCoordsRange[0] && y <= (leftPlayerCoordsRange[1] - ballSize))
        ) {
            let shift = 0;
            const random = this.getRandomAngle();
            if (y < (leftPlayerCoordsRange[0] + playerThird)) {
                shift += random;
            } else if (y > (leftPlayerCoordsRange[1] - playerThird)) {
                shift -= random;
            }
            const newDegress = this.radPi * 2 - this.degrees + shift;
            const newSpeed = this.changeBallSpeed(leftPlayer);
            this.setBallData(
                [ this.playersCoords[0], this.currentCoords[1] ],
                newDegress,
                newSpeed
            );
        }
        // if the ball around a right player
        else if (
            (x >= this.playersCoords[1] && x < this.xLimits.max)
            && (y >= rightPlayerCoordsRange[0] && y <= (rightPlayerCoordsRange[1] - ballSize))
        ) {
            let shift = 0;
            const random = this.getRandomAngle();
            if (y < (rightPlayerCoordsRange[0] + playerThird)) {
                shift -= random;
            } else if (y > (rightPlayerCoordsRange[1] - playerThird)) {
                shift += random;
            }
            const newDegress = this.radPi * 2 - this.degrees + shift;
            const newSpeed = this.changeBallSpeed(rightPlayer);
            this.setBallData(
                [ this.playersCoords[1], this.currentCoords[1] ],
                newDegress,
                newSpeed,
            );
        }
        // if the ball has leaved the field (to left)
        else if ( x === this.xLimits.min ) {
            rightPlayer.addPoint();
            if (rightPlayer.isWinner()) {
                game.resetGameProcess();
                game.restartGameProcess(server, channel);
            } else {
                [ leftPlayer, rightPlayer ]
                    .forEach((player) => player.resetPlayer(playerInitParams.racketCoordY));
                this.setBallData(initBallCoords, this.radPi * 1.5, ballInitParams.speed);
                game.pauseGameProcess();
            }
        }
        // if the ball has leaved the field (to right)
        else if ( x === this.xLimits.max ) {
            leftPlayer.addPoint();
            if (leftPlayer.isWinner()) {
                game.resetGameProcess();
                game.restartGameProcess(server, channel);
            } else {
                [ leftPlayer, rightPlayer ]
                    .forEach((player) => player.resetPlayer(playerInitParams.racketCoordY));
                this.setBallData(initBallCoords, this.radPi / 2, ballInitParams.speed);
                game.pauseGameProcess();
            }
        }

        const [ alphaX, alphaY ] = this.getCoordsAlpha();
        const [ currentX, currentY ] = this.currentCoords;
        const xBorderStricted = Math.min(Math.max(currentX + alphaX, this.xLimits.min), this.xLimits.max);
        const yBorderStricted = Math.min(Math.max(currentY + alphaY, this.yLimits.min), this.yLimits.max);
        this.currentCoords = [
            this.getStickedBallToPlayers(
                [ xBorderStricted, yBorderStricted ],
                leftPlayerCoordsRange,
                rightPlayerCoordsRange,
                ballSize
            ),
            yBorderStricted
        ];
    }
}