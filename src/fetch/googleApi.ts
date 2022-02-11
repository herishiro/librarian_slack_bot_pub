function fetchGoogleApiResponse(title) {
  try {
    const url = encodeURI(`https://www.googleapis.com/books/v1/volumes?q=${title}&country=JP`)
    const res = UrlFetchApp.fetch(url);
    const data = JSON.parse(res.getContentText());
    if (!data.totalItems) return null
    const firstItem = data.items[0]
    const googleTitle = firstItem && firstItem.volumeInfo.title
    if (googleTitle && !hasAlmostSameTitle(title, googleTitle)) return null
    return firstItem
  } catch (error) {
    console.error(`「${title}」のGoogle API取得に失敗しました。詳細：`, error)
  }
}

// 最初の2文字が同じかどうかを比較して、全く違う本の取得を防ぐ
const hasAlmostSameTitle = (libraryTitle: string, googleTitle: string) => {
  const headStrOfLib = libraryTitle.normalize().trim().substr(0, 2)
  const headStrOfGoogle = googleTitle.normalize().trim().substr(0, 2)
  return headStrOfLib === headStrOfGoogle

}
