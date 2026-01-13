import { createContext, useContext, useState, ReactNode } from 'react';

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "discontinued";
  sales: number;
  createdAt: string;
  cover?: string;
  description?: string;
  rating?: number;
}

interface BooksContextType {
  books: AdminBook[];
  setBooks: (books: AdminBook[]) => void;
  addBook: (book: AdminBook) => void;
  updateBook: (id: string, updates: Partial<AdminBook>) => void;
  deleteBook: (id: string) => void;
  getActiveBooks: () => AdminBook[];
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

// Default books that come with the app
const defaultBooks: AdminBook[] = [
  {
    id: "1",
    title: "The Midnight Library", 
    author: "Matt Haig",
    category: "Fiction",
    price: 15.99,
    stock: 245,
    status: "active",
    sales: 1247,
    createdAt: "2023-12-01",
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    rating: 4.2
  },
  {
    id: "2",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    category: "Romance",
    price: 16.99,
    stock: 189,
    status: "active",
    sales: 1895,
    createdAt: "2023-11-20",
    description: "A captivating romance that will keep you engaged from start to finish. This highly-rated book has garnered critical acclaim and reader praise alike.",
    rating: 4.5
  },
  {
    id: "3", 
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    price: 18.99,
    stock: 156,
    status: "active",
    sales: 2134,
    createdAt: "2023-11-15",
    description: "A captivating self-help that will keep you engaged from start to finish. This highly-rated book has garnered critical acclaim and reader praise alike.",
    rating: 4.8
  },
  {
    id: "4",
    title: "The Silent Patient",
    author: "Alex Michaelides", 
    category: "Thriller",
    price: 15.99,
    stock: 97,
    status: "active",
    sales: 892,
    createdAt: "2023-10-20",
    description: "A captivating thriller that will keep you engaged from start to finish. This highly-rated book has garnered critical acclaim and reader praise alike.",
    rating: 4.1
  },
  {
    id: "5",
    title: "Educated",
    author: "Tara Westover",
    category: "Memoir",
    price: 17.99,
    stock: 134,
    status: "active",
    sales: 1456,
    createdAt: "2023-09-10",
    description: "A captivating memoir that will keep you engaged from start to finish. This highly-rated book has garnered critical acclaim and reader praise alike.",
    rating: 4.6
  },
  {
    id: "6",
    title: "The Invisible Life of Addie LaRue",
    author: "V.E. Schwab",
    category: "Fantasy",
    price: 19.99,
    stock: 203,
    status: "active",
    sales: 1123,
    createdAt: "2023-08-25",
    description: "A captivating fantasy that will keep you engaged from start to finish. This highly-rated book has garnered critical acclaim and reader praise alike.",
    rating: 4.3
  },
  {
    id: "7",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "History",
    price: 22.99,
    stock: 87,
    status: "active",
    sales: 987,
    createdAt: "2023-07-15",
    description: "A captivating history that will keep you engaged from start to finish. This highly-rated book has garnered critical acclaim and reader praise alike.",
    rating: 4.4
  }
];

export const BooksProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<AdminBook[]>(defaultBooks);

  const addBook = (book: AdminBook) => {
    setBooks(prev => [...prev, book]);
  };

  const updateBook = (id: string, updates: Partial<AdminBook>) => {
    setBooks(prev => 
      prev.map(book => 
        book.id === id ? { ...book, ...updates } : book
      )
    );
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(book => book.id !== id));
  };

  const getActiveBooks = () => {
    return books.filter(book => book.status === "active" && book.stock > 0);
  };

  return (
    <BooksContext.Provider value={{
      books,
      setBooks,
      addBook,
      updateBook,
      deleteBook,
      getActiveBooks
    }}>
      {children}
    </BooksContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
};