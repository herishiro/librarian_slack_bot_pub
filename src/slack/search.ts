type RecordRow = [
  title: string,
  libType: "非電子書籍" | "電子書籍",
  pdfUrl: string,
  barrower: string,
  author: string,
  publishedDate: Date | string | number,
  description: string,
  apiThumbnail: string
];

function searchBookByTitle(keyword: string) {
  const shelfSh =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("bookShelf");
  const dataRange = shelfSh.getDataRange();
  const table = dataRange.getValues() as RecordRow[];
  table.shift(); //ヘッダー行を削除

  if (keyword.length < 2) return "2文字以上で検索してください！"

  const matchedRecords = table.filter((record) => {
    let title = record[0];
    if (typeof title === "string") title = title.normalize()
    const regExp = new RegExp(`${keyword}`, "i");
    return regExp.test(title);
  });

  if (!matchedRecords.length) return makeNoBookMessage();

  const postString = makeMassageBlocks(matchedRecords, keyword);
  return postString;
}


const makeMassageBlocks = (records: RecordRow[], keyword: string) => {
  let headerText = `「${keyword}」をタイトルに含む本に`
  if (records.length <= 10) {
    headerText = headerText + `${records.length}件の該当がありました。`
  } else {
    headerText = headerText + `10件以上の該当があったため、最初の10件だけを表示しています。`
    records = records.slice(0, 10)
  }
  headerText = headerText + `\n非電子書籍を借りる時は<https://docs.google.com/spreadsheets/d/********************|このシート>の貸出者を更新しておいてくださいね！`
  const bookListBlocks = makeBookListBlocks(records)
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: headerText,
      },
    },
    {
      type: "divider",
    },
    ...bookListBlocks
  ];
};

const makeBookListBlocks = (records: RecordRow[]) => {
  return records.reduce((acc, rec) => {
    const publishedDate = ['string', 'number'].includes(typeof rec[5]) ?
      rec[5] : Utilities.formatDate(new Date(rec[5]), "JST", 'YYYY-MM-dd')
    const bookInfo = `*${rec[0]}*\n\`${rec[1]}\`\n著者：${rec[4]}      出版日：${publishedDate}`;
    const shelfInfo = rec[1] === '電子書籍' ?
      `\n\n*<${rec[2]}|PDFでこの本を読む>*` : `\n\n貸出者：${rec[3]}`
    const text = bookInfo + shelfInfo
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
        accessory: rec[7] ? {
          type: "image",
          image_url: rec[7],
          alt_text: rec[0],
        } : undefined,
      },
      {
        type: "divider",
      },
    ];
    return [...acc, ...blocks]
  }, []);
}

const makeNoBookMessage = () => {
  return `該当する本はありませんでした… :leaves:` +
    `\n\n` +
    `<https://docs.google.com/spreadsheets/d/********************|このシート>をチェックしても無かったら、新しい本を申請してみませんか？ ` +
    `<https://www.notion.so/********************|:point_right:＊申請方法＊:four_leaf_clover:>`
}