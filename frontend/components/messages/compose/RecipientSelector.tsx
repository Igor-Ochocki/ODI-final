"use client";

import { useState, useRef } from "react";
import { User, X, Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Recipient {
  user_id: string;
  username: string;
  email: string;
  signing_public_key: string;
}

interface RecipientSelectorProps {
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
}

export default function RecipientSelector({
  recipients,
  onRecipientsChange,
}: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await api.searchUsers(query);
      if (response.data) {
        const filtered = response.data.filter(
          (user) => !recipients.some((r) => r.user_id === user.user_id)
        );
        setSearchResults(filtered);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addRecipient = (recipient: Recipient) => {
    if (!recipients.some((r) => r.user_id === recipient.user_id)) {
      onRecipientsChange([...recipients, recipient]);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const removeRecipient = (userId: string) => {
    onRecipientsChange(recipients.filter((r) => r.user_id !== userId));
  };

  return (
    <div>
      <label className="block text-sm font-mono text-dark-300 mb-2">Do:</label>
      <div className="relative">
        <div className="flex flex-wrap gap-2 p-2 min-h-[48px] bg-dark-900/50 border border-dark-600 rounded-sm focus-within:border-primary-500">
          {recipients.map((r) => (
            <span
              key={r.user_id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded-sm text-sm"
            >
              <User className="w-3 h-3" />
              {r.username}
              <button
                onClick={() => removeRecipient(r.user_id)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-dark-200 placeholder:text-dark-500"
            placeholder={recipients.length === 0 ? "Search user..." : ""}
          />
        </div>

        {showResults && (
          <div className="absolute z-10 w-full mt-1 bg-dark-900 border border-dark-700 rounded-sm shadow-lg max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-dark-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-dark-400">
                {searchQuery.length >= 2 ? "No users found" : "Type at least 2 characters"}
              </div>
            ) : (
              searchResults.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => addRecipient(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-200">{user.username}</p>
                    <p className="text-xs text-dark-500">{user.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
