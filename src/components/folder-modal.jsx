import React, { useState } from "react";
import { uploadFolder } from "../service/dbService";
import { X } from "lucide-react";

export default function FolderModal({ open, onClose }) {
  const [folderName, setFolderName] = useState();
  const [isLoading, setLoading] = useState(false);
  async function handleSubmit() {
    setLoading(true);
    const result = await uploadFolder(folderName);
    if (result.ok) {
      confirm("Your folder was Created");
      onClose();
    } else {
      confirm("This folder already exists. Please enter a different name");
    }
    setLoading(false);
  }
  if (!open) return null;
  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-white/70 flex items-center justify-center">
          <span className="loading loading-spinner loading-3xl text-primary"></span>
        </div>
      )}
      <div className="modal modal-open">
        <div className="modal-box relative">
          {/* Close Button */}
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            <X size={16} />
          </button>

          {/* Modal Header */}
          <h3 className="font-bold text-lg mb-4">Create New Folder</h3>

          {/* Form */}
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Folder Name</span>
              </label>
              <input
                type="text"
                onInput={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="input input-bordered w-full"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
