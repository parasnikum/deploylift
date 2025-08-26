const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config()
const { singleProjectModel } = require("./models/project.schema");
const { connect } = require("./utils/db")
connect();
app.use(express.static(path.join(__dirname, "uploads"), { extensions: ['html'] }))
2

const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });


// app.get("/", async (req, res) => {
//     const subdomain = req.hostname.split('.')[0]
//     // const data = await singleProjectModel.find({ 'subdomain': subdomain })

//     res.send("index")
// });

app.get(/(.*)/, async (req, res) => {
    const subdomain = req.hostname.split('.')[0]
    let projectPath;

    if (!myCache.get(subdomain)) {
        const data = await singleProjectModel.findOne({ 'subdomain': subdomain });
        if (!data) {
            res.send("no domain here")
        }
        projectPath = data.projectPath;
        console.log("Path: ", data.projectPath);

        myCache.set(subdomain, projectPath, 1000);
    }
    projectPath = myCache.get(subdomain);

    if (req.url == '/') {
        projectPath += "/index.html"
    } else if (req.url == "/index") {
        return res.redirect("/")
    } else if (req.url.endsWith('.html')) {
        const cleanPath = req.url.replace(/\.html$/, '');
        return res.redirect(cleanPath);
    }
    else {
        projectPath += req.url;
        if (path.extname(projectPath) == "") {
            projectPath += ".html";
        }
    }
    res.sendFile(projectPath)

})


app.listen(3003, () => {
    console.log("Server running at http://127.0.0.1:3003");
});
