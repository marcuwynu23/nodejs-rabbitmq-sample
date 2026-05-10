import amqp from 'amqplib';

const queue = 'file_metadata_queue';

async function consume() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, {
            durable: true
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, (msg) => {
            if (msg !== null) {
                const metadata = JSON.parse(msg.content.toString());
                console.log(" [x] Received file metadata:");
                console.table(metadata);
                
                // Simulate processing
                console.log(" [x] Processing file: %s...", metadata.filename);
                
                setTimeout(() => {
                    console.log(" [x] Done processing %s", metadata.filename);
                    channel.ack(msg);
                }, 1000);
            }
        }, {
            noAck: false
        });
    } catch (error) {
        console.error("Error consuming from queue:", error);
    }
}

consume();
