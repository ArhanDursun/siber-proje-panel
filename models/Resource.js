const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    type: { type: String, default: "standard" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", ResourceSchema);
