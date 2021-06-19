import * as http from 'http';
import * as connect from 'connect';
const middlewares = connect();

const createServer = () => {
  http.createServer(middlewares).listen(3000, () => {
    console.log('simple-vite-dev-server start at localhost: 3000!');
  });
};

createServer();
