import amqp from 'amqplib';
import express, { type Request, type Response } from 'express';

const app = express();
const port = 3000;
const queue = 'file_metadata_queue';

app.use(express.json());

async function sendToQueue(metadata: any) {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, {
            durable: true
        });

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(metadata)), {
            persistent: true
        });

        console.log(" [x] Sent %s", JSON.stringify(metadata));

        setTimeout(() => {
            connection.close();
        }, 500);
    } catch (error) {
        console.error("Error sending to queue:", error);
    }
}

app.post('/upload-metadata', async (req: Request, res: Response) => {
    const { filename, size, type, uploader } = req.body;

    if (!filename || !size || !type) {
        return res.status(400).send({ error: 'Missing metadata fields' });
    }

    const metadata = {
        filename,
        size,
        type,
        uploader: uploader || 'anonymous',
        timestamp: new Date().toISOString()
    };

    await sendToQueue(metadata);
    res.status(202).send({ message: 'Metadata received and queued for processing', metadata });
});

app.listen(port, () => {
    console.log(`Producer server listening at http://localhost:${port}`);
});
