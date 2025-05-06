
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Book } from '@/types';
import { AnimatePresence, motion } from 'framer-motion'; // Import motion and AnimatePresence
import { Eye } from 'lucide-react';

interface FeaturedBooksProps {
  books: Book[];
  onReadClick: (pdfPath: string) => void;
}

// Default placeholder image path within the public directory
const DEFAULT_COVER = '/covers/default_cover.png'; // You should create this placeholder image

export function FeaturedBooks({ books, onReadClick }: FeaturedBooksProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Ensure this runs only on the client
    if (books.length > 1) {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % books.length);
        }, 3000); // Rotate every 3 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }
  }, [books.length]); // Re-run effect if the number of books changes

  if (!books || books.length === 0) {
    return null; // Don't render if no books
  }

  const currentBook = books[currentIndex];
  const coverSrc = currentBook.cover || DEFAULT_COVER;


  return (
    // Revert to bg-secondary for the section background
    <div className="relative w-full bg-secondary py-12 md:py-16 lg:py-20 overflow-hidden">
      <AnimatePresence mode="wait"> {/* Use mode="wait" for smooth transitions */}
        <motion.div
          key={currentIndex} // Key change triggers the animation
          initial={{ opacity: 0, x: 50 }} // Start off-screen right and invisible
          animate={{ opacity: 1, x: 0 }} // Animate to visible and center
          exit={{ opacity: 0, x: -50 }} // Animate out to the left and invisible
          transition={{ duration: 0.5, ease: "easeInOut" }} // Smooth transition
          className="container mx-auto px-4 md:px-6"
        >
          {/* Card is transparent, background comes from the parent div */}
          <Card className="overflow-hidden border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Disable right-click and dragging on the image */}
                 <div
                    className="relative aspect-[3/4] w-full max-w-xs mx-auto md:mx-0 rounded-lg overflow-hidden shadow-lg"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()} // Prevent context menu
                 >
                    <Image
                      src={coverSrc}
                      alt={currentBook.title}
                      layout="fill"
                      objectFit="cover"
                      className="pointer-events-none" // Double ensure no interaction
                       // Add data-ai-hint based on category or title if needed
                      data-ai-hint={`featured ${currentBook.category?.toLowerCase() || 'book'}`.split(' ').slice(0,2).join(' ')} // Example: "featured fiction"
                       // Handle image loading errors gracefully
                       onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER; }}
                    />
                 </div>
                <div className="space-y-4 text-center md:text-left">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                    {currentBook.title}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    By {currentBook.author}
                  </p>
                  <p className="text-muted-foreground">
                     {/* Add short promotional text if available in your Book type */}
                    Discover stories that inspire and transport you to new worlds.
                  </p>
                  <Button size="lg" onClick={() => onReadClick(currentBook.pdfPath)}>
                     <Eye className="mr-2 h-4 w-4" />
                    Leer Ahora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Optional Navigation Dots */}
       {books.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {books.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full ${
                    currentIndex === index ? 'bg-accent' : 'bg-muted-foreground/50'
                    } transition-colors`}
                    aria-label={`Go to slide ${index + 1}`}
                />
                ))}
            </div>
        )}
    </div>
  );
}
