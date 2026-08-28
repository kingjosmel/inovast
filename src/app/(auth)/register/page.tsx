import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Register | FoodGo",
  description: "Create a new FoodGo account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white mx-auto mb-4">
              F
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
            <p className="mt-2 text-slate-600">Join FoodGo and start your journey</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
            <RegisterForm />
          </div>

          <div className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
