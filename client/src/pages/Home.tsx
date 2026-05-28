import { useState, useRef } from "react";

// ⚠️ 請將下方 GOOGLE_APPS_SCRIPT_URL 換成你部署後的 Apps Script Web App URL
// 格式：https://script.google.com/macros/s/XXXXXXXX/exec
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRJb_ACHbFLlUCLyQqndoPOSzp9k04v1g8brIkW808O8-SKbCeu0F1A6Uda1KbKOGDKQ/exec";

const MAX_PARTICIPANTS = 6;

interface Participant {
  name: string;
  idNumber: string;
  birthday: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [totalCount, setTotalCount] = useState<number>(0);
  const [participants, setParticipants] = useState<Participant[]>(
    Array.from({ length: MAX_PARTICIPANTS }, () => ({ name: "", idNumber: "", birthday: "" }))
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleParticipantChange = (index: number, field: keyof Participant, value: string) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newErrors: string[] = [];
    const count = Number(totalCount);

    if (!count || count < 1) {
      newErrors.push("請填入參加人數");
    } else {
      for (let i = 0; i < count; i++) {
        const p = participants[i];
        if (!p.name.trim()) newErrors.push(`第 ${i + 1} 位參與者請填寫姓名`);
        if (!p.idNumber.trim()) newErrors.push(`第 ${i + 1} 位參與者請填寫身分證字號`);
        if (!p.birthday.trim()) newErrors.push(`第 ${i + 1} 位參與者請填寫生日`);
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      document.getElementById("insurance-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setErrors([]);

    // 收集表單資料
    const formData = new FormData(form);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // 加入保險資訊（React state 管理，不在 FormData 中）
    for (let i = 0; i < count; i++) {
      data[`participant_name_${i + 1}`] = participants[i].name;
      data[`participant_id_${i + 1}`] = participants[i].idNumber;
      data[`participant_birthday_${i + 1}`] = participants[i].birthday;
    }
    data["participantCount"] = String(count);

    setSubmitStatus("loading");

    try {
      // Google Apps Script 需要用 no-cors 模式，或透過 JSONP
      // 這裡使用 fetch + no-cors，Apps Script 端需設定 doPost 回傳 JSON
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // no-cors 模式下 response.ok 永遠是 false，但只要不 throw 就視為成功
      setSubmitStatus("success");
      // 清除表單
      form.reset();
      setTotalCount(0);
      setParticipants(Array.from({ length: MAX_PARTICIPANTS }, () => ({ name: "", idNumber: "", birthday: "" })));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("送出失敗：", err);
      setSubmitStatus("error");
      setErrorMessage("送出失敗，請確認網路連線後再試一次，或聯絡主辦單位。");
    }
  };

  const handleReset = () => {
    setTotalCount(0);
    setParticipants(Array.from({ length: MAX_PARTICIPANTS }, () => ({ name: "", idNumber: "", birthday: "" })));
    setErrors([]);
    setSubmitStatus("idle");
    setErrorMessage("");
  };

  const count = Number(totalCount) || 0;
  const visibleRows = Math.min(Math.max(count, 0), MAX_PARTICIPANTS);
  const isLoading = submitStatus === "loading";

  // 送出成功畫面
  if (submitStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center p-5">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-900 text-white px-12 py-8 text-left">
            <h1 className="text-2xl font-bold mb-2">
              農業部農業創新育成中心標竿學習參訪活動調查
            </h1>
          </div>
          <div className="p-12 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-green-700 mb-4">報名成功！</h2>
            <p className="text-gray-600 mb-2">感謝您的填寫，資料已成功送出。</p>
            <p className="text-gray-600 mb-8">請留意信箱，稍後將收到確認通知信。</p>
            <button
              onClick={handleReset}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              重新填寫
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center p-5">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-900 text-white px-12 py-8 text-left">
          <h1 className="text-2xl font-bold mb-2">
            農業部農業創新育成中心標竿學習參訪活動調查
          </h1>
          <p className="text-sm opacity-95 leading-relaxed">
            誠摯邀請您參與 115年6月29日（星期一）標竿學習活動，請於 6月5日(星期五) 17:00 前完成填寫，謝謝您的配合！
          </p>
        </div>
        {/* Schedule Table */}
        <div className="px-8 pt-8">
          <h2 className="text-lg font-semibold text-green-700 mb-5">📅 115年6月29日（一）參訪行程</h2>
          <table className="w-full border-collapse mb-8">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="p-3 text-left font-semibold border border-green-700 w-1/4">時間</th>
                <th className="p-3 text-left font-semibold border border-green-700">內容</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-gray-300 font-semibold">09:20</td>
                <td className="p-3 border border-gray-300">高鐵台中站集合</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300"></td>
                <td className="p-3 border border-gray-300">前往喬伊登國際農產股份有限公司</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-semibold">10:00-11:30</td>
                <td className="p-3 border border-gray-300">
                  <strong>【企業參訪與交流】</strong>喬伊登國際農產股份有限公司（番茄方舟）
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 border border-gray-300 font-semibold">12:00-13:20</td>
                <td className="p-3 border border-gray-300">午餐時間（菁芳園）</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300"></td>
                <td className="p-3 border border-gray-300">前往玉美生技股份有限公司</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-semibold">14:00-16:00</td>
                <td className="p-3 border border-gray-300">
                  <strong>【企業參訪與交流】</strong>興農集團所屬之植物保護事業玉美生技股份有限公司食品部及玉美部
                </td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-semibold">16:15</td>
                <td className="p-3 border border-gray-300">高鐵台中站</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Form */}
        <form id="registrationForm" ref={formRef} className="p-8" onSubmit={handleSubmit}>
          {/* Basic Info */}
          <h2 className="text-base font-semibold text-green-700 mb-5 border-b-2 border-green-100 pb-3">📋 基本資訊</h2>
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-3 text-sm">
              貴公司來自哪個育成中心？<span className="text-red-600 font-bold">*</span>
            </label>
            <div className="space-y-3">
              {['農業試驗所', '林業試驗所', '水產試驗所', '畜產試驗所', '農業科技研究院'].map((center, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={`center${idx + 1}`}
                    name="incubator"
                    value={center}
                    required
                    disabled={isLoading}
                    className="w-4 h-4 cursor-pointer accent-green-700"
                  />
                  <label htmlFor={`center${idx + 1}`} className="cursor-pointer text-sm font-normal">
                    {center}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-2 text-sm">
              公司／組織名稱<span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="company"
              placeholder="請輸入公司或組織名稱"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* 參加人數 */}
          <div className="mb-6" id="insurance-section">
            <label className="block font-semibold text-gray-800 mb-2 text-sm">
              參加人數<span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="number"
              name="totalCount"
              placeholder="請填入參加人數"
              min="1"
              max={MAX_PARTICIPANTS}
              required
              disabled={isLoading}
              value={totalCount === 0 ? "" : totalCount}
              onChange={(e) => setTotalCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-600 mt-1">請填入參加本次參訪活動的總人數</p>

            {/* Insurance Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 font-semibold mb-3">
                為辦理本次活動保險事宜，請提供參與者的資訊，謝謝您的協助
              </p>

              {/* 驗證錯誤訊息 */}
              {errors.length > 0 && (
                <div className="mb-3 p-3 bg-red-50 border border-red-300 rounded-lg">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">{err}</p>
                  ))}
                </div>
              )}

              {visibleRows === 0 ? (
                <p className="text-xs text-gray-400 italic">請先填入參加人數，以顯示保險資訊填寫欄位</p>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: visibleRows }, (_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-600 mb-2">第 {i + 1} 位參與者</p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            姓名<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={participants[i].name}
                            disabled={isLoading}
                            onChange={(e) => handleParticipantChange(i, "name", e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-700 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            身分證字號<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={participants[i].idNumber}
                            disabled={isLoading}
                            onChange={(e) => handleParticipantChange(i, "idNumber", e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-700 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            生日<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={participants[i].birthday}
                            disabled={isLoading}
                            onChange={(e) => handleParticipantChange(i, "birthday", e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-700 disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transport Info */}
          <h2 className="text-base font-semibold text-green-700 mb-5 border-b-2 border-green-100 pb-3 mt-8">🚗 參訪相關資訊</h2>
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-3 text-sm">
              交通方式<span className="text-red-600 font-bold">*</span>
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="transport1"
                  name="transport"
                  value="高鐵站接駁"
                  required
                  disabled={isLoading}
                  className="w-4 h-4 cursor-pointer accent-green-700"
                />
                <label htmlFor="transport1" className="cursor-pointer text-sm font-normal">
                  高鐵站接駁
                </label>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="radio"
                    id="transport2"
                    name="transport"
                    value="自行前往"
                    required
                    disabled={isLoading}
                    className="w-4 h-4 cursor-pointer accent-green-700"
                  />
                  <label htmlFor="transport2" className="cursor-pointer text-sm font-normal">
                    自行前往（請填入車號）
                  </label>
                </div>
                <div className="ml-7">
                  <input
                    type="text"
                    name="carNumber"
                    placeholder="請輸入車號"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meal Preferences */}
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-3 text-sm">
              午餐用餐需求<span className="text-red-600 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 gap-5">
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    name="mealType"
                    value="meat"
                    disabled={isLoading}
                    className="w-4 h-4 cursor-pointer accent-green-700"
                  />
                  <span className="text-sm font-medium">葷食</span>
                </label>
                <input
                  type="number"
                  name="meatCount"
                  placeholder="人數"
                  min="0"
                  defaultValue="0"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                />
              </div>
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    name="mealType"
                    value="veg"
                    disabled={isLoading}
                    className="w-4 h-4 cursor-pointer accent-green-700"
                  />
                  <span className="text-sm font-medium">素食</span>
                </label>
                <input
                  type="number"
                  name="vegCount"
                  placeholder="人數"
                  min="0"
                  defaultValue="0"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">請勾選並填入人數，葷食 + 素食人數應等於總參加人數</p>
          </div>

          {/* Special Needs */}
          <h2 className="text-base font-semibold text-green-700 mb-5 border-b-2 border-green-100 pb-3 mt-8">💬 特殊需求</h2>
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-2 text-sm">
              是否有特殊需求或備註？
            </label>
            <textarea
              name="note"
              placeholder="如有其他需求或特殊狀況，請在此說明（選擇性填答）"
              rows={3}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 resize-none disabled:bg-gray-100"
            />
          </div>

          {/* Contact Info */}
          <h2 className="text-base font-semibold text-green-700 mb-5 border-b-2 border-green-100 pb-3 mt-8">📞 聯絡人資訊</h2>
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-2 text-sm">
              聯絡人姓名<span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              placeholder="請輸入聯絡人姓名"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-2 text-sm">
              聯絡人電話<span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="例: 02-1234-5678 或 0912-345-678"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-2 text-sm">
              聯絡人信箱<span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@company.com"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* 送出失敗提示 */}
          {submitStatus === "error" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-600">⚠️ {errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  送出中，請稍候...
                </>
              ) : (
                "✓ 送出報名"
              )}
            </button>
            <button
              type="reset"
              disabled={isLoading}
              onClick={handleReset}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              清除
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-4 text-center">
            ✓ 表單提交後將保存到 Google Sheet，請檢查信箱獲取確認信
          </p>
        </form>
      </div>
    </div>
  );
}
