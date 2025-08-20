const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const path = require("path");
const { uploadFiles, genDeploymentId, extractFile } = require("./utils/utils")
require("dotenv").config()
const { login, register } = require("./controllers/user.controller")
const { connect } = require("./utils/db")
const { auth } = require("./utils/auth");
const { singleProjectModel } = require("./models/project.schema");
const { depolymentModel } = require("./models/deployments.schema");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")
app.set("views", "views")
app.use(express.static(path.join(__dirname, "views")))
connect()

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
    // console.log(req.files);  // Logs the uploaded files
    console.log("after upload", req.finalPath);
    // const { pname, unique_pname } = req.body;
    // await singleProjectModel.create({ userID: req.user.id, projectName: pname, subdomain: unique_pname, projectPath: req.deploymentPath })
    res.send("Files uploaded successfully!");
});


app.post("/newDeployment/:projectID", auth, genDeploymentId, uploadFiles, extractFile, async (req, res) => {
    // console.log(req.files);  // Logs the uploaded files
    // const { pname, unique_pname } = req.body;
    // await singleProjectModel.create({ userID: req.user.id, projectName: pname, subdomain: unique_pname, projectPath: req.deploymentPath })
    res.send("Deployment successfully!");
});

app.get("/projects", auth, async (req, res) => {

    const projects = await singleProjectModel.find({ userID: req.user.id }).limit(5);
    res.render("createNewProject", { projects })

    // res.send("All Projects")
})


app.get("/:projectID/deployments", auth, async (req, res) => {
    const projectid = req.params.projectID;
    const deploys = await depolymentModel.find({ projectID: projectid }).limit(5)
    const projectData = await singleProjectModel.findOne({ _id: projectid }).limit(5)

    res.render("createNewDeploy", { deploys, projectID: projectid, currentDeployment: projectData.currentDepoledID })
    // res.send("All Projects")
})



app.post("/setDeploy/:projectID", auth, async (req, res) => {
    // console.log(req.files);  // Logs the uploaded files
    // const { pname, unique_pname } = req.body;
    // await singleProjectModel.create({ userID: req.user.id, projectName: pname, subdomain: unique_pname, projectPath: req.deploymentPath })
    const newPath = path.join(__filename, "../uploads", `${req.user.id}`, `${req.body.deploymentID}`);
    console.log(newPath );
    console.log(req.params.projectID );
    console.log(req.user.id );
    console.log(req.body.deploymentID );
    
    const a = await singleProjectModel.updateOne(
            { _id: req.params.projectID, userID: req.user.id }, 
            {
                $set: {
                    currentDepoledID: req.body.deploymentID,
                    projectPath: newPath
                }
            }
        );
        console.log("updated data",a);
        
    res.send("Set As New Deployment");
});


// app.get("/:projectID/deploy", auth, async (req, res) => {
//     const projectid = req.params.projectID;
//     const deploys = await depolymentModel.find({ projectID: projectid }).limit(5)
//     res.send(deploys)
//     // res.send("All Projects")
// })

app.get("/asd/:id", async (req, res) => {
    const projectDetails = await singleProjectModel.findOne({ subdomain: req.params.id })
    console.log(projectDetails);

    express.static(projectDetails.projectPath)
})


app.listen(3025, () => {
    console.log("Server running at http://127.0.0.1:3025");
});
