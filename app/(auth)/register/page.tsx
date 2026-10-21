import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="auth-card">
      <Link className="back-link" href="/">←&nbsp; Back to home</Link>
      <h2>Create your account</h2>
      <p className="auth-subtitle">A little learning can take you a long way. Start here.</p>
      <AuthForm mode="register" />
    </div>
  );
}
