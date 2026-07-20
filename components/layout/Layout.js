import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main id="top" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
