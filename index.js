import express from "express";
import gradesRouter from "./routes/grades.js"

const app = express();
const PORT = process.env.PORT || 5000


//middlesware
app.use(express.json());
app.use('/api/grades', gradesRouter)


app.get("/", (req, res) => {
    res.send('running')
});

app.listen(PORT, () => {
    console.log(`server is runnung on port: ${PORT}`);
});