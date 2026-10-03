const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Allow JSON data from frontend
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Optimization API
app.post("/api/optimize", (req, res) => {

    const { maxTime, assignments } = req.body;

    // Validate input
    if (maxTime === undefined || !Array.isArray(assignments)) {
        return res.status(400).json({
            error: "Invalid input data"
        });
    }

    const availableTime = Number(maxTime);

    if (availableTime <= 0 || !Number.isInteger(availableTime)) {
        return res.status(400).json({
            error: "Available time must be a positive whole number"
        });
    }

    if (assignments.length === 0) {
        return res.status(400).json({
            error: "Please add at least one assignment"
        });
    }

    const n = assignments.length;

    // Dynamic Programming table
    let dp = Array(n + 1)
        .fill(0)
        .map(() => Array(availableTime + 1).fill(0));

    // 0/1 Knapsack
    for (let i = 1; i <= n; i++) {

        const time = Number(assignments[i - 1].time);
        const marks = Number(assignments[i - 1].marks);

        for (let t = 0; t <= availableTime; t++) {

            if (time <= t) {

                dp[i][t] = Math.max(
                    marks + dp[i - 1][t - time],
                    dp[i - 1][t]
                );

            } else {

                dp[i][t] = dp[i - 1][t];

            }
        }
    }

    // Find selected assignments
    let remainingTime = availableTime;
    let selected = [];

    for (let i = n; i > 0; i--) {

        if (dp[i][remainingTime] !== dp[i - 1][remainingTime]) {

            selected.push(assignments[i - 1]);

            remainingTime -= Number(assignments[i - 1].time);
        }
    }

    selected.reverse();

    // Calculate used time
    const usedTime = selected.reduce(
        (total, assignment) =>
            total + Number(assignment.time),
        0
    );

    // Maximum marks
    const maxMarks = selected.reduce(
        (total, assignment) =>
            total + Number(assignment.marks),
        0
    );

    // Find skipped assignments
    const selectedNames = selected.map(
        assignment => assignment.name
    );

    const skipped = assignments.filter(
        assignment =>
            !selectedNames.includes(assignment.name)
    );

    // Send result to frontend
    res.json({
        success: true,
        maxMarks: maxMarks,
        usedTime: usedTime,
        availableTime: availableTime,
        remainingTime: availableTime - usedTime,
        selected: selected,
        skipped: skipped
    });
});

// Start server
app.listen(PORT, () => {
    console.log(
        `GradeMax server running at http://localhost:${PORT}`
    );
});