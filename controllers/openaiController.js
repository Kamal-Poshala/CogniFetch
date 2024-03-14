const { Configuration, OpenAIApi } = require("openai");
const callopenai = async (data) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API,
  });
  const prompt =
    "extract keywods from the below text as comma seperated\n" + `${data}`;
  try {
    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0,
      max_tokens: 250,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
  } catch (err) {
    console.log(err);
  }
};

module.exports = callopenai;
