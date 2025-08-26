import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import { uploadFiles, genDeploymentId, extractFile, repoSetup } from "./utils/utils.js";
import { login, register } from "./controllers/user.controller.js";
import { connect } from "./utils/db.js";
import { auth } from "./utils/auth.js";
import { singleProjectModel } from "./models/project.schema.js";
import { depolymentModel } from "./models/deployments.schema.js";
import { createClient } from "redis";
dotenv.config()
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")
app.set("views", "views")
app.use(express.static(path.join(__dirname, "views")))

connect()

const client = await createClient(
    { url: process.env.REDIS_URL }
)
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect(() => {
        console.log("Connected to Redis DB");
    });


const liveVisitor = await createClient(
    { url: process.env.REDIS_URL }
)
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect(() => {
        console.log("Connected to Redis DB");
    });



app.get("/", auth, (req, res) => {
    res.render("index")
});

app.get("/login", (req, res) => {
    const tokenFromCookie = req.cookies?.jwt;
    if (tokenFromCookie) {
        try {
            const verified = jwt.verify(tokenFromCookie, JWT_SECRETE);
            return res.render("index")
        } catch (e) {

        }
    }
    res.render("login")
});

app.get("/register", (req, res) => {
    res.render("register")
});


app.post("/login", login);


app.post("/register", register);

app.post(["/upload", "/newproject"], auth, genDeploymentId, uploadFiles, extractFile, async (req, res) => {
    console.log("after upload", req.finalPath);
    res.send("Files uploaded successfully!");
});


app.post("/newDeployment/:projectID", auth, genDeploymentId, uploadFiles, extractFile, async (req, res) => {
    res.send("Deployment successfully!");
});

app.post("/newDeployment/repo/:projectID", auth, genDeploymentId, repoSetup, async (req, res) => {
    res.send("Deployment successfully!");
});

app.get("/projects", auth, async (req, res) => {
    const projects = await singleProjectModel.find({ userID: req.user.id }).limit(5);
    res.render("createNewProject", { projects })
})

app.get("/newproject", auth, async (req, res) => {
    const projects = await singleProjectModel.find({ userID: req.user.id }).limit(5);
    res.render("createNewProject", { projects })
})

app.get("/:projectID/deployments", auth, async (req, res) => {
    const projectid = req.params.projectID;
    const deploys = await depolymentModel.find({ projectID: projectid }).limit(5)
    const projectData = await singleProjectModel.findOne({ _id: projectid }).limit(5)

    res.render("createNewDeploy", { deploys, projectID: projectid, currentDeployment: projectData.currentDepoledID })
})

app.post("/setDeploy/:projectID", auth, async (req, res) => {
    const newPath = path.join(__filename, "../uploads", `${req.user.id}`, `${req.body.deploymentID}`);
    const updatedProject = await singleProjectModel.findOneAndUpdate(
        { _id: req.params.projectID, userID: req.user.id },
        {
            $set: {
                currentDepoledID: req.body.deploymentID,
                projectPath: newPath
            }
        },
        {
            new: true 
        }
    );
    client.set(updatedProject.subdomain, newPath, {
        expiration: {
            type: 'EX',
            value: 40
        }
    })
    res.send("Set As New Deployment");
});



app.get("/analytics/:projectId", async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await singleProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        const subdomain = project.subdomain;
        const liveCount = await liveVisitor.get(subdomain + ":count");
        const visitorCount = liveCount ? parseInt(liveCount) : 0;

        res.render("analytics", {
            projectId,
            subdomain,
            liveVisitors: visitorCount,
        });
    } catch (error) {
        console.error("Error in analytics route:", error);
        res.status(500).send("Internal server error");
    }
});



app.listen(3025, () => {
    console.log("Server running at Port 3025");
});
