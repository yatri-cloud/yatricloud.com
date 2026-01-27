import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import Index from "./pages/Index";

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<Index />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
