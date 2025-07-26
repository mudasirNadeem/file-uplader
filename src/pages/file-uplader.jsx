import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { loadAllFile } from "../service/dbService";
import { FolderIcon } from "lucide-react";

const ProductCard = () => {
  var [loadContant, setLoadContant] = useState();
  var [backButton, setBackButton] = useState();
  var [parentId, setParentId] = useState();
  var [folderName, setFolderName] = useState();
  var [navigationStack, setNavigationStack] = useState([]);
  var [isLoading, setLoading] = useState(true);
  var [folderCache, setFolderCache] = useState(new Map());

  function goBack() {
    if (navigationStack.length > 0) {
      const previousState = navigationStack[navigationStack.length - 1];
      const newStack = navigationStack.slice(0, -1);
      setNavigationStack(newStack);
      const isRoot = newStack.length === 0;
      const cacheKey = previousState.parentId || 'root';
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
    if (id !== undefined) {
      setParentId(id);
    } else {
      setParentId(undefined);
    }
    const cacheKey = id || 'root';
    const cachedData = folderCache.get(cacheKey);
    if (cachedData) {
      setBackButton(back);
      setLoadContant(cachedData);
      setFolderName(folderNameParam);
      setLoading(false);
      return;
    }
    var result = await loadAllFile(id);
    if (result.ok) {
      setFolderCache(prev => new Map(prev).set(cacheKey, result.data));
      setBackButton(back);
      setLoadContant(result.data);
      setFolderName(folderNameParam);
      setLoading(false);
    }
  }
  useEffect(() => {
    loadFiles(undefined, false);
  }, []);
  
  return (
    <>
      <Navbar parentId={parentId} folderName={folderName} />
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
          <div key={index}>
            {item.type === "file" ? (
              <div className="mx-3">
                <img src={item.localPath} width={120} height={100} alt="sdf" />
                <p className="w-[120px] break-words">{item.name.slice(14)}</p>
              </div>
            ) : (
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
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductCard;