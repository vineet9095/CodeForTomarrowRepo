const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["token"];
  if (!token) {
    return res
      .status(403)
      .json({ status: "FAILED", message: "Token not provided" });
  }

  jwt.verify(token, "abc", (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ status: "FAILED", message: "Failed to authenticate token" });
    }
    console.log(decoded.foo);
    req.userId = decoded.foo;
    next();
  });
};

module.exports = verifyToken;
