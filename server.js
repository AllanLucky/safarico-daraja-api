// indexStart.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import helper functions
import { getAccessToken } from "./Mpesa/auth.js";      // Function to request OAuth token from Safaricom
import { generateStkPush } from "./Mpesa/generateStkPush.js"; // Function to trigger STK push request

dotenv.config(); // Load environment variables from .env file
const app = express();

// ------------------- Middleware ------------------- //
app.use(cors({ origin: "*", credentials: true })); // Enable CORS (allow all origins for now)
app.use(express.json()); // Parse incoming JSON request bodies

// ------------------- Routes ------------------- //

// Route to initiate M-Pesa STK Push
app.post("/initiate", async (req, res) => {
    try {
        // Extract required details from request body
        const { phoneNumber, amount, productName } = req.body;

        // 1. Get Access Token from Safaricom
        const accessToken = await getAccessToken();

        // 2. Trigger STK Push request
        const stkResponse = await generateStkPush(
            accessToken,
            phoneNumber,
            amount,
            productName
        );

        // 3. Send success response back to frontend
        res.json({
            success: true,
            message: "STK Push initiated successfully",
            data: stkResponse,
        });
    } catch (error) {
        // Handle errors gracefully
        res.status(500).json({
            success: false,
            error: "Failed to initiate STK push",
            details: error.message,
        });
    }
});

// ------------------- Callback Route ------------------- //
// This is where Safaricom will send payment result after STK push
app.post("/stk-callback", (req, res) => {
    try {
        const callbackData = req.body;
        const { Body } = callbackData;

        if (Body?.stkCallback) {
            const stkCallback = Body.stkCallback;
            const resultCode = stkCallback.ResultCode;
            const resultDesc = stkCallback.ResultDesc;
            const checkoutRequestID = stkCallback.CheckoutRequestID;

            if (resultCode === 0) {
                // Payment successful — extract transaction details
                const meta = stkCallback.CallbackMetadata?.Item || [];
                const amount = meta.find((item) => item.Name === "Amount")?.Value;
                const mpesaReceipt = meta.find((item) => item.Name === "MpesaReceiptNumber")?.Value;
                const phoneNumber = meta.find((item) => item.Name === "PhoneNumber")?.Value;

                // TODO: Save successful transaction to DB (amount, mpesaReceipt, phoneNumber, checkoutRequestID)
            } else {
                // TODO: Log failed transaction with resultDesc and checkoutRequestID
            }
        }

        // Always respond 200 so Safaricom knows callback was received
        res.json({ message: "Callback received successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to process callback" });
    }
});

// ------------------- Start Server ------------------- //
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
    // Production: Use a proper logger instead of console
});
