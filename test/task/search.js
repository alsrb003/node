var config = require("../config.json");
const util = require("../lib/util.js");
const logger = require("../lib/log.js");
const axios = require("axios");

async function search(config, qObj, res) {
    //http://125.7.235.202:19200/approval/_search?q=%EC%95%84%EC%9D%B4%EC%8A%A4%ED%81%AC%EB%A6%BC&size=5&from=0&default_operator=OR&sort=_created:order=asc
    //http://125.7.235.202:19200/approval/_search?q=subject:%EC%95%BC%EA%B7%BC
    const id = config.elastic_id + ":" + config.elastic_pw;
    var authorization = Buffer.from(id, "utf8").toString('base64');

    // var url = config.elastic_address + '/_search?q=' + encodeURI(qObj.query);//+ escape(qObj.query);
    // var url = `${config.elastic_address}/_search?q=${encodeURI(qObj.query)}&size=${encodeURI(qObj.size)}&from=${encodeURI(qObj.page)}&default_operator=${encodeURI(qObj.oper)}&sort=_score:order=desc`;

    let today = new Date();

    let year = today.getFullYear(); // 년도
    let month = today.getMonth() + 1;  // 월
    let date = today.getDate();  // 날짜
    let day = today.getDay();  // 요일

    let hours = today.getHours(); // 시
    let minutes = today.getMinutes();  // 분
    let seconds = today.getSeconds();  // 초

    let compare = "gte";
    let set = "";
    if (qObj.filter === "all" || qObj.filter === "모든 날짜") {
        compare = "lte"
        set = "T" + hours + minutes + seconds + "+09:00";
        qObj.filter = "all"
    }
    if (qObj.filter === "지난 1년") {
        year -= 3;
        qObj.filter = "all";
    } else if (qObj.filter === "지난 1개월") {
        month -= 1;
        if (month === 0) {
            month = 12;
            year -= 1;
        }
        qObj.filter = "all";
    } else if (qObj.filter === "지난 1주") {
        for (var i = 0; i < 7; i++) {
            date -= 1;
            if (date === 0) {
                month -= 1;
                if (month === 0) {
                    year -= 1;
                    month = 12;
                    date = 31;
                } else if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
                    date = 31;
                } else {
                    date = 30;
                }
            }
        }
    } else if (qObj.filter === "지난 1일") {
        date -= 1;
        if (date === 0) {
            month -= 1;
            if (month === 0) {
                month = 12;
                year -= 1;
                date = 31;
            } else if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
                date = 31;
            } else {
                date = 30;
            }
        }
        qObj.filter = "all";
    }


    if (qObj.filter === "정확도순") {
        qObj.filter = "all";
        compare = "lte";
    }

    console.log("year  :::::::::::::: " + year);
    console.log("month  :::::::::::::: " + month);
    console.log("date  :::::::::::::: " + date);
    console.log("compare :::::::::::::: " + compare);
    console.log("set :::::::::::::: " + set);

    // post
    url = `${config.elastic_address}/_search`;
    var esquery = {};
    if (qObj.filter === "all") {

        esquery = {
            // 'query': {
            //     'match': {
            //         'body': {
            //             'query': qObj.query,
            //             'operator': qObj.oper
            //         },
            //     }
            // },
            // 'size': qObj.size,
            // 'from': qObj.page

            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": qObj.query,
                                "fields": ["body", "subject", "_vc_wviwlist30__author"],
                                'operator': qObj.oper,
                            },
                        }
                    ],
                    "filter": [
                        {
                            "range": {
                                "_created": {
                                    [compare]: year + "" + month + "" + date + "" + set,
                                }
                            },
                        },
                    ],
                },
            },
            'size': qObj.size,
            'from': qObj.page,
            "sort": {
                "_created.keyword": {
                    "order": "desc",
                },
                "_vc_wviwlist30__subject.keyword": {
                    "order": "desc",
                }
            }
        };
    } else if (qObj.filter === "lately") {
        esquery = {
            "query": {
                "range": {
                    "_created": {
                        "lte": year,
                        //20180731T162126+09:00
                    }
                },
            },
        }
    }
    else {
        var match = {};
        var query = {};
        if (qObj.filter === "_vc_wviwlist30__author") {
            query['query'] = "ko:" + qObj.query;
        } else {
            query['query'] = qObj.query;
        }
        query['operator'] = qObj.oper;
        match[qObj.filter] = query;
        var query = {};
        query['match'] = match;
        esquery.query = query;
        esquery.size = qObj.size;
        esquery.from = qObj.from;
    }

    // authorization = Buffer.from("elastic:123!@#qwe", "utf8").toString('base64');
    // url = "http://125.7.235.202:19200/approval/_search?q=subject:%EC%95%BC%EA%B7%BC";
    console.log(url);
    console.log(authorization);

    axios({
        // method: "get",
        method: "post",
        url: url,
        data: JSON.stringify(esquery),
        headers: {
            Authorization: 'Basic ' + authorization,
            'Content-type': 'application/json'
        },
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

function convert(config, qObj, res, es_res) {
    console.log(es_res);
    const esData = es_res.data;
    var ret = {};
    ret.total_cnt = esData.hits.total;
    // util.writeSuccess(ret, res);
    const hits = esData.hits.hits;
    const arr = [];
    for (var i = 0; i < hits.length; i++) {
        var obj = {};
        obj.subject = hits[i]["_source"].subject;
        obj.from = hits[i]["_source"].inetfrom;
        obj.created = hits[i]["_source"]._created;
        obj.body = hits[i]["_source"].body;
        obj.author = hits[i]["_source"]._vc_wviwlist30__author;

        // obj.created = obj.created.substring(0, 4) + "년 " + obj.created.substring(4, 6) + "월 " + obj.created.substring(6, 8) + "일";

        arr.push(obj);
    }
    var category = {};
    category.approval = arr;
    ret.category = category;
    res.statusCode = 200;
    res.setHeader("Content-type", "application/json; charset=UTF-8");
    res.end(JSON.stringify(ret));
}

module.exports = {
    search,
};