const BACKEND_URL = "https://word-hunting.onrender.com";

/**
 * ゲーム開始：サーバーに新しいお題を作成させる
 */
async function startGame(userId) {
  try {
    const response = await callBackendAPI(0, "", "", userId);

    if (!response || !response.success || !response.id) {
      throw new Error("サーバーからの返答が不正です");
    }

    currentSessionId = response.id;

    return { success: true, sessionId: currentSessionId };
  } catch (error) {
    console.error("ゲーム開始でエラー:", error);
    return { success: false, sessionId: null };
  }
}

/**
 * 質問に対してAIが○×で答える
 * @param {string} question - プレイヤーからの質問
 * @param {string} sessionId - startGame で取得したセッションID
 */
async function askQuestion(question, sessionId) {
  try {
    const response = await callBackendAPI(1, question, sessionId, null);

    if (!response || !response.success || !response.answer) {
      throw new Error("サーバーからの返答が不正です");
    }

    return { success: true, answer: response.answer.trim() };
  } catch (error) {
    console.error("質問でエラー:", error);
    return { success: false, answer: "通信に失敗しました" };
  }
}

/**
 * OpenAI APIを呼び出す共通関数
 * @param {number} prompt - AIに送るメッセージ
 * @param {string} Q - プレイヤーからの質問
 * @param {string} session_id
 * @param {string} userId
 */
async function callBackendAPI(prompt, Q, session_id, userId) {
  // fetch()でAPIにリクエストを送信
  const response = await fetch(BACKEND_URL + "/api/openai", {
    method: "POST", // POSTメソッドでデータを送信
    headers: {
      "Content-Type": "application/json", // JSONデータを送ることを明示
    },
    body: JSON.stringify({ prompt, Q, session_id, userId }), // リクエストボディにJSON形式でデータを設定
  });

  // レスポンスが成功かチェック
  if (!response.ok) {
    throw new Error(`API エラー: ${response.status} ${response.statusText}`);
  }

  // レスポンスをJSONとして解析
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  return data;
}
