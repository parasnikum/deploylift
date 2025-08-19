const { depolymentModel } = require("../models/deployments.schema");
const { singleProjectModel } = require("../models/project.schema")
const { uploadFiles } = require("../utils/utils")


const createNewProject = async (req, res) => {
    const { projectname, subdomain } = req.body
    try {
        const isProjectExist = await singleProjectModel.find({ $or: [{ projectname: projectname }, { subdomain: subdomain }] });
        if (isProjectExist) {
            res.send("project already exist !!")
            return;
        }
        await singleProjectModel.create({ userID: req.user.userid, projectname: projectname, subdomain: subdomain, })
        res.send("project created !")
    } catch (error) {
        res.json({ status: "Error", message: error.message })
    }
}


const createNewDeployment = async (req, res) => {
    const { projectID } = req.body;

    uploadFiles(req, res, (err) => {
        if (err) return res.json({ "error occured": err.message })
        console.log("Project Uploaded !");
    })

    const currentDate = new Date.now();
    const data = {
        userID: req.user.userID,
        projectID: projectID,
        name: currentDate
    }

    await depolymentModel.create(data)
    res.send("New Deployment !!")
}

const getAllDeployments = async (req, res) => {
    const projectID = req.params.projectID;
    const deployments = await depolymentModel.find({ _id: projectID })
    res.json(deployments);
}

const getSingleProject = async (req, res) => {
    const projectID = req.params.projectID;
    const projectDetails = await singleProjectModel.find({ _id: projectID })
    res.json({ project: projectDetails });
}

module.exports = { createNewProject, createNewDeployment, getAllDeployments }