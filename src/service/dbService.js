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

export async function getMegaStorage() {
  let storage = new Storage({
    email: localStorage.getItem("email"),
    password: localStorage.getItem("password"),
  });
  await storage.ready;
  return await getFolder(storage);
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
async function getFolder(storage) {
  try {
    const folderName = "mega file upload";
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
var fileName = "";

var insertFile = "";
export async function uploadFile(file) {
  try {
    const database = await initDatabase();
    const megaFolder = await getMegaStorage();
    fileName = `${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");
    const uint8Array = new Uint8Array(arrayBuffer);
    var localPath = `mega file upload/${fileName}`;
    const existFile = megaFolder.children.find(
      (child) => child.name === fileName
    );
    if (existFile) {
      confirm("File already exists in MEGA. Skipping upload.");
      return;
    }
    const uploadedFile = await megaFolder.upload(fileName, uint8Array).complete;
    var type = "file";
    insertFile = await database.execute(
      "INSERT INTO files (id, email, password, type, localPath , parentId , name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        uploadedFile.nodeId,
        email,
        password,
        type,
        localPath,
        uploadedFile.parent.nodeId,
        fileName,
      ]
    );
    copyFilesToAppData(file);
    confirm("The file was uploaded!", uploadedFile);
  } catch (error) {
    alert(error.message);
  }
}
export async function uploadFolder(folderName) {
  try {
    const database = await initDatabase();
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
      var folderCreating = await storage.mkdir(folderName);
      var type = "folder";
      var localPath = `C:/Users/GAC/AppData/Roaming/com.file-upload.app/${folderName}`;
      insertFile = await database.execute(
        "INSERT INTO files (id, email, password, type,  localPath , name , parentId) VALUES (?,?, ?, ?, ?, ?, ?)",
        [
          folderCreating.nodeId,
          email,
          password,
          type,
          localPath,
          folderName,
          folderCreating.parent.nodeId
        ]
      );
      createAppDataFolder(folderName);
      return { ok: true };
    }
  } catch (error) {
    console.log(error.message);
    return { ok: false, error: error.message };
  }
}

async function createAppDataFolder(folderName) {
  try {
    const appDataDirPath = await appDataDir();
    const folderPath = `${appDataDirPath}/${folderName}`;

    await fs.mkdir(folderPath, {
      dir: fs.BaseDirectory.AppData,
      recursive: true,
    });

    console.log(`Folder '${folderName}' created successfully at ${folderPath}`);
  } catch (error) {
    console.error("Error creating folder:", error);
  }
}
export async function copyFilesToAppData(file) {
  try {
    const folderName = "mega file upload";
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
let rows ;
export async function loadAllFile(id) {
  const database = await initDatabase();
  const email = localStorage.getItem("email");
  const password = localStorage.getItem("password");
  if(id == undefined){
     rows = await database.select(
      "SELECT * FROM files WHERE email = ? AND password = ?",
      [email, password]
    );
  }
  else{
      rows = await database.select(
      "SELECT * FROM files WHERE email = ? AND password = ? AND parentId = ?",
      [email, password , id]
    );
  }
  return { ok: true, data: rows };
}
