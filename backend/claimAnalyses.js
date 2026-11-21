require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Analysis = require("./models/Analysis");

(async () => {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: node claimAnalyses.js your@email.com");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email });

  if (!user) {
    const users = await User.find().select("email name");

    console.log("No user found with that email. Registered accounts:");
    users.forEach((u) => console.log(` - ${u.email} (${u.name})`));

    await mongoose.disconnect();
    process.exit(1);
  }
  if (!user) {
    console.log("No user found with that email.");
    process.exit(1);
  }

  const result = await Analysis.updateMany(
    { $or: [{ userId: null }, { userId: { $exists: false } }] },
    { $set: { userId: user._id } }
  );

  console.log(`Assigned ${result.modifiedCount} old analyses to ${email}`);

  await mongoose.disconnect();
})();
