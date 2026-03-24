import FuelDispositionForm from "@/components/FuelDispositionForm";

export const metadata = {
  title: "Fuel Dispositions Form",
  description: "Form for fuel dispositions by field agents",
};

export default function FormPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <FuelDispositionForm />
    </div>
  );
}
