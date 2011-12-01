var create, destroy, update, _;
_ = require("underscore")._;
exports.model = function(doc, req) {
  if (req.method === 'POST') {
    return create(doc, req);
  } else if (req.method === 'PUT') {
    return update(doc, req);
  } else if (req.method === 'DELETE') {
    return destroy(doc, req);
  }
};
create = function(doc, req) {
  var resp;
  doc = JSON.parse(req.body);
  doc.modelname = req.query.modelname;
  doc._id = req.uuid;
  resp = {
    ok: true,
    body: JSON.stringify(doc)
  };
  return [doc, resp];
};
update = function(doc, req) {
  var new_fields, resp, updated_doc;
  delete doc._revisions;
  new_fields = JSON.parse(req.body);
  delete new_fields.id;
  updated_doc = _.defaults(new_fields, doc);
  resp = {
    ok: true,
    body: JSON.stringify(updated_doc)
  };
  return [updated_doc, resp];
};
destroy = function(doc, req) {
  var resp;
  doc._deleted = true;
  resp = {
    ok: true
  };
  return [doc, resp];
};