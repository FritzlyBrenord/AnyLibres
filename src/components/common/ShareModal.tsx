import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Share2,
  MessageCircle,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(
        title + " " + url
      )}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black hover:bg-gray-800",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-500 hover:bg-gray-600",
      url: `mailto:?subject=${encodeURIComponent(
        title
      )}&body=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Partager</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
                onClick={onClose}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform transform group-hover:scale-110 shadow-sm ${link.color}`}
                >
                  <link.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">
                  {link.name}
                </span>
              </a>
            ))}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lien de la page
            </label>
            <div className="flex items-center gap-2 p-1 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex-1 px-3 py-2 text-sm text-gray-500 truncate select-all">
                {url}
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  copied
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
