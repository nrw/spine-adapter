exports.docs_by_modelname = {
  map: function(doc) {
    return emit([doc.modelname], null);
  }
};