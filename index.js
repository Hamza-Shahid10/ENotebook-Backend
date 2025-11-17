import express from 'express'
import cors from "cors";
import connectToMongo from "./db.js"
import authRoutes from "./routes/auth.js";  
import notesRoutes from "./routes/notes.js";
// import moviesRoutes from "./routes/movies.js";

const app = express()
const port = 1010

let users = []

app.use(cors({
  origin: ["http://localhost:5173", "https://enotebook-hamza.vercel.app"],
  credentials: true
}));

app.use(express.json());
connectToMongo();


app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

//For sample Data
// app.use("/api/test", moviesRoutes)


app.get('/users', (req, res) => {
    res.send({
        message: "users fetched succesfully",
        users: users
    })
})

app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    const user = users.find((user) => user.id === Number(id));

    if (user === undefined) {
        return res.status(404).json({ message: "User not found" });
    }

    res.send({
        message: "Single user fetched succesfully",
        users: user
    })
})

app.post("/users", (req, res) => {
    try {
        const newUser = {
            id: Date.now(),
            ...req.body,
        };

        users.push(newUser);

        res.status(201).json({
            message: "User created successfully",
            user: newUser,
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.put("/users/:id", (req, res) => {
    const { id } = req.params;
    const findIndex = users.findIndex((user) => user.id === Number(id));

    if (findIndex === -1) {
        return res.status(404).json({ message: "User not found" });
    }

    users[findIndex] = {
        ...users[findIndex], 
        ...req.body,         
        id: users[findIndex].id, 
    };

    res.json({
        message: "User updated successfully",
        user: users[findIndex],
    });
});

app.delete("/users/:id", (req, res) => {
    const { id } = req.params
    let findId = users.findIndex((user) => user.id === Number(id))
    let deletedUser = users.splice(findId, 1)
    if (findId === -1) {
        return res.status(404).json({ message: "User not found" });
    }
    res.send({
        message: "user remove succesfully",
        deletedUser: deletedUser[0]
    })
})

//App listening
app.listen(port, () => {
    console.log(`ENotebook app listening on port http://localhost:${port}`)
})
