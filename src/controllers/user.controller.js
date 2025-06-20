import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";




const genrateAccessAndRefreshTokens=async (userId)=>{

    try {
      const user=await User.findById(userId);

      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()

      // adding the refreshToken
      user.refreshToken=refreshToken;
      //now saving the refersh token without validation because of the required true 

      await user.save({ValidateBeforeSave:false})

      // now return the tokens 

      return {accessToken,refreshToken}
    } catch (error) {
      throw new ApiError(500,"Something went Wrong While Generating the refresh and Access Token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
  // Steps for registering the user:
  // 1. Get user details from frontend
  // 2. Validate input fields
  // 3. Check if user already exists (username or email)
  // 4. Validate and upload avatar and optional cover image
  // 5. Create user object and save to database
  // 6. Remove password and refresh token from response
  // 7. Return success response

  const { fullName, email, username, password } = req.body;

  // Debug: Log request data
  console.log("Request body:", req.body);
  console.log("Uploaded files:", req.files);

  // Validate required fields
  if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "All fields (fullName, email, username, password) are required");
  }

  if ([fullName, email, username, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields must have non-empty values");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // Validate avatar file
  if (!req.files || !req.files.avatar || !Array.isArray(req.files.avatar) || req.files.avatar.length === 0) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatarLocalPath = req.files.avatar[0].path;

  // Validate cover image (optional)
  let coverImagePath;
  if (req.files && req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImagePath = req.files.coverImage[0].path;
  }

  // Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(500, "Failed to upload avatar to Cloudinary");
  }

  let coverImage = { url: "" };
  if (coverImagePath) {
    coverImage = await uploadOnCloudinary(coverImagePath);
    if (!coverImage?.url) {
      throw new ApiError(500, "Failed to upload cover image to Cloudinary");
    }
  }

  // Create user
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Fetch created user without sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Send response
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User successfully registered")
  );
});



const loginUser=asyncHandler(async(req,res)=>{

   // req.body => data
   //username or email
   // find the user
   //password check 
   //access and refresh token
   //send cookies 

   const {email,password,username}=req.body

   if(!email && !username){
    throw new ApiError(400,"Username or Email is Required")
   }

   // finding the username and email

   const user =await  User.findOne({
    $or: [{username}, {email}]
   })

   // if user is not there
   if(!user){
    throw new ApiError(404,"User does not exists")
   }

   // check the password 

   const isPasswordValid=await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(401,"Invalid User Credentials ")
   }
   // genrating the access token
   
   const {accessToken,refreshToken}= await genrateAccessAndRefreshTokens(user._id)

   // ab actually mn user obj oper hai tou wahan sab field ka access hai isliye hum dobara query chal rhe hain

   const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
 

   // sending cookies 
   // making options
    const options={
      httpOnly:true,  // oinly modified through server
      secure:true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options ).json(
      new ApiResponse(200,{user:loggedInUser,refreshToken,accessToken},"user loggedIn successfully")
    )



})


const logOutUser=asyncHandler(async(req,res)=>{
// middleware should be made  
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }


  )


  const options={
    httpOnly:true,
    secure:true
  }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User LoggedOut"))
    
  
})



const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unAuthorized Request")

  }

  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
    const user=await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"invalid refresh token")
  
    }
  
    if(incomingRefreshToken != user.refreshToken){
      throw new ApiError(401,"refresh token is expired")
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
  
    const{accessToken,newRefreshToken}=await genrateAccessAndRefreshTokens(user._id)
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"access token Refreshed"))
  } catch (error) {
    throw ApiError (401,error?.message || "Invalid Refresh Token")
  }

})

const   changeCurrentPassword=asyncHandler(async(req,res)=>{

  const {oldPassword,newPassword}=req.body
    const user= await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
      throw new ApiError(401,"old password is incorrect")
    }

    user.password=newPassword
   await user.save({ValidateBeforeSave:false })

   return res.status(200).json(new ApiResponse(200,{},"Password Changed Successfully "))

})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200).json(200,req.user,"current User Fetched")
})

const UpdateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
      throw new ApiError(400,"All Fields are Required")
    }

    const user=User.findByIdAndUpdate(req.user?._id,
      {
       $set:{
          fullName,
          email
       }
    }
    ,{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account Details Updated"))
})


const UpdateUserAvatar=asyncHandler(async(req,res)=>{
          const avatarLocalPath=req.file?.path

          if(!avatarLocalPath){
            throw new ApiError(400,"Avatar is Missing ")
          }

         const avatar=await  uploadOnCloudinary(avatarLocalPath)

         if(!avatar.url){
          throw new ApiError(400,"Avatar is Missing")
         }

        const user= await User.findByIdAndUpdate(req.user?._id
          ,
          {
            $set:{
              avatar:avatar.url
            }
          },
          {
            new:true
          }
         ).select("-password")

         return res.status(200).json(new ApiResponse(200,user,"Avatar Image Updated Successfully"))

})


const UpdateUserCoverImage=asyncHandler(async(req,res)=>{
          const coverImageLocalPath=req.file?.path

          if(!coverImageLocalPath){
            throw new ApiError(400,"cover Image is Missing ")
          }

         const coverImage=await  uploadOnCloudinary(coverImageLocalPath)

         if(!coverImage.url){
          throw new ApiError(400,"Avatar is Missing")
         }

         const user=await User.findByIdAndUpdate(req.user?._id
          ,
          {
            $set:{
              coverImage:coverImage.url
            }
          },
          {
            new:true
          }
         ).select("-password")

        return res.status(200).json(new ApiResponse(200,user,"cover Image Updated Successfully"))

})

export { registerUser,loginUser,logOutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,UpdateAccountDetails,UpdateUserAvatar,UpdateUserCoverImage };

