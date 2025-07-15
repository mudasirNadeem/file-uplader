import React, { useState } from "react";
import { uploadFile } from "../service/dbService";

const Navbar = () => {
  async function getFile(value){
    const result = await uploadFile(value)
  }
  return (
    <nav className="navbar bg-base-200 px-4 py-2 flex justify-between items-center shadow">
      <div className="flex items-center">
        <p className="text-3xl">Upload File</p>
      </div>
      <div className="flex">
        <a href="/" className="btn btn-primary flex items-center gap-2">
          Log Out
        </a>
        <input
          type="file"
          id="upload-Image"
          onChange={(e) => getFile(e.target.files[0])}
          accept=".png, .svg, .jpg, .jpeg, image/png, image/svg+xml, image/jpeg"
          hidden
        />
        <label htmlFor="upload-Image"  className="btn btn-primary ms-2 flex items-center gap-2">
            <span className="text-lg">+</span>
            Add
        </label>
      </div>
    </nav>
  );
};

export default Navbar;
