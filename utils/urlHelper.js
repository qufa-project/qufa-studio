const urlHelper = function (p, page) {
  if (page) {
    p.query.currentPage = page;
  } else {
    delete p.query.currentPage;
  }

  const queries = [];
  for (const [key, value] of Object.entries(p.query)) {
    queries.push(`${key}=${value}`);
  }

  return `${p.path}?${queries.join("&")}`;
};

module.exports = urlHelper;
