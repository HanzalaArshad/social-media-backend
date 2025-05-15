import {asyncHandler} from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js" 
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser=asyncHandler(async(req,res)=>{
  //steps for register the user 
  // get the user detail from the frontend
  // validate 
  // check it is already exists or not 
  // check for image and avatar
  // upload them to cloudinary,avatar
  //create user obj,create entry in db
  // remove password and refresh token field from the response 
  // check for user creation
  // return response

  const {fullName,email,username,password}=req.body

  // checking validation for email and username 


  if(
    [fullName,email,username,password].some((field)=>field?.trim()==="")
  ){
      throw new ApiError(400,"All fields Are Required ")
  } 
  

  const existedUser=User.findOne({
    $or:[{ username },{ email }]
  })
   
  if(existedUser){
        
    throw new ApiError(409,"user with username And email Already Exists")
  } 



     const avatarLocalPath =req.files?.avatar[0]?.path;
     const coverImagePath=req.files?.coverImage[0]?.path;


     if(!avatarLocalPath){
      throw new ApiError(400,"Avatar is Required")
     }

     const avatar=await uploadOnCloudinary(avatarLocalPath);
     const coverImage=await uploadOnCloudinary(coverImagePath);
   
 
     if(!avatar) {
       throw new ApiError(400,"Avatar is Required")
 
     }
 
    const user=await User.create({
       fullName,
       avatar:avatar.url,
       coverImage:coverImage?.url || "",
       email,
       password,
       username:username.toLowerCase()
     })
   
     const createdUser= await User.findById(user._id).select("-password -refreshToken")

     if(!createdUser){
      throw new ApiError(500,"Something Went Wrong While Registering the user")
     }

    return res.send(201).json(
      new ApiResponse(200,createdUser,"user Successfully registered")
    )

})








export {registerUser}