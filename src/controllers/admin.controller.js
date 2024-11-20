import { Admin } from "../model/admin.model.js";
import sendPasswordResetEmail from "../utils/changepassword.js";

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await Admin.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    return { accessToken, refreshToken };
  } catch (error) {
    return res.status(400).json({
      messaage: "something went wrong while creating user",
      success: false,
    });
  }
};
const createAdmin = async (req, res) => {
  const { username, email, password, adminType } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  try {
    const exitadmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });
    if (exitadmin) {
      return res.status(400).json({
        status: 400,
        message: "Email already exists",
        success: false,
      });
    }
    const admin = await Admin.create({
      username,
      email,
      password,
      adminType,
    });

    return res.status(200).json({
      status: 200,
      message: "Admin Create SuccessFully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      success: false,
    });
  }
};
const adminlogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const user = await Admin.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await Admin.findById(user._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: false,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        data: loggedInUser,
        adminType: loggedInUser.adminType,
        id: loggedInUser._id,
        senderType: "admin",
        success: true,
        accessToken: accessToken,
        refreshToken: refreshToken,
        messaage: "Logged In Successfully !!",
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Internal Error", error });
  }
};
const logoutAdmin = async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      message: "Admin Logged Out Successfully",
      success: true,
    });
};
const getallAdmin = async (req, res) => {
  try {
    const admins = await Admin.find({});
    const count = admins.length;
    console.log("Admin in Server =>", admins);
    return res.status(200).json({
      data: admins,
      count: count,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Internal Server Error",
      success: false,
      error,
    });
  }
};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendMailTochangePassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required", success: false });
  }
  try {
    const admin = await Admin.findOne({ email });
  if (!admin) {
    return res
      .status(404)
      .json({ message: "Admin not found", success: false });
  }
  const generatedOTP = generateOTP();
  admin.changepasswordcode = generatedOTP;
  await admin.save();
  const emailSent = await sendPasswordResetEmail(email, generatedOTP);
  if (emailSent) {
    return res
      .status(200)
      .json({ message: "Password reset email sent", success: true });
  } else {
    return res
      .status(500)
      .json({ message: "Failed to send password reset email", success: false });
  }
  } catch (error) {
    return res.status(500).json({
      messaage: "Error while changing password",
      success: false,
    });
  }
};

const changePassword = async (req, res) => {
  const { newPassword, otp, email } = req.body;
  if (!newPassword && !otp && !id) {
    return res.status(400).json({
      message: "New password, OTP, and Email is required !!",
      success: false,
    });
  }

  try {
    const admin = await Admin.findOne({
      email: email,
      changepasswordcode: otp,
    });
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found or OTP is expired",
        success: false,
      });
    }
    admin.password = newPassword;
    admin.changepasswordcode = null;
    await admin.save();

    return res.status(200).json({
      message: "Password updated successfully",
      data: admin,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while updating password",
      success: false,
    });
  }
};

const deleteAdmin = async(req, res) => {
  const { email } = req.body
  try {
    const deletedAdmin = await Admin.findOneAndDelete({ email })

    if (!deletedAdmin) {
      return res.status(404).json({
        message: "Admin Not Found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: deletedAdmin,
      message: "Admin Deleted Successfully !!",
      success: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error While Deleting Admin !!",
      success: false,
    });
  }
}

const getCurrentAdmin = async (req, res) => {
  try {
    const _id = req.user?._id
    const admin = await Admin.findById({ _id })
    if (!admin) {
      return res.status(404).json({
        message: "Admin Not Found !!",
        success: false,
      });
    }
    return res.status(200).json({
      data: admin,
      message: "Admin Found !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error While Getting Current Admin !!",
      success: false,
    });
  }
}

export { createAdmin, adminlogin, logoutAdmin, getallAdmin, sendMailTochangePassword, changePassword, deleteAdmin, getCurrentAdmin };
