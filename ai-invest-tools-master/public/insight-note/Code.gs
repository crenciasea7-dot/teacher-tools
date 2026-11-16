/**
 * 인사이트 노트 연결 코드 (구글 시트 '부동산자료_읽기·채점표'에 붙여 넣는 코드)
 * 사이트(Netlify)가 이 코드를 통해 시트를 읽고 쓰고, 파일을 클로드분석 폴더에 올린다.
 */
const TOKEN = '여기에 연결 코드';
const SHEET_ID = '1gn9-XlqgbYfy6mraG1k7S-s_RQThm1Qd6BjsJh6YeDA';
const FOLDERS = {
  '흥부강의': '1fAK5Ij5T7cIWldLLoZAapF9k26EQQ30E',
  '트루카피': '1rUGQPOGi7RxB2CL7kLRgaCNW_HX-WR1i',
  '톡방': '1q0vyTHYCMT6oHhrVnPh0jsMfQLqiZ80O',
  '유료리포트': '14JNFR7gjHXYTruMGqTfIMgrnr5tS75m_',
  '기타': '1qRQJVPHhF7ksfTcx1Ed4DnFrfW-DWV_K'
};
const UPLOAD_SHEET = '6_업로드기록';
const UPLOAD_HEADERS = ['올린 날짜', '분류', '파일명', '링크', '메모', '처리 상태'];

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh && name === UPLOAD_SHEET) {
    sh = ss.insertSheet(UPLOAD_SHEET);
    sh.getRange(1, 1, 1, UPLOAD_HEADERS.length).setValues([UPLOAD_HEADERS])
      .setFontWeight('bold').setBackground('#404040').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  if (!sh) throw new Error('시트를 찾을 수 없음: ' + name);
  return sh;
}

function read_(name) {
  const sh = sheet_(name);
  const last = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (last < 1) return { headers: [], rows: [] };
  const vals = sh.getRange(1, 1, last, lastCol).getDisplayValues();
  // 헤더 행 찾기: 첫 번째로 칸이 3개 이상 채워진 행
  let h = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i].filter(String).length >= 3) { h = i; break; }
  }
  const headers = vals[h];
  const rows = [];
  for (let i = h + 1; i < vals.length; i++) {
    if (!vals[i].some(String)) continue;
    const o = { _row: i + 1 };
    headers.forEach((k, j) => { if (k) o[k] = vals[i][j]; });
    rows.push(o);
  }
  return { headers: headers.filter(String), headerRow: h + 1, rows };
}

function headerMap_(sh) {
  const r = read_(sh.getName());
  const map = {};
  const raw = sh.getRange(r.headerRow, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  raw.forEach((k, j) => { if (k) map[k] = j + 1; });
  return map;
}

function update_(name, row, data) {
  const sh = sheet_(name);
  const map = headerMap_(sh);
  Object.keys(data).forEach(k => {
    if (map[k]) sh.getRange(row, map[k]).setValue(data[k]);
  });
  return { ok: true };
}

function append_(name, data) {
  const sh = sheet_(name);
  const map = headerMap_(sh);
  const row = sh.getLastRow() + 1;
  Object.keys(data).forEach(k => {
    if (map[k]) sh.getRange(row, map[k]).setValue(data[k]);
  });
  return { ok: true, row };
}

function upload_(p) {
  const folderId = FOLDERS[p.category] || FOLDERS['기타'];
  const folder = DriveApp.getFolderById(folderId);
  const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const name = p.name.indexOf(today) === 0 ? p.name : today + '_' + p.name;
  const blob = Utilities.newBlob(Utilities.base64Decode(p.base64), p.mimeType || 'application/octet-stream', name);
  const file = folder.createFile(blob);
  const sh = sheet_(UPLOAD_SHEET);
  sh.appendRow([today, p.category, name, file.getUrl(), p.memo || '', '대기']);
  return { ok: true, url: file.getUrl(), name };
}

function doGet(e) {
  try {
    if (e.parameter.token !== TOKEN) return out_({ error: '연결 코드가 맞지 않아요' });
    if (e.parameter.action === 'read') return out_(read_(e.parameter.sheet));
    if (e.parameter.action === 'ping') return out_({ ok: true });
    return out_({ error: '알 수 없는 요청' });
  } catch (err) {
    return out_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    if (p.token !== TOKEN) return out_({ error: '연결 코드가 맞지 않아요' });
    if (p.action === 'update') return out_(update_(p.sheet, p.row, p.data));
    if (p.action === 'append') return out_(append_(p.sheet, p.data));
    if (p.action === 'upload') return out_(upload_(p));
    return out_({ error: '알 수 없는 요청' });
  } catch (err) {
    return out_({ error: String(err) });
  }
}

/** 처음 한 번 실행해서 권한을 허락하는 용도 */
function setup() {
  sheet_(UPLOAD_SHEET);
  Logger.log('준비 완료');
}
