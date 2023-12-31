import Ball from './Ball';
import Player from './Player';
import type { Server } from 'bun';
import {
    maxPlayers,
    loopTimeout,
    pauseTimeout,
    ballInitParams,
    messages,
    secBeforeNewGame,
} from '../const';

export default class Game {
    private players: Player[] = [];
    private ball: Ball;
    private play: boolean = false;
    private gameProcess: NodeJS.Timeout | null = null; 

    constructor(
        ball: Ball,
        players?: Player[],
        play?: boolean,
        gameProccess?: NodeJS.Timeout | null,
    ) {
        this.ball = ball;
        this.players = players ?? this.players;
        this.play = play ?? this.play;
        this.gameProcess = gameProccess ?? this.gameProcess;
    }

    isPlay(): Game['play'] {
        return this.play;
    }

    getPlayersCount(): number {
        return this.players.length;
    }

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    removePlayerBySessionId(sessionId: string): void {
        this.players = this.players
            .filter((player) => player.getSessionId() !== sessionId);
    }

    getPlayerBySessionId(sessionId: Player['sessionId']): Player | undefined  {
        return this.players.find((player) => player.getSessionId() === sessionId);
    }

    getAllPlayers(): Player[] {
        return this.players;
    }

    startGameProcess = (server: Server, channel: string): void => {
        this.gameProcess = setInterval(() => {
            if (!this.play) {
                return;
            }
        
            this.ball.moveBall(this, server, channel);
            server.publish(
                channel,
                JSON.stringify({
                    ball: this.ball.getCoords(),
                    players: this.players
                        .map((player) => player.getPlayerData()),
                    play: this.play,
                })
            );
        }, loopTimeout);
    };

    pauseGameProcess(): void {
        this.play = false;
        setTimeout(() => {
            if (this.getPlayersCount() < maxPlayers) {
                return;
            }
            this.play = true;
        }, pauseTimeout);
    }

    resetGameProcess(): void {
        this.play = false;
        this.players.forEach((player) => player.resetPlayer(200, 0, 20));
        this.ball.setBallData(
            ballInitParams.coords,
            ballInitParams.degrees,
            ballInitParams.speed
        );
    }

    restartGameProcess(server: Server, channel: string): void {
        let timer: number = secBeforeNewGame;
        this.play = false;
        const interval = setInterval(() => {
            if (this.getPlayersCount() < maxPlayers) {
                clearInterval(interval);
                return;
            }
            server.publish(
                channel,
                JSON.stringify({ message: `${messages.newGame} ${timer - 1}` })
            );
            timer -= 1;
            if (timer === 2) {
                this.pauseGameProcess();
            }
            if (!timer) {
                clearInterval(interval);
            }
        }, 1000);
    }

    finishGameProcess(): void {
        clearInterval(this.gameProcess as NodeJS.Timeout);
        this.gameProcess = null;
    }
}