import uniqid from 'uniqid';
import Game from './models/Game';
import Ball from './models/Ball';
import Player from './models/Player';
import type { Server } from 'bun';
import {
    defaultPort,
    ballInitParams,
    playerInitParams,
    maxPlayers,
    messages,
} from './const';

export default (games: Record<string, Game>): Server => {
    const server: Server = Bun.serve<{ sessionId: string, channel: string }>({
        port: process.env.PORT ?? defaultPort,
    
        fetch(req, server) {
            const sessionId = req.headers.get('cookie')?.split('sessionId=')[1] ?? uniqid();
            const params = new URL(req.url);
            // fetching channel name of this game
            const channel = params.searchParams.get('channel') ?? 'default';
    
            if (server.upgrade(req, {
                    data: {
                        sessionId,
                        channel,
                    },
                    headers: {
                        'Set-Cookie': `sessionId=${sessionId}`,
                    }
                }
            )) {
                return;
            }
            return new Response('Can\'t upgrade connection', {
                status: 500,
            });
        },
    
        websocket: {
            open(ws) {
                const { channel, sessionId } = ws.data;
                // if it's new game then creating a new game instanse
                const { coords, degrees, speed } = ballInitParams;
                if (!games[channel]) {
                    games[channel] = new Game(
                        new Ball(coords, degrees, speed),
                        [],
                        false,
                        null
                    );
                    // starting game loop
                    games[channel].startGameProcess(server, channel);

                    ws.send(JSON.stringify({ message: messages.waiting2ndPlayer }));
                }
    
                // if there are no players or there is one
                // then add a new player and subscribe him on the channel
                if (games[channel].getPlayersCount() < 2) {
                    const { speed, racketCoordY } = playerInitParams;
                    games[channel].addPlayer(new Player(sessionId, speed, racketCoordY));
                    ws.subscribe(channel);
    
                    // if it's a second player then starting the game
                    if (games[channel].getPlayersCount() === maxPlayers) {
                        games[channel].restartGameProcess(server, channel);
                    }
                // if the channel is filled (both players) then text about it
                } else {
                    ws.send(JSON.stringify({ message: messages.isInProcess }));
                }
            },
            message(ws, message) {
                const { channel, sessionId } = ws.data;
                // catch keys pressing (arrow up/arrow down)
                if (JSON.parse(message as string).key) {
                    const player = games[channel].getPlayerBySessionId(sessionId);
                    if (!player) {
                        return;
                    }
                    const { key } = JSON.parse(message as string);
                    player.movePlayer(key, games[channel]);
                }
                // push all recieved messages to the channel
                ws.publish(channel, message);
            },
            close(ws) {
                const { channel, sessionId } = ws.data;
                if (!games[channel]) {
                    return;
                }
                // is this player is active?
                const player = games[channel].getPlayerBySessionId(sessionId);
                
                if (player) {
                    // remove player from the game
                    games[channel].removePlayerBySessionId(sessionId);
    
                    // if there are no players then remove channel and stop game loop
                    if (games[channel].getPlayersCount() === 0) {
                        games[channel].finishGameProcess();
                        delete games[channel];
                    // otherwise reset game process and waiting a new player
                    } else {
                        games[channel].resetGameProcess();
    
                        server.publish(
                            channel,
                            JSON.stringify({
                                message: messages.waiting2ndPlayer,
                                players: games[channel].getAllPlayers(),
                                play: games[channel].isPlay(),
                            })
                        );
                    }
                }
            }
        },
    });

    return server;
};
