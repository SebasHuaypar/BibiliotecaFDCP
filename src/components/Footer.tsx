
import React from 'react';
import { Github, Twitter, Facebook, Instagram } from 'lucide-react'; // Using lucide-react icons

export function Footer() {
  // Get current year dynamically
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-gray-900 text-gray-400 py-8 mt-16"> {/* Adjusted dark background */}
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 hover:text-accent transition-colors">
            <Github className="h-6 w-6" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-accent transition-colors">
            <Twitter className="h-6 w-6" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-accent transition-colors">
            <Facebook className="h-6 w-6" />
          </a>
           <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-accent transition-colors">
            <Instagram className="h-6 w-6" />
          </a>
        </div>
        <p className="text-sm">
          {/* Update copyright text */}
          &copy; {currentYear} Biblioteca Virtual FDCP. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

