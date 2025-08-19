const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const extract = require('extract-zip');
const { depolymentModel } = require("../models/deployments.schema");

const genDeploymentId = async (req, res, next) => {
    const uniqueid = uuidv4(50);
    req.deploymentPath = path.join(__dirname, "../uploads", `U-${req.user.id}`, `D-${uniqueid}`);
    req.uniqueDeploymentId = `D-${uniqueid}`;
    console.log(req.body);
    console.log(req.files);

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
    filename: function (req, file, cb) {
        const filePath = req.deploymentPath;

        file.destination = path.dirname(filePath);
        file.path = filePath;
        req.finalPath = path.join(req.deploymentPath, file.originalname);
        console.log("final path ", req.deploymentPath)
        cb(null, file.originalname);
    }
});


const extractFile = async (req, res, next) => {
    try {
        console.log("user", req.user);
        console.log("finalPath", typeof req.finalPath);
        console.log("deploymentPath", typeof req.deploymentPath);
        await extract(req.finalPath, { dir: req.deploymentPath })
        fs.unlink(req.finalPath, (err) => {
            if (err) throw err;
            console.log('File deleted!');
        });
        depolymentModel.create({ userID: req.user.id, projectID: req.user.id, deploymentName: req.uniqueDeploymentId })
        console.log('Extraction complete')
    } catch (err) {
        console.log(err);
    }
    next()
}


const upload = multer({ storage: storage });
const uploadFiles = upload.single("files");

module.exports = { genDeploymentId, uploadFiles, upload, extractFile };
