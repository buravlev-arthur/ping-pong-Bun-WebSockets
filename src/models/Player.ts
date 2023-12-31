import Game from './Game';
import { playerYLimits, playerSize, maxPoints } from '../const';

export default class Player {
    private yLimit: Record<string, number> = playerYLimits;
    private racketYAlpha: Record<string, number> = {
        'ArrowUp': 1,
        'ArrowDown': -1,
    };
    private sessionId: string = '';
    private racketCoordY: number = 0;
    private score: number = 0;
    private speed: number = 1;
    private moving: boolean = false;
    private movingTimeout: NodeJS.Timeout | null = null;

    constructor(
        sessionId: string,
        speed?: number,
        racketCoordY?: number
    ) {
        this.sessionId = sessionId;
        this.speed = speed ?? this.speed;
        this.racketCoordY = racketCoordY ?? this.racketCoordY; 
    }

    isMoving(): boolean {
        return this.moving;
    }

    movePlayer(key: string, game: Game): void {
        if (this.movingTimeout) {
            clearTimeout(this.movingTimeout)
            this.movingTimeout = null;
        }

        if (!game.isPlay()) {
            return;
        }
        this.racketCoordY = Math.max(
            Math.min(this.racketCoordY + this.racketYAlpha[key] * this.speed, this.yLimit.max),
            this.yLimit.min
        );
        
        this.moving = true;
        this.movingTimeout = setTimeout(() => {
            this.moving = false;
        }, 200);
    }

    resetPlayer(racketCoordY?: number, score?: number, speed?: number) {
        this.racketCoordY = racketCoordY ?? 0;
        this.score = score ?? this.score;
        this.speed = speed ?? this.speed;
    } 

    addPoint() {
        this.score += 1;
    }

    isWinner(): boolean {
        return this.score === maxPoints;
    }

    getSessionId() {
        return this.sessionId;
    }

    getPlayerCoordsRange() {
        return [
            this.racketCoordY,
            this.racketCoordY + playerSize, 
        ]
    };

    getPlayerData() {
        return {
            sessionId: this.sessionId,
            racketY: this.racketCoordY,
            score: this.score
        }
    }
}
