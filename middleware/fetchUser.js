import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()

const fetchUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).json({ error: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next(); 
  } catch (error) {
    res.status(401).json({ error: "Please authenticate using a valid token" });
  }
}

export default fetchUser;