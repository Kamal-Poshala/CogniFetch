import React from "react";
import {
  FaPlusCircle,
  FaTrash,
  FaFileImage,
  FaRegPaperPlane,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Loading from "./Loading";
import getContent from "../controllers/getContent";

const Scrape = ({ setResdata, resdata }) => {
  const [file, setFile] = useState("");
  const [error, setError] = useState(null);
  const [image, setImage] = useState(null);
  const [isloading, setIsloading] = useState(false);
  const [subject, setSubject] = useState("");

  const handleUpload = async (event) => {
    const extname = event.target.files[0].name;

    if (
      extname.endsWith(".jpg") ||
      extname.endsWith(".jpeg") ||
      extname.endsWith(".png")
    ) {
      setError(null);
      const fname = event.target.files[0].name;
      console.log(fname);
      if (fname) {
        setFile(fname);
        setImage(event.target.files[0]);
      }
    } else {
      setError("Invalid File");
      setFile("");
    }
  };

  const handleDelete = () => {
    setFile("");
  };

  const handleResults = async () => {
    if (image !== null) {
      setIsloading(true);
      sessionStorage.setItem("subject", subject);
      const d = await getContent(image);
      setResdata(d);
      setIsloading(false);
    }
  };

  return !isloading && resdata === null ? (
    <main className=" flex flex-col min-h-screen bg-slate-800 gap-4  pt-3 items-center">
      <section className="font-mono font-extrabold flex flex-row items-center justify-center p-1 bg-slate-900 text-[#E1E4E7] rounded-xl">
        <label className="relative cursor-pointer">
          <input
            type="text"
            placeholder="Subject"
            className="h-10 w-30 px-4 py-4 text-xl text-white bg-black border-white border-2 rounded-lg border-opacity-50 outline-none focus:border-blue-500 placeholder-gray-300 placeholder-opacity-0 transition duration-200"
            onChange={(e) => setSubject(e.target.value)}
          />
          <span className="text-xl text-white text-opacity-80 bg-black absolute left-4 top-1 px-1 transition duration-200 input-text">
            Subject
          </span>
        </label>
      </section>

      <section className="flex flex-col items-center text-sky-700 text-3xl bg-slate-900  w-80 h-auto py-8 px-2 text-center rounded-2xl border-dashed border-4 border-sky-700 my-7">
        <button className="flex flex-row justify-center items-center flex-nowrap  mx-2 my-12 p-2 text-xl  w-24  max-h-9 bg-sky-300  rounded-sm text-slate-900 hover:scale-150 hover:-translate-y-4 transition-all hover:shadow-2xl hover:shadow-sky-500">
          <input
            type="file"
            onChange={(e) => {
              handleUpload(e);
            }}
            className="-m-100 opacity-0 "
            name="image"
          />
          <FaPlusCircle className="flex-shrink-0" />
          Import
        </button>
        <p>Add Your Scan</p>
        <p>Accepted-Format: JPEG, PNG, JPG</p>

        <h3 className="text-lg text-red-600">{error}</h3>

        <section className="text-xl text-sky-600 mt-6">
          {file[0] != null ? (
            <section className=" text-slate-800 flex flex-row justify-between items-center bg-sky-500 w-auto gap-3 p-3 rounded-xl">
              <FaFileImage />
              <p>{file.length > 8 ? file.substring(0, 5) + "..." : file}</p>
              <FaTrash
                type="button"
                onClick={handleDelete}
                className=" ml-14"
              />
            </section>
          ) : (
            <p>Import File To See.</p>
          )}
        </section>
      </section>
      <button
        className="flex flex-row  h-auto w-auto p-3 m-5 bg-sky-700 hover:bg-sky-500 hover:-translate-y-3 transition-all delay-200 text-slate-900 text-xl justify-center items-center rounded-xl active:shadow-xl active:shadow-sky-600 animate-bounce hover:animate-none shadow-lg shadow-slate-900"
        onClick={handleResults}
      >
        <h1>GO</h1>
        <FaRegPaperPlane className=" ml-4" />
      </button>

      <ul className=" w-80 morp rounded-xl text-lg text-indigo-300 p-2 text-center">
        <h1 className="flex flex-row flex-nowrap text-2xl gap-2 items-center justify-center p-2 text-indigo-300 w-full border-b-2 border-indigo-300">
          <FaExclamationTriangle />
          Limitations
        </h1>

        <li> Size of the image must be less than 1024KB</li>
        <li>Make Sure To Crop Unnecessary Information </li>
      </ul>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path
          fill="#0099ff"
          fill-opacity="1"
          d="M0,160L21.8,165.3C43.6,171,87,181,131,197.3C174.5,213,218,235,262,234.7C305.5,235,349,213,393,208C436.4,203,480,213,524,197.3C567.3,181,611,139,655,133.3C698.2,128,742,160,785,197.3C829.1,235,873,277,916,282.7C960,288,1004,256,1047,245.3C1090.9,235,1135,245,1178,245.3C1221.8,245,1265,235,1309,197.3C1352.7,160,1396,96,1418,64L1440,32L1440,320L1418.2,320C1396.4,320,1353,320,1309,320C1265.5,320,1222,320,1178,320C1134.5,320,1091,320,1047,320C1003.6,320,960,320,916,320C872.7,320,829,320,785,320C741.8,320,698,320,655,320C610.9,320,567,320,524,320C480,320,436,320,393,320C349.1,320,305,320,262,320C218.2,320,175,320,131,320C87.3,320,44,320,22,320L0,320Z"
        ></path>
      </svg>
    </main>
  ) : isloading ? (
    <Loading />
  ) : (
    <Navigate to={`/results/${sessionStorage.getItem("subject")}`} />
  );
};

export default Scrape;
