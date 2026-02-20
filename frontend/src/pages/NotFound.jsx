import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/common/Button";

export function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center page-container py-20">
      <motion.div
        className="text-center max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-20 h-20 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <SearchX size={36} className="text-warm-400" />
        </div>
        <h1 className="text-4xl font-bold text-warm-900 mb-2">404</h1>
        <p className="text-warm-500 mb-6">Stranica nije pronađena.</p>
        <Link to="/">
          <Button leftIcon={Home}>Natrag na početnu</Button>
        </Link>
      </motion.div>
    </div>
  );
}
