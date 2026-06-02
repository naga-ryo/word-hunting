import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import fetch from "node-fetch"; // node-fetch@2 を使う場合

const app = express();

const corsOptions = {
  origin: "https://naga-ryo.github.io", // 自分の GitHub Pages だけ許可
  methods: ["POST"],
};

app.use(cors(corsOptions));

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // ← サーバー用の安全なキー
);

// OpenAI API 共通呼び出し関数
async function callOpenAI(prompt, temperature = 0.7, max_completion_tokens = 40) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5.1",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens,
      temperature,
    }),
  });
  const data = await res.json();
  if (!data?.choices?.[0]?.message?.content)
    throw new Error("OpenAIから不正な応答");
  return data.choices[0].message.content.trim();
}

function createPrompt(type, log, theme, hira, question){
  let prompt = null;
  if(type === 1){
    prompt = `
    次のカテゴリのうちの1つを、**無作為に選んで**ください。
    そのカテゴリに該当する、日本人の多くが知っている「名詞」を1つだけ思い浮かべてください。（例示しているものである必要はありません）

    【カテゴリ】
    - 歴史上の人物（例：「織田信長」「坂本龍馬」「紫式部」）
    - 有名人・国民的キャラクター（例：「ドラえもん」「ピカチュウ」「イチロー」）
    - 職業・役割（例：「医者」「教師」「警察官」「大工」）
    - 日用品・身の回り品（例：「椅子」「傘」「財布」「スマートフォン」）
    - 家電・機械・道具（例：「冷蔵庫」「パソコン」「望遠鏡」「掃除機」）
    - 乗り物
      - 陸（例：「自動車」「自転車」「バス」）
      - 海（例：「船」「ヨット」「潜水艦」）
      - 空（例：「飛行機」「ヘリコプター」「気球」）
    - 動物（例：「犬」「ゾウ」「カンガルー」）
    - 鳥類（例：「スズメ」「カラス」「フクロウ」）
    - 昆虫（例：「カブトムシ」「チョウ」「トンボ」）
    - 海の生き物（例：「イルカ」「サメ」「タコ」「クジラ」）
    - 植物・花（例：「桜」「ひまわり」「松」「竹」）
    - 食べ物（例：「寿司」「ラーメン」「カレー」「おにぎり」）
    - 果物（例：「りんご」「みかん」「バナナ」「スイカ」）
    - 飲み物（例：「お茶」「コーヒー」「ジュース」「コーラ」）
    - 国・地域（例：「日本」「アメリカ」「フランス」）
    - 都市・地名（例：「東京」「大阪」「京都」「ニューヨーク」）
    - 有名な建物・人工物（例：「東京タワー」「金閣寺」「エッフェル塔」）
    - 自然の場所・地形（例：「山」「川」「森」「海」）
    - 伝統文化・年中行事（例：「着物」「歌舞伎」「正月」「盆踊り」）
    - スポーツ・競技（例：「野球」「サッカー」「剣道」「卓球」）
    - 音楽・芸能（例：「ピアノ」「ギター」「太鼓」「オーケストラ」）
    - 映画・アニメ・ゲーム作品（例：「ジブリ」「鬼滅の刃」「ポケモン」）
    - 趣味・娯楽（例：「旅行」「読書」「釣り」「キャンプ」）
    - 学問・科目（例：「数学」「物理」「歴史」「化学」）
    - 天体・自然現象（例：「太陽」「月」「星」「台風」「地震」）
    - 有名ブランド・製品（例：「任天堂」「ユニクロ」「レゴ」）
    - その他：日本人が一般的に知っているその他の名詞

    【制約ルール】
    - 出力は「**1語の名詞**」のみ（例：「先生」「パンダ」「音楽」）
    - **説明・カテゴリ名などは一切出力しない**
    - **英数字・記号は禁止**
    - **助詞や複数語は禁止（例：「綺麗な花」「窓を開ける」などはNG）**
    - 日本にあるものに限る必要はありませんが、**日本人の多くが知っている語**にしてください
    - **抽象的な概念や難解な語は避けてください**（例：「情報」「考え」）
    - 丁寧語や敬語がつく語は避けてください（例：「お父さん」「お弁当」）
    - **個人レベルの固有名詞は厳禁**（例：「田中さん」「山田くん」「近所のスーパー」）
    - **極端にマイナーで知られていない作品名や地名は厳禁**（例：「無名の地方キャラ」「小さな村の名前」）
    - **意味が曖昧で連想できない語は厳禁**（例：「存在」「もの」「こと」など）
    - **形容詞などを名詞化した語は避けてください**（例：「やさしさ」「かたさ」）
    - 漢字・ひらがな・カタカナの一般的表記にしてください
    - ${log}は最近使用されたため避けてください
    - 最近使用された${log}と同一カテゴリまたは似たジャンルは出来るだけ避けてください
    - 一般的な日本人が理解する程度の言葉ならなんでもいいですが、**意味が明確に伝わる語**にしてください

    🎯【出力形式】
    - 出力は「名詞1語」のみ。
    - その他の文字・記号・説明は一切禁止です。

    では、実行してください。
    `;
  }else if(type === 3){
    prompt = `
    あなたの役割：以下の条件に厳密に従い、"名詞を1語だけ" 出力してください。
    目的：お題当てゲームのためのお題（日本人の全員に知られているが、お題としては思い浮かびにくい名詞）を**無作為に1つ選ぶ**こと。
    
    1) 出力ルール（絶対遵守）
    - 出力は**「名詞1語」だけ**（改行も含め、それ以外の文字を一切出力しない）。
    - 先頭・末尾に空白を入れないこと。
    - 英数字、記号、括弧、引用符、句点・読点（。、）、空白は一切禁止。
    - 使用できる文字は日本語および伸ばし棒（ー）のみとする。
    - **名詞として意味が一つに定まる語**とする。
    - 漢字表記される名詞は必ず標準的な漢字表記で出力する。
    - 固有名詞やカタカナ語はそのままカタカナ/ひらがなでよい。
    - 複合語・句（空白や助詞でつながったもの）は禁止。
    - 敬称（〜さん、〜くん等）や接頭辞（お〜）はつけない。
    - 出力は必ず**単語（名詞）として意味の通る語**とする。
    
    2) 許容／不許容の例（参考）
    - 【許容】「換気扇」「将棋」「サンタクロース」「高速道路」「カーテン」  
    - 【不許容】「こと」「存在」「ドラえもん。」（句点あり）「テレビ 2台」（数字・空白）「らい」（漢字の音読みのみ）
    
    3) 固有名詞について
    - 歴史上の人物、有名人・国民的キャラクター・有名作品名・有名地名・広く知られたブランド等は許容する。
    - 一般人や個人レベルの固有名詞、ローカル/マイナーな固有名詞は出さない。
    - 「有名かどうか」が判断に迷う場合は出力を控える。
    
    4) 意味・抽象度の制約
    - 抽象的・概念的すぎる語（例：「情報」「概念」「存在」など）は避ける。
    - 具体的に想像できる「物・人物・場所・事象・生物・作品名・技術・伝統文化など」を選ぶ。
    - 思い浮かべにくい語を選ぶにあたって、**専門的な知識などが必要な難しい語を選ぶことは禁止**。
    
    5) recent avoidance（直近採用回避）
    - 変数 ${log} に含まれる語（直近30件）は**避ける**。
    - なるべく直近ログ ${log} と**カテゴリが異なる**ものを選ぶよう努める。
    
    以上の条件に従って、**無作為に1語の名詞（日本人全員が知っているがお題としては思い浮かべにくいやつ）**だけを出力してください。`;
  }else if(type === 2){
    prompt = `
    あなたの役割：以下の条件に厳密に従い、"名詞を1語だけ" 出力してください。
    目的：お題当てゲームのためのお題（日本人に広く知られている名詞）を**無作為に1つ選ぶ**こと。

    1) 出力ルール（絶対遵守）
    - 出力は**「名詞1語」だけ**（改行も含め、それ以外の文字を一切出力しない）。
    - 先頭・末尾に空白を入れないこと。
    - 英数字、記号、括弧、引用符、句点・読点（。、）、空白は一切禁止。
    - 使用できる文字は日本語および伸ばし棒（ー）のみとする。
    - **名詞として意味が一つに定まる語**とする。
    - 一般的に漢字表記される名詞は必ず標準的な漢字表記で出力する。
    - 固有名詞やカタカナ語など通常ひらがな・カタカナで書かれる語はそのままカタカナ/ひらがなでよい。
    - 複合語・句（空白や助詞でつながったもの）は禁止（例：「きれいな花」「窓を開ける」はNG）。
    - 敬称（〜さん、〜くん等）や接頭辞（お〜）はつけない。
    - 出力は必ず**単語（名詞）として意味の通る語**とする。

    2) 許容／不許容の例（参考）
    - 【許容】「猫」「ピカチュウ」「東京」「リンゴ」「音楽」  
    - 【不許容】「おとうさん」「たなかさん」「ドラえもん。」（句点あり）「テレビ 2台」（数字・空白）「存在」「こと」（抽象的すぎる）「らい」(漢字の音読みなど部分読みのみ)

    3) 固有名詞について
    - 歴史上の人物、有名人・国民的キャラクター・有名作品名・有名地名・広く知られたブランド等は許容する（例：「織田信長」「ドラえもん」「東京」「ポケモン」）。
    - 一般人や個人レベルの固有名詞、極端にローカル/マイナーな固有名詞は出さない（例：「田中さん」「○○商店」などはNG）。
    - 「有名かどうか」が判断に迷う場合は出力を控える（＝無理にマイナー語を出さない）。

    4) 意味・抽象度の制約
    - 抽象的・概念的すぎる語（例：「存在」「こと」「情報」など）は避ける。
    - 具体的に想像できる「物・人物・場所・事象・生物・作品名など」を選ぶ。

    5) recent avoidance（直近採用回避）
    - 変数 ${log} に含まれる語（直近の30件）は**避ける**こと。  
    - なるべく直近ログ ${log} と**カテゴリが異なる**ものを選ぶよう努めよ（完全に別カテゴリにできない場合は語自体を避ける）。

    以上の条件に従って、**無作為に1語の名詞**だけを出力してください。`;
  }else if(type === 4){
    prompt = `
    「${theme}」は日本語の名詞です。
    「${theme}」を、ひらがなに変換して出力してください。

    【制約】
    - 出力は「ひらがなに直した1語」のみ。
    - すでにひらがなであれば、そのまま出力してください。
    - 漢字やカタカナの場合は、日本語で一般的に使われる名詞として自然な形にひらがなへ変換してください。
      - 例：「雷」→「かみなり」, 「犬」→「いぬ」, 「東京」→「とうきょう」, 「ピアノ」→「ぴあの」
    - 部分的な読みや、漢字1字に対応する音読みや訓読みだけを出力するのは禁止。
      - 例：「雷」を「らい」としてはいけません。
    - 出力は変換後の「ひらがなに直した1語」だけ。それ以外の文字・説明・記号は禁止。
    `;
  }else if(type === 5){
    prompt = `
    あなたは「ある対象」についての質問に答える役割です。
    
    ユーザーは質問を通して、その対象が何であるかを特定しようとしています。
    あなたはその対象についての情報を正確に理解しており、質問に対して事実に基づいて回答します。
    
    【対象の情報】
    ・対象：${theme[0]}
    ・これは日本語の名詞です
    ・ひらがな表記：${theme[1]}
    ・ひらがなでの文字数：${hira}文字
    
    ━━━━━━━━━━━━━━━━━━
    【回答形式（最重要）】
    
    回答は必ず以下の7つのうちのどれか1つのみを出力してください：
    
    「はい」
    「いいえ」
    「たぶんそう」
    「部分的にそう」
    「たぶん違う」
    「そうでもない」
    「わかりません」
    
    これ以外の文字・説明・記号は絶対に出力してはいけません。
    必ず1語のみ出力してください。
    
    ━━━━━━━━━━━━━━━━━━
    【基本ルール】
    
    ・常に対象「${theme[0]}」の事実に基づいて回答してください
    ・推測ではなく、一般的に正しいとされる知識を優先してください
    ・質問の意図を正しく理解して回答してください
    
    可能な限り以下を優先してください：
    
    明確に正しい → 「はい」
    明確に誤り → 「いいえ」
    
    明確ではないがおそらく正しい → 「たぶんそう」
    一部のみ一致する → 「部分的にそう」
    
    完全に誤りではないが否定的 → 「そうでもない」
    明確ではないがおそらく誤り → 「たぶん違う」
    
    「わかりません」は本当に判断できない場合のみ使用してください。
    
    ━━━━━━━━━━━━━━━━━━
    【文字数に関する特別ルール】
    
    文字数について質問された場合：
    
    ■ひらがなの文字数について
    ・${hira}文字と一致する → 「はい」
    ・一致しない → 「いいえ」
    
    ■ひらがな以外（漢字・カタカナ・英語など）の文字数
    → 「わかりません」
    
    ■「〇文字以上」「〇文字以下」
    → ひらがな文字数 ${hira} を基準に判断して回答してください
    
    ━━━━━━━━━━━━━━━━━━
    【対象に無関係な質問】
    
    対象「${theme[0]}」と無関係な質問には：
    → 「わかりません」
    
    ━━━━━━━━━━━━━━━━━━
    【曖昧な質問への対応】
    
    質問の意味が曖昧でも、
    合理的に解釈可能であれば回答してください。
    
    完全に意味不明な場合のみ：
    → 「わかりません」
    
    ━━━━━━━━━━━━━━━━━━
    【最重要判断方針】
    
    次の優先順位で回答してください：
    
    1. 明確に判断できる → 「はい」または「いいえ」
    2. 概ね判断できる → 「たぶんそう」「たぶん違う」
    3. 一部のみ該当 → 「部分的にそう」「そうでもない」
    4. 本当に不明 → 「わかりません」
    
    「わかりません」は最後の手段です。
    
    ━━━━━━━━━━━━━━━━━━

    【ユーザーからの質問】
    \`\`\`
    ${question}
    \`\`\`
    `;
  }

  return prompt;
}

