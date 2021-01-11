const fs = require("fs");
const url = require("url");
const querystring = require("querystring");
const express = require("express");
const config = require("./config.json");
const util = require("./lib/util.js");
const searchTask = require("./task/search.js");
const languagesTask = require("./task/language.js");
const log = console.log;

var pathList = [
  "/search",
  "/getlanguages"
];
var app = express();

if (config.port) {
  port = config.port;
} else {
  console.log("환경 파일--config.json 에 port 키가 없습니다.");
}

app.get(pathList, (req, res) => {
  console.log(util.getTimeStamp() + " " + "GET..." + req.url);
  var reqUrl = url.parse(req.url, true);
  var qObj = reqUrl.query; // 일반적인 사용

  console.log("req >>>", req.headers.cookie);

  // var query = qObj.query;
  // console.log("검색어 : " + query);
  // if (typeof query == "undefined" || typeof query == undefined || query == null || query == "") {
  //   console.log("검색어가 입력되지 않았습니다.");
  //   util.writeError("검색어가 입력되지 않았습니다", res);
  //   return;
  // }

  // var oper = qObj.oper;
  // if (typeof oper == "undefined" || typeof oper == undefined || oper == null || oper == "") {
  //   oper = "OR";
  // }
  // qObj.oper = oper;

  // var category = qObj.category;
  // if (typeof category == "undefined" || typeof category == undefined || category == null || category == "") {
  //   category = config.default_category;
  //   if (typeof category == "undefined" || typeof category == undefined || category == null || category == "") {
  //     category = "all";
  //   }
  // }
  // qObj.category = category;
  // console.log("카테고리: " + qObj.category);
  // console.log("요청한 페이지는 " + qObj.page);
  // console.log("사이즈는 " + qObj.size);


  for (var i = 0; i < pathList.length; i++) {
    if (req.url.toLowerCase().indexOf(pathList[i].toLowerCase()) == 0) {
      var functionName = pathList[i].substring(pathList[i].indexOf('/') + 1, pathList[i].length);
      // console.log("functionName => ", functionName);
      qObj["cookie"] = req.headers.cookie;
      eval(functionName + '(config, qObj, res)');
      return;
    }
  }

  // searchTask.search(config, qObj, res);
  return;
});
app.post(pathList, (req, res) => {
  var body = [];
  var qObj = {};
  req
    .on("error", function (err) {
      console.log("[REQUEST_BODY-ERROR] " + err);
    })
    .on("data", function (chunk) {
      // chunk : postdata
      body.push(chunk);
    })
    .on("end", function (chunk) {
      console.log("=======================================");
      var postData = body.toString();

      var arr = postData.split("&");
      // x=1&y=2&z=3 => [0] x=1 [1] y=2 [2] z=3
      for (var index = 0; index < arr.length; index++) {
        console.log(arr[index]);
        if (arr[index].indexOf("=") > 0) {
          var key = util.strLeft(arr[index], "=");
          var val = util.strRight(arr[index], "=");
          val = val.replace(/%20/gi, "&");
          qObj[key] = val;
        } else {
          var key = arr[index];
          qObj[key] = "";
          qObj = arr[index];
        }
      }

      console.log(util.getTimeStamp() + " " + "POST..." + req.url);
      // var reqUrl = url.parse(req.url, true);
      // var qObj = req.body; // 일반적인 사용
      var functionName = "";
      for (var index = 0; index < pathList.length; index++) {
        if (
          req.url
            .toLocaleLowerCase()
            .indexOf(pathList[index].toLocaleLowerCase()) == 0
        ) {
          functionName = util.strRight(pathList[index], "/"); // ping./..
          break;
        }
      }
      if (functionName != "") {
        var shell = "jdbc." + functionName + "(config, qObj, res)";
        // eval(shell);

        if (qObj.locale == "" || qObj.locale == null || typeof qObj.locale == undefined || typeof qObj.locale == "undefined") {

          var query = qObj.query;
          // console.log("검색어 : " + query);
          if (typeof query == "undefined" || typeof query == undefined || query == null || query == "") {
            console.log("검색어가 입력되지 않았습니다.");
            util.writeError("검색어가 입력되지 않았습니다", res);
            return;
          }

          var oper = qObj.oper;
          if (typeof oper == "undefined" || typeof oper == undefined || oper == null || oper == "") {
            oper = "OR";
          }
          qObj.oper = oper;

          var filter = qObj.filter;
          if (typeof filter == "undefined" || typeof filter == undefined || filter == null || filter == "") {
            filter = "body";
          }
          qObj.filter = filter;

          switch (qObj.filter) {
            case "제목에서": qObj.filter = "subject"; break;
            case "내용에서": qObj.filter = "body"; break;
            case "모든 결과": qObj.filter = "all"; break;
            case "작성자에서": qObj.filter = "_vc_wviwlist30__author"; break;
            case "최근일자순": qObj.filter = "lately"; break;
          }

          var category = qObj.category;
          if (typeof category == "undefined" || typeof category == undefined || category == null || category == "") {
            category = config.default_category;
            if (typeof category == "undefined" || typeof category == undefined || category == null || category == "") {
              category = "all";
            }
          }
          qObj.category = category;
          // searchTask.search(config, qObj, res);
        }
        // post pathList
        for (var i = 0; i < pathList.length; i++) {
          if (req.url.toLowerCase().indexOf(pathList[i].toLowerCase()) == 0) {
            var functionName = pathList[i].substring(pathList[i].indexOf('/') + 1, pathList[i].length);
            // console.log("functionName => ", functionName);
            qObj.cookie = req.headers.cookie;
            eval(functionName + '(config, qObj, res)');
            return;
          }
        }
      }
      return;
    });
});

function search(config, qObj, res) {
  var query = qObj.query;
  console.log("검색어 : " + query);
  if (typeof query == "undefined" || typeof query == undefined || query == null || query == "") {
    console.log("검색어가 입력되지 않았습니다.");
    util.writeError("검색어가 입력되지 않았습니다", res);
    return;
  }

  var oper = qObj.oper;
  if (typeof oper == "undefined" || typeof oper == undefined || oper == null || oper == "") {
    oper = "OR";
  }
  qObj.oper = oper;

  var category = qObj.category;
  if (typeof category == "undefined" || typeof category == undefined || category == null || category == "") {
    category = config.default_category;
    if (typeof category == "undefined" || typeof category == undefined || category == null || category == "") {
      category = "all";
    }
  }
  qObj.category = category;
  console.log("카테고리: " + qObj.category);
  console.log("요청한 페이지는 " + qObj.page);
  console.log("사이즈는 " + qObj.size);

  searchTask.search(config, qObj, res);
}

function getlanguages(config, qObj, res) {
  var locale = qObj.locale;
  console.log("locale : " + locale);

  switch (qObj.locale) {
    case "한국어": qObj.locale = "ko"; break;
    case "English": qObj.locale = "en"; break;
  }

  languagesTask.getlanguages(config, qObj, res);
}

var server = app.listen(port, function () {
  console.log("Express server has started on port " + port);
});
