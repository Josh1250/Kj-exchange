import Layout from '../components/layout/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just show a success message
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      <Head>
        <title>Contact · KJ Exchange</title>
        <meta name="description" content="Get in touch with KJ Exchange. We're here to help you with any questions or support needs." />
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left: Contact Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
                Get in <span className="text-orange">Touch</span>
              </h1>
              <p className="text-text-muted mb-8">
                Have questions or need support? We're here to help. Reach out to us through any of the channels below.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <div>
                    <p className="font-semibold">WhatsApp</p>
                    <a href="https://wa.me/2348160678317" target="_blank" className="text-text-muted hover:text-orange transition text-sm">
                      +234 816 067 8317
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl">
                    <i className="fa-regular fa-envelope"></i>
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href="mailto:support@kjexchange.com" className="text-text-muted hover:text-orange transition text-sm">
                      support@kjexchange.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl">
                    <i className="fa-regular fa-clock"></i>
                  </div>
                  <div>
                    <p className="font-semibold">Support Hours</p>
                    <p className="text-text-muted text-sm">24/7 — We're always here for you</p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="mt-8">
                <p className="font-semibold mb-3">Follow Us</p>
                <div className="flex gap-4">
                  <a href="https://instagram.com/kj_xchange" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-orange hover:border-orange transition">
                    <i className="fab fa-instagram text-lg"></i>
                  </a>
                  <a href="https://tiktok.com/@kj_xchange" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-orange hover:border-orange transition">
                    <i className="fab fa-tiktok text-lg"></i>
                  </a>
                  <a href="https://wa.me/2348160678317" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-orange hover:border-orange transition">
                    <i className="fab fa-whatsapp text-lg"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="bg-bg-card/60 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <h2 className="text-xl font-bold mb-4">Send a Message</h2>
              {submitted ? (
                <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4 text-green-400 text-sm flex items-center gap-2">
                  <i className="fa-regular fa-circle-check"></i>
                  <span>Thank you! We'll get back to you soon.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none resize-none"
                      placeholder="How can we help you?"
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition shadow-lg shadow-orange/20"
                  >
                    <i className="fa-solid fa-paper-plane mr-2"></i>Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
