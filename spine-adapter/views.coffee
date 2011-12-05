exports.spine_adapter_docs_by_modelname = 
  map: (doc) ->
    if doc.modelname
      emit [doc.modelname, doc._id], null

exports.spine_adapter_docs_by_belongs_to = 
  map: (doc) ->
    if doc.belongs_to and doc.modelname
      emit [doc.modelname, doc.belongs_to], null
