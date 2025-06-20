// require('dotenv').config({path:'./env'})


import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import express from "express"
import {app} from "./app.js"


dotenv.config({
  path:'./.env'
})


connectDB()
.then(()=>{

  app.on('error',(error)=>{
    console.log("ERRR",error);
    throw error


  })
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`Server Is Running at Port ${process.env.PORT}`);
    
  })
})
.catch((err)=>{
  console.log("MONGODB  Connection Failed  !!!!",err);
  
})








/*
import express from "express"


const app=express()

(async ()=>{
  try {
   await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`)
   app.on("error",(error)=>{
    console.log("ERRR",error);
    throw error
    
   })

   app.listen(process.env.PORT,()=>{
    console.log(`App is Listening on port ${process.env.PORT}`);
    
   })

  } catch (error) {
    console.error("ERROR",error)
    throw err
  }
})()
*/
