import { Link } from "react-router";
import AuthLayout from "../Auth/AuthLayout.jsx";

export default function NotFoundPage() {
  return (
    <AuthLayout
      eyebrow="404"
      title="This page has wilted"
      subtitle="The page you’re looking for doesn’t exist or has moved."
    >
      <Link to="/" className="btn btn--ink">
        Back to the atelier
      </Link>
    </AuthLayout>
  );
}
