const mongoose = require("mongoose");

connect = () => {
    mongoose.connect(process.env.MONGO_URI)
}

module.exports = { connect }