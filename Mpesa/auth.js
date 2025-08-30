export async function getAccessToken() {
    try {
        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

        // Convert consumerKey and consumerSecret to base64
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const response = await fetch(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${auth}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.access_token; // return only the access token
    } catch (error) {
        console.error("Error getting access token:", error.message);
        throw error;
    }
}
