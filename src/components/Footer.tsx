
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Flexbo Packaging</h3>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              Premium packaging solutions for businesses worldwide, combining quality materials with elegant designs.
            </p>
            <div className="flex space-x-4">
              <SocialLink href="#" icon={<Facebook size={18} />} />
              <SocialLink href="#" icon={<Instagram size={18} />} />
              <SocialLink href="#" icon={<Linkedin size={18} />} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <FooterLink to="/" label="Home" />
              <FooterLink to="/products" label="Products" />
              <FooterLink to="/about" label="About Us" />
              <FooterLink to="/contact" label="Contact" />
            </nav>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Products</h3>
            <nav className="flex flex-col space-y-2">
              <FooterLink to="/products/paper-bags" label="Paper Bags" />
              <FooterLink to="/products/boxes" label="Boxes" />
              <FooterLink to="/products/gift-packaging" label="Gift Packaging" />
              <FooterLink to="/products/custom-packaging" label="Custom Packaging" />
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <ContactItem icon={<MapPin size={18} />} text="Balitai Industrial Park, Jianshi YiZhi Road,4 - Tianjin China" />
              <ContactItem icon={<Phone size={18} />} text="+86 (22) 2872 0595" />
              <ContactItem icon={<Mail size={18} />} text="sales@flexbo.com.cn" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {currentYear} Flexbo Packaging. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Privacy Policy
              </span>
              <span className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors duration-300"
  >
    {icon}
  </a>
);

const FooterLink = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
    {label}
  </Link>
);

const ContactItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-start">
    <div className="text-gray-600 mt-0.5 mr-2">{icon}</div>
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

export default Footer;
