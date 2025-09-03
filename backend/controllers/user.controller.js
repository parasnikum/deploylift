const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { userModel } = require("../models/user.schema");
require('dotenv').config()


const JWT_SECRETE = process.env.JWT_SECRETE;
const COOKIE_EXPIRE = process.env.COOKIE_EXPIRE || 2 * 24 * 60 * 60 * 1000; // default: 2 days

// Register User
const register = async (req, res) => {
    try {
        const { username, email, password, fname, lname } = req.body;

        if (!username || !email || !password || !fname || !lname) {
            return res.status(400).send("All fields are required.");
        }

        const isUserExist = await userModel.findOne({ email });
        if (isUserExist) {
            return res.status(409).send("User already registered.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const storeData = await userModel.create({
            firstname: fname,
            lastname: lname,
            username,
            email,
            password: hashedPassword,
        });

        const payload = {
            username: storeData.username,
            email: storeData.email,
            userid: storeData._id,
        };
        const token = jwt.sign(payload, JWT_SECRETE, { expiresIn: "2d" });

        res.cookie("jwt", token, { maxAge: COOKIE_EXPIRE, httpOnly: true });

        return res.status(201).send("Registered successfully.");
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).send("Server error.");
    }
};


// Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
console.log(JWT_SECRETE);

        if (!email || !password) {
            return res.status(400).send("Email and password are required.");
        }

        const tokenFromCookie = req.cookies?.jwt;
        if (tokenFromCookie) {
            try {
                const verified = jwt.verify(tokenFromCookie, JWT_SECRETE);
                return res.status(200).send("Already logged in.");
            } catch (e) {
                
            }
        }
        console.log(req.body);


        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).send("Invalid credentials.");
        }

        const payload = {
            username: user.username,
            email: user.email,
            userid: user._id,
        };
        const token = jwt.sign(payload, JWT_SECRETE, { expiresIn: "2d" });
        res.cookie("jwt", token, {
        });
        return res.redirect("/")
        // return res.status(200).send("User logged in successfully.");
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).send("Server error.");
    }
};

module.exports = { login, register };
