import Database from "@tauri-apps/plugin-sql";
import { Storage } from "megajs";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { remove } from '@tauri-apps/plugin-fs';
import * as fs from "@tauri-apps/plugin-fs";
let db = null;
export async function initDatabase() {
  if (!db) {
    try {
      db = await Database.load("sqlite:files.db");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          email TEXT,
          password TEXT,
          type TEXT,
          localPath TEXT,
          name TEXT,
          parentId text
        )
      `);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  return db;
}

export async function getMegaStorage(fileName, folderName) {
  let storage = new Storage({
    email: localStorage.getItem("email"),
    password: localStorage.getItem("password"),
  });
  await storage.ready;
  return await getFolder(storage, folderName);
}
export async function loginUser(email, password) {
  try {
    localStorage.setItem("email", email);
    localStorage.setItem("password", password);
    let storage = new Storage({
      email: email,
      password: password,
    });
    await storage.ready;
    if (storage) {
      return { ok: true };
    } else {
      return { ok: false };
    }
  } catch (error) {
    console.error("❌ Failed to login user:", error.message);
    return { ok: false };
  }
}
async function getFolder(storage, foldername = "mega upload files") {
  try {
    const folderName = foldername;
    const existingFolder = await storage.find(folderName);
    if (!existingFolder) {
      const appDataDirPath = await appDataDir();
      const folderPath = `${appDataDirPath}/${folderName}`;
      await fs.mkdir(folderPath, {
        dir: fs.BaseDirectory.AppData,
        recursive: true,
      });
      existingFolder = await storage.mkdir(folderName);
    }
    return existingFolder;
  } catch (error) {
    console.error("❌ Error in createFolder:", error.message);
  }
}
export async function uploadFile(
  file,
  parentId,
  folderName = "mega upload files"
) {
  try {
    const database = await initDatabase();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
    const storage = new Storage({ email, password });
    await storage.ready;
    function findFolderById(node, targetId) {
      if (node.nodeId === targetId) return node;
      if (node.children) {
        for (const child of node.children) {
          if (child.directory) {
            const found = findFolderById(child, targetId);
            if (found) return found;
          }
        }
      }
      return null;
    }
    const megaFolder = await getMegaStorage();
    let parentFolder = parentId ? findFolderById(storage.root, parentId) : null;
    let targetFolder = parentFolder || megaFolder;
    const fileName = `${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const uploadedFile = await targetFolder.upload(fileName, uint8Array)
      .complete;
    function buildLocalPath(uploadedFile) {
      const pathParts = [];
      let currentFile = uploadedFile;
      while (currentFile && currentFile.name !== "mega upload files") {
        pathParts.unshift(currentFile.name);
        currentFile = currentFile.parent;
      }
      return `C:/Users/GAC/AppData/Roaming/mega upload files/${pathParts.join(
        "/"
      )}`;
    }
    const localPath = buildLocalPath(uploadedFile);
    await database.execute(
      "INSERT INTO files (id, email, password, type, localPath, name, parentId) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        uploadedFile.nodeId,
        email,
        password,
        "file",
        localPath,
        fileName,
        parentId || uploadedFile.parent.nodeId,
      ]
    );
    await copyFilesToAppData(uploadedFile, uint8Array);
    return { ok: true, fileId: uploadedFile.nodeId };
  } catch (error) {
    alert(error.message);
    return { ok: false, error: error.message };
  }
}

