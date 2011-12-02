exports.spine_adapter_docs_by_modelname = 
  map: (doc) ->
    emit [doc.modelname], null
