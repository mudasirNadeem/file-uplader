import React, { useState } from "react";
import { uploadFolder } from "../service/dbService";
import { X } from "lucide-react";

export default function FolderModal({ open, onClose , parentId , onFileAdded, parentFolder }) {
  const [folderName, setFolderName] = useState();
  const [isLoading, setLoading] = useState(false);
  async function handleSubmit() {
    setLoading(true);
    if (folderName == undefined || folderName.length < 3) {
      alert("Folder name must be at least 3 characters long.");
      setLoading(false);
      return;
    } else {
      const result = await uploadFolder(folderName , parentId , parentFolder);
      if (result.ok) {
        setLoading(false);
        alert("Your folder was Created");
        onClose();
        onFileAdded();
      } else {
        confirm("This folder already exists. Please enter a different name");
        setLoading(false);
      }
    }
  }
  if (!open) return null;
  return (
    <>
      {isLoading && (
          <div className="fixed inset-0   z-[9999] flex items-center justify-center bg-white/60">
            <div className="w-12 h-12 border-4 border-[#422ad5]  border-t-transparent rounded-full animate-spin"></div>
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
                required
                onInput={(e) => setFolderName(e.target.value)}
                autoFocus
                placeholder="Enter folder name"
                className="input input-bordered w-full"
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