export async function uploadFolder(folderName, parentId) {
  try {
    const database = await initDatabase();
    const megaFolder = await getMegaStorage();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
    const storage = new Storage({ email, password });
    await storage.ready;
    function findFolderById(node, targetId) {
      if (node.nodeId === targetId) return node;
      if (node.children) {
        for (const child of node.children) {
          if (child.directory) {
            const found = findFolderById(child, targetId);
            if (found) return found;
          }
        }
      }
      return null;
    }
    let parentFolder = parentId ? findFolderById(storage.root, parentId) : null;
    let targetFolder = parentFolder || megaFolder;
    if (parentId && !parentFolder) {
      return { ok: false, error: "Parent folder not found" };
    }
    const existingFolder = targetFolder.children?.find(
      (child) => child.name === folderName && child.directory
    );
    if (existingFolder) {
      return { ok: false, error: "Folder already exists" };
    }
    const folderCreating = await targetFolder.mkdir(folderName);
    function buildLocalPath(folder) {
      const pathParts = [];
      let currentFolder = folder;
      while (currentFolder && currentFolder.name !== "mega upload files") {
        pathParts.unshift(currentFolder.name);
        currentFolder = currentFolder.parent;
      }
      return `C:/Users/GAC/AppData/Roaming/com.file-upload.app/mega upload files/${pathParts.join(
        "/"
      )}`;
    }
    const localPath = buildLocalPath(folderCreating);
    await database.execute(
      "INSERT INTO files (id, email, password, type, localPath, name, parentId) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        folderCreating.nodeId,
        email,
        password,
        "folder",
        localPath,
        folderName,
        parentId || folderCreating.parent.nodeId,
      ]
    );
    createAppDataFolder(folderCreating);
    return { ok: true, folderId: folderCreating.nodeId };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function createAppDataFolder(folderCreating) {
  try {
    function buildLocalPath(folder) {
      const pathParts = [];
      let currentFolder = folder;
      while (currentFolder && currentFolder.name !== "mega upload files") {
        pathParts.unshift(currentFolder.name);
        currentFolder = currentFolder.parent;
      }
      return `C:/Users/GAC/AppData/Roaming/com.file-upload.app/mega upload files/${pathParts.join(
        "/"
      )}`;
    }
    const localPath = buildLocalPath(folderCreating);
    const appDataDirPath = await appDataDir();
    await fs.mkdir(localPath, {
      dir: fs.BaseDirectory.AppData,
      recursive: true,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
  }
}

export async function copyFilesToAppData(megaFile, originalFileData) {
  try {
    function buildLocalPath(file) {
      const pathParts = [];
      let currentFile = file;
      while (currentFile && currentFile.name !== "mega upload files") {
        pathParts.unshift(currentFile.name);
        currentFile = currentFile.parent;
      }
      return `mega upload files/${pathParts.join("/")}`;
    }
    const localPath = buildLocalPath(megaFile);
    const uint8Array = new Uint8Array(originalFileData);
    await fs.writeFile(localPath, uint8Array, {
      baseDir: BaseDirectory.AppData,
    });
    return {
      ok: true,
      localPath: `C:/Users/GAC/AppData/Roaming/com.file-upload.app/${localPath}`,
    };
  } catch (error) {
    console.error("Error copying file:", error);
    return { ok: false, error: error.message };
  }
}
    let rows;
export async function loadAllFile(id) {
  try {
    const database = await initDatabase();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");

    if (id == undefined) {
      const megaFolder = await getMegaStorage();
      rows = await database.select(
        "SELECT * FROM files WHERE email = ? AND password = ? AND parentId = ?",
        [email, password, megaFolder.nodeId]
      );
    } else {
      rows = await database.select(
        "SELECT * FROM files WHERE email = ? AND password = ? AND parentId = ?",
        [email, password, id]
      );
    }

     return { ok: true, data: rows };
  } catch (error) {
    console.error("Error loading files:", error);
    return { ok: false, error: error.message };
  }
}

export async function syncWithMega() {
  try {
    const database = await initDatabase();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");

    if (!email || !password) {
      return { ok: false, error: "User not logged in" };
    }

    const storage = new Storage({ email, password });
    await storage.ready;

    const megaFolder = await getMegaStorage();
    if (!megaFolder) {
      return { ok: false, error: "Mega upload folder not found" };
    }
    const dbFiles = await database.select(
      "SELECT * FROM files WHERE email = ? AND password = ?",
      [email, password]
    );
    const megaFiles = getAllMegaFilesFromStorage(storage.root);
    const deletedFiles = dbFiles.filter(
      (dbFile) => !megaFiles.find((megaFile) => megaFile.nodeId === dbFile.id)
    );
    const newFiles = megaFiles.filter(
      (megaFile) => !dbFiles.find((dbFile) => dbFile.id === megaFile.nodeId)
    );
    let syncResults = {
      deleted: 0,
      added: 0,
      errors: [],
    };

    for (const deletedFile of deletedFiles) {
      try {
        await database.execute("DELETE FROM files WHERE id = ?", [
          deletedFile.id,
        ]);

        try {
          const relativePath = deletedFile.localPath.replace(
            `C:/Users/GAC/AppData/Roaming/com.file-upload.app/`,
            ""
          );
          await fs.remove(relativePath, {
            baseDir: BaseDirectory.AppData,
          });
        } catch (fsError) {
          console.log(`Local file not found: ${deletedFile.localPath}`);
        }

        syncResults.deleted++;
        console.log(`Deleted: ${deletedFile.name}`);
      } catch (error) {
        syncResults.errors.push(
          `Error deleting ${deletedFile.name}: ${error.message}`
        );
        console.error("Delete error:", error);
      }
    }

    for (const newFile of newFiles) {
      try {
        console.log(
          `Attempting to add: ${newFile.name} (NodeID: ${newFile.nodeId})`
        );

        const existingFile = await database.select(
          "SELECT id FROM files WHERE id = ?",
          [newFile.nodeId]
        );

        if (existingFile.length > 0) {
          console.log(`File ${newFile.name} already exists in DB, skipping...`);
          continue;
        }

        const localPath = buildLocalPathLikeExisting(newFile);
        const parentNodeId = newFile.parent
          ? newFile.parent.nodeId
          : megaFolder.nodeId;

        await database.execute(
          "INSERT INTO files (id, email, password, type, localPath, name, parentId) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            newFile.nodeId,
            email,
            password,
            newFile.directory ? "folder" : "file",
            localPath,
            newFile.name,
            parentNodeId,
          ]
        );

        if (newFile.directory) {
          await createLocalFolderLikeExisting(newFile);
        } else {
          await downloadFileLikeExisting(newFile);
        }

        syncResults.added++;
        console.log(
          `Successfully added: ${newFile.name} (${
            newFile.directory ? "folder" : "file"
          })`
        );
      } catch (error) {
        syncResults.errors.push(
          `Error adding ${newFile.name}: ${error.message}`
        );
        console.error("Add error for", newFile.name, ":", error);
      }
    }

    return {
      ok: true,
      message: `Sync completed: ${syncResults.added} added, ${syncResults.deleted} deleted`,
      details: syncResults,
    };
  } catch (error) {
    console.error("Sync error:", error);
    return { ok: false, error: error.message };
  }
}

function getAllMegaFilesFromStorage(rootNode, allFiles = []) {
  try {
    function findMegaUploadFolder(node) {
      if (node.name === "mega upload files") {
        return node;
      }
      if (node.children) {
        for (const child of node.children) {
          if (child.directory) {
            const found = findMegaUploadFolder(child);
            if (found) return found;
          }
        }
      }
      return null;
    }

    function traverseFolder(currentFolder) {
      if (currentFolder.children) {
        for (const child of currentFolder.children) {
          allFiles.push(child);

          if (child.directory && child.children) {
            traverseFolder(child);
          }
        }
      }
    }

    const megaUploadFolder = findMegaUploadFolder(rootNode);
    if (megaUploadFolder) {
      traverseFolder(megaUploadFolder);
    }

    return allFiles;
  } catch (error) {
    console.error("Error getting mega files:", error);
    return allFiles;
  }
}

function buildLocalPathLikeExisting(file) {
  const pathParts = [];
  let currentFile = file;

  while (currentFile && currentFile.name !== "mega upload files") {
    pathParts.unshift(currentFile.name);
    currentFile = currentFile.parent;
  }

  return `C:/Users/GAC/AppData/Roaming/com.file-upload.app/mega upload files/${pathParts.join(
    "/"
  )}`;
}

async function createLocalFolderLikeExisting(megaFolder) {
  try {
    const pathParts = [];
    let currentFolder = megaFolder;

    while (currentFolder && currentFolder.name !== "mega upload files") {
      pathParts.unshift(currentFolder.name);
      currentFolder = currentFolder.parent;
    }

    const localPath = `C:/Users/GAC/AppData/Roaming/com.file-upload.app/mega upload files/${pathParts.join(
      "/"
    )}`;

    await fs.mkdir(localPath, {
      dir: fs.BaseDirectory.AppData,
      recursive: true,
    });

    console.log(`Created local folder: ${localPath}`);
  } catch (error) {
    console.error("Error creating local folder:", error);
    throw error;
  }
}

async function downloadFileLikeExisting(megaFile) {
  try {
    const pathParts = [];
    let currentFile = megaFile;

    while (currentFile && currentFile.name !== "mega upload files") {
      pathParts.unshift(currentFile.name);
      currentFile = currentFile.parent;
    }

    const relativePath = `mega upload files/${pathParts.join("/")}`;

    const fileBuffer = await megaFile.downloadBuffer();
    const uint8Array = new Uint8Array(fileBuffer);

    await fs.writeFile(relativePath, uint8Array, {
      baseDir: BaseDirectory.AppData,
    });

    console.log(`Downloaded file: ${relativePath}`);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

export async function debugMegaFolderDetailed() {
  try {
    const storage = new Storage({
      email: localStorage.getItem("email"),
      password: localStorage.getItem("password"),
    });
    await storage.ready;

    console.log("=== STORAGE ROOT ===");
    console.log("Root children count:", storage.root.children?.length || 0);

    if (storage.root.children) {
      storage.root.children.forEach((child) => {
        console.log(
          `Root child: ${child.name}, Type: ${
            child.directory ? "folder" : "file"
          }`
        );
      });
    }

    const megaFolder = await getMegaStorage();
    console.log("=== MEGA UPLOAD FOLDER ===");
    console.log("Mega folder:", megaFolder?.name);
    console.log("Mega folder children:", megaFolder?.children?.length || 0);

    if (megaFolder?.children) {
      megaFolder.children.forEach((child) => {
        console.log(
          `Mega child: ${child.name}, Type: ${
            child.directory ? "folder" : "file"
          }, NodeId: ${child.nodeId}`
        );
        if (child.directory && child.children) {
          child.children.forEach((grandChild) => {
            console.log(
              `  Grandchild: ${grandChild.name}, Type: ${
                grandChild.directory ? "folder" : "file"
              }`
            );
          });
        }
      });
    }

    const allFiles = getAllMegaFilesFromStorage(storage.root);
    console.log("=== ALL FILES FROM STORAGE ===");
    console.log("Total files found:", allFiles.length);
    allFiles.forEach((file) => {
      console.log(
        `File: ${file.name}, Type: ${
          file.directory ? "folder" : "file"
        }, NodeId: ${file.nodeId}`
      );
    });

    return { megaFolder, allFiles, storage };
  } catch (error) {
    console.error("Debug error:", error);
    return null;
  }
}

export async function deleteFileFormDb(id) {
  try {
    const database = await initDatabase();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
  
    await deleteFileFromMega(id);
   var files =  await database.execute(
      "DELETE FROM files WHERE id = ? AND email = ? AND password = ?",
      [id, email, password]
    );
      const fileInfo = await database.select(
      "SELECT * FROM files WHERE id = ? AND email = ? AND password = ?",
      [id, email, password]
    );
    return { ok: true, data: fileInfo };
  } catch (error) {
    console.error(`Failed to delete file: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

export async function deleteFileFromMega(id) {
  try {
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
    if (!email || !password) throw new Error("Missing email or password");

    const storage = new Storage({ email, password });
    await storage.ready;

    const file = findNodeById(storage.root, id);
    if (!file) throw new Error("File or folder not found");

    await file.delete();

    const filePath = await getNodePath(file);
    if (filePath) {
      await deleteFileLocally(filePath , id);
    }
  } catch (error) {
    console.error("Delete Error:", error.message);
  }
}

function findNodeById(node, targetId) {
  if (!node) return null;
  if (node.nodeId === targetId) return node;
  if (node.children) {
    for (const child of node.children) {
      const result = findNodeById(child, targetId);
      if (result) return result;
    }
  }
  return null;
}

async function getNodePath(node) {
  if (!node) return null;

  const pathParts = [];
  let currentNode = node;
  while (currentNode && currentNode.name !== "mega upload files") {
    pathParts.unshift(currentNode.name);
    currentNode = currentNode.parent;
  }
  if (!currentNode || currentNode.name !== "mega upload files") {
    return null;
  }
  const filePath = `mega upload files/${pathParts.join("/")}`;
  return filePath;
}

async function deleteFileLocally(filePath, id) {
  try {
    const fileExists = await fs.exists(filePath, { baseDir: BaseDirectory.AppData });
    if (fileExists) {
      await remove(filePath, { baseDir: BaseDirectory.AppData, recursive: true });
    } 
  } catch (error) {
    console.error("Error deleting locally:", error.message);
  }
}

// export async function showImage(imageId) {
//   console.log(imageId);
// }