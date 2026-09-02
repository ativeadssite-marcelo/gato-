import './globals.css';

export const metadata = {
  title: 'Gato — MGN Autopeças',
  description: 'Estoque, balcão e gestão comercial',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
