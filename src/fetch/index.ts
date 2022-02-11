const columns = {
  title: 0,
  libType: 1,// 非電子書籍 | 電子書籍
  pdfUrl: 2,  // pdfUrl: 2
  barrower: 3,
  author: 4,
  publishedDate: 5,
  description: 6,
  apiThumbnail: 7,
}

const updateBookShelfSheet = () => {
  const booksAsPDFfile = fetchBooksAsPDF()
  const booksInOffice = fetchBooksInOffice()

  const recordsOfPDF = makeRecordFromPDF(booksAsPDFfile)
  const recordsOfOffice = makeRecordInOffice(booksInOffice)
  const allRecords = [...recordsOfPDF, ...recordsOfOffice]
  const shelfSh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bookShelf')
  const oldTableRange = shelfSh.getDataRange()
  oldTableRange.clear()

  const headerRow = shelfSh.getRange(1, 1, 1, 8)
  headerRow.setValues([['書籍名', '書籍形態', 'drive URL(電子書籍のみ)', '貸出先', '著者', '出版日', '概要', 'サムネイル(GoogleAPI)']])
  const newTableRange = shelfSh.getRange(2, 1, allRecords.length, allRecords[0].length)
  newTableRange.setValues(allRecords)
}

const makeRecordFromPDF = (booksAsPDF) => {
  const records = booksAsPDF.map((book => {
    const title = book.getName().split('.')[0]

    const record = []
    record[columns.title] = title
    record[columns.libType] = '電子書籍'
    record[columns.pdfUrl] = book.getUrl()
    record[columns.barrower] = null
    const recordWithExternalInfo = addGoogleApiInfo(record, title)
    return recordWithExternalInfo
  }))
  return records
}

const makeRecordInOffice = (booksInOffice) => {
  const records = booksInOffice.map((book => {
    const record = []
    record[columns.title] = book[1]
    record[columns.libType] = '非電子書籍'
    record[columns.pdfUrl] = null
    record[columns.barrower] = book[2]
    const recordWithExternalInfo = addGoogleApiInfo(record, book[1])
    return recordWithExternalInfo
  }))
  return records
}

const addGoogleApiInfo = (imcompleteRecord, title) => {
  const record = [...imcompleteRecord]
  const apiData = fetchGoogleApiResponse(title)
  const hasAuthors = apiData && apiData.volumeInfo.authors
  const hasPubDate = apiData && apiData.volumeInfo.publishedDate
  const hasDescript = apiData && apiData.volumeInfo.description
  const hasThumbnail = apiData && apiData.volumeInfo.imageLinks && apiData.volumeInfo.imageLinks.thumbnail
  record[columns.author] = hasAuthors ? apiData.volumeInfo.authors.join(',') : ''
  record[columns.publishedDate] = hasPubDate ? apiData.volumeInfo.publishedDate : ''
  record[columns.description] = hasDescript ? apiData.volumeInfo.description : ''
  record[columns.apiThumbnail] = hasThumbnail ? apiData.volumeInfo.imageLinks.thumbnail : ''
  return record
}

