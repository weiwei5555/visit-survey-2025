/**
 * 農業部農業創新育成中心標竿學習參訪活動調查
 * Google Apps Script - 接收表單資料、寫入 Google Sheets、寄信通知
 *
 * 使用說明：
 * 1. 開啟 Google Sheets，建立新試算表，命名為「參訪活動報名資料」
 * 2. 點選上方選單「擴充功能」→「Apps Script」
 * 3. 將此程式碼全部貼入編輯器（取代原有內容）
 * 4. 修改下方 NOTIFICATION_EMAIL 為你要收通知的信箱
 * 5. 點選「部署」→「新增部署作業」→「類型選 Web 應用程式」
 *    - 執行身分：我（你的 Google 帳號）
 *    - 存取權：任何人
 * 6. 複製部署後的 Web App URL，貼回網頁程式碼的 GOOGLE_APPS_SCRIPT_URL
 */

// ⚠️ 請修改為你要收通知的 Email 信箱
const NOTIFICATION_EMAIL = "your-email@example.com";

// Google Sheets 試算表名稱（如果不同請修改）
const SHEET_NAME = "報名資料";

/**
 * 處理 POST 請求（表單送出時呼叫）
 */
function doPost(e) {
  try {
    // 解析 JSON 資料
    const data = JSON.parse(e.postData.contents);

    // 寫入 Google Sheets
    writeToSheet(data);

    // 寄送通知信
    sendNotificationEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "資料已收到" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理 GET 請求（測試用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Apps Script 運作正常" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 將資料寫入 Google Sheets
 */
function writeToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // 如果工作表不存在，建立新的
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // 如果是第一列（沒有標題），先建立標題列
  if (sheet.getLastRow() === 0) {
    const headers = [
      "送出時間",
      "育成中心",
      "公司／組織名稱",
      "參加人數",
      "第1位-姓名", "第1位-身分證字號", "第1位-生日",
      "第2位-姓名", "第2位-身分證字號", "第2位-生日",
      "第3位-姓名", "第3位-身分證字號", "第3位-生日",
      "第4位-姓名", "第4位-身分證字號", "第4位-生日",
      "第5位-姓名", "第5位-身分證字號", "第5位-生日",
      "第6位-姓名", "第6位-身分證字號", "第6位-生日",
      "交通方式",
      "車號",
      "葷食人數",
      "素食人數",
      "特殊需求",
      "聯絡人姓名",
      "聯絡人電話",
      "聯絡人信箱"
    ];
    sheet.appendRow(headers);

    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#2d6a4f");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
  }

  // 組裝資料列
  const participantCount = parseInt(data.participantCount) || 0;
  const row = [
    new Date(),                          // 送出時間
    data.incubator || "",                // 育成中心
    data.company || "",                  // 公司名稱
    participantCount,                    // 參加人數
    data.participant_name_1 || "",       // 第1位姓名
    data.participant_id_1 || "",         // 第1位身分證
    data.participant_birthday_1 || "",   // 第1位生日
    data.participant_name_2 || "",
    data.participant_id_2 || "",
    data.participant_birthday_2 || "",
    data.participant_name_3 || "",
    data.participant_id_3 || "",
    data.participant_birthday_3 || "",
    data.participant_name_4 || "",
    data.participant_id_4 || "",
    data.participant_birthday_4 || "",
    data.participant_name_5 || "",
    data.participant_id_5 || "",
    data.participant_birthday_5 || "",
    data.participant_name_6 || "",
    data.participant_id_6 || "",
    data.participant_birthday_6 || "",
    data.transport || "",                // 交通方式
    data.carNumber || "",                // 車號
    data.meatCount || "0",              // 葷食人數
    data.vegCount || "0",               // 素食人數
    data.note || "",                     // 特殊需求
    data.contactName || "",              // 聯絡人姓名
    data.phone || "",                    // 聯絡人電話
    data.email || ""                     // 聯絡人信箱
  ];

  sheet.appendRow(row);
}

/**
 * 寄送通知信（給主辦單位 + 報名者）
 */
function sendNotificationEmail(data) {
  const participantCount = parseInt(data.participantCount) || 0;
  const submitTime = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss");

  // 組裝保險資訊文字
  let insuranceText = "";
  for (let i = 1; i <= participantCount; i++) {
    const name = data[`participant_name_${i}`] || "";
    const id = data[`participant_id_${i}`] || "";
    const birthday = data[`participant_birthday_${i}`] || "";
    insuranceText += `  第 ${i} 位：${name} / ${id} / ${birthday}\n`;
  }

  // 信件內容
  const subject = `【參訪報名】${data.company || "（未填公司）"} 已完成報名 - 農業部標竿學習活動`;

  const body = `
農業部農業創新育成中心標竿學習參訪活動 - 報名通知
═══════════════════════════════════════

📋 基本資訊
  育成中心：${data.incubator || ""}
  公司／組織名稱：${data.company || ""}
  參加人數：${participantCount} 人

🔒 保險資訊
${insuranceText}
🚗 參訪相關資訊
  交通方式：${data.transport || ""}
  車號：${data.carNumber || "（無）"}
  葷食人數：${data.meatCount || "0"} 人
  素食人數：${data.vegCount || "0"} 人

💬 特殊需求
  ${data.note || "（無）"}

📞 聯絡人資訊
  姓名：${data.contactName || ""}
  電話：${data.phone || ""}
  信箱：${data.email || ""}

═══════════════════════════════════════
送出時間：${submitTime}
  `.trim();

  // 1. 寄給主辦單位
  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: body
  });

  // 2. 如果報名者有填信箱，寄確認信給報名者
  if (data.email && data.email.includes("@")) {
    const confirmSubject = "【報名確認】農業部農業創新育成中心標竿學習參訪活動";
    const confirmBody = `
${data.contactName || "您好"}，

感謝您完成報名！以下是您的報名資料，請確認是否正確。

${body}

如有任何問題，請聯絡主辦單位。

此為系統自動發送，請勿直接回覆此信。
    `.trim();

    MailApp.sendEmail({
      to: data.email,
      subject: confirmSubject,
      body: confirmBody
    });
  }
}
