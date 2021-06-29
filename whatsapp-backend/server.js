// importing
import express from 'express';
import mongoose from "mongoose";
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1226183",
    key: "9b309fd19b798f9874b1",
    secret: "a778b4f91a004ef401ca",
    cluster: "us2",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = 'mongodb+srv://admin:Rg7CkZTfGd24F1A8@cluster0.esvst.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection

db.once('open', () => {
    // console.log("DB Connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        // console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log('Error triggering Pusher')
        }
    });
});


// ??????????

// api routes
app.get('/', (req,res) => res.status(200).send('hello world'))

app.get('/messages/sync', (req,res) => {
    Messages.find((err,data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post('/messages/new', (req,res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err,data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})

// listen
app.listen(port,() => console.log(`Listening on localhost:${port}`))