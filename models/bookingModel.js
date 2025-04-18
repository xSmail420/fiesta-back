const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
    },
    providerId:{
        type: String,
        required: true,
    },
    userInfo:{
        type: Object,
        required: true,
    },
    userInfo:{
        type: Object,
        required: true,
    },
    providerInfo:{
        type: Object,
        required: true,
    },
    date:{
        type: String,
        required: true,
    },
    time:{
        type: String,
        required: true,
    },
    status:{
        type: String,
        required: true,
        default: "pending",
    },
},{
    timestamps: true,
}

);

const bookingModel = mongoose.model("booking", bookingSchema);
module.exports = bookingModel;
