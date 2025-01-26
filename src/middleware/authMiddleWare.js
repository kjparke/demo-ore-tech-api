const jwt = require("jsonwebtoken");
const permissions = require("./permissions");

exports.verifyToken = (req, res, next) => {
  try {
    let token = req.headers["x-access-token"];
    if (!token) {
      return res.status(403).send({ error: "Unauthorized: No token provided!" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: "Unauthorized!" });
      }
      req.user = decoded; // Attach the decoded token payload to the request object
      next();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyPermissions = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.body.metaData || req.body.metaData.accessLevel === undefined) {
      return res.status(403).json({ message: 'Forbidden: Access level not found' });
    }

    const accessLevel = req.body.metaData.accessLevel;
    const userPermissions = permissions[accessLevel] || {};

    if (!userPermissions[requiredPermission]) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
