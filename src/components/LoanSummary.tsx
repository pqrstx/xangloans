import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LoanApplication } from "@/types";
import { Loader2 } from "lucide-react";

interface LoanSummaryProps {
  data: Partial<LoanApplication>;
  onBack: () => void;
  onPayment: (phoneNumber: string) => Promise<void>;
}

export const LoanSummary = ({ data, onBack, onPayment }: LoanSummaryProps) => {
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentClick = () => {
    setShowPhoneDialog(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      await onPayment(phoneNumber);
      setShowPhoneDialog(false);
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applicationFee = 230;
  const loanAmount = data.loanAmount || 0;
  const totalAmount = loanAmount + applicationFee;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Payment Summary</h2>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between pb-3 border-b">
            <span className="text-muted-foreground">Loan Amount</span>
            <span className="font-semibold">KES {loanAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pb-3 border-b">
            <span className="text-muted-foreground">Application Fee</span>
            <span className="font-semibold text-primary">KES {applicationFee}</span>
          </div>
          <div className="flex justify-between pb-3 border-b">
            <span className="text-muted-foreground">Interest Rate</span>
            <span className="font-semibold">10%</span>
          </div>
          <div className="flex justify-between pb-3 border-b">
            <span className="text-muted-foreground">Repayment Period</span>
            <span className="font-semibold">30 days</span>
          </div>
          <div className="flex justify-between pt-3">
            <span className="text-lg font-bold">Total Payable</span>
            <span className="text-lg font-bold text-primary">
              KES {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Your Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">
                {data.firstName} {data.secondName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Number:</span>
              <span className="font-medium">{data.idNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{data.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Type:</span>
              <span className="font-medium capitalize">{data.loanType} Loan</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={handlePaymentClick} className="flex-1" size="lg">
            Pay with M-Pesa
          </Button>
        </div>
      </Card>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm M-Pesa Payment</DialogTitle>
            <DialogDescription>
              Enter your M-Pesa phone number to receive the payment prompt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="payment-phone">M-Pesa Phone Number</Label>
              <Input
                id="payment-phone"
                placeholder="+254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Amount to pay:</p>
              <p className="text-2xl font-bold text-primary">KES {applicationFee}</p>
              <p className="text-xs text-muted-foreground mt-2">
                This is the application processing fee
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPhoneDialog(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
