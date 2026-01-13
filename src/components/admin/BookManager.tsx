import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKET, BOOK_FILES_BUCKET } from "@/lib/storageSetup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover_image_url: string | null;
  isbn: string | null;
  published_date: string | null;
  pages: number | null;
  language: string;
  rating: number | null;
  status: string;
  stock: number;
  sales: number;
}

interface BookVersion {
  id: string;
  book_id: string;
  version_type: string;
  price: number;
  available: boolean;
}

export const BookManager = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ebookPDFFile, setEbookPDFFile] = useState<File | null>(null);
  const [previewPDFFile, setPreviewPDFFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    description: "",
    cover_image_url: "",
    ebook_pdf_url: "",
    preview_pdf_url: "",
    isbn: "",
    published_date: "",
    pages: "",
    language: "English",
    rating: "",
    status: "active",
    stock: "0",
    versions: [
      { version_type: "ebook", price: "", available: true },
      { version_type: "paperback", price: "", available: true },
      { version_type: "hardcover", price: "", available: true },
    ]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      });
      return;
    }

    setBooks(data || []);
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `books/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);

        if (uploadError.message?.includes("not found")) {
          toast({
            title: "Error",
            description: "Storage bucket not configured. Please contact administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to upload image: ${uploadError.message}`,
            variant: "destructive",
          });
        }
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Image upload exception:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
      return null;
    }
  };

  const handlePDFUpload = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BOOK_FILES_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error("PDF upload error:", uploadError);
        toast({
          title: "Error",
          description: `Failed to upload PDF: ${uploadError.message}`,
          variant: "destructive",
        });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BOOK_FILES_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("PDF upload exception:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during PDF upload",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.author || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    let imageUrl = formData.cover_image_url;
    if (imageFile) {
      imageUrl = await handleImageUpload(imageFile) || "";
    }

    const bookData = {
      title: formData.title,
      author: formData.author,
      category: formData.category,
      description: formData.description,
      cover_image_url: imageUrl,
      isbn: formData.isbn || null,
      published_date: formData.published_date || null,
      pages: formData.pages ? parseInt(formData.pages) : null,
      language: formData.language,
      rating: formData.rating ? parseFloat(formData.rating) : null,
      status: formData.status,
      stock: parseInt(formData.stock) || 0,
    };

    let bookId: string;

    if (editingId) {
      const { error } = await supabase
        .from("books")
        .update(bookData)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update book",
          variant: "destructive",
        });
        return;
      }

      bookId = editingId;
      await supabase.from("book_versions").delete().eq("book_id", editingId);
    } else {
      const { data: newBook, error } = await supabase
        .from("books")
        .insert(bookData)
        .select()
        .single();

      if (error || !newBook) {
        toast({
          title: "Error",
          description: "Failed to add book",
          variant: "destructive",
        });
        return;
      }

      bookId = newBook.id;
    }

    // Insert versions for both new and edited books
    const versions = formData.versions
      .filter(v => v.price && v.price.trim() !== "" && parseFloat(v.price) > 0)
      .map(v => ({
        book_id: bookId,
        version_type: v.version_type,
        price: parseFloat(v.price),
        available: v.available,
      }));

    if (versions.length > 0) {
      const { error: versionError } = await supabase.from("book_versions").insert(versions);
      if (versionError) {
        console.error("Error inserting versions:", versionError);
        toast({
          title: "Warning",
          description: "Book saved but some version data may not have been saved correctly",
          variant: "destructive",
        });
      }
    }

    // Upload PDFs and update book record with URLs
    const pdfUpdates: { ebook_pdf_url?: string; preview_pdf_url?: string } = {};

    if (ebookPDFFile) {
      const ebookUrl = await handlePDFUpload(ebookPDFFile, "ebooks");
      if (ebookUrl) {
        pdfUpdates.ebook_pdf_url = ebookUrl;
      }
    }

    if (previewPDFFile) {
      const previewUrl = await handlePDFUpload(previewPDFFile, "previews");
      if (previewUrl) {
        pdfUpdates.preview_pdf_url = previewUrl;
      }
    }

    // Update book with PDF URLs if any were uploaded
    if (Object.keys(pdfUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from("books")
        .update(pdfUpdates)
        .eq("id", bookId);

      if (updateError) {
        toast({
          title: "Warning",
          description: "Book saved but failed to update PDF URLs",
          variant: "destructive",
        });
      }
    }

    toast({
      title: "Success",
      description: editingId ? "Book updated successfully" : "Book added successfully",
    });

    resetForm();
    fetchBooks();
  };

  const handleEdit = async (book: Book) => {
    const { data: versions } = await supabase
      .from("book_versions")
      .select("*")
      .eq("book_id", book.id);

    const { data: bookData } = await supabase
      .from("books")
      .select("ebook_pdf_url, preview_pdf_url")
      .eq("id", book.id)
      .maybeSingle();

    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description || "",
      cover_image_url: book.cover_image_url || "",
      ebook_pdf_url: bookData?.ebook_pdf_url || "",
      preview_pdf_url: bookData?.preview_pdf_url || "",
      isbn: book.isbn || "",
      published_date: book.published_date || "",
      pages: book.pages?.toString() || "",
      language: book.language,
      rating: book.rating?.toString() || "",
      status: book.status,
      stock: book.stock.toString(),
      versions: [
        { version_type: "ebook", price: "", available: true },
        { version_type: "paperback", price: "", available: true },
        { version_type: "hardcover", price: "", available: true },
      ].map(v => {
        const existing = versions?.find(ver => ver.version_type === v.version_type);
        return existing ? {
          version_type: existing.version_type,
          price: existing.price.toString(),
          available: existing.available,
        } : v;
      }),
    });
    setEditingId(book.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    const { error } = await supabase.from("books").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Book deleted successfully" });
    fetchBooks();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      category: "",
      description: "",
      cover_image_url: "",
      ebook_pdf_url: "",
      preview_pdf_url: "",
      isbn: "",
      published_date: "",
      pages: "",
      language: "English",
      rating: "",
      status: "active",
      stock: "0",
      versions: [
        { version_type: "ebook", price: "", available: true },
        { version_type: "paperback", price: "", available: true },
        { version_type: "hardcover", price: "", available: true },
      ]
    });
    setImageFile(null);
    setEbookPDFFile(null);
    setPreviewPDFFile(null);
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold">Book Management</h2>
          <p className="text-muted-foreground">Manage your book inventory</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{editingId ? "Edit Book" : "New Book"}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Book title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Author *</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Fiction"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-input bg-background px-3 py-2 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Book description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ISBN</label>
                <Input
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="978-0000000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Published Date</label>
                <Input
                  type="date"
                  value={formData.published_date}
                  onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pages</label>
                <Input
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="288"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <Input
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  placeholder="English"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cover Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {formData.cover_image_url && (
                <p className="text-xs text-muted-foreground mt-1">Current: {formData.cover_image_url}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">E-book PDF File</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setEbookPDFFile(e.target.files?.[0] || null)}
                />
                {formData.ebook_pdf_url && (
                  <p className="text-xs text-muted-foreground mt-1">Current: {formData.ebook_pdf_url}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preview PDF File</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPreviewPDFFile(e.target.files?.[0] || null)}
                />
                {formData.preview_pdf_url && (
                  <p className="text-xs text-muted-foreground mt-1">Current: {formData.preview_pdf_url}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">Book Versions & Pricing</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.versions.map((version, index) => (
                  <Card key={version.version_type} className="p-4">
                    <h4 className="font-medium mb-2 capitalize">{version.version_type}</h4>
                    <Input
                      type="number"
                      step="0.01"
                      value={version.price}
                      onChange={(e) => {
                        const newVersions = [...formData.versions];
                        newVersions[index].price = e.target.value;
                        setFormData({ ...formData, versions: newVersions });
                      }}
                      placeholder="0.00"
                      className="mb-3"
                    />
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={version.available}
                        onChange={(e) => {
                          const newVersions = [...formData.versions];
                          newVersions[index].available = e.target.checked;
                          setFormData({ ...formData, versions: newVersions });
                        }}
                        className="w-4 h-4 rounded border-input"
                      />
                      <span className="text-sm font-medium">Available</span>
                    </label>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {editingId ? "Update" : "Add"} Book
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Author</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{book.title}</td>
                  <td className="p-4">{book.author}</td>
                  <td className="p-4"><Badge variant="outline">{book.category}</Badge></td>
                  <td className="p-4">{book.stock}</td>
                  <td className="p-4"><Badge>{book.status}</Badge></td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(book)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(book.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No books yet. Add your first book!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
