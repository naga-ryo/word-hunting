let five = ["5回に到達しました", "ちょっとした節目ですね","ここまではまだ始まりといった感じですね", "まだまだ余裕のある段階です", "ここからが本番です！"];
let ten = ["ちょうど10回に到達しました", "10回目ひとつの区切りですね","10回目に入りました", "あと20回は質問できますよ", "質問内容は慎重に考えましょう"];
let fifteen = ["15回に到達しました", "ここからが後半になりますね","折り返し地点ですね", "答えがわかったら解答してくださいね", "頑張ってください！"];
let twenty = ["20回に到達しました", "質問残り10回までです","終盤に差しかかっています", "かなり進んできましたね", "残りも限られてきました"];
let twentyfive = ["25回に到達しました", "残り5回です","残り少しになりました", "大きな節目です", "質問の仕方に注意しましょう"];
let twentynine = ["質問はあと一回できます", "質問は残り一回です","もうほとんど終わりです", "頑張って当ててください！", "最後まで諦めないでください！"];

function addComment(count){
    let comment = "";
    if(count === 5){
        comment = five[Math.floor(Math.random() * five.length)];
    }else if(count === 10){
        comment = ten[Math.floor(Math.random() * ten.length)];
    }else if(count === 15){
        comment = fifteen[Math.floor(Math.random() * fifteen.length)];
    }else if(count === 20){
        comment = twenty[Math.floor(Math.random() * twenty.length)];
    }else if(count === 25){
        comment = twentyfive[Math.floor(Math.random() * twentyfive.length)];
    }else if(count === 29){
        comment = twentynine[Math.floor(Math.random() * twentynine.length)];
    }

    if(comment !== ""){
        const newComment = document.createElement("div");
        newComment.textContent = comment;
        newComment.classList.add("response");
        const comments = document.getElementById("comments");
        comments.appendChild(newComment);
        setTimeout(() => {
            comments.scrollTop = comments.scrollHeight;
        }, 0);
    }
}