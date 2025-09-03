const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const simpleGit = require('simple-git');
simpleGit().clean(simpleGit.CleanOptions.FORCE);
const extract = require('extract-zip');
const { depolymentModel } = require("../models/deployments.schema");
const { singleProjectModel } = require("../models/project.schema");

const genDeploymentId = async (req, res, next) => {
    const uniqueid = uuidv4(50);
    req.deploymentPath = path.join(__dirname, "../uploads", `${req.user.id}`, `${uniqueid}`);
    req.uniqueDeploymentId = `${uniqueid}`;
    // req.deploymentPath = path.join(__dirname, "../uploads", `U-${req.user.id}`, `${req.body.unique_pname}`);
    // req.uniqueDeploymentId = `${req.body.unique_pname}`;
    next();
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = req.deploymentPath;
        // Create the directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath); // Path to save files
    },
    filename: async function (req, file, cb) {
        // const filePath = req.deploymentPath;
        // file.path = filePath;
        req.zipPath = path.join(req.deploymentPath, file.originalname);
        cb(null, file.originalname);
    }
});


const extractFile = async (req, res, next) => {
    try {
        await extract(req.zipPath, { dir: req.deploymentPath })
        fs.unlink(req.zipPath, (err) => {
            if (err) throw err;
            console.log('File deleted!');
        });
        const { pname, unique_pname: psubdomain } = req.body;
        if (pname && psubdomain) {
            req.newprojectID = await singleProjectModel.create({ currentDepoledID: req.uniqueDeploymentId, projectName: pname, userID: req.user.id, subdomain: psubdomain, projectPath: req.deploymentPath })
        }
        const pid = req.newprojectID || req.params.projectID;
        const deployedData = await depolymentModel.create({ userID: req.user.id, projectID: pid, deploymentName: req.uniqueDeploymentId })

        console.log('Extraction complete')
    } catch (err) {
        console.log(err);
    }
    next();
}


const repoSetup = async (req, res, next) => {
    console.log(req.body);
    console.log("Path", req.deploymentPath);
    fs.mkdirSync(req.deploymentPath, { recursive: true });

    await simpleGit().clone(req.body.repo_link, req.deploymentPath).then(() => {
        console.log("Cloned")
    }).catch((err) => {
        console.log(err);
    });;
    const { pname, unique_pname: psubdomain } = req.body;
    if (pname && psubdomain) {
        req.newprojectID = await singleProjectModel.create({ currentDepoledID: req.uniqueDeploymentId, projectName: pname, userID: req.user.id, subdomain: psubdomain, projectPath: req.deploymentPath })
    }
    const pid = req.newprojectID || req.params.projectID;
    const deployedData = await depolymentModel.create({ userID: req.user.id, projectID: pid, deploymentName: req.uniqueDeploymentId })
    next();
}

const upload = multer({ storage: storage });
const uploadFiles = upload.single("files");

module.exports = { genDeploymentId, uploadFiles, upload, extractFile, repoSetup };
