import express from "express"
import cors from "cors"
import cookieParser from "Cookie-parser"
 

const app=express()

app.use(cors(
  {
    origin:process.env.CORS_ORIGIN,
    credentials:true
  }
))

// limit of the data using middleware 
app.use(express.json({
  limit:"16kb"
}))
// encoding of the url data of form extended keyword provide nested object 
app.use(express.urlencoded({extended}))

//It's a middleware that makes all files inside the public folder directly accessible from the browser.

app.use(express.static("public "))

app.use(cookieParser())


export {app}