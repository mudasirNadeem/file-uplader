import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { loadAllFile, deleteFileFormDb } from "../service/dbService";
import { FolderIcon, Trash2 } from "lucide-react";
import { image } from "@tauri-apps/api";
// import ImageModal from "../components/image-modal";

const FileUpload = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [loadContant, setLoadContant] = useState([]);
  const [imageModal, setImageModal] = useState(false);
  const [backButton, setBackButton] = useState(false);
  const [parentId, setParentId] = useState();
  const [folderName, setFolderName] = useState();
  const [navigationStack, setNavigationStack] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [folderCache, setFolderCache] = useState(new Map());
  async function refreshCurrentFolder() {
    setLoading(true);
    const result = await loadAllFile(parentId);
    if (result.ok) {
      const cacheKey = parentId || "root";
      setFolderCache((prev) => new Map(prev).set(cacheKey, result.data));
      setLoadContant(result.data);
    }
    setLoading(false);
  }

  function goBack() {
    if (navigationStack.length > 0) {
      const previousState = navigationStack[navigationStack.length - 1];
      const newStack = navigationStack.slice(0, -1);
      setNavigationStack(newStack);
      const isRoot = newStack.length === 0;
      const cacheKey = previousState.parentId || "root";
      const cachedData = folderCache.get(cacheKey);
      if (cachedData) {
        setParentId(previousState.parentId);
        setFolderName(previousState.folderName);
        setBackButton(!isRoot);
        setLoadContant(cachedData);
        setLoading(false);
      } else {
        loadFiles(previousState.parentId, !isRoot, previousState.folderName);
      }
    }
  }

  async function loadFiles(id, back, folderNameParam) {
    setLoading(true);
    if (id !== undefined) {
      setParentId(id);
    } else {
      setParentId(undefined);
    }
    const cacheKey = id || "root";
    const cachedData = folderCache.get(cacheKey);

    if (cachedData) {
      setBackButton(back);
      setLoadContant(cachedData);
      setFolderName(folderNameParam);
      setLoading(false);
      return;
    }
    const result = await loadAllFile(id);
    if (result.ok) {
      setFolderCache((prev) => new Map(prev).set(cacheKey, result.data));
      setBackButton(back);
      setLoadContant(result.data);
      setFolderName(folderNameParam);
    }
    setLoading(false);
  }

  async function deleteFile(id) {
    try {
      setLoading(true);
      const result = await deleteFileFormDb(id);
      if (result.ok) {
        const updatedContent = loadContant.filter((item) => item.id !== id);
        setLoadContant(updatedContent);
        const currentCacheKey = parentId || "root";
        setFolderCache((prev) =>
          new Map(prev).set(currentCacheKey, updatedContent)
        );
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Delete error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

//   const handleOpenModal = (id) => {
//   setSelectedId(id);
//   setImageModal(true);
// };
  useEffect(() => {
    loadFiles(undefined, false);
  }, []);

  return (
    <>
      <Navbar
        parentId={parentId}
        folderName={folderName}
        onFileAdded={refreshCurrentFolder}
      />
      {backButton ? (
        <button className="btn btn-primary" onClick={() => goBack()}>
          Back
        </button>
      ) : (
        <span></span>
      )}
      <div className="flex p-4 flex-wrap">
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/60 z-50">
            <div className="w-12 h-12 border-4 border-[#422ad5] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {loadContant?.map((item, index) => (
          <div key={item.id || index}>
            {item.type === "file" ? (
              <div className="mx-3 relative">
                <button
                  className="absolute top-0 right-0 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  onClick={() => deleteFile(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <img
                className="cursor-pointer rounded shadow-sm"
                  // onClick={() => handleOpenModal(item.id)}
                  src={item.localPath}
                  width={120}
                  height={100}
                  alt="file"
                />
                <p className="w-[120px] break-words">{item.name.slice(14)}</p>
              </div>
            ) : (
              <div className="flex flex-col relative">
                <button
                  className="absolute top-0 right-0 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  onClick={() => deleteFile(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div
                  className="flex items-center mx-3 cursor-pointer flex-col gap-2"
                  onClick={() => {
                    setNavigationStack((prev) => [
                      ...prev,
                      { parentId, folderName },
                    ]);
                    setFolderName(item.name);
                    loadFiles(item.id, true, item.name);
                  }}
                >
                  <FolderIcon className="w-[90px] h-[91px] text-yellow-600" />
                  <span className="w-[100px] break-words text-wrap">
                    {item.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* <ImageModal isOpen={imageModal} imageId={selectedId} onClose={() => setImageModal(false)} /> */}
    </>
  );
};

export default FileUpload;
