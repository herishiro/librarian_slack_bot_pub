// スクリプトプロパティから Verification Token を読み込む
const verificationToken = scriptProps.getProperty("verificationToken")
const slackToken = scriptProps.getProperty("slackToken")
const libraryChannelId = scriptProps.getProperty("libraryChannelId")
const botAdminUserId = scriptProps.getProperty("botAdminUserId")

// Slack からの POST リクエストをハンドリングする関数
function doPost(e) {
  // @ts-ignore:next-line
  const slackApp = SlackApp.create(slackToken);
  try {
    if (typeof e.postData === "undefined") return ack("invalid request");
    if (e.postData.type !== "application/json") return ack("");

    const payload = JSON.parse(e.postData.getDataAsString())
    console.log(`Incoming payload: ${JSON.stringify(payload, null, 2)}`);

    if (payload.token !== verificationToken) {
      console.log(
        `Invalid verification token detected (actual: ${payload.token}, expected: ${verificationToken})`
      );
      return ack("invalid request");
    }

    if (typeof payload.challenge !== "undefined") {
      // Events API を有効にしたときの URL 検証リクエストへの応答
      return ack(payload.challenge);
    }

    const pl = payload as MentionedPayload
    console.log(`Events API payload: ${JSON.stringify(payload)}`);

    if (typeof pl.event.channel === "undefined") return ack("");

    const query = pl.event.blocks.reduce((_, curBlock) => {
      return curBlock.elements.reduce((_, curElms) => {
        return curElms.elements.reduce((prev, curElm) => {
          return curElm.type === 'text' ? curElm.text : prev
        }, "")
      }, "")
    }, "")

    const result = searchBookByTitle(query.trim())
    const isBlocks = typeof result !== 'string'
    const plainText = !isBlocks ? result : '司書Botからの通知です'
    console.log('result', result)


    const res = slackApp.chatPostMessage(pl.event.channel, plainText, {
      blocks: isBlocks ? JSON.stringify(result) : undefined,
      username: "アルサーガ司書",
    });
    console.log('slack response', res)
  } catch (error) {
    const errorMessage =
      `検索中に下記のエラーが発生しました！\n` +
      `<@${botAdminUserId}> は早めに対応して下さいね…\n\n` +
      `\`Error Message : ${error.message}\``
    const res = slackApp.chatPostMessage(libraryChannelId, errorMessage, {
      username: "アルサーガ司書",
    });
    console.log('slack response', res)
  }
  return ack("");
}



// 200 OK を返すことでペイロードを受信したことを Slack に対して伝えます
// 基本的には空のボディで応答しますが、インタラクションの種類によっては
// ボディに何らかの情報を含めることができます
function ack(payload) {
  if (typeof payload === "string") {
    // これは "" かチャンネル内でのシンプルなメッセージ応答のパターンです
    return ContentService.createTextOutput(payload);
  } else {
    // チャンネル内での応答の場合はボディに返信メッセージ内容を含めることができます
    // view_submission への応答の場合は response_action などを含めることもできます
    return ContentService.createTextOutput(JSON.stringify(payload));
  }
}

function doGet(e) {
  doPost(e);
}

type MentionedPayload = {
  token: string;
  team_id: string;
  api_app_id: string;
  type: string; //"event_callback"
  event_id: string; //"Ev02PJUUQ0EP"
  event_time: number;  //1638685298
  event: {
    client_msg_id: string; //"3efbcb5a-e678-4a28-8338-1704790b4734"
    type: "app_mention";
    text: string;
    user: string;
    ts: string; //"1638685298.006600",
    team: string;
    blocks: Block[]
    channel: string;
    event_ts: string; //"1638685298.006600"
  };

  authorizations: [
    {
      enterprise_id: null;
      team_id: "T01EWD87BLY";
      user_id: "U02PJ1CAP6X";
      is_bot: true;
      is_enterprise_install: false;
    }
  ];
  is_ext_shared_channel: false;
  event_context: "4-eyJldCI6ImFwcF9tZW50aW9uIiwidGlkIjoiVDAxRVdEODdCTFkiLCJhaWQiOiJBMDJQM0FFMkMwNyIsImNpZCI6IkMwMUUxTkFKNjNZIn0";
};

type Block = {
  type: string;  //"rich_text"
  block_id: string;  //"EKz",
  elements: BlockElement[]
}

type BlockElement = {
  type: string; // "rich_text_section",
  elements: {
    type: "user" | "text";
    text?: string;
    user_id?: string;
  }[]
}