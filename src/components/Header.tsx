
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, ChevronDown, Home, Mail } from 'lucide-react'; // Removed BookOpen

interface HeaderProps {
  categories: string[]; // Accept dynamic categories
  onFilterChange: (category: string | null) => void;
  onSearch: (term: string) => void;
}

export function Header({ categories, onFilterChange, onSearch }: HeaderProps) {
  const { user, logout } = useAuth();

  const handleScrollToFooter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const footer = document.getElementById('footer');
    footer?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* Replace BookOpen icon with Image component */}
          <Image
            src="/images/logo.png" // Path to the logo in the public folder
            alt="Biblioteca Virtual FDCP Logo"
            width={24} // Adjust width as needed
            height={24} // Adjust height as needed
            className="h-6 w-6" // Keep existing size classes or adjust
          />
          {/* Update title */}
          <span className="font-bold text-foreground">Biblioteca Virtual FDCP</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
          {/* Use text-foreground/70 for slightly muted text */}
          <Link href="/" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground no-underline">
            <Home className="inline-block h-4 w-4 mr-1" /> Inicio
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Use text-foreground/70 for slightly muted text */}
              <Button variant="ghost" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
                Categorías <ChevronDown className="relative top-[1px] ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onFilterChange(null)}>
                Todas las Categorías
              </DropdownMenuItem>
              {categories.length > 0 && <DropdownMenuSeparator />}
              {categories.map((category) => (
                <DropdownMenuItem key={category} onClick={() => onFilterChange(category)}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

           {/* Use text-foreground/70 for slightly muted text */}
          <a href="#footer" onClick={handleScrollToFooter} className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground no-underline">
             <Mail className="inline-block h-4 w-4 mr-1" /> Contacto
          </a>
        </nav>

        {/* Optional Search Bar - Implement filtering logic in parent */}
        {/* <div className="relative ml-auto mr-4 flex-1 md:grow-0">
           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input
             type="search"
             placeholder="Search books..."
             className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
             onChange={(e) => onSearch(e.target.value)}
           />
        </div> */}


        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {/* <AvatarImage src="/avatars/01.png" alt={user.username} /> */}
                  <AvatarFallback className="bg-primary text-primary-foreground"> {/* Avatar uses primary colors */}
                    {user.username.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  {/* <p className="text-xs leading-none text-muted-foreground">
                    m@example.com {/* Add email if available *}
                  </p> */}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                 Add other items if needed
              </DropdownMenuGroup> */}
              {/* <DropdownMenuSeparator /> */}
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