function hasInvalidChars(str) {
    return /[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\u30FC]/u.test(str);
}

function hasInvalidChars2(str) {
    return /[^\p{Script=Hiragana}\u30FC]/u.test(str);
}

// --- 入力サニタイズ --- 
function escapeForPrompt(str) {
  return str
    .slice(0, 100)                           // 長さ制限
    .replace(/[\p{C}\p{Zl}\p{Zp}]/gu, ' ')          // 制御文字・不可視スペースをスペース化
    .replace(/\\/g, '\\\\')                        // バックスラッシュ
    .replace(/`/g, '\\`')                           // バッククォート
    .replace(/\$/g, '\\$')                          // $
    .replace(/\r?\n/g, ' ')                         // 改行→スペース
    .trim();
}

function validateAnswer(ans) {
  const allow = /^(はい|いいえ|たぶんそう|部分的にそう|たぶん違う|そうでもない|わかりません)$/u;
  return allow.test(ans) ? ans : null;
}

// 直近 N 件の correct_answer を取得
async function getRecentCorrectAnswers(limit = 30) {
  const { data, error } = await supabase
    .from("sessions")
    .select("correct_answer")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(r => r.correct_answer);
}

// 新しいセッションを作成して ID を返す
async function insertSession(originalWord, hiraWord) {
  const { data, error } = await supabase
    .from("sessions")
    .insert([{ correct_answer: originalWord, theme_hiragana: hiraWord }])
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// セッションIDでお題を取得
async function getSessionById(sessionId) {
  const { data, error } = await supabase
    .from("sessions")
    .select("correct_answer, theme_hiragana")
    .eq("id", sessionId)
    .single();

  if (error || !data) throw new Error("該当セッションなし");
  return data;
}

// 質問と回答を保存
async function insertQuestion(sessionId, question, response) {
  const { error } = await supabase
    .from("questions")
    .insert([{ session_id: sessionId, question, response }]);

  if (error) throw error;
}

// AI使うやつ
app.post("/api/openai", async (req, res) => {
  try {
    const { prompt, Q, session_id, userId } = req.body;

    // --- 1️⃣ お題生成 & ひらがな変換 & 保存 ---
    if (prompt === 0) {
      const rand = Math.random();
      const typeOfPrompt = rand < 0.45 ? 1 : rand < 0.90 ? 2 : 3;

      const themeLog = await getRecentCorrectAnswers(30);
      const themePrompt = createPrompt(typeOfPrompt, themeLog, null, null, null);
      const originalWord = await callOpenAI(themePrompt, 1.5, 40);

      if (hasInvalidChars(originalWord)) {
        return res.status(400).json({ error: "不正なお題" });
      }

      const hiraPrompt = createPrompt(4, null, originalWord, null, null);
      const hiraWord = await callOpenAI(hiraPrompt, 0, 40);

      if (hasInvalidChars2(hiraWord)) {
        return res.status(400).json({ error: "不正なお題" });
      }

      const sessionId = await insertSession(originalWord, hiraWord);

      if (userId) {
        try {
          const { data: user } = await supabase
            .from("account")
            .select("play_count")
            .eq("id", userId)
            .maybeSingle();

          if (user) {
            const newPlayCount = (parseInt(user.play_count) || 0) + 1;
            await supabase
              .from("account")
              .update({ play_count: newPlayCount })
              .eq("id", userId);
          }
        } catch {
        }
      }

      return res.json({ success: true, id: sessionId });
    }

    // --- 2️⃣ 質問対応 ---
    else if (prompt === 1) {
      const sessionRow = await getSessionById(session_id);
      const { correct_answer, theme_hiragana } = sessionRow;
      const count = [...theme_hiragana.normalize("NFC")].length;

      const safeQustion = escapeForPrompt(Q);
      if(safeQustion.length > 50){
        return res.status(400).json({ success: false, error: '不正な質問' });
      }
      const questionPrompt = createPrompt(5, null, [correct_answer,theme_hiragana], count, safeQustion);
      const answer = await callOpenAI(questionPrompt, 0, 40);
      const checkedAnswer = validateAnswer(answer.trim());

      if (checkedAnswer == null) {
        return res.status(400).json({ success: false, error: '不正回答' });
      }

      try {
        await insertQuestion(session_id, Q, checkedAnswer);
      } catch (err) {
        console.error("質問保存エラー:", err);
      }

      return res.json({ success: true, answer });
    }

    else {
      return res.status(400).json({ success: false, error: "不正なリクエスト" });
    }

  } catch (err) {
    console.error("APIエラー:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 最終回答追加
app.post("/update-session", async (req, res) => {
  const { sessionId, finalGuess, playTime, userId } = req.body;

  // ① final_guess と play_time を更新
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ final_guess: finalGuess, play_time: playTime, history_permission: true })
    .eq("id", sessionId);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  let usedHint = false;
  // ② correct_answer を取得して比較
  const { data, error: selectError } = await supabase
    .from("sessions")
    .select("correct_answer, theme_hiragana, final_guess, hint")
    .eq("id", sessionId)
    .single();

  if (selectError) {
    return res.status(500).json({ error: selectError.message });
  }

  // ③ 一致しているか判定
  const isCorrect = (data.final_guess.trim() === data.theme_hiragana.trim());

  if(data.hint){
    usedHint = true;
  }

  // ④ 正解ならアカウント操作
  if (isCorrect && userId) {
    (async () => {
      try {
        const { data: user, error: fetchError } = await supabase
          .from("account")
          .select("correct_count")
          .eq("id", userId)
          .maybeSingle();
        if (fetchError || !user) return;

        const newCorrectCount = (parseInt(user.correct_count) || 0) + (usedHint ? 0.5 : 1);
        await supabase
          .from("account")
          .update({ correct_count: newCorrectCount })
          .eq("id", userId);
      } catch {
      }
    })();
  }

  // ⑤ 判定結果を返す
  res.json({
    success: true,
    answer: data.correct_answer,
    isCorrect
  });
});

// ヒント追加
app.post("/add-hint", async (req, res) => {
  const { sessionId, hintNumber } = req.body;

  try {
    const { data: sessionRow, error: fetchErr } = await supabase
      .from("sessions")
      .select("theme_hiragana, hint")
      .eq("id", sessionId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!sessionRow) {
      return res.status(404).json({ success: false, error: "指定されたセッションが存在しません" });
    }

    if (sessionRow.hint) {
      return res.status(400).json({ success: false, error: "ヒントは既に追加されています" });
    }

    const text = sessionRow.theme_hiragana;
    const chars = [...text.normalize("NFC")];
    const pos = Math.floor(Math.random() * chars.length);
    const hintText = `${pos + 1}番目の文字は「${chars[pos]}」です`;

    const { error: updateErr } = await supabase
      .from("sessions")
      .update({
        hintPosition: hintNumber,
        hint: hintText
      })
      .eq("id", sessionId);

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      hint: hintText
    });

  } catch (err) {
    console.error("add-hint エラー:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 履歴取得（ページネーション）
app.get("/get-recent-sessions", async (req, res) => {
  const after = req.query.after || null;
  const userId = req.query.id;

  // セッション履歴取得
  const { data, error } = await supabase.rpc("fetch_magic_sessions", {
    p_limit: 15,
    p_after: after
  });

  if (error) return res.status(500).json({ error: error.message });

  // アカウント存在チェック
  let hasAccount = false;
  if (userId) {
    const { data: existingUser, error: selectError } = await supabase
      .from("account")
      .select()
      .eq("id", userId)
      .maybeSingle();

    if (selectError) {
      return res.status(500).json({ error: "エラー" });
    }
    hasAccount = !!existingUser;
  }

  const sanitized = data.map((item, index) => {
    const isLast = index === data.length - 1;
    const { created_at, ...rest } = item;

    let safeRest;

    if (hasAccount) {
      safeRest = rest;
    } else {
      safeRest = {
        ...rest,
        questions: rest.questions.map(q => ({
          question: "",
          response: ""
        }))
      };
    }

    return isLast ? { ...safeRest, created_at } : safeRest;
  });

  res.json(sanitized);
});

// 人気のお題を取得
app.get("/get-popular-answers", async (req, res) => {
  const { data, error } = await supabase.rpc("get_popular_answers");

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// アカウント作成
app.post("/create-account", async (req, res) => {
  const { user_name, password } = req.body;

  // 入力チェック
  if (!user_name || !password) {
    return res.status(400).json({ error: "user_name と password は必須です" });
  }

  // 既存ユーザー確認
  const { data: existingUser, error: selectError } = await supabase
    .from("account")
    .select("id")
    .eq("user_name", user_name)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({ error: "登録エラー" });
  }

  if (existingUser) {
    return res.status(400).json({ error: "使用済" });
  }

  try {
    // パスワードをハッシュ化（ソルトラウンドは10）
    const hashedPassword = await bcrypt.hash(password, 10);

    // 新規ユーザー追加
    const { data: user, error } = await supabase
      .from("account")
      .insert([{ user_name, password: hashedPassword }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "登録エラー" });
    }

    res.json({ id: user.id, user_name: user.user_name });

  } catch (err) {
    res.status(500).json({ error: "登録エラー" });
  }
});

// ログイン
app.post("/login", async (req, res) => {
  const { user_name, password } = req.body;

  // 入力チェック
  if (!user_name || !password) {
    return res.status(400).json({ error: "user_name と password は必須です" });
  }

  // ユーザー取得
  const { data: user, error: selectError } = await supabase
    .from("account")
    .select("id, user_name, password")
    .eq("user_name", user_name)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({ error: selectError.message });
  }

  if (!user) {
    return res.status(400).json({ error: "不正" });
  }

  try {

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "不正" });
    }

    // 認証成功
    res.json({ id: user.id, user_name: user.user_name });

  } catch (err) {
    res.status(500).json({ error: "認証エラー" });
  }
});

function updateLevel(correctCount) {
    let level = null;
    const c = parseInt(correctCount);

    if (c <= 2)      level = "Lv.1 見習いハンター";
    else if (c <= 4)  level = "Lv.2 ひよっこハンター";
    else if (c <= 9)  level = "Lv.3 若きハンター";
    else if (c <= 19) level = "Lv.4 中堅ハンター";
    else if (c <= 29) level = "Lv.5 熟練ハンター";
    else if (c <= 39) level = "Lv.6 エリートハンター";
    else if (c <= 59) level = "Lv.7 伝説のワードハンター";
    else if (c <= 79) level = "Lv.8 究極のワードハンター";
    else if (c <= 99)level = "Lv.9 ワードハンティング王";
    else if (c >= 100) level = "Lv.10 ワードハンティング超越者";

    return level;
}

// アカウント情報取得
app.get("/account-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("account")
      .select("user_name, play_count, correct_count, display_permission, accuracy_display_permission")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    if (!data) {
      return res.status(404).json({ success: false, error: "ユーザーが見つかりません" });
    }

    res.json({
      success: true,
      name: data.user_name,
      level: updateLevel(data.correct_count),
      play_count: data.play_count,
      correct_count: data.correct_count,
      display_permission: data.display_permission,
      accuracy_display_permission: data.accuracy_display_permission
    });

  } catch (err) {
    console.error("account-stats エラー:", err);
    res.status(500).json({ success: false, error: "サーバーエラー" });
  }
});


