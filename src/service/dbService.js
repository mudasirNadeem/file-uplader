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

export async function getMegaStorage(fileName , folderName) {
  let storage = new Storage({
    email: localStorage.getItem("email"),
    password: localStorage.getItem("password"),
  });
  await storage.ready;
  return await getFolder(storage , folderName);
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
async function getFolder(storage , foldername = "mega upload files") {
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
var fileName = ""
export async function uploadFile(file, parentId, folderName = "mega upload files") {
  try {
    const database = await initDatabase();
     fileName = `${Date.now()}_${file.name}`; 
    const megaFolder = await getMegaStorage(fileName, folderName);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
    const localPath = `${folderName}/${fileName}`;
    const uploadedFile = await megaFolder.upload(fileName, uint8Array).complete;
    const type = "file";
    const insertFile = await database.execute(
      "INSERT INTO files (id, email, password, type, localPath , parentId , name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        uploadedFile.nodeId,
        email,
        password,
        type,
        localPath,
        parentId || uploadedFile.parent?.nodeId,
        fileName,
      ]
    );

    copyFilesToAppData(file);
    confirm("The file was uploaded!", uploadedFile);
  } catch (error) {
    alert(error.message);
  }
}

export async function uploadFolder(folderName, parentId) {
  try {
    const database = await initDatabase();
    const megaFolder = await getMegaStorage();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
    let storage = new Storage({ email, password });
    await storage.ready;
    const existingFolder = storage.root.children.find(
      (child) => child.name === folderName && child.directory
    );
    if (existingFolder) {
      return { ok: false };
    } else {
      var folderCreating = await megaFolder.mkdir(folderName, parentId);
      var type = "folder";
      var localPath = `C:/Users/GAC/AppData/Roaming/com.file-upload.app/${folderName}`;
      if (parentId) {
        var insertFile = await database.execute(
          "INSERT INTO files (id, email, password, type,  localPath , name , parentId) VALUES (?,?, ?, ?, ?, ?, ?)",
          [
            folderCreating.nodeId,
            email,
            password,
            type,
            localPath,
            folderName,
            parentId,
          ]
        );
      } else {
        var insertFile = await database.execute(
          "INSERT INTO files (id, email, password, type,  localPath , name , parentId) VALUES (?,?, ?, ?, ?, ?, ?)",
          [
            folderCreating.nodeId,
            email,
            password,
            type,
            localPath,
            folderName,
            folderCreating.parent.nodeId,
          ]
        );
      }
      createAppDataFolder(folderName , megaFolder);
      return { ok: true };
    }
  } catch (error) {
    console.log(error.message);
    return { ok: false, error: error.message };
  }
}

async function createAppDataFolder(folderName, megaFolder) {
  try {
        const appDataDirPath = await appDataDir();
    const folderPath = `${appDataDirPath}/${megaFolder.name}/${folderName}`;
    await fs.mkdir(folderPath, {
      dir: fs.BaseDirectory.AppData,
      recursive: true,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
  }
}

export async function copyFilesToAppData(file) {
  try {
    const folderName = "mega upload files";
    var filename = `${folderName}/${fileName}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await fs.writeFile(filename, uint8Array, {
      baseDir: BaseDirectory.AppData,
    });
  } catch (error) {
    console.error("Error copying file:", error);
  }
}
export async function loadAllFile(id) {
  const database = await initDatabase();
  const email = localStorage.getItem("email");
  const password = localStorage.getItem("password");
  let rows;
  if (id == undefined) {
    rows = await database.select(
      "SELECT * FROM files WHERE email = ? AND password = ?",
      [email, password]
    );
  } else {
    rows = await database.select(
      "SELECT * FROM files WHERE email = ? AND password = ? AND parentId = ?",
      [email, password, id]
    );
  }
  return { ok: true, data: rows };
}
