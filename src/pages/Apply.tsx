import { useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { StepIndicator } from "@/components/StepIndicator";
import { LoanForm } from "@/components/LoanForm";
import { LoanSummary } from "@/components/LoanSummary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { LoanApplication } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Apply() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loanData, setLoanData] = useState<Partial<LoanApplication>>({});
  const { toast } = useToast();

  const handleFormSubmit = async (data: Partial<LoanApplication>) => {
    const fullData = { ...loanData, ...data };
    setLoanData(fullData);
    
    // Save to localStorage
    localStorage.setItem("loanApplication", JSON.stringify(fullData));
    
    // Move to eligibility check step
    setCurrentStep(2);
    
    try {
      // Create loan application in database
      const { data: loanApp, error } = await supabase
        .from("loan_applications")
        .insert({
          first_name: fullData.firstName!,
          second_name: fullData.secondName!,
          id_number: fullData.idNumber!,
          phone_number: fullData.phoneNumber!,
          monthly_earnings: fullData.monthlyEarnings!,
          loan_type: fullData.loanType!,
          loan_amount: fullData.loanAmount!,
          application_fee: 230,
          interest_rate: 10,
          repayment_period: 30,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      // Store the application ID
      setLoanData({ ...fullData, id: loanApp.id });
      
      // Simulate eligibility check
      setTimeout(() => {
        setCurrentStep(3);
        toast({
          title: "Loan Approved!",
          description: "You're eligible for the loan. Proceed to payment.",
        });
      }, 2000);
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast({
        title: "Error",
        description: "Failed to process your application. Please try again.",
        variant: "destructive",
      });
      setCurrentStep(1);
    }
  };

  const handlePayment = async (phoneNumber: string) => {
    try {
      if (!loanData.id) {
        throw new Error("Loan application ID not found");
      }

      toast({
        title: "Processing Payment",
        description: "Please check your phone for the M-Pesa prompt...",
      });

      // Call M-Pesa payment edge function
      const { data, error } = await supabase.functions.invoke("mpesa-payment", {
        body: {
          phoneNumber: phoneNumber,
          amount: 230, // Application fee
          loanApplicationId: loanData.id,
        },
      });

      if (error) {
        console.error("Payment error:", error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Payment failed");
      }

      console.log("Payment initiated:", data);

      toast({
        title: "Payment Initiated",
        description: "Enter your M-Pesa PIN to complete the payment.",
      });

      // Poll for payment status
      const pollInterval = setInterval(async () => {
        const { data: loanApp, error: fetchError } = await supabase
          .from("loan_applications")
          .select("status")
          .eq("id", loanData.id)
          .single();

        if (fetchError) {
          console.error("Error fetching loan status:", fetchError);
          return;
        }

        if (loanApp.status === "paid") {
          clearInterval(pollInterval);
          setCurrentStep(4);
          localStorage.removeItem("loanApplication");
          toast({
            title: "Payment Successful!",
            description: "Your loan has been processed successfully.",
          });
        } else if (loanApp.status === "rejected") {
          clearInterval(pollInterval);
          toast({
            title: "Payment Cancelled",
            description: "The payment was cancelled or failed.",
            variant: "destructive",
          });
        }
      }, 3000); // Poll every 3 seconds

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 120000);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <div className="container py-8 max-w-4xl">
        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && (
          <LoanForm onSubmit={handleFormSubmit} initialData={loanData} />
        )}

        {currentStep === 2 && (
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Checking Eligibility...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your information
            </p>
          </Card>
        )}

        {currentStep === 3 && (
          <LoanSummary
            data={loanData}
            onBack={() => setCurrentStep(1)}
            onPayment={handlePayment}
          />
        )}

        {currentStep === 4 && (
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Success!</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Your loan application has been successfully submitted and payment received.
              You will receive the funds in your M-Pesa shortly.
            </p>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                <p className="text-2xl font-bold text-primary">
                  KES {loanData.loanAmount?.toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Track your loan status via SMS updates to {loanData.phoneNumber}
              </p>
            </div>
            <Button asChild className="mt-8" size="lg">
              <Link to="/">Return to Home</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
