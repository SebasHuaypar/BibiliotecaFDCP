
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X as CloseIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn utility

// Define pdfjsLib type more accurately if possible, or use 'any'
interface PdfjsLib {
    getDocument: (src: string | { url: string } | ArrayBuffer) => any; // Returns a PDFDocumentLoadingTask
    GlobalWorkerOptions: {
        workerSrc: string;
    };
    // Add other pdfjsLib methods/properties if used
}

// Define PDFDocumentProxy type (returned by getDocument().promise)
interface PDFDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
    destroy: () => void;
}

// Define PDFPageProxy type (returned by getPage())
interface PDFPageProxy {
    getViewport: (options: { scale: number }) => PDFPageViewPort;
    render: (options: RenderParameters) => RenderTask;
}

// Define PDFPageViewPort type
interface PDFPageViewPort {
    width: number;
    height: number;
}

// Define RenderParameters type
interface RenderParameters {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFPageViewPort;
}

// Define RenderTask type
interface RenderTask {
    promise: Promise<void>;
    cancel: () => void;
}


declare global {
  interface Window {
    pdfjsLib?: PdfjsLib;
    pdfjsWorker?: any; // To hold the worker script content if loaded separately
  }
}

interface PdfViewerProps {
  pdfPath: string;
  onClose: () => void;
}

// Use a known stable version - Reverting to v3.11.174 as v4.x MJS imports seem problematic
// Check https://cdnjs.com/libraries/pdf.js for latest versions if needed
const PDFJS_VERSION = '3.11.174';
// NOTE: Using the legacy build (non-module) as dynamic MJS imports from CDN can be tricky
const PDFJS_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;


