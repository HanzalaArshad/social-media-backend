import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import express from "express"


const app=express()



const connectDB=async ()=>{
  try {
   const ConnectionInstance= await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`)
   console.log(`\nMongoDB Connected !! DB_HOST ${ConnectionInstance.connection.host}`);
   
  } catch (error) {
    console.log("MongoDB Connection Error",error);
    process.exit(1)
    
  }
}



export default connectDB;