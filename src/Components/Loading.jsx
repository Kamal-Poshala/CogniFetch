import React from "react";
import gif from "../assets/opener-loading.gif";
const Loading = () => {
  return (
    <main className=" min-h-screen bg-slate-900 text-2xl text-indigo-500 flex justify-center items-center">
      <img src={gif} alt="loading" className="w-80 h-80" />
    </main>
  );
};

export default Loading;
