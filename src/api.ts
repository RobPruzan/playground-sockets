import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

export const app = express();

app.use(
  cors({
    origin: [
      'https://www.algoviz.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ]
  })
);

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

app.use(cors());

export const server = require('http').createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://www.algoviz.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    methods: ['GET', 'POST']
    // credentials: true
  }
});
type Meta = {
  userID: string;
  playgroundID: string;
  fromServer?: boolean;
  scaleFactor?: number;
};
type SocketAction = { type: string; payload: any } & { meta: Meta | undefined };

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};
// should code split to get the type from next
type ObjectState = {
  circles: any;
  attachableLines: any;
  validatorLensContainer: any;
  pencilCoordinates: any;
};

const playgroundUsers = new Map<string, (User | { id: string })[]>();
// let mainId = '';

io.on('connect', (socket) => {
  console.log('user connected');
  socket.on(
    'join playground',

    (playgroundID: string, user: User, acknowledgement) => {
      // mainId = roomID;
      const before_UsersInPlayground = playgroundUsers.get(playgroundID);

      if (before_UsersInPlayground?.some((u) => u.id === user.id)) {
        return;
      }

      playgroundUsers.set(
        playgroundID,

        [...(before_UsersInPlayground ?? []), user]
      );

      socket.join(playgroundID);
      const after_UsersInPlayground = playgroundUsers.get(playgroundID);

      acknowledgement(after_UsersInPlayground);
      socket.emit('user joined playground', user);
    }
  );

  socket.on('action', (data: SocketAction) => {
    data.meta.fromServer = true;
    socket.broadcast.to(data.meta.playgroundID).emit('action', data);
  });

  socket.on('disconnect', () => {
    // #TODO
  });

  socket.on(
    'synchronize',
    (
      state: ObjectState,
      cameraCoordinate: [number, number],
      zoomFactor: number,
      playgroundID: string
    ) => {
      socket.broadcast
        .to(playgroundID)
        .emit('synchronize', state, cameraCoordinate, zoomFactor);
    }
  );

  socket.on('get connected users', (playgroundID: string, acknowledgement) => {
    const usersInPlayground = playgroundUsers.get(playgroundID);

    acknowledgement(usersInPlayground);
  });
});

// const port = process.env.PORT || 8080;
// server.listen(port, () => {
//   console.log(`listening on *:${port}`, new Date().getTime());
// });

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

// const api = express.Router();

// api.get('/hello', (req, res) => {
//   res.status(200).send({ message: 'hello world' });
// });

// // Version the api
// app.use('/api/v1', api);
