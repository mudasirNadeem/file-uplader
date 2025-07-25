import Database from "@tauri-apps/plugin-sql";
import { Storage } from "megajs";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
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
export async function uploadFile(file, parentId, folderName = "mega upload files") {
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
    const uploadedFile = await targetFolder.upload(fileName, uint8Array).complete;
    function buildLocalPath(uploadedFile) {
      const pathParts = [];
      let currentFile = uploadedFile;
      while (currentFile && currentFile.name !== "mega upload files") {
        pathParts.unshift(currentFile.name);
        currentFile = currentFile.parent;
      }
      return `C:/Users/GAC/AppData/Roaming/mega upload files/${pathParts.join("/")}`;
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
    confirm("The file was uploaded!", uploadedFile.name);
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
    return { ok: true, localPath: `C:/Users/GAC/AppData/Roaming/com.file-upload.app/${localPath}` };
  } catch (error) {
    console.error("Error copying file:", error);
    return { ok: false, error: error.message };
  }
}
export async function loadAllFile(id) {
  try {
    const database = await initDatabase();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
    let rows;
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