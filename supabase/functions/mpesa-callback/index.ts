import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const callbackData = await req.json();
    
    console.log("M-Pesa callback received:", JSON.stringify(callbackData, null, 2));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract callback data
    const { Body } = callbackData;
    const { stkCallback } = Body;
    
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    console.log("Result Code:", resultCode);
    console.log("Result Description:", resultDesc);
    console.log("Checkout Request ID:", checkoutRequestId);

    // Find the loan application
    const { data: loanApp, error: findError } = await supabase
      .from("loan_applications")
      .select("*")
      .eq("mpesa_checkout_request_id", checkoutRequestId)
      .single();

    if (findError || !loanApp) {
      console.error("Failed to find loan application:", findError);
      throw new Error("Loan application not found");
    }

    // Update based on result code
    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const transactionId = callbackMetadata.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      )?.Value;

      console.log("Payment successful. Transaction ID:", transactionId);

      const { error: updateError } = await supabase
        .from("loan_applications")
        .update({
          status: "paid",
          mpesa_transaction_id: transactionId,
        })
        .eq("id", loanApp.id);

      if (updateError) {
        console.error("Failed to update loan application:", updateError);
        throw new Error("Database update failed");
      }

      console.log("Loan application updated to paid status");
    } else {
      // Payment failed or cancelled
      console.log("Payment failed or cancelled");

      const { error: updateError } = await supabase
        .from("loan_applications")
        .update({
          status: "rejected",
        })
        .eq("id", loanApp.id);

      if (updateError) {
        console.error("Failed to update loan application:", updateError);
      }
    }

    // Return success response to M-Pesa
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: "Callback processed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in mpesa-callback function:", error);
    
    // Still return success to M-Pesa to prevent retries
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: "Callback received",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
