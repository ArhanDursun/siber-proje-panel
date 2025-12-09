// auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_GUVENLI_OLMASI_GEREKEN_UZUN_BIR_SECRET_STRING";

// 🔐 Doğru / güvenli JWT kontrolü
function authSecure(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(403).json({ message: "Geçersiz token" });
  }

  try {
    // İMZA DOĞRULANIYOR
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Geçersiz token" });
  }
}

// ❌ ZAFİYETLİ / güvensiz JWT kontrolü
function authInsecure(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(403).json({ message: "Geçersiz token" });
  }

  // 🚨 ZAFİYET: jwt.verify yerine SADECE jwt.decode kullanıyoruz.
  // İMZA KONTROLÜ YOK!
  const payload = jwt.decode(token) || {};

  req.user = payload; // role ve username tamamen token’ı yazan kişiye emanet
  next();
}

// Admin rolü zorunlu middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Yönetici yetkisi gerekli" });
  }
  next();
}

module.exports = {
  authSecure,
  authInsecure,
  requireAdmin,
};
