import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import type { LoanApplication } from "@/types";

interface LoanFormProps {
  onSubmit: (data: Partial<LoanApplication>) => void;
  initialData?: Partial<LoanApplication>;
}

const loanTypes = [
  {
    id: "quick",
    title: "Quick Loan",
    description: "Fast approval for urgent needs",
  },
  {
    id: "emergency",
    title: "Emergency Loan",
    description: "Immediate funds for emergencies",
  },
  {
    id: "business",
    title: "Business Loan",
    description: "Support for your business growth",
  },
];

export const LoanForm = ({ onSubmit, initialData }: LoanFormProps) => {
  const [formData, setFormData] = useState<Partial<LoanApplication>>({
    firstName: initialData?.firstName || "",
    secondName: initialData?.secondName || "",
    idNumber: initialData?.idNumber || "",
    phoneNumber: initialData?.phoneNumber || "",
    monthlyEarnings: initialData?.monthlyEarnings || "",
    loanType: initialData?.loanType || "quick",
    loanAmount: initialData?.loanAmount || 10000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateIdNumber = (id: string) => {
    const idRegex = /^\d{7,8}$/;
    return idRegex.test(id);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.secondName) newErrors.secondName = "Second name is required";
    if (!formData.idNumber) {
      newErrors.idNumber = "ID number is required";
    } else if (!validateIdNumber(formData.idNumber)) {
      newErrors.idNumber = "Invalid Kenyan ID number (7-8 digits)";
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid Kenyan phone number";
    }
    if (!formData.monthlyEarnings) {
      newErrors.monthlyEarnings = "Monthly earnings is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const updateField = (field: keyof LoanApplication, value: any) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Apply for a Loan</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Fill in your details to check your loan eligibility
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="secondName">Second Name</Label>
            <Input
              id="secondName"
              placeholder="Doe"
              value={formData.secondName}
              onChange={(e) => updateField("secondName", e.target.value)}
              className={errors.secondName ? "border-destructive" : ""}
            />
            {errors.secondName && (
              <p className="text-xs text-destructive mt-1">{errors.secondName}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="monthlyEarnings">Monthly Earnings</Label>
          <Select
            value={formData.monthlyEarnings}
            onValueChange={(value) => updateField("monthlyEarnings", value)}
          >
            <SelectTrigger className={errors.monthlyEarnings ? "border-destructive" : ""}>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1000-10000">KES 1,000 - 10,000</SelectItem>
              <SelectItem value="10000-30000">KES 10,000 - 30,000</SelectItem>
              <SelectItem value="30000-50000">KES 30,000 - 50,000</SelectItem>
              <SelectItem value="50000+">KES 50,000+</SelectItem>
            </SelectContent>
          </Select>
          {errors.monthlyEarnings && (
            <p className="text-xs text-destructive mt-1">{errors.monthlyEarnings}</p>
          )}
        </div>

        <div className="mb-4">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input
            id="idNumber"
            placeholder="12345678"
            value={formData.idNumber}
            onChange={(e) => updateField("idNumber", e.target.value)}
            className={errors.idNumber ? "border-destructive" : ""}
          />
          {errors.idNumber && (
            <p className="text-xs text-destructive mt-1">{errors.idNumber}</p>
          )}
        </div>

        <div className="mb-6">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            placeholder="+254712345678"
            value={formData.phoneNumber}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
            className={errors.phoneNumber ? "border-destructive" : ""}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>
          )}
        </div>

        <div className="mb-6">
          <Label className="mb-3 block">Select Loan Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loanTypes.map((type) => (
              <Card
                key={type.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  formData.loanType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
                onClick={() => updateField("loanType", type.id)}
              >
                <h3 className="font-semibold text-sm mb-1">{type.title}</h3>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Label>Loan Amount (KES)</Label>
            <span className="text-2xl font-bold text-primary">
              {formData.loanAmount?.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[formData.loanAmount || 10000]}
            onValueChange={([value]) => updateField("loanAmount", value)}
            min={1000}
            max={50000}
            step={1000}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1,000</span>
            <span>50,000</span>
          </div>
        </div>

        <Card className="p-4 bg-muted/50 mb-6">
          <h3 className="font-semibold mb-3">Loan Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Interest Rate:</p>
              <p className="font-semibold">10%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Application Fee:</p>
              <p className="font-semibold text-primary">KES 230</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Repayment Period:</p>
              <p className="font-semibold">30 days</p>
            </div>
          </div>
        </Card>

        <Button type="submit" className="w-full" size="lg">
          Continue
        </Button>
      </Card>
    </form>
  );
};
