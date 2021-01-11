var config = require("../config.json");
const util = require("../lib/util.js");
const logger = require("../lib/log.js");
const axios = require("axios");

async function getlanguages(config, qObj, res) {
    // http://localhost/homepage.nsf/api/data/collections/name/textlist?category=ko
    const url = `${config.languages_address}&category=${qObj.locale}`;

    axios({
        method: "get",
        url: url,
        headers: {
            cookie: qObj.cookie
        }
    }).then((response) => {
        // console.log(response);
        console.log(JSON.stringify(response.data));
        convert(config, qObj, res, response);

    }).catch(error => {
        // console.log(error);
        throw new Error(error);
    });
    return;
};

function convert(config, qObj, res, domino_res) {
    const dominoData = domino_res.data;
    var ret = {};

    for (var i = 0; i < dominoData.length; i++) {
        ret[dominoData[i].id] = dominoData[i].text;
    }
    res.statusCode = 200;
    res.setHeader("Content-type", "application/json; charset=UTF-8");
    res.end(JSON.stringify(ret));
}

module.exports = {
    getlanguages,
};