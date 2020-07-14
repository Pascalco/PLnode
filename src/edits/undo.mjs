function getPara(data) {
  let para = {
    'format': 'json',
    'action': 'edit',
    'title': data.entity,
    'undo': data.revid,
    'bot': 1
  }
  return [para, 'csrf'];
}

export default {
  getPara
}