// ランキング情報取得
app.get("/account-ranking", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("account")
      .select("user_name, play_count, correct_count, accuracy_display_permission")
      .eq("display_permission", true)
      .limit(100)
      .order("correct_count", { ascending: false })
      .order("play_count", { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: "ユーザーが見つかりません" });
    }

    // 各ユーザーに正答率とレベルを付与
    const rankingWithLevels = data.map(user => {
      const play = user.play_count || 0;
      const correct = user.correct_count || 0;
      const rate = play > 0 ? correct / play : 0;

      // 非公開フラグのチェック
      const userName  = user.user_name;
      const accuracy  = user.accuracy_display_permission  ? Math.round(rate * 1000) / 10 : "非公開";

      return {
        user_name: userName,
        accuracy: accuracy,
        level: updateLevel(correct)
      };
    });

    res.json({
      success: true,
      ranking: rankingWithLevels
    });

  } catch (err) {
    console.error("account-ranking エラー:", err);
    res.status(500).json({ success: false, error: "サーバーエラー" });
  }
});

// ランキング設定更新
app.post("/update-ranking-setting", async (req, res) => {
  const { userId, newPolicy } = req.body;
  if (!userId) return res.status(400).json({ error: "userId は必須です" });
  if (!newPolicy) return res.status(400).json({ error: "newPolicy は必須です" });
  
  let permission1 = null;
  let permission2 = null;
  if(newPolicy === "none"){
    permission1 = false;
    permission2 = false;
  }else if(newPolicy === "name"){
    permission1 = true;
    permission2 = false;
  }else if(newPolicy === "accuracy"){
    permission1 = true;
    permission2 = true;
  }else{
    return res.status(400).json({ error: "不正" });
  }

  try {
    const { data, error: updateError } = await supabase
      .from("account")
      .update({ display_permission: permission1, accuracy_display_permission: permission2 })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: "更新エラー"});
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "更新エラー " });
  }
});

