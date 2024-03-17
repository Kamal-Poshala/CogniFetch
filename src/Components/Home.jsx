import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <main className=" min-h-screen bg-slate-800 overflow-x-hidden">
      <div className="flex flex-col h-screen items-center justify-center flex-nowrap bgimg z-50">
        <h1 className="xl:text-7xl lg:text-6xl text-4xl bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent font-michroma font-bold mb-10 -mt-5 mx-2 z-50 ">
          COGNI FETCH
        </h1>

        <div class="text-center w-full ">
          <h1 className="my-1 lg:text-3xl text-xl text-sky-500 font-bold leading-tight ">
            Running Short For Exam Preparation?
          </h1>
          <h1 className="my-1 lg:text-3xl text-xl text-sky-500 font-bold leading-tight">
            {" "}
            Don't Worry{" "}
            <font className=" md:text-5xl text-3xl font-Proxima-Nova text-fuchsia-100	 font-extrabold font-outfit">
              We Got You
            </font>
          </h1>
          <p className="mb-8 lg:text-lg text-slate-400 font-outfit text-sm">
            Our Scraper Converts Your Syllabus Copy Into An Elegant , Easy
            Understandable Set Of Curated Videos
          </p>
          <div className="flex justify-center gap-5">
            <Link to="/scrape">
              {" "}
              <button className="hover:bg-sky-500 transition-all delay-200 bg-white text-gray-800 font-bold rounded-full  lg:py-4 lg:px-8 py-2 px-4 hover:outline-4 hover:outline-sky-300 hover:outline">
                Let's Do This!
              </button>
            </Link>
            <Link to="/instructions">
              <button className="hover:bg-sky-500 transition-all delay-200 bg-white text-gray-800 font-bold rounded-full  lg:py-4 lg:px-8 py-2 px-4  hover:outline-4 hover:outline-sky-300 hover:outline">
                Instructions
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-80 h-80 rounded-full bg-indigo-900 opacity-60 blur-3xl absolute -top-3 -left-10 z-10 "></div>

      <div className="w-80 h-80 rounded-full  bg-blue-900 opacity-60 blur-3xl absolute top-28 right-10 z-10 "></div>
    </main>
  );
};

export default Home;