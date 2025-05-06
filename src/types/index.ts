
export interface UserCredentials {
  username: string;
  password?: string; // Password might be omitted in some contexts after login
}

export interface Book {
  id: number | string; // Unique identifier
  title: string;
  author: string;
  cover?: string; // URL to cover image (optional)
  pdfPath: string; // Path to the PDF file in the /public/pdfs directory
  category: string; // e.g., 'Fiction', 'Non-Fiction'
  featured?: boolean; // Optional flag for featured books
  isNew?: boolean; // Optional flag for 'Novedades'
  mostRead?: boolean; // Optional flag for 'Más Leídos'
}
