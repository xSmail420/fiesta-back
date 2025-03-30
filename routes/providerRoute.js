const express = require("express");
const router = express.Router();
const Provider = require("../models/providerModel");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/bookingModel");
const User = require("../models/userModel");

router.get(
  "/get-provider-info-by-user-id/:userId",
  authMiddleware,
  async (req, res) => {
    try {
      console.log(req.params.userId);
      const provider = await Provider.findOne({ userId: req.params.userId });
      console.log(provider);
      res.status(200).send({
        success: true,
        message: "Provider info fetched successfully",
        data: provider,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error getting provider info",
        success: false,
        error,
      });
    }
  }
);

router.get(
  "/get-provider-info-by-id/:providerId",
  authMiddleware,
  async (req, res) => {
    try {
      console.log(req.params.providerId);
      const provider = await Provider.findOne({ _id: req.params.providerId });

      console.log(provider.firstName);
      console.log(provider.lastName);

      res.status(200).send({
        success: true,
        message: "Provider info fetched successfully",
        data: provider,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error getting provider info",
        success: false,
        error,
      });
    }
  }
);

router.post("/get-provider-info-by-id/", authMiddleware, async (req, res) => {
  try {
    console.log(req.body.providerId);
    const provider = await Provider.findOne({ _id: req.body.providerId });

    console.log(provider.firstName);
    console.log(provider.lastName);

    res.status(200).send({
      success: true,
      message: "Provider info fetched successfully",
      data: provider,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting provider info", success: false, error });
  }
});

router.post("/update-provider-profile", authMiddleware, async (req, res) => {
  try {
    const provider = await Provider.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );

    console.log(provider);

    res.status(200).send({
      success: true,
      message: "Provider profile updated successfully",
      data: provider,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Error getting provider info", sucess: false, error });
  }
});

router.get(
  "/get-appointments-by-provider-id",
  authMiddleware,
  async (req, res) => {
    try {
      const provider = await Provider.findOne({ userId: req.body.userId });
      console.log(provider);
      const appointments = await Appointment.find({ providerId: provider._id });
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
  }
);

router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      status,
    });

    const user = await User.findOne({ _id: appointment.userId });

    console.log(user);

    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      type: "Appointment-status-changed",
      message: `Appointment status has been ${status}`,
      onClickPath: "/appointments",
    });
    await user.save();

    console.log(unseenNotifications);

    res.status(200).send({
      message: "Appointment status changed successfully",
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error changing appointment status",
      success: false,
      error,
    });
  }
});

module.exports = router;
