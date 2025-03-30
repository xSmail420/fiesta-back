const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Provider = require("../models/providerModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/bookingModel");
const moment = require("moment");

router.post("/register", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newuser = new User(req.body);
    await newuser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error creating user", success: false });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      return res
        .status(200)
        .send({ message: "Login successful", success: true, data: token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error Logging In", success: false, error });
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });

    console.log(user);

    user.password = undefined;
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", sucess: false });
    } else {
      res.status(200).send({ success: true, data: user });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.post("/apply-provider-account", authMiddleware, async (req, res) => {
  try {
    const newprovider = new Provider({ ...req.body, status: "pending" });
    await newprovider.save();
    const adminUser = await User.findOne({ isAdmin: true });

    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-provider-request",
      message: `${newprovider.firstName} ${newprovider.lastName} has applied for a provider account`,
      data: {
        providerId: newprovider._id,
        name: newprovider.firstName + " " + newprovider.lastName,
      },
      onClickPath: "/admin/providerslist",
    });
    console.log(unseenNotifications);
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Provider account applied successfully",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error applying provider account", success: false });
  }
});

router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      //Marking all notifications as seen
      seenNotifications.push(...unseenNotifications);
      //Emptying the notifications
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying provider account",
        success: false,
        error,
      });
    }
  }
);

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    console.log(user);
    //deleting all user notifications
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications deleted",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error deleting notifications", success: false });
  }
});

router.get("/get-all-approved-providers", authMiddleware, async (req, res) => {
  try {
    const providers = await Provider.find({ status: "approved" });
    console.log(providers);
    res.status(200).send({
      message: "Providers fetched successfully",
      success: true,
      data: providers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying provider account",
      success: false,
      error,
    });
  }
});

router.post("/book-service", authMiddleware, async (req, res) => {
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    const newAppointment = new Appointment(req.body);
    await newAppointment.save(); //pushing notification to provider based on his userId
    const user = await User.findOne({ _id: req.body.providerInfo.userId });
    user.unseenNotifications.push({
      type: "new-booking-request",
      message: `A new booking request has been made by ${req.body.userInfo.name}`,
      onClickPath: "/provider/bookings",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error appointment appointment",
      success: false,
      error,
    });
  }
});

router.post(
  "/check-appointment-availability",
  authMiddleware,
  async (req, res) => {
    try {
      const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
      const fromTime = moment(req.body.time, "HH:mm")
        .subtract(1, "hours")
        .toISOString();
      const toTime = moment(req.body.time, "HH:mm")
        .add(1, "hours")
        .toISOString();
      const providerId = req.body.providerId;
      const appointments = await Appointment.find({
        providerId,
        date,
        time: { $gte: fromTime, $lte: toTime },
      });
      console.log(fromTime, toTime);
      console.log(date);
      if (appointments.length > 0) {
        return res.status(200).send({
          message: "Appointment not available",
          success: false,
        });
      } else {
        return res.status(200).send({
          message: "Appointment available",
          success: true,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error appointment appointment",
        success: false,
        error,
      });
    }
  }
);

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.body.userId });
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error getting appointments",
      success: false,
      error,
    });
  }
});

module.exports = router;
