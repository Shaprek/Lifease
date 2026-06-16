import "./globals.css";

export const metadata = {
  title: "Lifease FAQ Assistant",
  description: "AI-powered FAQ assistant with MongoDB conversation history and search.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
