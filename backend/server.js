import express from "express";
import mysql from 'mysql2'
import cors from 'cors'

const app = express();
app.use(cors());
app.use(express.json());

//configure database connection
const db = mysql.createConnection({
    host: 'localhost',
    //TODO: replace with working credentials
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
});

//establish connection to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

//TODO: make .get routes for needed data

//start server
const PORT = 3306;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});