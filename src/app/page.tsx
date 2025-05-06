
"use client"; // This page requires client-side hooks and state

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BookCard } from '@/components/BookCard';
import { FeaturedBooks } from '@/components/FeaturedBooks';
import { PdfViewer } from '@/components/PdfViewer';
import { type Book } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Path to the books JSON file
const BOOKS_JSON_PATH = '/data/books.json';

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  // const [searchTerm, setSearchTerm] = useState(''); // For search functionality
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [isBooksLoading, setIsBooksLoading] = useState(true); // Loading state for books
  const [categories, setCategories] = useState<string[]>([]); // State for dynamic categories

  // Fetch books from JSON and extract categories
  useEffect(() => {
    const fetchBooksAndCategories = async () => {
      setIsBooksLoading(true);
      try {
        const response = await fetch(BOOKS_JSON_PATH);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Book[] = await response.json();
        const validBooks = Array.isArray(data) ? data : [];
        setBooks(validBooks);
        setFilteredBooks(validBooks); // Initially show all books

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(validBooks.map(book => book.category).filter(Boolean))); // Filter out empty/null categories
        setCategories(uniqueCategories.sort()); // Sort categories alphabetically

      } catch (error) {
        console.error('Error fetching books.json:', error);
        setBooks([]); // Set empty array on error
        setFilteredBooks([]);
        setCategories([]);
      } finally {
          setIsBooksLoading(false);
      }
    };
    fetchBooksAndCategories();
  }, []); // Fetch books only once on mount

  // Filter books based on category and search term
  useEffect(() => {
    let tempBooks = books;

    if (currentFilter) {
      tempBooks = tempBooks.filter(book => book.category === currentFilter);
    }

    // if (searchTerm) {
    //   tempBooks = tempBooks.filter(book =>
    //     book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //     book.author.toLowerCase().includes(searchTerm.toLowerCase())
    //   );
    // }

    setFilteredBooks(tempBooks);
  }, [currentFilter, books]); // Re-run filter when filter, search term, or books change

  const handleFilterChange = (category: string | null) => {
    setCurrentFilter(category);
  };

  // const handleSearch = (term: string) => {
  //   setSearchTerm(term);
  // };

  const handleReadClick = (pdfPath: string) => {
    // Ensure pdfPath is valid and starts with /
    if (pdfPath && typeof pdfPath === 'string') {
        const correctedPath = pdfPath.startsWith('/') ? pdfPath : `/${pdfPath}`;
        console.log("Attempting to open PDF:", correctedPath); // Debug log
        setSelectedPdf(correctedPath);
    } else {
        console.error("Invalid pdfPath provided:", pdfPath);
        // Optionally show a toast error message
    }
  };


  const handleClosePdf = () => {
    setSelectedPdf(null);
  };

  // Loading state for authentication
  if (isAuthLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background"> {/* Use theme background */}
            {/* Simple loading text or spinner */}
            <p>Loading authentication...</p>
             {/* Or use Skeleton */}
             {/* <Skeleton className="h-10 w-40" /> */}
        </div>
    );
  }

  // If not authenticated, show the login form
  if (!user) {
    return <AuthForm />; // AuthForm manages its own background
  }

  // Separate lists for layout based on flags in books.json
  const novedades = filteredBooks.filter(b => b.isNew).slice(0, 4);
  const masLeidos = filteredBooks.filter(b => b.mostRead).slice(0, 3);
  const featured = books.filter(b => b.featured).slice(0, 4); // Use original books for featured

  // --- Main Authenticated View ---
  return (
    // Use bg-background (white) for the overall page container
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header
        categories={categories} // Pass dynamic categories
        onFilterChange={handleFilterChange}
        onSearch={() => {}} /* Pass handleSearch if implemented */
      />

      {/* FeaturedBooks component handles its own background (bg-secondary) */}
      {!isBooksLoading && featured.length > 0 && (
        <FeaturedBooks books={featured} onReadClick={handleReadClick} />
      )}
      {isBooksLoading && (
          <div className="container mx-auto px-4 md:px-6 py-8">
             <Skeleton className="h-64 w-full" />
          </div>
      )}


      {/* Main Content Grid - container for book sections */}
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
           {/* Optional: Add category filter buttons/dropdown here again if needed */}
           {/* <div className="mb-6"> ... Filter UI ... </div> */}

           {isBooksLoading ? (
             // Skeleton Loading for Book Grid
             <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Novedades</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={`new-skel-${i}`} className="h-80 w-full" />)}
                     </div>
                </div>
                 <div className="bg-muted/40 p-6 rounded-lg"> {/* Skeleton highlight */}
                    <h2 className="text-2xl font-bold mb-4">Más Leídos</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 md:gap-6">
                        {[...Array(3)].map((_, i) => <Skeleton key={`read-skel-${i}`} className="h-80 w-full" />)}
                     </div>
                 </div>
             </div>
           ) : (
             // Actual Book Grid
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 items-start"> {/* Use items-start */}
                 {/* Left Column: Novedades - Inherits bg-background from parent */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Novedades</h2>
                  {novedades.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                      {novedades.map((book) => (
                        <BookCard key={book.id} book={book} onReadClick={handleReadClick} />
                      ))}
                    </div>
                  ) : (
                     <p className="text-muted-foreground">No new books{currentFilter ? ` in ${currentFilter}` : ''}.</p>
                  )}
                </div>

                {/* Right Column: Más Leídos */}
                {/* Apply background, padding, rounded corners for highlight */}
                <div className="bg-muted/40 p-6 rounded-lg"> {/* Highlight Styles */}
                    <h2 className="text-2xl font-bold mb-4">Más Leídos</h2>
                     {masLeidos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 md:gap-6">
                         {masLeidos.map((book) => (
                            <BookCard key={book.id} book={book} onReadClick={handleReadClick} />
                        ))}
                        </div>
                     ) : (
                         <p className="text-muted-foreground">No most read books{currentFilter ? ` in ${currentFilter}` : ''}.</p>
                     )}
                </div>

             </div>
           )}
        </main>

      <Footer />

      {/* PDF Viewer Modal */}
      {selectedPdf && <PdfViewer pdfPath={selectedPdf} onClose={handleClosePdf} />}
    </div>
  );
}
