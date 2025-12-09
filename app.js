require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const mongoose = require("mongoose");

const User = require("./models/User");
const Resource = require("./models/Resource");

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠ Bu SECRET demoda kalacak, gerçek projede .env'de tutulmalı
const JWT_SECRET = process.env.JWT_SECRET;

mongoose
  .mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Atlas’a bağlandı!");
    seedDefaultAdmin();
  })
  .catch((err) => {
    console.error("Atlas bağlantı hatası:", err.message);
  });

async function seedDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const hash = await bcrypt.hash("admin123", 10);
      await User.create({
        username: "admin",
        passwordHash: hash,
        role: "admin",
      });
      console.log("Varsayılan admin kullanıcısı oluşturuldu: admin/admin123");
    }
  } catch (err) {
    console.error(
      "Varsayılan admin kullanıcısı oluşturulamadı:",
      err.message
    );
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/**
 * ❌ ZAFİYETLİ AUTH (INSECURE)
 * Burada jwt.verify KULLANMIYORUZ, SADECE jwt.decode kullanıyoruz.
 * Yani token'ın imzası kontrol edilmiyor; payload içindeki "role" alanını
 * Burp ile değiştirirsen backend bunu fark edemez.
 */
function authInsecure(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token yok veya Bearer formatında değil" });
  }

  const token = authHeader.split(" ")[1];

  // Çok kaba bir format kontrolü: "xxx.yyy.zzz"
  if (!token || !token.includes(".")) {
    return res.status(403).json({ message: "Geçersiz token" });
  }

  // 🚨 ZAFİYET: İMZA DOĞRULANMIYOR!
  const decoded = jwt.decode(token); // sadece decode

  if (!decoded) {
    return res.status(403).json({ message: "Geçersiz token" });
  }

  // Burada role, username, sub tamamen token'ı yazan saldırgana emanet
  req.user = decoded;
  next();
}

/**
 * 🔐 GÜVENLİ AUTH (SECURE)
 * Burada jwt.verify kullanılıyor; token'ın imzası SECRET ile doğrulanıyor.
 */
function authSecure(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token yok veya Bearer formatında değil" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Geçersiz token" });
  }
}

/**
 * Admin rolü kontrolü
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Yönetici yetkisi gerekli" });
  }
  next();
}

// -------------------- STATIC SAYFALAR --------------------
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);
app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "register.html"))
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin.html"))
);

// -------------------- AUTH ENDPOINTLERİ --------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("➡ /api/auth/register çağrıldı. Body:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
      console.log("❌ Eksik alan:", { username, password: !!password });
      return res
        .status(400)
        .json({ message: "Kullanıcı adı ve şifre gerekli" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      console.log("❌ Kullanıcı adı zaten kayıtlı:", username);
      return res
        .status(409)
        .json({ message: "Bu kullanıcı adı zaten mevcut" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    console.log("✅ Şifre hash’lendi");

    const user = await User.create({
      username,
      passwordHash,
      role: "user",
    });

    console.log("✅ Yeni kullanıcı oluşturuldu:", user._id);

    await Resource.create({
      ownerId: user._id,
      title: "Kişisel Çalışma Alanı",
      type: "standard",
    });

    console.log("✅ Kullanıcıya varsayılan resource eklendi");

    return res.status(201).json({
      message: "Kayıt başarılı",
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("💥 Register error:", err);
    return res.status(500).json({
      message: "Sunucu hatası (register)",
      error: String(err),
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: "Hatalı giriş" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Hatalı giriş" });

  const token = jwt.sign(
    {
      sub: user._id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Giriş başarılı",
    token,
    user,
  });
});

// Mevcut kullanıcı bilgisi
app.get("/api/auth/me", authSecure, async (req, res) => {
  const user = await User.findById(req.user.sub).select("_id username role");
  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
  res.json(user);
});

// Kullanıcının kendi kaynakları
app.get("/api/resources", authSecure, async (req, res) => {
  const items = await Resource.find({ ownerId: req.user.sub });
  res.json({ items });
});

// -------------------- ADMIN ENDPOINTLERİ --------------------

// INSECURE LIST: jwt.decode + requireAdmin
app.get(
  "/api/admin/insecure/users",
  authInsecure,
  requireAdmin,
  async (req, res) => {
    const users = await User.find();
    res.json({ users });
  }
);

// INSECURE DELETE: jwt.decode + requireAdmin
app.delete(
  "/api/admin/insecure/users/:id",
  authInsecure,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (String(req.user.sub) === id) {
        return res
          .status(400)
          .json({ message: "Kendi hesabınızı silemezsiniz." });
      }

      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      await Resource.deleteMany({ ownerId: id });

      return res.json({ message: "Kullanıcı silindi (insecure)" });
    } catch (err) {
      console.error("Insecure delete error:", err);
      return res
        .status(500)
        .json({ message: "Sunucu hatası (insecure delete)" });
    }
  }
);

// SECURE LIST: jwt.verify + requireAdmin
app.get(
  "/api/admin/secure/users",
  authSecure,
  requireAdmin,
  async (req, res) => {
    const users = await User.find();
    res.json({ users });
  }
);

// SECURE DELETE: jwt.verify + requireAdmin
app.delete(
  "/api/admin/secure/users/:id",
  authSecure,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (String(req.user.sub) === id) {
        return res
          .status(400)
          .json({ message: "Kendi hesabınızı silemezsiniz." });
      }

      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      await Resource.deleteMany({ ownerId: id });

      return res.json({ message: "Kullanıcı silindi (secure)" });
    } catch (err) {
      console.error("Secure delete error:", err);
      return res
        .status(500)
        .json({ message: "Sunucu hatası (secure delete)" });
    }
  }
);

// -------------------- SERVER --------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
