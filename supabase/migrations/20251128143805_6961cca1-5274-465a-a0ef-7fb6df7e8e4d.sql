-- Create loan_applications table
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  second_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  monthly_earnings TEXT NOT NULL,
  loan_type TEXT NOT NULL CHECK (loan_type IN ('quick', 'emergency', 'business')),
  loan_amount INTEGER NOT NULL,
  application_fee INTEGER NOT NULL DEFAULT 230,
  interest_rate INTEGER NOT NULL DEFAULT 10,
  repayment_period INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  mpesa_checkout_request_id TEXT,
  mpesa_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert loan applications
CREATE POLICY "Anyone can create loan applications" 
ON public.loan_applications 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading own applications by phone number
CREATE POLICY "Users can view their own applications" 
ON public.loan_applications 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loan_applications_updated_at
BEFORE UPDATE ON public.loan_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_loan_applications_phone ON public.loan_applications(phone_number);
CREATE INDEX idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX idx_loan_applications_created_at ON public.loan_applications(created_at DESC);