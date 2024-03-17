import axios from "axios";

const getContent = async (image) => {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("content-type", "image/jpeg");
  let res = await axios.post(
    "https://mineskill-back.onrender.com/datacall",
    formData,
    {
      "Content-Type": "multipart/form-data",
    }
  );
  console.log(res.data);
  return res.data;
};

export default getContent;
