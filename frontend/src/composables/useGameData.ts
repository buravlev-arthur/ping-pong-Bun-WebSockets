import { ref, onMounted } from 'vue';
import { Ball, Player, RecivedData } from '../types';

export const useGameData = () => {
    const connectionTimeoutMs = 2000;
    const socket = ref<WebSocket | null>(null);
    const message = ref<string | null>(null);
    const ball = ref<Ball>({
      x: 0,
      y: 0
    });
    const players = ref<Player[]>([]);
    const isPlay = ref<RecivedData['play']>(false);

    onMounted(() => {
      const host = document.location.hostname;
      socket.value = new WebSocket(`ws://${host}:3577/`);

      setTimeout(() => {
          if (socket.value?.readyState === 3) {
            message.value = 'Server connection error';
          }
        }, connectionTimeoutMs);

      socket.value.addEventListener('message', (event) => {
        const recivedData: RecivedData = JSON.parse(event.data);
        const updatedBall = recivedData.ball;
        const updatedPlayers = recivedData.players;
        const serverMessage = recivedData.message;

        isPlay.value = recivedData.play ?? false;
        if (updatedBall) {
          ball.value = updatedBall;
        }
        if (updatedPlayers) {
          players.value = updatedPlayers;
        }
        if (serverMessage) {
          message.value = serverMessage;
        } else {
          message.value = null;
        }
      });
      listenKeyPress(socket.value);
    });

    return {
        ball,
        players,
        isPlay,
        message,
    };
};

const listenKeyPress = (socket: WebSocket): void => {
      const keys: string[] = [ 'ArrowUp', 'ArrowDown' ];
      let keyPressInterval: NodeJS.Timeout | null =null;

      document.addEventListener('keydown', (event) => {
        const key = event.code;
        if (keys.includes(key) && keyPressInterval === null) {
          keyPressInterval = setInterval(() => {
            socket?.send(JSON.stringify({ key: event.code }));
          }, 20);
        }
      });
      document.addEventListener('keyup', (event) => {
        const key = event.code;
        if (keys.includes(key) && keyPressInterval !== null) {
          clearInterval(keyPressInterval);
          keyPressInterval = null;
        }
      });
};
