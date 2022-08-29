const API_SERVER = "dev-label.softcamp.co.kr";
const USER_ID = "user1@bizsecret.co.kr";
const CORP_ID = "K1WFWP1J-A6xU1CHi-ToXlW2QO-TNTo4Rtg";
const API_KEY =
  "cecfdf065879c6f98e776dc22a475ebd681e52e3eeaa1fa8136516d586f657fa";

function setToken() {
  let url = `https://${API_SERVER}/v1/token`;
  console.log("[setToken] " + url);

  let json = JSON.stringify({
    userID: USER_ID,
    corpID: CORP_ID,
    apiKey: API_KEY,
  });
  console.log("[setToken] " + json);

  $.ajax({
    type: "post",
    url: url,
    dataType: "json",
    contentType: "application/json; charset=utf-8",
    async: false,
    data: json,
    success: function (responseJson) {
      console.log("[setToken] Token= " + responseJson.token);
      localStorage.accessToken = responseJson.token;
    },
    error: function (xhr, textStatus, errorThrown) {
      doApiError("setToken", xhr, textStatus, errorThrown);
    },
  });
}

function isExpired(jwt) {
  const currentUTC = new Date().getTime() / 1000; //new Date()는 현재시간을 UTC밀리세컨단위로 읽어와서 '/1000'해줌
  const diff = jwt.exp - currentUTC;
  const userID = USER_ID;

  console.log("[checkTokenExpired] exp - currunt = " + diff);

  if (10 > diff || jwt.userID !== userID) {
    return true;
  }

  return false;
}

function getAccessToken() {
  const currentToken = localStorage.accessToken;

  if (currentToken) {
    let base64Payload = currentToken.split(".")[1]; //value 0 -> header, 1 -> payload, 2 -> VERIFY SIGNATURE
    base64Payload = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64Payload)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const jwt = JSON.parse(jsonPayload);

    if (!isExpired(jwt)) {
      return currentToken;
    }

    console.log("accessToken expired");
  } else {
    console.log("not found accessToken");
  }

  setToken();

  return localStorage.accessToken;
}

function getDocHistory(docId) {
  var docHistory;
  const accessToken = getAccessToken();
  let url = `https://${API_SERVER}/v1/history/docs`;
  console.log("[getDocHistory] " + url);

  $.ajax({
    type: "POST",
    url: url,
    dataType: "json",
    contentType: "application/json; charset=utf-8",
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
    },
    data: JSON.stringify({
      from: 0,
      size: 9999,
      searchInfo: {
        items: [{ docID: docId }],
        analyze: false,
      },
      sortInfo: { field: "time", asc: false },
      filters: null,
    }),
    async: false,
    success: function (result) {
      docHistory = result.items;
      if (result.code != 0) {
        console.log(
          "[getDocHistory]문서 이력조회에 실패했습니다." + result.msg
        );
      } else {
        console.log(
          "[getDocHistory]문서 이력조회에 성공했습니다." + result.msg
        );
      }
    },
    error: function (xhr, textStatus, errorThrown) {
      doApiError("getDocHistory", xhr, textStatus, errorThrown);
    },
  });
  console.log(docHistory);
  return docHistory || [];
}

export function showHistory(docID) {
  const docHistory = getDocHistory(docID);
  docHistory.forEach((history) => {
    const content = {
      time: new Date(history.time).toLocaleString(),
      ip: history.ip,
      type: history.type,
      detail: history.detail,
      userID: history.userID,
    };
    let showDetail = "";
    let stringContent = "";
    if (!!content.detail && typeof content.detail == "object") {
      for (const key in content.detail) {
        stringContent += `<li>${key}:${JSON.stringify(
          content.detail[key]
        )}</li>`;
      }
    }
    if (stringContent != "") {
      showDetail += `<details class="moreInfo" style="font-size:12px;">
        <summary>자세히</summary>
        <ul style="padding-left: 1.5rem">${stringContent}</ul>
      </details>`;
    }

    $("#historyList").append(`
          <li class="list-group-item">
            <h5 style="font-weight:600;font-size:medium;margin:0;">${content.type}</h5>
            <p style="font-size:small;margin:0">
              time : ${content.time}<br>
              ip : ${content.ip}<br>
              user : ${content.userID}
            </p>
            ${showDetail}
          </li>
          `);
  });
}
