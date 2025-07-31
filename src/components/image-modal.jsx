// import { useState, useEffect } from "react";
// import { showImage } from "../service/dbService";

// export default function ImageModal({ isOpen, onClose, imageId }) {

//   async function imageView() {
//     try {
//       const url = await showImage(imageId);
//     } catch (error) {
//       console.error("Error fetching image:", error);
//     }
//   }

//   useEffect(() => {
//       imageView();
//   }, [isOpen, imageId]);

//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
//       onClick={onClose}
//     >
//       <div className="bg-white p-4 rounded shadow-lg">
//         {/* {imageUrl ? (
//           <img
//             src="sdf"
//             alt="Preview"
//             className="max-w-full w-[400px] h-[400px] rounded"
//           />
//         ) : (
//           <div>Loading...</div>
//         )} */}
//         <img src="C:\Users\GAC\AppData\Roaming\com.file-upload.app\mega upload files\1753880982195_media_20250217_094707_355072176203640145.jpg" />
//       </div>
//     </div>
//   );
// }