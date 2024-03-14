import React from "react";
import axios from "axios";
import { useRef, useState } from "react";
import CryptoJS from "crypto-js";
import { Navigate } from "react-router";
import { useAuth } from "../Context/AuthProvider";
import {toast} from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
const Loginx = () => {
  const user = useRef("");
  const pass = useRef("");

  const { usr, setUsr, setUserdata } = useAuth();
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSignup = async (e) => {
    e.preventDefault();
    const reqdata = {
      UserName: user.current.value,
      Password: pass.current.value,
    };
    console.log(reqdata);
    const result = await axios.post("http://localhost:8081/setCred", reqdata);
    if (result.status === 200) {
      toast.success("Registration successfull");
    } else {
      toast.error("login failed");
    }
    user.current.value = "";
    pass.current.value = "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const reqdata = {
      UserName: user.current.value,
      Password: pass.current.value,
    };
    console.log(reqdata);
    const result = await axios.post(
      "http://localhost:8081/validateCred",
      reqdata
    );
    if (result.status === 200) {
      console.log("validated");
      toast.success("login successfull");

      await delay(2000);
      const hashedpass = CryptoJS.AES.encrypt(
        pass.current.value,
        import.meta.env.VITE_PASS_KEY
      ).toString();
      setUsr(user.current.value);
      sessionStorage.setItem("user", user.current.value);
      sessionStorage.setItem("pass", hashedpass);
    } else {
      console.log("error");
      toast.error(result.data.message);
    }

    user.current.value = "";
    pass.current.value = "";
  };

  return (
    <>
      {!sessionStorage.getItem("user") ? (
        <main className=" min-h-screen bg-slate-800 overflow-x-hidden">
          <div className="flex flex-col h-screen items-center justify-center flex-nowrap bgimg  z-50">
            <form>
              <h1 className="xl:text-7xl lg:text-6xl text-4xl bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent font-michroma font-bold mb-10 -mt-5 mx-2 z-50 ">
                CogniFetch
              </h1>

              <div class="relative mb-4">
                <input
                  type="text"
                  class="peer block min-h-[auto] w-full rounded border border-white-500 dark:text-white bg-slate-900 px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:placeholder:text--200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0 "
                  id="exampleFormControlInput1"
                  required
                  ref={user}
                />
                <label
                  htmlFor="exampleFormControlInput1"
                  class="pointer-events-none absolute left-3 top-1 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[te-input-state-active]:-translate-y-[0.9rem] peer-data-[te-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-200 dark:peer-focus:text-primary bg-slate-900"
                  placeholder="USERNAME"
                >
                  
                </label>
              </div>

              <div class="relative mb-4" data-te-input-wrapper-init>
                <input
                  type="password"
                  class="peer block min-h-[auto] w-full rounded border border-white-500 dark:text-white bg-slate-900 px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0 b"
                  id="exampleFormControlInput11"
                  placeholder="Password"
                  required
                  ref={pass}
                />
                <label
                  htmlFor="exampleFormControlInput11"
                  class="pointer-events-none absolute left-3 top-1 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[te-input-state-active]:-translate-y-[0.9rem] peer-data-[te-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-200 dark:peer-focus:text-primary bg-slate-900"
                  placeholder="PASSWORD"
                >
                  
                </label>
              </div>

              <div className="flex justify-center gap-5">
                <button
                  type="button"
                  class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"
                  onClick={(e) => handleLogin(e)}
                >
                  LOG IN
                </button>
                <button
                  type="button"
                  class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"
                  onClick={(e) => handleSignup(e)}
                >
                  SIGN UP
                </button>
              </div>
            </form>
          </div>
        </main>
      ) : (
        <Navigate to="/profile" />
      )}
    </>
  );
};

export default Loginx;