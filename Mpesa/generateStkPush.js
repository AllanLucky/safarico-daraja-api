// Function to initiate an STK Push request
export async function generateStkPush(accessToken, phoneNumber, amount, productName, customDesc) {

    // Safaricom Daraja API credentials (loaded from environment variables for security)
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackurl = process.env.MPESA_CALLBACK_URL;

    // Function to generate timestamp in YYYYMMDDHHMMSS format
    const generateTimestamp = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };

    // Generate timestamp for password creation
    const timestamp = generateTimestamp();

    // Encode password using Base64 (Shortcode + Passkey + Timestamp)
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    // STK Push request body as per Safaricom Daraja API documentation
    const requestBody = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline", // Default transaction type
        Amount: amount, // Amount to be charged
        PartyA: phoneNumber, // Customer phone number (payer)
        PartyB: shortcode, // Paybill/Till number (receiver)
        PhoneNumber: phoneNumber, // Same as PartyA
        CallBackURL: callbackurl, // URL to receive response from Safaricom
        AccountReference: productName, // Used to identify transaction (e.g., product/service name)

        // 👇 Dynamic TransactionDesc (uses custom description if provided, otherwise fallback)
        TransactionDesc: customDesc || `Payment of KES ${amount} for ${productName}`,
    };

    try {
        // Send request to Safaricom STK Push API
        const response = await fetch(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }
        );

        // Parse Safaricom API response
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("❌ STK Push Request Failed:", error);
        throw error;
    }
}
