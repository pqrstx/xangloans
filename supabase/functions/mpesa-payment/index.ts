import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  phoneNumber: string;
  amount: number;
  loanApplicationId: string;
}

// Get M-Pesa OAuth token
async function getMpesaToken(): Promise<string> {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured");
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  
  console.log("Requesting M-Pesa OAuth token...");
  console.log("Using consumer key (first 10 chars):", consumerKey.substring(0, 10) + "...");
  
  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("OAuth token error response:", error);
    console.error("OAuth status:", response.status);
    throw new Error(`Failed to get M-Pesa token: ${error}`);
  }

  const data = await response.json();
  console.log("OAuth token obtained successfully");
  console.log("Token (first 20 chars):", data.access_token?.substring(0, 20) + "...");
  
  if (!data.access_token) {
    throw new Error("No access token in response");
  }
  
  return data.access_token;
}

// Format phone number to M-Pesa format (254XXXXXXXXX)
function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or plus signs
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  
  // If it starts with 0, replace with 254
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  }
  
  // If it doesn't start with 254, add it
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  
  return cleaned;
}

// Initiate STK Push
async function initiateSTKPush(
  token: string,
  phoneNumber: string,
  amount: number,
  accountReference: string
): Promise<any> {
  const shortcode = Deno.env.get("MPESA_SHORTCODE");
  const passkey = Deno.env.get("MPESA_PASSKEY");
  const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL");
  
  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("M-Pesa configuration incomplete");
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: "Xangloans Application Fee",
  };

  console.log("Initiating STK Push...");
  console.log("Shortcode:", shortcode);
  console.log("Phone:", formattedPhone);
  console.log("Amount:", Math.round(amount));
  console.log("Timestamp:", timestamp);
  console.log("Token (first 20 chars):", token.substring(0, 20) + "...");

  const response = await fetch(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  console.log("STK Push response status:", response.status);
  console.log("STK Push response:", JSON.stringify(data));
  
  if (!response.ok || data.errorCode) {
    console.error("STK Push failed");
    console.error("Error code:", data.errorCode);
    console.error("Error message:", data.errorMessage);
    
    // Provide more helpful error messages
    let errorMsg = data.errorMessage || "Failed to initiate payment";
    if (data.errorCode === "404.001.03") {
      errorMsg = "Invalid M-Pesa credentials. Please verify your Consumer Key, Consumer Secret, and Shortcode match and are for the same app.";
    }
    
    throw new Error(errorMsg);
  }

  console.log("STK Push initiated successfully");
  console.log("CheckoutRequestID:", data.CheckoutRequestID);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, loanApplicationId }: PaymentRequest = await req.json();

    console.log("Processing payment request for loan:", loanApplicationId);

    // Validate input
    if (!phoneNumber || !amount || !loanApplicationId) {
      throw new Error("Missing required fields");
    }

    // Get M-Pesa OAuth token
    const token = await getMpesaToken();

    // Initiate STK Push
    const stkResponse = await initiateSTKPush(
      token,
      phoneNumber,
      amount,
      loanApplicationId
    );

    // Update loan application with checkout request ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("loan_applications")
      .update({
        mpesa_checkout_request_id: stkResponse.CheckoutRequestID,
        status: "pending",
      })
      .eq("id", loanApplicationId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to update loan application");
    }

    console.log("Payment request processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment request sent. Please check your phone.",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in mpesa-payment function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Payment initiation failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
