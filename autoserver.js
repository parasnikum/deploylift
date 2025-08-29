const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config()
const { singleProjectModel } = require("./models/project.schema");
const { connect } = require("./utils/db")
connect();
app.use(express.static(path.join(__dirname, "uploads"), { extensions: ['html'] }))

const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });


// app.get("/", async (req, res) => {
//     const subdomain = req.hostname.split('.')[0]
//     // const data = await singleProjectModel.find({ 'subdomain': subdomain })

//     res.send("index")
// });


app.get(/(.*)/, async (req, res) => {
    const isSubdomain = req.host.endsWith(process.env.BASE_HOST);
    const identifier = isSubdomain ? req.hostname.split('.')[0] : req.hostname;

    let projectPath = myCache.get(identifier);
    if (!projectPath) {
        const query = isSubdomain 
            ? { subdomain: identifier } 
            : { customDomain: identifier };
        
        const data = await singleProjectModel.findOne(query);
        if (!data) {
            return res.send(isSubdomain ? "No domain here" : "Project does not exist");
        }

        projectPath = data.projectPath;
        myCache.set(identifier, projectPath, 1000);
    }

    if (req.url === '/') {
        projectPath += '/index.html';
    } else if (req.url === '/index') {
        return res.redirect('/');
    } else if (req.url.endsWith('.html')) {
        const cleanPath = req.url.replace(/\.html$/, '');
        return res.redirect(cleanPath);
    } else {
        projectPath += req.url;
        if (!path.extname(projectPath)) {
            projectPath += '.html';
        }
    }

    res.sendFile(projectPath);
});






app.listen(3003, () => {
    console.log("Server running at http://127.0.0.1:3003");
});
