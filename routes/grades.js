import {Router} from 'express';
import db from "../db/conn.js"
import { ObjectId } from 'mongodb';

const router = new Router();


// This Helper function will calculate weighted average
const calculateWeightedAverage = (scores) => {
    const weights = {
        exam: 0.5,
        quiz: 0.2,
        homework: 0.1,
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const weightedSum = scores.reduce((acc, score) => {
        return acc + (score.score * weights[score.type] || 0);
    }, 0);

    return (weightedSum / totalWeight).toFixed(2);
};


// GET route to get statistics for all grades
router.get('/stats', async (req, res) => {
    try {
        const gradesCollection = await db.collection('grades');
        const grades = await gradesCollection.find().toArray();
        const totalLearners = grades.length;

        const learnersAbove70 = grades.filter(grade => {
            const average = calculateWeightedAverage(grade.scores);
            return average > 70;
        }).length;

        const percentageAbove70 = totalLearners > 0 ? ((learnersAbove70 / totalLearners) * 100).toFixed(2) : 0;

        res.status(200).json({
            totalLearners,
            learnersAbove70,
            percentageAbove70
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET route to get statistics for a specific class
router.get('/stats/:id', async (req, res) => {
    const classId = req.params.id;
    try {
        const gradesCollection = await db.collection('grades');
        const grades = await gradesCollection.find({ class_id: classId }).toArray(); 
        const totalLearners = grades.length;

        const learnersAbove70 = grades.filter(grade => {
            const average = calculateWeightedAverage(grade.scores);
            return average > 70;
        }).length;

        const percentageAbove70 = totalLearners ? ((learnersAbove70 / totalLearners) * 100).toFixed(2) : 0;

        res.status(200).json({
            totalLearners,
            learnersAbove70,
            percentageAbove70
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get("/", async (req, res) => {
   try {
    const gradesCollection = await db.collection('grades');
    const grades = await gradesCollection.find().limit(10).toArray();
    res.json({grades});
   } catch (e) {
    console.log(e);
   }
});

router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params
        const gradesCollection = await db.collection("grades")
        const grade = await gradesCollection.findOne({_id: ObjectId.createFromHexString(id)})
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }
        res.status(200).json(grade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const gradesCollection = await db.collection('grades');
        const newGrade = {
            scores: req.body.scores, 
            class_id: req.body.class_id,
            learner_id: req.body.learner_id
        };

        const result = await gradesCollection.insertOne(newGrade);
        res.status(201).json({ message: 'Grade created successfully', id: result.insertedId });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating grade' });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};

        ['scores', 'class_id', 'learner_id'].forEach(key => {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        });

        const result = await db.collection('grades').updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        );

        res.status(result.matchedCount ? 200 : 404).json({ message: result.matchedCount ? 'Grade updated successfully' : 'Grade not found' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await db.collection('grades').deleteOne({ _id: new ObjectId(req.params.id) });
        res.status(result.deletedCount ? 204 : 404).json({ message: result.deletedCount ? '' : 'Grade not found' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting grade' });
    }
})


export default router;





