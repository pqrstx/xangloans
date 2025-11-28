export interface LoanApplication {
  id?: string;
  firstName: string;
  secondName: string;
  idNumber: string;
  phoneNumber: string;
  monthlyEarnings: string;
  loanType: 'quick' | 'emergency' | 'business';
  loanAmount: number;
  applicationFee: number;
  interestRate: number;
  repaymentPeriod: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt?: string;
}

export interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  message: string;
  checkoutRequestId?: string;
}
