import {MongoClient} from 'mongodb'
import '../loadEnv.js';


const connectionString = process.env.MONGODB_URI || '';

// Mongodb client instance
const client = new MongoClient(connectionString);

// // connection
// let conn;
// try {
//     // tries to connect to the database
//     conn = await client.connect();
// } catch (e) {
//     console.error('Error connecting to MongoDB', e);
// }
// // Selecting the db to use
// const db = conn.db('sample_training');
// export default db;

let db;

async function connectDB() {
    if (!db) {
        try {
            const conn = await client.connect();
            db = conn.db('sample_training');  

            console.log('Successfully connected to MongoDB');
            const gradesCollection = db.collection('grades');
            await gradesCollection.createIndex({ class_id: 1 });
            await gradesCollection.createIndex({ learner_id: 1 });
            await gradesCollection.createIndex({ learner_id: 1, class_id: 1 });

            console.log('Indexes created successfully');

        } catch (e) {
            console.error('Error connecting to MongoDB', e);
            throw e; 
        }
    }
    return db;
}

export default connectDB;