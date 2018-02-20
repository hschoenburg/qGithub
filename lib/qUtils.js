
// header content is different if initial request includes a page number
module.exports.totalPages = (link) => {
  let total
  if (!link) { return 0 } else {
    const pattern = new RegExp(/=\d>/, 'g')
    var pages = link.match(pattern)
    if (pages.length > 1) {
      total = pages[1].match(/\d/)[0]
    } else {
      total = pages[0].match(/\d/)[0]
    }
    return Number(total)
  }
}
