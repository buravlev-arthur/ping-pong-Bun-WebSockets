import startServer from './src/server';
import { messages, host } from './src/const';

const initApp = () => {
    const server = startServer({});
    console.log(`${messages.serverIsRunning} ${host}:${server.port}`);
};

initApp();
