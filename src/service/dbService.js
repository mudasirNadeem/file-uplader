import Database from "@tauri-apps/plugin-sql";
import { Storage } from "megajs";

let db = null;
let storage = null;
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
export async function loginUser(email, password) {
  try {
    storage = new Storage({
      email: email,
      password: password,
    });
    await storage.ready;
    if (storage) {
      await createFolder(storage);
      return { ok: true };
    } else {
      return { ok: false };
    }
  } catch (error) {
    console.error("❌ Failed to login user:", error.message);
    return { ok: false };
  }
}

async function createFolder(storage) {
  try {
    const folderName = "mega file upload";
    await storage.ready;
    const existingFolder = await storage.find(folderName);
    if (!existingFolder) {
      const newFolder = await storage.mkdir(folderName);
    }
  } catch (error) {
    console.error("❌ Error in createFolder:", error.message);
  }
}

export async function uploadFile(value) {
  try {
     console.log("Storage status:", storage);
    if (!storage) throw new Error("❌ Not logged in: storage is missing");
    await storage.ready;
    const file = await storage.upload(value, value).complete;
  } catch (error) {
    console.log("Mudasir");
  }
}
