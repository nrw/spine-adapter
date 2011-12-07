exports.spine_adapter_docs_by_modelname = 
  map: (doc) ->
    if doc.modelname
      emit [doc.modelname, doc._id], null
