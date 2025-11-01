const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

exports.authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required."
            });
        }

        const token = authHeader.substring(7);

        if(token !== ACCESS_TOKEN){
            return res.status(401).json({
                status: "error",
                message: "Authentication required."
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
};