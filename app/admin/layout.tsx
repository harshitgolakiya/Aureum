import "./admin.css";

export const metadata = {
  title: "Content Management",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