// ユーザー名更新
app.post("/update-name", async (req, res) => {
  const { userId, new_user_name } = req.body;
  if (!userId) return res.status(400).json({ error: "userId は必須です" });
  if (!new_user_name) return res.status(400).json({ error: "new_user_name は必須です" });

  // 既存ユーザー確認
  const { data: existingUser, error: selectError } = await supabase
    .from("account")
    .select("id")
    .eq("user_name", new_user_name)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({ error: "更新エラー" });
  }

  if (existingUser) {
    return res.status(400).json({ error: "使用済" });
  }

  try {
    const { data, error: updateError } = await supabase
      .from("account")
      .update({ user_name: new_user_name })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: "更新エラー" });
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "更新エラー " });
  }
});

// パスワード更新
app.post("/update-password", async (req, res) => {
  const { userId, new_password } = req.body;
  if (!userId) return res.status(400).json({ error: "userId は必須です" });
  if (!new_password) return res.status(400).json({ error: "new_password は必須です" });

  const hashedPassword = await bcrypt.hash(new_password, 10);
  try {
    const { data, error: updateError } = await supabase
      .from("account")
      .update({ password: hashedPassword })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: "更新エラー"});
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "更新エラー " });
  }
});

// アカウント削除
app.post("/delete-account", async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "id が必要です" });

  const { data, error } = await supabase
    .from("account")
    .delete()
    .eq("id", id)
    .select(); // 削除した行を返す

  if (error) {
    return res.status(500).json({ error: "削除エラー" });
  }

  if (!data.length) {
    return res.status(404).json({ error: "削除エラー" });
  }

  res.json({ success: true });
});

app.listen(process.env.PORT || 3001, () => console.log("サーバー起動"));
