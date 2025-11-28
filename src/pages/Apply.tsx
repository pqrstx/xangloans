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

export default function Apply() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loanData, setLoanData] = useState<Partial<LoanApplication>>({});
  const { toast } = useToast();

  const handleFormSubmit = (data: Partial<LoanApplication>) => {
    setLoanData({ ...loanData, ...data });
    
    // Save to localStorage
    localStorage.setItem("loanApplication", JSON.stringify({ ...loanData, ...data }));
    
    // Move to eligibility check step
    setCurrentStep(2);
    
    // Simulate eligibility check
    setTimeout(() => {
      setCurrentStep(3);
      toast({
        title: "Loan Approved!",
        description: "You're eligible for the loan. Proceed to payment.",
      });
    }, 2000);
  };

  const handlePayment = async (phoneNumber: string) => {
    try {
      toast({
        title: "Processing Payment",
        description: "Please check your phone for the M-Pesa prompt...",
      });

      // Here you would integrate with M-Pesa API through Supabase function
      // For now, simulate success
      setTimeout(() => {
        setCurrentStep(4);
        localStorage.removeItem("loanApplication");
        toast({
          title: "Payment Successful!",
          description: "Your loan has been processed successfully.",
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
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
