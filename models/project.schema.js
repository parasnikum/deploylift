const mongoose = require("mongoose")
const singleProjectSchema = mongoose.Schema({
    userID: {
        type: mongoose.SchemaTypes.ObjectId,
        refer: "User",
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    subdomain: {
        type: String,
        required: true
    },
    avatarPath: {
        type: String,
    },
    projectPath: {
        type: String,
        required: true,
    },
    currentDepoledID: {
        type: String,
        required: true,
    }
}, { timestamps: true })

const singleProjectModel = mongoose.model("Project", singleProjectSchema)
module.exports = { singleProjectModel }