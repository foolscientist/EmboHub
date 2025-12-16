import React from "react";

interface FileProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

function InputUploadFiles({ files, setFiles }: FileProps) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = e.target.files;
    setFiles((prevState) => [...prevState, ...Array.from(files)]);
  };

  const handleDelete = (indexToRemove: number) => {
    setFiles((prevState) =>
      prevState.filter((_, index) => index !== indexToRemove),
    );
    console.log("Deleting file at index", indexToRemove);
  };

  return (
    <div>
      <input type="file" multiple onChange={handleUpload} />
      <ol>
        {files &&
          files.map((file, index) => (
            <li key={index}>
              <p>{file.name}</p>
              <button onClick={() => handleDelete(index)}>Delete</button>
            </li>
          ))}
      </ol>
    </div>
  );
}

export default InputUploadFiles;
