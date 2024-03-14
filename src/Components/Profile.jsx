import React from "react";
import avatar from "../assets/male-avatar.gif";
import { useAuth } from "../Context/AuthProvider";
import { Navigate } from "react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CryptoJS from "crypto-js";
const items = [
  { id: "1", topic: "DSGT" },
  { id: "2", topic: "Web Tech" },
  { id: "3", topic: "DataStructure" },
  { id: "4", topic: "Physics" },
];

const Profile = () => {
  const { usr, setUsr, userdata } = useAuth();
  const [pass, setPass] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPass(
      CryptoJS.AES.decrypt(
        sessionStorage.getItem("pass"),
        import.meta.env.VITE_PASS_KEY
      ).toString(CryptoJS.enc.Utf8)
    );
  }, []);

  const handlelogout = async (e) => {
    e.preventDefault();
    toast.success("logged out");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("pass");
    sessionStorage.removeItem("userdata");
    sessionStorage.removeItem("ocrres");
    window.location.reload();
  };

  const handlehist = async (e, d, s) => {
    e.preventDefault();
    console.log(d);
    const data = {
      concepts: d,
    };
    sessionStorage.setItem("ocrres", JSON.stringify(data));
    sessionStorage.setItem("subject", s);
  };

  return (
    <>
      {usr && userdata ? (
        <main className="bg-slate-900 min-h-screen w-auto flex flex-col">
          <div className="w-full flex items-center justify-center">
            <h1 className=" text-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent font-michroma font-bold  mx-2 mt-5  ">
              CogniFetch
            </h1>
          </div>

          <div className="flex mt-14 flex-col ">
            <h1 className="xl:text-5xl text-4xl font-sora text-slate-200 flex flex-row w-full justify-between items-center">
              DASHBOARD
              <button
                className="p-2 mr-5 text-xl font-sora bg-sky-500 text-slate-900 rounded-xl my-1 shadow-md shadow-slate-950 "
                onClick={(e) => handlelogout(e)}
              >
                logout
              </button>
            </h1>
            <hr className="xl:border-sky-500 xl:border border-0" />
            <img
              src={avatar}
              alt="avatar"
              className=" hidden xl:block xl:w-72  xl:h-64 rounded-full self-center xl:-mt-24 "
            />
          </div>

          <section className="w-full flex flex-col justify-center items-center mt-8">
            <img
              src={avatar}
              alt="avatar"
              className=" xl:hidden rounded-full self-center w-28 h-28 z-10"
            />
            <form
              action=""
              className="bg-[#4a567ea9] xl:w-1/2 w-80 h-auto p-3 rounded-3xl -mt-5"
            >
              <div className="mx-2 mt-5 flex flex-row flex-nowrap flex-shrink justify-evenly items-center">
                <label
                  htmlFor="username"
                  className="font-sora xl:text-3xl text-xl text-slate-200 "
                >
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  className="bg-[#051F3E] rounded-full text-sky-500 font-sora p-2 outline-none ring-1 ring-sky-500 shadow-lg shadow-slate-800 w-1/2"
                  value={userdata.user}
                />
              </div>
              <div className="mx-2 mt-5 flex flex-row flex-nowrap flex-shrink justify-evenly items-center">
                <label
                  htmlFor="pass"
                  className="font-sora xl:text-3xl text-xl text-slate-200"
                >
                  Password
                </label>
                <input
                  type="text"
                  name="pass"
                  className="bg-[#051F3E] rounded-full text-sky-500 font-sora p-2 outline-none ring-1 ring-sky-500 shadow-lg shadow-slate-800 w-1/2"
                  value={pass}
                />
              </div>

              <div className="flex flex-row justify-center mx-4 gap-8 items-center mt-5">
                <button className="bg-[#29BBDB] rounded-full font-sora text-xl text-white px-3 py-1">
                  Save
                </button>
                <button className="bg-[#D93A44] rounded-full font-sora text-xl text-white px-3 py-1">
                  Cancel
                </button>
              </div>
            </form>
          </section>

          <section className="px-8">
            <h1 className="font-sora text-3xl text-white self-start">
              History
            </h1>

            <ul>
              {userdata.src &&
                Object.keys(userdata.src).map(
                  (item) =>
                    item !== "undefined" && (
                      <li
                        key={item}
                        className="w-full bg-[#051F3E] font-sora p-4 flex flex-row flex-nowrap text-white font-2xl justify-between items-center my-3 mx-1 rounded-full shadow-md shadow-slate-950"
                      >
                        <div className="flex flex-row gap-3">
                          <h1>Subject</h1>{" "}
                          <h1 className="text-sky-500 font-bold">{item}</h1>
                        </div>
                        <button
                          onClick={(e) =>
                            handlehist(e, userdata.src[item], item)
                          }
                        >
                          More details🔽
                        </button>
                      </li>
                    )
                )}
            </ul>
          </section>

          <section className="self-center xl:w-1/2 w-80 bg-[#dbaaaa7e] border border-[#f87373] p-3 rounded-2xl backdrop-opacity-10 text-white my-3">
            <div className="flex flex-row flex-wrap justify-center items-center gap-3">
              <h1 className="text-red-500 ">❗Warning</h1>
              <h1>Careful your account will be deleted</h1>
            </div>
            <div className="flex flex-row flex-wrap justify-center items-center gap-3 mt-5">
              Click To Delete Your Account
              <button className="bg-red-500 text-white px-3 py-2 rounded-full">
                Delete Your Account
              </button>
            </div>
          </section>
        </main>
      ) : (
        <Navigate to="/login" />
      )}
    </>
  );
};

export default Profile;