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



app.use(async (req, res, next) => {
    const host = req.hostname;
    console.log(host);
    console.log(host.split('.')[0]);
    
    // Check if request is for custom domain or subdomain
    try {
        const project = await singleProjectModel.findOne({
            $or: [
                { subdomain: host.split('.')[0] },
                { customDomain: host }
            ]
        });

        if (project) {
            const deploymentId = project.currentDepoledID;
            const projectId = project._id.toString();
            const baseDir = project.projectPath;

            // If root, serve index.html
            let filePath = path.join(baseDir, "index.html");

            // Allow sub-routes
            const subPath = req.path === "/" ? "" : req.path;
            if (subPath && subPath !== "/") {
                filePath = path.join(baseDir, subPath);
                if (!path.extname(filePath)) {
                    filePath += ".html";
                }
            }

            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error("File not found:", filePath);
                    return res.status(404).send("Page not found");
                }
            });
        } else {
            // Not a custom domain or subdomain request, continue to normal routes
            return next();
        }
    } catch (err) {
        console.error("Error in domain middleware:", err);
        next();
    }
});




// app.use('/:projectId/preview/:deploymentId', (req, res, next) => {
//     const { projectId, deploymentId } = req.params;
//     const baseDir = path.join(__dirname, 'uploads', projectId, deploymentId);

//     express.static(baseDir)(req, res, next);
// });
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

    res.render("createNewDeploy", { deploys, projectID: projectid, currentDeployment: projectData.currentDepoledID , projectData })
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



app.post("/customDomainSet/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const { domain } = req.body;

    try {
        const project = await singleProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).send("Project not found");
        }
        if (!domain) {
            return res.status(404).send("Custom Domain Feild Must need to fill");
        }

        const subdomain = project.subdomain;

        const updatedProject = await singleProjectModel.findOneAndUpdate(
            { _id: projectId },
            {
                $set: {
                    customDomain: domain,
                }
            },
            {
                new: true
            }
        );

        res.send("Custom Domain Setup !");
    } catch (error) {
        console.error("Error in analytics route:", error);
        res.status(500).send("Internal server error");
    }
});

app.get('/:projectId/preview/:deploymentId', (req, res) => {
    const { projectId, deploymentId } = req.params;
    const subPath = req.path.replace(`/${projectId}/preview/${deploymentId}`, '') || '/';

    const baseDir = path.join(__dirname, 'uploads', projectId, deploymentId);
    let filePath;

    if (subPath === '/' || subPath === '') {
        filePath = path.join(baseDir, 'index.html');
    } else if (subPath.endsWith('/index')) {
        return res.redirect(`/${projectId}/preview/${deploymentId}/`);
    } else if (subPath.endsWith('.html')) {
        const cleanPath = subPath.replace(/\.html$/, '');
        return res.redirect(`/${projectId}/preview/${deploymentId}${cleanPath}`);
    } else {
        filePath = path.join(baseDir, subPath);
        if (!path.extname(filePath)) {
            filePath += '.html';
        }
    }

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('File not found:', filePath);
            res.status(404).send('Page not found');
        }
    });
});





app.listen(3025, () => {
    console.log("Server running at Port 3025");
});