export function PdfViewer({ pdfPath, onClose }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null); // Use specific type
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageNumPending, setPageNumPending] = useState<number | null>(null);
  const [scale, setScale] = useState(1.5); // Initial scale
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const isMounted = useRef(true); // Track component mount status
  const currentRenderTask = useRef<RenderTask | null>(null); // Track current render task


  // --- PDF Rendering Logic ---

  const renderPage = async (num: number, doc = pdfDoc, currentScale = scale) => {
    if (!doc || !canvasRef.current || !isMounted.current) {
      console.log("Render condition not met: no doc, canvas, or component unmounted.");
      setPageRendering(false);
      return;
    }

     // Cancel previous render task if it exists
     if (currentRenderTask.current) {
        console.log(`Cancelling previous render task for page ${pageNum}`);
        currentRenderTask.current.cancel();
        currentRenderTask.current = null; // Clear the reference
    }

    setPageRendering(true);
    console.log(`Rendering page ${num} with scale ${currentScale}`);
    setPdfError(null); // Clear previous page render errors

    try {
      const page: PDFPageProxy = await doc.getPage(num); // Use specific type
      console.log(`Page ${num} fetched`);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error("Could not get canvas context");
        setPdfError("Failed to get canvas context for rendering.");
        setPageRendering(false);
        return;
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      const renderTask = page.render(renderContext);
      currentRenderTask.current = renderTask; // Store the current task

      await renderTask.promise;
      currentRenderTask.current = null; // Clear task reference on completion

      if (!isMounted.current) {
         console.log(`Page ${num} rendered, but component unmounted.`);
         return; // Avoid state updates if unmounted
      }

      console.log(`Page ${num} rendered successfully.`);
      setPageRendering(false);

      if (pageNumPending !== null) {
        console.log(`Rendering pending page ${pageNumPending}`);
        const pendingPage = pageNumPending;
        setPageNumPending(null); // Clear pending state before starting next render
        // No await here, let it run asynchronously
         renderPage(pendingPage, doc, currentScale); // Render the queued page
      }

    } catch (error: any) {
        currentRenderTask.current = null; // Clear task reference on error
      if (!isMounted.current) {
        console.error(`Error rendering page ${num} but component unmounted:`, error);
        return; // Avoid state updates if unmounted
      }
      // Check if the error is due to cancellation
      if (error.name === 'RenderingCancelledException' || error.message?.includes('Rendering cancelled')) {
            console.log(`Rendering of page ${num} cancelled.`);
            // Don't set pageRendering to false here if a new render is pending
            if (pageNumPending === null) {
                setPageRendering(false); // Only set if no new page is queued
            }
       } else {
            console.error(`Error rendering page ${num}:`, error);
            setPdfError(`Failed to render page ${num}. Error: ${error.message || 'Unknown'}`);
            setPageRendering(false);
      }
    }
  };


  // Queue render function - checks if rendering, otherwise renders immediately
  const queueRenderPage = (num: number) => {
    if (pageRendering) {
      console.log(`Queueing page ${num} for rendering.`);
      // Cancel existing render *before* setting pending page
      if (currentRenderTask.current) {
        console.log(`Cancelling current render task for pending page ${num}`);
        currentRenderTask.current.cancel();
        // Don't set pageRendering false here, the error handler or success handler will
      }
      setPageNumPending(num);
    } else {
      // No need to await here, renderPage handles its own async logic and queuing
      renderPage(num, pdfDoc, scale);
    }
  };


  // --- PDF Loading Logic ---

  // Function to load the PDF document once the library is ready
  const loadPdfDocument = async () => {
      if (!window.pdfjsLib || !pdfPath || !isMounted.current) {
          console.error("PDF library not ready, no PDF path, or component unmounted.");
          if (!isLibraryLoading && isMounted.current) {
              setPdfError("PDF library failed to initialize correctly.");
          }
          return;
      }

      console.log("PDF library is ready. Setting worker source...");
      setPdfError(null); // Clear previous errors
      setIsLibraryLoading(false); // Library is definitely loaded now

      try {
           // CRITICAL: Set worker source *before* calling getDocument
           // Use the CDN URL for the worker
           window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_URL;
           console.log("PDF.js worker source set to:", PDFJS_WORKER_CDN_URL);

           console.log(`Loading PDF document from path: ${pdfPath}`);
           const loadingTask = window.pdfjsLib.getDocument(pdfPath);
           const loadedPdfDoc: PDFDocumentProxy = await loadingTask.promise; // Use specific type

           if (!isMounted.current) {
              console.log("PDF loaded, but component unmounted.");
              loadedPdfDoc.destroy(); // Clean up if possible
              return;
           }

           console.log("PDF document loaded successfully:", loadedPdfDoc);
           setPdfDoc(loadedPdfDoc);
           setNumPages(loadedPdfDoc.numPages);
           const initialPage = 1;
           setPageNum(initialPage);
           // Don't await here, let it render async
           renderPage(initialPage, loadedPdfDoc, scale); // Render the first page

      } catch (error: any) {
           if (!isMounted.current) {
              console.error("Error loading PDF document, but component unmounted:", error);
              return;
           }
           console.error("Error loading PDF document:", error);
           let errorMessage = `Failed to load PDF. Error: ${error.message || 'Unknown error'}`;
           if (error.name === 'MissingPDFException' || error.message?.includes('Missing PDF')) {
               errorMessage = `PDF file not found or invalid URL: ${pdfPath}. Ensure it's in the public folder and the path is correct (starts with /).`;
           } else if (error.name === 'UnexpectedResponseException') {
               errorMessage = `Incorrect response received when fetching PDF. Check network or file access. Status: ${error.status}`;
           } else if (error.message?.includes('Password required')) {
               errorMessage = "This PDF is password protected and cannot be displayed.";
           } else if (error.message?.includes('Invalid PDF structure')) {
                errorMessage = "The PDF file structure seems invalid or corrupted.";
           }
           setPdfError(errorMessage);
           setPdfDoc(null);
           setNumPages(0);
           setPageRendering(false); // Ensure rendering state is reset on load failure
      }
  };


   // Effect to load the pdf.js library dynamically using <script> tag
  useEffect(() => {
    isMounted.current = true; // Mark as mounted
    let scriptElement: HTMLScriptElement | null = null;

    const loadPdfJsLibrary = () => {
      if (window.pdfjsLib) {
        console.log("pdf.js library already loaded.");
        setIsLibraryLoading(false);
        loadPdfDocument(); // Load the PDF immediately
        return;
      }

      // Avoid adding multiple scripts
      if (document.querySelector(`script[src="${PDFJS_CDN_URL}"]`)) {
          console.log("pdf.js script tag already exists.");
          // It might exist but not be loaded/executed yet, or window.pdfjsLib isn't set
          // We might need to wait or check periodically - simple approach: assume it will load
          // If it fails repeatedly, the error handling will catch it later.
          // Setting library loading false optimistically
           setIsLibraryLoading(false);
           // Try loading doc again after a short delay in case script just finished
            setTimeout(() => {
                if (isMounted.current && !pdfDoc && !pdfError) {
                     loadPdfDocument();
                }
            }, 500);
          return;
      }


      console.log("Loading pdf.js library script dynamically via <script> tag...");
      setIsLibraryLoading(true);
      setPdfError(null);

      scriptElement = document.createElement('script');
      scriptElement.src = PDFJS_CDN_URL;
      scriptElement.async = true;
      scriptElement.onload = () => {
         console.log(`pdf.js library script loaded successfully from ${PDFJS_CDN_URL}`);
         if (isMounted.current) {
            // Check if window.pdfjsLib is actually available now
             if (window.pdfjsLib) {
                setIsLibraryLoading(false);
                loadPdfDocument(); // Now load the PDF
             } else {
                 console.error("pdf.js script loaded, but window.pdfjsLib is not defined.");
                 setPdfError("Failed to initialize PDF library after loading script.");
                 setIsLibraryLoading(false);
             }
         }
      };
      scriptElement.onerror = (error) => {
          console.error(`Error loading pdf.js library script from ${PDFJS_CDN_URL}:`, error);
           if (isMounted.current) {
             setPdfError(`Failed to load PDF viewing library script. Check network connection and CDN URL. Error: ${error instanceof ErrorEvent ? error.message : 'Unknown script error'}`);
             setIsLibraryLoading(false);
           }
      };

      document.body.appendChild(scriptElement);
    };

    // Delay loading slightly to ensure client-side context is ready
    const timer = setTimeout(() => {
        if (isMounted.current) {
            loadPdfJsLibrary();
        }
    }, 100); // 100ms delay

    // Cleanup function
    return () => {
      console.log("PdfViewer unmounting...");
      isMounted.current = false; // Mark as unmounted
      clearTimeout(timer); // Clear timeout if unmounted before it runs

      // Remove the script tag if it was added by this component instance
      // Note: This won't remove it if it existed before or was added by another instance
      // if (scriptElement && scriptElement.parentNode) {
      //    scriptElement.parentNode.removeChild(scriptElement);
      //    console.log("Removed pdf.js script tag.");
      // }
      // Decided against removing script tag on unmount as other instances might need it,
      // and removing pdfjsLib from window could cause issues. Rely on browser caching.


      // Cancel any pending page renders if component unmounts
      if (currentRenderTask.current) {
         currentRenderTask.current.cancel();
         currentRenderTask.current = null;
      }
      setPageNumPending(null);

      // Optional: Clean up pdfDoc resources
       pdfDoc?.destroy().catch(e => console.warn("Error destroying PDF doc:", e)); // Catch potential errors on destroy
       setPdfDoc(null); // Clear the doc state
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pdfPath is the core dependency
  }, [pdfPath]); // Rerun ONLY if pdfPath changes


  // --- Navigation and Interaction ---

  // Effect to handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetElement = event.target as Element;
      // Check if mounted and if the click is outside the container and not on a control button inside it
       if (isMounted.current && containerRef.current && !containerRef.current.contains(targetElement)) {
            // Check if the click target is *inside* the modal toolbar or canvas area. If it is, don't close.
            // This simplified logic might need refinement depending on exact layout.
            if (!targetElement.closest('.pdf-viewer-modal-content')) { // Add a class to the main content div
                 console.log("Clicked outside modal content, closing.");
                 onClose();
            }
       }
    };
    // Use `capture: true` to catch clicks on elements that might stop propagation later
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]); // Dependency on onClose

  // Navigation and zoom functions
  const onPrevPage = () => {
    if (pageNum <= 1 || pageRendering || !pdfDoc) return;
    const newPageNum = pageNum - 1;
    setPageNum(newPageNum);
    queueRenderPage(newPageNum);
  };

  const onNextPage = () => {
    if (pageNum >= numPages || pageRendering || !pdfDoc) return;
    const newPageNum = pageNum + 1;
    setPageNum(newPageNum);
    queueRenderPage(newPageNum);
  };

  const zoomIn = () => {
      if (pageRendering || !pdfDoc) return;
      const newScale = Math.min(scale + 0.25, 3.0); // Max zoom 3.0
      if (newScale !== scale) { // Only re-render if scale actually changes
        setScale(newScale);
        // Re-render current page with new scale
        renderPage(pageNum, pdfDoc, newScale);
      }
  };

  const zoomOut = () => {
      if (pageRendering || !pdfDoc) return;
      const newScale = Math.max(scale - 0.25, 0.5); // Min zoom 0.5
       if (newScale !== scale) { // Only re-render if scale actually changes
            setScale(newScale);
            // Re-render current page with new scale
            renderPage(pageNum, pdfDoc, newScale);
       }
  };


  return (
     <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
       {/* Add pdf-viewer-modal-content class */}
       <div ref={containerRef} className="pdf-viewer-modal-content bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden w-full max-w-4xl h-[90vh] flex flex-col">

         {/* Toolbar */}
         <div className="bg-muted text-muted-foreground p-2 flex items-center justify-between border-b border-border shrink-0">
           <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close PDF Viewer">
             <CloseIcon className="h-5 w-5" />
           </Button>
           <div className="flex items-center space-x-2">
             <Button variant="outline" size="icon" onClick={onPrevPage} disabled={pageNum <= 1 || pageRendering || !!pdfError || !pdfDoc} aria-label="Previous Page">
               <ChevronLeft className="h-5 w-5" />
             </Button>
             <span className="text-sm font-medium px-2 min-w-[120px] text-center tabular-nums"> {/* Wider span */}
               {isLibraryLoading ? 'Loading Lib...' : pdfError ? 'Error' : pdfDoc ? `Page ${pageNum} / ${numPages}` : 'Loading PDF...'}
             </span>
             <Button variant="outline" size="icon" onClick={onNextPage} disabled={pageNum >= numPages || pageRendering || !!pdfError || !pdfDoc} aria-label="Next Page">
               <ChevronRight className="h-5 w-5" />
             </Button>
           </div>
            <div className="flex items-center space-x-2">
               <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5 || pageRendering || !!pdfError || !pdfDoc} aria-label="Zoom Out">
                 <ZoomOut className="h-5 w-5" />
               </Button>
                <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span> {/* Display scale */}
               <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 3.0 || pageRendering || !!pdfError || !pdfDoc} aria-label="Zoom In">
                 <ZoomIn className="h-5 w-5" />
               </Button>
           </div>
         </div>

         {/* Canvas/Content Area */}
         {/* Updated background to bg-secondary/30 */}
         <div className="flex-grow overflow-auto p-4 flex justify-center items-start bg-secondary/30 relative"> {/* Added relative positioning and changed background */}
              {/* Loading States and Error Display */}
             {isLibraryLoading && (
                 <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-muted-foreground bg-background/50">Loading PDF library...</div>
             )}
             {!isLibraryLoading && !pdfDoc && !pdfError && ( // Show PDF loading only after library is loaded and no error
                 <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-muted-foreground bg-background/50">Loading PDF document...</div>
             )}
             {pdfError && (
                 <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-destructive bg-background/80">
                      <div className="max-w-md">{pdfError}</div>
                 </div>
             )}

             {/* Page Rendering Spinner */}
             {pageRendering && (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 pointer-events-none">
                      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                 </div>
              )}

             {/* Canvas - Render only if pdfDoc exists */}
             {pdfDoc && (
                <canvas
                     ref={canvasRef}
                     className={cn(
                         "max-w-full h-auto shadow-md block bg-white", // Keep bg-white for PDF contrast
                         pageRendering && "opacity-50" // Dim canvas slightly while rendering new page
                      )}
                 ></canvas>
             )}
         </div>
       </div>
     </div>
  );
}
