const mongoose = require("mongoose")
const depolymentSchema = mongoose.Schema({
    userID: {
        type: mongoose.SchemaTypes.ObjectId,
        refer: "User",
        required: true
    },
    projectID: {
        type: mongoose.SchemaTypes.ObjectId,
        refer: "Project",
        required: true
    },
    deploymentName: {
        type: String,
        requried: true
    },
}, { timestamps: true })

const depolymentModel = mongoose.model("Deployment", depolymentSchema)
module.exports = { depolymentModel }