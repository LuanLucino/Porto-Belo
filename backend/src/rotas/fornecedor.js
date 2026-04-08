const dotenv = require("dotenv");
const axios = require("axios");
const SIENGE_USER = process.env.SIENGE_USER;

const url = "";

async function buscarFornecedor(cnpj) {

    const response = await axios.get(`${url}/creditors`, {
        params: { cnpj },
        auth: {
            username: "",
            password: "",
        },
    });

    return response.data.results;
    

}
dotenv.config();
(async () => {
    const data = await buscarFornecedor("");
    console.log(data);
})();