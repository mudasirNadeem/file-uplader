import React, { useState } from "react";
import { uploadFile, syncWithMega } from "../service/dbService";
import { FolderPlus } from "lucide-react";
import FolderModal from "./folder-modal";
import { Upload } from "lucide-react";
import { LogOut } from "lucide-react";
import { RefreshCcw } from "lucide-react";

const Navbar = ({parentId , onFileAdded, folderName}) => {
  const [folderModal, setFolderModal] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isSyncing, setSyncing] = useState(false);
  
  async function getFile(file) {
    setLoading(true);
    const result = await uploadFile(file , parentId , folderName);
    if(result.ok){
      if(onFileAdded) {
        onFileAdded();
      }
      setLoading(false);
    }
  }
  
  async function handleSync() {
    setSyncing(true);
    const result = await syncWithMega();
    if(result.ok){
      if(onFileAdded) {
        onFileAdded();
      }
      alert(result.message);
    } else {
      alert('Sync failed: ' + result.error);
    }
    setSyncing(false);
  }
  
  function deleteLogcalStorage(){
          localStorage.clear();
  }
  
  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          <div className="w-full h-full absolute top-0 left-0 bg-transparent pointer-events-auto" />
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-12 h-12 border-4 border-[#422ad5] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      <nav className="navbar px-4 py-2 flex justify-between items-center shadow">

       
        <div className="flex items-center">
          <p className="text-3xl">Upload File</p>
        </div>
        <div className="flex">
            <button
            className="btn btn-neutral me-2"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCcw className={`w-6 h-6 cursor-pointer ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <input
            type="file"
            id="upload-Image"
            onChange={(e) => getFile(e.target.files[0])}
            accept=".png, .svg, .jpg, .jpeg, image/png, image/svg+xml, image/jpeg"
            hidden
          />
          <label
            htmlFor="upload-Image"
            className="btn btn-primary me-2 flex items-center gap-2"
          >
            <Upload size={20} />
          </label>
          <button
            className="btn btn-neutral me-2"
            onClick={() => setFolderModal(true)}
          >
            <FolderPlus size={20} />
          </button>
          <a onClick={() => deleteLogcalStorage()} href="/" className="btn btn-primary flex items-center gap-2">
            <LogOut size={20} />
          </a>
        </div>
        <FolderModal onFileAdded={onFileAdded} parentId={parentId} parentFolder={folderName} open={folderModal} onClose={() => setFolderModal(false)} />
      </nav>
    </>
  );
};

export default Navbar;