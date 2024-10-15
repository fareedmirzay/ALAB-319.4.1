import {Router} from 'express';
import connectDB from "../db/conn.js"
import { ObjectId } from 'mongodb';

const router = new Router();

// Helper function to calculate weighted average
const calculateWeightedAverage = (scores) => {
    const weights = {
        exam: 0.5,
        quiz: 0.2,
        homework: 0.1,
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const weightedSum = scores.reduce((acc, score) => {
        return acc + (score.score * (weights[score.type] || 0));
    }, 0);

    return (weightedSum / totalWeight).toFixed(2);
};

// GET route to get statistics for all grades
router.get('/stats', async (req, res) => {
    try {
        const db = await connectDB();
        const gradesCollection = db.collection('grades');
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
        const db = await connectDB();
        const gradesCollection = db.collection('grades');
        const grades = await gradesCollection.find({ class_id: parseInt(classId) }).toArray();
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

// GET route for aggregation stats for a specific class
router.get('/grades/stats/:id', async (req, res) => {
    const classId = parseInt(req.params.id);
    try {
        const db = await connectDB();
        const gradesCollection = db.collection('grades');
        
        const pipeline = [
            { $match: { class_id: classId } },
            {
                $group: {
                    _id: null,
                    totalLearners: { $sum: 1 },
                    learnersAbove70: {
                        $sum: {
                            $cond: [{ $gt: [{ $avg: "$scores.score" }, 70] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalLearners: 1,
                    learnersAbove70: 1,
                    percentageAbove70: {
                        $cond: {
                            if: { $gt: ["$totalLearners", 0] },
                            then: { $multiply: [{ $divide: ["$learnersAbove70", "$totalLearners"] }, 100] },
                            else: 0
                        }
                    }
                }
            }
        ];

        const result = await gradesCollection.aggregate(pipeline).toArray();
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Class not found or no learners in class' });
        }
        
        res.status(200).json(result[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET route to fetch all grades
router.get("/", async (req, res) => {
    try {
        const db = await connectDB();
        const gradesCollection = db.collection('grades');
        const grades = await gradesCollection.find().limit(10).toArray();
        res.json({ grades });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET route to fetch a specific grade by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await connectDB();
        const gradesCollection = db.collection("grades");
        const grade = await gradesCollection.findOne({ _id: ObjectId.createFromHexString(id) });
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }
        res.status(200).json(grade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST route to create a new grade
router.post('/:id', async (req, res) => {
    try {
        const db = await connectDB();
        const gradesCollection = db.collection('grades');
        const newGrade = {
            scores: req.body.scores,
            class_id: req.body.class_id,
            learner_id: req.body.learner_id
        };

        const result = await gradesCollection.insertOne(newGrade);
        res.status(201).json({ message: 'Grade created successfully', id: result.insertedId });
    } catch (error) {
        res.status(400).json({ message: 'Error creating grade', error: error.message });
    }
});

// PATCH route to update a grade
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};

        ['scores', 'class_id', 'learner_id'].forEach(key => {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        });

        const db = await connectDB();
        const gradesCollection = db.collection('grades');
        const result = await gradesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        );

        res.status(result.matchedCount ? 200 : 404).json({ message: result.matchedCount ? 'Grade updated successfully' : 'Grade not found' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE route to delete a grade
router.delete('/:id', async (req, res) => {
    try {
        const db = await connectDB();
        const gradesCollection = db.collection('grades');
        const result = await gradesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.status(result.deletedCount ? 204 : 404).json({ message: result.deletedCount ? '' : 'Grade not found' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting grade', error: error.message });
    }
});

export default router;