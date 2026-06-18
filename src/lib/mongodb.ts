import { connect } from "mongoose";


//  const MONGODB_URI = process.env.NODE_ENV === 'development' 
//    ? 'mongodb://localhost:27017/theguraidhoo' 
//  : process.env.MONGODB_URI;
 const MONGODB_URI = 'mongodb://localhost:27017/theguraidhoo'

if (!MONGODB_URI || MONGODB_URI.length === 0) {
  throw new Error("Please add your MongoDB URI");
}

async function connectDB() {
  try {
    const opts = {
      dbName: "theguraidhoo",
    };

    const connection = await connect(MONGODB_URI as string, { ...opts, dbName: opts.dbName });

    // Helper to close the connection
    const close = async () => {
      await connection.disconnect();
    };

    // Return both connection and close function
    return { connection, close };
  } catch (error) {
    console.error("❌ Connection to database failed");
    throw error;
  }
}

export default connectDB;
