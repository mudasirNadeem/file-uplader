import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { loadAllFile } from "../service/dbService";
import { FolderIcon } from "lucide-react";

const ProductCard = () => {
  var [loadContant, setLoadContant] = useState();
  var [backButton, setBackButton] = useState();
  var [parentId, setParentId] = useState();
  var [defaultParentId, setDefaultParentId] = useState();
  var [folderName, setFolderName] = useState();
  async function loadFiles(id, back) {
    if (id !== undefined) {
      setParentId(id);
    }
    var result = await loadAllFile(id);
    setBackButton(back);
    if (result.ok) {
      setLoadContant(result.data);
    }
  }
  useEffect(() => {
    loadFiles(undefined, false);
  }, []);
  return (
    <>
      <Navbar parentId={parentId} folderName={folderName}/>
      {backButton ? (
        <button
          className="btn btn-primary"
          onClick={() => loadFiles(undefined, false)}
        >
          Back
        </button>
      ) : (
        <span></span>
      )}
      <div className="flex p-4 flex-wrap">
        {loadContant?.map((item, index) => (
          <div key={index}>
            {/* {setDefaultParentId(item.parentId)} */}
            {item.type === "file" ? (
              <div className="mx-3">
                <img src={item.localPath} width={120} height={100} alt="sdf" />
                <p className="w-[120px]  break-words">{item.name.slice(14)}</p>
              </div>
            ) : (
              <div
                className="flex items-center mx-3 cursor-pointer flex-col gap-2"
                onClick={() => {
                  setFolderName(item.name);
                  loadFiles(item.id, true);
                }}
              >
                <FolderIcon className="w-[90px] h-[91px] text-yellow-600" />
                <span className="w-[100px]  break-words text-wrap">
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
