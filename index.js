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
    const { pname, unique_pname } = req.body;
    await singleProjectModel.create({ userID: req.user.id, projectName: pname, subdomain: unique_pname, projectPath: req.deploymentPath })
    res.send("Files uploaded successfully!");
});

app.get("/projects", auth, async (req, res) => {

    const projects = await singleProjectModel.find({userID : req.user.id}).limit(10);
    res.render("createNewProject", { projects })

    // res.send("All Projects")
})


app.post("/newproject", auth, (req, res) => {

    // res.send("All Projects")
})

app.get("/asd/:id", async (req, res) => {
    const projectDetails = await singleProjectModel.findOne({subdomain:req.params.id})
    console.log(projectDetails);
    
    express.static(projectDetails.projectPath)
})


app.listen(3025, () => {
    console.log("Server running at http://127.0.0.1:3025");
});
