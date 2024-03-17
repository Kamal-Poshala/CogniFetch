import React from "react";
import videoplay from "../assets/video-play.png";
const Search = () => {
  return (
    <main className="min-h-full font-outfit flex flex-col justify-center items-center">
      <h1 className=" text-5xl text-indigo-400">Play Results</h1>
      <img src={videoplay} alt="play" className=" w-80 h-80" />
    </main>
  );
};

export default Search;
