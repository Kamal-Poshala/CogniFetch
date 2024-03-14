import React, { useState } from "react";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../Context/AuthProvider";
import CryptoJS from "crypto-js";
import { Navigate } from "react-router";
import axios from "axios";
import Loading from "./Loading";
import Layout from "./Layout";
import useSWR from "swr";

const PersistAuth = () => {
  const { usr, setUsr, setUserdata } = useAuth();
  const [loading, setLoading] = useState(false);

  const getdata = async () => {
    const res = await axios.post("http://localhost:3500/users/getdata", {
      user: sessionStorage.getItem("user"),
    });

    sessionStorage.setItem("userdata", JSON.stringify(res.data));
    return res.data;
  };

  const { data, error, isLoading } = useSWR(
    "http://localhost:3500/users/getdata",
    getdata
  );

  useEffect(() => {
    setLoading(true);
    if (sessionStorage.getItem("user")) {
      const reqdata = {
        UserName: sessionStorage.getItem("user"),
        Password: CryptoJS.AES.decrypt(
          sessionStorage.getItem("pass"),
          import.meta.env.VITE_PASS_KEY
        ).toString(CryptoJS.enc.Utf8),
      };

      /*  axios.post("http://localhost:8081/validateCred", reqdata).then((res) => {
        if (res.status == 200) setUsr(sessionStorage.getItem("user"));
      }); */

      setUsr(sessionStorage.getItem("user"));

      if (!error) setUserdata(data);

      setLoading(false);
    }
    setLoading(false);
  }, []);

  return isLoading ? <Loading /> : usr ? <Outlet /> : <Navigate to="/login" />;
};

export default PersistAuth;