const scriptProps = PropertiesService.getScriptProperties();
const 全社共有FolderId = scriptProps.getProperty("全社共有FolderId")
const QA用ForlderId = scriptProps.getProperty("QA用ForlderId")
const 全社共有SheetId = scriptProps.getProperty("全社共有SheetId")

const fetchBooksAsPDF = () => {
  const books = fetchFilesIn(全社共有FolderId)
  books.push(...fetchFilesIn(QA用ForlderId))
  return books
}

const fetchFilesIn = (id) => {
  const rootFolder = DriveApp.getFolderById(id)
  const subFolders = rootFolder.getFolders()

  const files = extractPDFFiles(rootFolder)

  while (subFolders.hasNext()) {
    const subFolder = subFolders.next()
    files.push(...extractPDFFiles(subFolder))
  }

  return files
}

const extractPDFFiles = (folder) => {
  const fileIter = folder.getFiles()
  const files = []
  while (fileIter.hasNext()) {
    const file = fileIter.next()
    const fileName = file.getName()
    const fileExtension = fileName.split('.')[1]
    if (['pdf', 'zip'].includes(fileExtension)) files.push(file)

  }
  return files
}

const fetchBooksInOffice = () => {
  const spreadsheet = SpreadsheetApp.openById(全社共有SheetId)
  const sheets = spreadsheet.getSheets()
  const shelfSheets = sheets.filter(sh => sh.getName() !== '教材')

  const records = shelfSheets.reduce((acc, curSh) => {
    const shRecords = extractRecordsInOfficeBy(curSh)
    return acc.concat(shRecords)
  }, [])
  return records
}

const extractRecordsInOfficeBy = (sheet) => {
  const dataRange = sheet.getDataRange()
  const shValues = dataRange.getValues()
  const headerRowIndex = shValues.findIndex(rowValues => {
    return rowValues.includes('購入日')
  })
  if (!headerRowIndex) throw new Error(`ヘッダーの行が特定出来ません`)
  const bookTable = shValues.filter((_, i) => i > headerRowIndex)

  // 電子書籍、Udemy等が補足されている列を除外する
  const colIdxOfInOffice = shValues[headerRowIndex].filter(Boolean).length + 1
  const booksInOffice = bookTable.filter(rec => !rec[colIdxOfInOffice])

  // ラベル名からcolumnの位置を取得
  const getColumnIndexOf = (label) => {
    const colIdx = shValues[headerRowIndex].findIndex(c => c === label)
    if (!colIdx) throw new Error(`「${label}」をシートから取得できませんでした`)
    return colIdx
  }

  const colIdxOf購入日 = getColumnIndexOf("購入日")
  const colIdxOf貸出物 = getColumnIndexOf("貸出物")
  const colIdxOf貸出者 = getColumnIndexOf("貸出者")

  const shRecords = booksInOffice.map(rowValues => {
    const record = []
    record.push(rowValues[colIdxOf購入日])
    record.push(rowValues[colIdxOf貸出物])
    record.push(rowValues[colIdxOf貸出者])
    return record
  })

  return shRecords
}