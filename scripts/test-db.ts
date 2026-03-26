import dotenv from 'dotenv';

// Load environment variables strictly before initializing internal singletons
dotenv.config({ path: '.env.local' });

async function verifyDatabase() {
  try {
    console.log("🔍 Testing Database Connection...");
    console.log("===================================");
    
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is undefined. Check .env.local file.");
    }
    
    // Dynamically import models to ensure Mongoose evaluates `process.env` AFTER dotenv runs
    const dbConnect = (await import('../lib/mongodb')).default;
    const UserConfig = (await import('../lib/models/UserConfig')).default;
    const Disposition = (await import('../lib/models/Disposition')).default;

    // 1. Connection Test
    await dbConnect();
    console.log("✅ [1/3] Connected successfully to MongoDB Atlas.");

    // 2. UserConfig Model Test
    const testConfig = await UserConfig.findOneAndUpdate(
      { email: "test-auth-bot@blackbuck.com" },
      { config: { visibleFields: { noOfTrucks: true }, options: { omcs: ["TEST_OMC"] } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("✅ [2/3] Configuration Model Write Successful:", testConfig._id);

    // 3. Disposition Model Test
    const testRecord = await Disposition.create({
      agentEmail: "test-auth-bot@blackbuck.com",
      foNumber: "FO-TEST-100",
      omc: "TEST_OMC",
      callStatus: "Testing System",
      remarks: "This is an automated backend test record verifying Schema integrity.",
    });
    console.log("✅ [3/3] Disposition Model Write Successful:", testRecord._id);

    // Clean up generic test traces
    await UserConfig.deleteOne({ _id: testConfig._id });
    await Disposition.deleteOne({ _id: testRecord._id });
    
    console.log("===================================");
    console.log("🚀 All tests passed. Test records deleted.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database Verification Failed:", error);
    process.exit(1);
  }
}

verifyDatabase();
