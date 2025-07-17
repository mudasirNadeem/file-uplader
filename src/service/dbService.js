import Database from "@tauri-apps/plugin-sql";
import { Storage } from "megajs";
import { appDataDir } from '@tauri-apps/api/path';
import * as fs from "@tauri-apps/plugin-fs";
let db = null;
export async function initDatabase() {
  if (!db) {
    try {
      db = await Database.load("sqlite:product.db");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS user (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password TEXT
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
      existingFolder = await storage.mkdir(folderName);
    }
    return existingFolder;
  } catch (error) {
    console.error("❌ Error in createFolder:", error.message);
  }
}

export async function uploadFile(file) {
  try {
    const megaFolder = await getMegaStorage();
    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const existFile = megaFolder.children.find(
      (child) => child.name === fileName
    );
    if (existFile) {
      confirm("File already exists in MEGA. Skipping upload.");
      return;
    }
    const uploadedFile = await megaFolder.upload(fileName, uint8Array).complete;
    confirm("The file was uploaded!", uploadedFile);
  } catch (error) {
    alert(error.message);
  }
}

export async function uploadFolder(folderName) {
  try {
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
      await storage.mkdir(folderName);
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
      recursive: true
    });

    console.log(`Folder '${folderName}' created successfully at ${folderPath}`);
  } catch (error) {
    console.error('Error creating folder:', error);
  }
}

