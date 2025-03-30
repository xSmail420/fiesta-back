const express = require('express');
const router = express.Router();
const Provider = require("../models/providerModel");
const User = require("../models/userModel");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/get-all-providers", authMiddleware, async(req, res) => {
    try{
        const providers = await Provider.find({});
        console.log(providers);
        res.status(200).send({
            message: "Providers fetched successfully",
            success: true,
            data: providers,
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            message: "Error applying provider account",
            success: false,
            error,
        });
    }
});

router.get("/get-all-users", authMiddleware, async(req, res) => {
    try{
        const users = await User.find({});
        console.log(users);
        res.status(200).send({
            message: "Users fetched successfully",
            success: true,
            data: users,
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            message: "Error applying provider account",
            success: false,
            error,
        });
    }
});

router.post("/change-provider-account-status", authMiddleware, async(req, res) => {
    try{
        const {providerId, status} = req.body;
        const provider = await Provider.findByIdAndUpdate(providerId, {
            status,
        });

        console.log(provider);

        const user = await User.findOne({_id: provider.userId});

        console.log(user);

        const unseenNotifications = user.unseenNotifications;
        unseenNotifications.push({
            type: "new-provider-request-changed",
            message: `Your provider account has been ${status}`,
            onClickPath: "/notifications",
        })
        user.isProvider = status === "approved" ? true : false;
        await user.save();

        res.status(200).send({
            message: "Provider status updated successfully",
            success: true,
            data: provider,
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            message: "Error applying provider account",
            success: false,
            error,
        });
    }
});

module.exports = router;