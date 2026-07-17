import mongoose from "mongoose";

const SocialChannelSchema = new mongoose.Schema(
  {
    channelId: { type: String, required: true, unique: true }, // "facebook","instagram","twitter","linkedin","youtube","google"
    name: { type: String, required: true },        // "Facebook"
    handle: { type: String, default: "" },          // "@CoolTechACServices"
    connected: { type: Boolean, default: false },
    followers: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },           // only Google/reviews channels
    bg: { type: String, default: "#F8FAFC" },        // card tint, optional override
  },
  { timestamps: true, collection: "socialChannels" } // explicit collection name — keeps it fully separate from chat's "channels" collection
);

export default mongoose.models.SocialChannel || mongoose.model("SocialChannel", SocialChannelSchema);
