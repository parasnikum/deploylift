import jwt from "jsonwebtoken";

export const auth = async (req, res, next) => {
    try {
        const jwtToken = req.cookies?.jwt;
        
        if (!jwtToken) {
            
            return res.redirect('/login');
        }

        const data = jwt.verify(jwtToken, process.env.JWT_SECRETE);

        req.user = {
            username: data.username,
            email: data.email,
            id: data.userid,
        };

        return next();
    } catch (err) {
        console.error("JWT verification failed:", err.message);
        return res.redirect('/login');
    }
};

