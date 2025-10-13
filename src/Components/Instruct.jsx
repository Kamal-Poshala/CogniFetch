import React from "react";
import fishing from "../assets/fishing.png";
const Instruct = () => {
  return (
    <main className=" bg-slate-900 min-w-full h-auto bgimg flex flex-row justify-evenly">
      <img
        src={fishing}
        alt="fishing"
        className="xl:block hidden w-1/2 h-auto self-start"
      />

      <section className="self-center font-sora text-white text-center my-2 xl:w-1/3 w-80">
        <h1 className="font-sora text-2xl text-sky-400 underline ">
          Instructions
        </h1>
        <ul className=" list-none border border-sky-500 rounded-xl bg-slate-900">
          <li className=" leading-10 border-b-2 border-sky-600">
            Navigate to the homepage of the website.
          </li>
          <li className=" leading-10 border-b-2 border-sky-600">
            If you are a new user create your account by clicking "user" icon
          </li>
          <li className=" leading-10 border-b-2 border-sky-600">
            On the scrape, click on the "Upload" button and select the image you
            want to extract content from using OCR.Click "Go"
          </li>
          <li className=" leading-10 border-b-2 border-sky-600">
            You can click play on data list to see the content
          </li>
          <li className=" leading-10 border-b-2 border-sky-600">
            User can save data by clicking save in results page.
          </li>
          <li className=" leading-10 border-b-2 border-sky-600">
            If you want to logout of your account, click on the "Logout" button
            in the profile
          </li>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path
              fill="#0099ff"
              fill-opacity="1"
              d="M0,160L21.8,165.3C43.6,171,87,181,131,197.3C174.5,213,218,235,262,234.7C305.5,235,349,213,393,208C436.4,203,480,213,524,197.3C567.3,181,611,139,655,133.3C698.2,128,742,160,785,197.3C829.1,235,873,277,916,282.7C960,288,1004,256,1047,245.3C1090.9,235,1135,245,1178,245.3C1221.8,245,1265,235,1309,197.3C1352.7,160,1396,96,1418,64L1440,32L1440,320L1418.2,320C1396.4,320,1353,320,1309,320C1265.5,320,1222,320,1178,320C1134.5,320,1091,320,1047,320C1003.6,320,960,320,916,320C872.7,320,829,320,785,320C741.8,320,698,320,655,320C610.9,320,567,320,524,320C480,320,436,320,393,320C349.1,320,305,320,262,320C218.2,320,175,320,131,320C87.3,320,44,320,22,320L0,320Z"
            ></path>
          </svg>
        </ul>
      </section>
    </main>
  );
};

export default Instruct;