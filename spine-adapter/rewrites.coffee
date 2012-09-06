module.exports = [
  from: "/spine-adapter/belongs-to/:modelname/:owner"
  to: "_view/spine_adapter_docs_by_belongs_to"
  method: "GET"
  query:
    startkey: [":modelname", ":owner"]
    endkey: [":modelname", ":owner", {}]
    include_docs: "true"
,
  from: "/spine-adapter/:modelname"
  to: "_update/spine_adapter_model"
  method: "POST"
,
  from: "/spine-adapter/:modelname/:id"
  to: "_update/spine_adapter_model/:id"
  method: "PUT"
,
  from: "/spine-adapter/:modelname/:id"
  to: "_update/spine_adapter_model/:id"
  method: "DELETE"
,
  from: "/spine-adapter/:modelname"
  to: "_view/spine_adapter_docs_by_modelname"
  method: "GET"
  query:
    startkey: [":modelname"]
    endkey: [":modelname", {}]
    include_docs: "true"
,
  from: "/spine-adapter/:modelname/:id"
  to: "_view/spine_adapter_docs_by_modelname"
  method: "GET"
  query:
    startkey: [":modelname", ":id"]
    endkey: [":modelname", ":id", {}]
    include_docs: "true"
]