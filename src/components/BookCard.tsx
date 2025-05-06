
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type Book } from '@/types'; // Assuming Book type is defined in types.ts
import { Eye } from 'lucide-react'; // Changed to Eye icon

// Default placeholder image path within the public directory
const DEFAULT_COVER = '/covers/default_cover.png'; // You should create this placeholder image

export function BookCard({ book, onReadClick }: { book: Book; onReadClick: (pdfPath: string) => void }) {
  const coverSrc = book.cover || DEFAULT_COVER;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full flex flex-col">
      <CardHeader className="p-0">
         {/* Disable right-click and dragging on the image */}
         <div
            className="relative aspect-[3/4] w-full"
             style={{ pointerEvents: 'none', userSelect: 'none' }}
             draggable="false"
             onContextMenu={(e) => e.preventDefault()} // Prevent context menu
         >
            <Image
                src={coverSrc}
                alt={book.title}
                layout="fill"
                objectFit="cover"
                className="pointer-events-none" // Double ensure no interaction
                // Add data-ai-hint based on category or title if needed
                data-ai-hint={`book ${book.category?.toLowerCase() || 'cover'}`.split(' ').slice(0,2).join(' ')} // Example: "book fiction"
                // Handle image loading errors gracefully
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER; }}
            />
         </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">{book.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full" onClick={() => onReadClick(book.pdfPath)}>
          <Eye className="mr-2 h-4 w-4" /> {/* Changed to Eye icon */}
          Leer
        </Button>
      </CardFooter>
    </Card>
  );
}
